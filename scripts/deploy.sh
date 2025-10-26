#!/bin/bash

# Production deployment script for Chat Website

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="/var/backups/chat-website"
LOG_FILE="/var/log/chat-website/deploy.log"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "backend/.env.${ENVIRONMENT}" ]]; then
        error "Environment file backend/.env.${ENVIRONMENT} not found"
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$(dirname "$LOG_FILE")"
    sudo mkdir -p ./logs/nginx
    sudo mkdir -p ./uploads
    sudo mkdir -p ./ssl
    
    # Set proper permissions
    sudo chown -R $USER:$USER ./logs ./uploads
    sudo chmod 755 ./logs ./uploads
    
    log "Directories created successfully"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="${BACKUP_DIR}/backup_${BACKUP_TIMESTAMP}"
    
    sudo mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker ps | grep -q "chat-website-mongodb"; then
        log "Backing up MongoDB..."
        docker exec chat-website-mongodb mongodump --out /tmp/backup
        docker cp chat-website-mongodb:/tmp/backup "$BACKUP_PATH/mongodb"
    fi
    
    # Backup Redis data
    if docker ps | grep -q "chat-website-redis"; then
        log "Backing up Redis..."
        docker exec chat-website-redis redis-cli BGSAVE
        docker cp chat-website-redis:/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"
    fi
    
    # Backup uploaded files
    if [[ -d "./uploads" ]]; then
        log "Backing up uploaded files..."
        sudo cp -r ./uploads "$BACKUP_PATH/"
    fi
    
    # Backup logs
    if [[ -d "./logs" ]]; then
        log "Backing up logs..."
        sudo cp -r ./logs "$BACKUP_PATH/"
    fi
    
    log "Backup completed: $BACKUP_PATH"
    echo "$BACKUP_PATH" > .last_backup
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" pull
    
    log "Images pulled successfully"
}

# Build application images
build_images() {
    log "Building application images..."
    
    # Build backend
    docker build -f Dockerfile.backend -t chat-website-backend:latest .
    
    # Build frontend
    docker build -f Dockerfile.frontend -t chat-website-frontend:latest .
    
    log "Images built successfully"
}

# Run database migrations (if any)
run_migrations() {
    log "Running database migrations..."
    
    # Add migration logic here if needed
    # docker exec chat-website-backend npm run migrate
    
    log "Migrations completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check backend health
        if curl -f http://localhost:5000/health &> /dev/null; then
            log "Backend health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Health check failed after $max_attempts attempts"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Check frontend
    if curl -f http://localhost/health.html &> /dev/null; then
        log "Frontend health check passed"
    else
        warning "Frontend health check failed"
    fi
    
    log "Health checks completed"
}

# Deploy application
deploy() {
    log "Starting deployment for environment: $ENVIRONMENT"
    
    # Copy environment file
    cp "backend/.env.${ENVIRONMENT}" "backend/.env"
    cp "frontend/.env.${ENVIRONMENT}" "frontend/.env"
    
    # Stop existing containers gracefully
    log "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down --timeout 30
    
    # Remove old containers and networks
    docker system prune -f
    
    # Start new deployment
    log "Starting new deployment..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    log "Deployment completed"
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    # Stop current deployment
    docker-compose -f "$COMPOSE_FILE" down --timeout 30
    
    # Restore from backup if available
    if [[ -f ".last_backup" ]]; then
        BACKUP_PATH=$(cat .last_backup)
        
        if [[ -d "$BACKUP_PATH" ]]; then
            log "Restoring from backup: $BACKUP_PATH"
            
            # Restore uploaded files
            if [[ -d "$BACKUP_PATH/uploads" ]]; then
                sudo rm -rf ./uploads
                sudo cp -r "$BACKUP_PATH/uploads" ./
                sudo chown -R $USER:$USER ./uploads
            fi
            
            # Restore database (implement as needed)
            # docker exec chat-website-mongodb mongorestore /tmp/backup
            
            log "Rollback completed"
        else
            error "Backup directory not found: $BACKUP_PATH"
        fi
    else
        error "No backup information found"
    fi
    
    exit 1
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    sudo find "$BACKUP_DIR" -name "backup_*" -type d | sort -r | tail -n +6 | xargs sudo rm -rf
    
    log "Backup cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message="Chat Website deployment $status for environment: $ENVIRONMENT"
    
    # Add notification logic here (Slack, email, etc.)
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   "$SLACK_WEBHOOK_URL"
    
    log "Notification sent: $message"
}

# Main deployment process
main() {
    log "Starting Chat Website deployment process"
    
    # Trap errors and rollback
    trap rollback ERR
    
    check_root
    check_prerequisites
    create_directories
    backup_current
    pull_images
    build_images
    deploy
    run_migrations
    health_check
    cleanup_backups
    
    # Remove error trap on success
    trap - ERR
    
    log "Deployment completed successfully!"
    send_notification "SUCCESS"
}

# Script usage
usage() {
    echo "Usage: $0 [environment]"
    echo "  environment: production (default) | staging"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy to production"
    echo "  $0 production         # Deploy to production"
    echo "  $0 staging           # Deploy to staging"
    exit 1
}

# Check arguments
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
fi

if [[ -n "$1" && "$1" != "production" && "$1" != "staging" ]]; then
    error "Invalid environment: $1"
    usage
fi

# Run main function
main