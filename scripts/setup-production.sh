#!/bin/bash

# Production server setup script for Chat Website

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}
USER="chatapp"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    apt-get update
    apt-get upgrade -y
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        htop \
        vim \
        nano \
        tree
    
    log "System packages updated successfully"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Install Docker Compose (standalone)
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    log "Docker installed successfully"
}

# Install Node.js (for development/debugging)
install_nodejs() {
    log "Installing Node.js..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install global packages
    npm install -g pm2 nodemon
    
    log "Node.js installed successfully"
}

# Create application user
create_user() {
    log "Creating application user: $USER"
    
    # Create user if it doesn't exist
    if ! id "$USER" &>/dev/null; then
        useradd -m -s /bin/bash "$USER"
        usermod -aG docker "$USER"
        
        # Create SSH directory
        mkdir -p /home/$USER/.ssh
        chmod 700 /home/$USER/.ssh
        chown $USER:$USER /home/$USER/.ssh
        
        log "User $USER created successfully"
    else
        log "User $USER already exists"
    fi
}

# Setup firewall
setup_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports (adjust as needed)
    ufw allow 5000/tcp  # Backend API
    ufw allow 3000/tcp  # Frontend (if running separately)
    
    # Allow monitoring ports (restrict to specific IPs in production)
    ufw allow from 10.0.0.0/8 to any port 9090  # Prometheus
    ufw allow from 10.0.0.0/8 to any port 3001  # Grafana
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured successfully"
}

# Configure fail2ban
setup_fail2ban() {
    log "Configuring fail2ban..."
    
    # Create custom jail configuration
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log "Fail2ban configured successfully"
}

# Setup SSL certificates with Let's Encrypt
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Install Certbot
    apt-get install -y certbot python3-certbot-nginx
    
    # Create SSL directory
    mkdir -p /etc/ssl/chat-website
    
    # Generate certificates (this requires domain to be pointing to server)
    if [[ "$DOMAIN" != "your-domain.com" ]]; then
        log "Generating SSL certificate for $DOMAIN..."
        
        # Stop nginx if running
        systemctl stop nginx || true
        
        # Generate certificate
        certbot certonly --standalone \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "api.$DOMAIN"
        
        # Copy certificates to application directory
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/ssl/chat-website/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/ssl/chat-website/
        
        # Set proper permissions
        chown root:docker /etc/ssl/chat-website/*
        chmod 640 /etc/ssl/chat-website/*
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        log "SSL certificates configured successfully"
    else
        warning "Using default domain name. SSL setup skipped."
        warning "Update DOMAIN variable and run setup again for SSL."
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p /opt/chat-website/monitoring/{prometheus,grafana,logstash}
    
    # Create Prometheus configuration
    cat > /opt/chat-website/monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'chat-website-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
EOF

    # Create Grafana datasource configuration
    mkdir -p /opt/chat-website/monitoring/grafana/datasources
    cat > /opt/chat-website/monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    # Create Logstash pipeline configuration
    cat > /opt/chat-website/monitoring/logstash/pipeline/logstash.conf << EOF
input {
  file {
    path => "/var/log/chat-website/*.log"
    start_position => "beginning"
    codec => "json"
  }
}

filter {
  if [level] {
    mutate {
      uppercase => [ "level" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "chat-website-logs-%{+YYYY.MM.dd}"
  }
}
EOF

    log "Monitoring setup completed"
}

# Setup application directories
setup_app_directories() {
    log "Setting up application directories..."
    
    # Create application directory
    mkdir -p /opt/chat-website/{logs,uploads,backups,ssl}
    
    # Set proper ownership and permissions
    chown -R $USER:$USER /opt/chat-website
    chmod -R 755 /opt/chat-website
    
    # Create symbolic links for easier access
    ln -sf /opt/chat-website /home/$USER/chat-website
    
    log "Application directories created successfully"
}

# Setup system services
setup_services() {
    log "Setting up system services..."
    
    # Create systemd service for the application
    cat > /etc/systemd/system/chat-website.service << EOF
[Unit]
Description=Chat Website Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/chat-website
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

    # Create log rotation configuration
    cat > /etc/logrotate.d/chat-website << EOF
/opt/chat-website/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker exec chat-website-backend kill -USR1 1 2>/dev/null || true
    endscript
}
EOF

    # Reload systemd
    systemctl daemon-reload
    
    log "System services configured successfully"
}

# Setup backup system
setup_backup() {
    log "Setting up backup system..."
    
    # Create backup script
    cat > /opt/chat-website/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/chat-website/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"

mkdir -p "$BACKUP_PATH"

# Backup MongoDB
docker exec chat-website-mongodb mongodump --out /tmp/backup
docker cp chat-website-mongodb:/tmp/backup "$BACKUP_PATH/mongodb"

# Backup Redis
docker exec chat-website-redis redis-cli BGSAVE
docker cp chat-website-redis:/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"

# Backup uploads
cp -r /opt/chat-website/uploads "$BACKUP_PATH/"

# Backup logs
cp -r /opt/chat-website/logs "$BACKUP_PATH/"

# Compress backup
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"
rm -rf "$BACKUP_PATH"

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_PATH.tar.gz"
EOF

    chmod +x /opt/chat-website/backup.sh
    chown $USER:$USER /opt/chat-website/backup.sh
    
    # Setup daily backup cron job
    echo "0 2 * * * /opt/chat-website/backup.sh" | crontab -u $USER -
    
    log "Backup system configured successfully"
}

# Setup security hardening
setup_security() {
    log "Applying security hardening..."
    
    # Disable root SSH login
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Disable password authentication (uncomment if using key-based auth)
    # sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    # Change SSH port (optional)
    # sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
    
    # Restart SSH service
    systemctl restart ssh
    
    # Set up automatic security updates
    apt-get install -y unattended-upgrades
    echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
    
    # Configure kernel parameters
    cat >> /etc/sysctl.conf << EOF

# Chat Website Security Settings
net.ipv4.conf.default.rp_filter=1
net.ipv4.conf.all.rp_filter=1
net.ipv4.tcp_syncookies=1
net.ipv4.ip_forward=0
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.all.secure_redirects=0
net.ipv4.conf.all.accept_source_route=0
EOF

    sysctl -p
    
    log "Security hardening completed"
}

# Generate environment files
generate_env_files() {
    log "Generating environment files..."
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    MONGO_ROOT_PASSWORD=$(openssl rand -base64 24)
    REDIS_PASSWORD=$(openssl rand -base64 24)
    GRAFANA_PASSWORD=$(openssl rand -base64 16)
    
    # Create production environment file
    cat > /opt/chat-website/.env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://root:${MONGO_ROOT_PASSWORD}@mongodb:27017/chat-website?authSource=admin
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://${DOMAIN}

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/chat-website/fullchain.pem
SSL_KEY_PATH=/etc/ssl/chat-website/privkey.pem

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/chat-website/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
MESSAGE_RATE_LIMIT_MAX=30

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_TIMEOUT=3600000

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
METRICS_PORT=9090

# Generated passwords
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
EOF

    # Set proper permissions
    chown $USER:$USER /opt/chat-website/.env.production
    chmod 600 /opt/chat-website/.env.production
    
    log "Environment files generated successfully"
    info "IMPORTANT: Save these credentials securely:"
    info "MongoDB Root Password: ${MONGO_ROOT_PASSWORD}"
    info "Redis Password: ${REDIS_PASSWORD}"
    info "Grafana Admin Password: ${GRAFANA_PASSWORD}"
}

# Display final instructions
show_final_instructions() {
    log "Production server setup completed successfully!"
    
    echo ""
    echo -e "${BLUE}=== NEXT STEPS ===${NC}"
    echo ""
    echo "1. Switch to application user:"
    echo "   sudo su - $USER"
    echo ""
    echo "2. Clone your application repository:"
    echo "   git clone https://github.com/your-username/chat-website.git /opt/chat-website/app"
    echo ""
    echo "3. Copy the generated environment file:"
    echo "   cp /opt/chat-website/.env.production /opt/chat-website/app/backend/"
    echo ""
    echo "4. Deploy the application:"
    echo "   cd /opt/chat-website/app"
    echo "   ./scripts/deploy.sh production"
    echo ""
    echo "5. Enable the systemd service:"
    echo "   sudo systemctl enable chat-website"
    echo ""
    echo -e "${YELLOW}=== IMPORTANT SECURITY NOTES ===${NC}"
    echo ""
    echo "- Change default passwords immediately"
    echo "- Configure SSH key-based authentication"
    echo "- Review and adjust firewall rules"
    echo "- Set up monitoring alerts"
    echo "- Configure backup retention policies"
    echo ""
    echo -e "${GREEN}Server is ready for production deployment!${NC}"
}

# Main setup process
main() {
    log "Starting Chat Website production server setup"
    
    check_root
    update_system
    install_docker
    install_nodejs
    create_user
    setup_firewall
    setup_fail2ban
    setup_ssl
    setup_monitoring
    setup_app_directories
    setup_services
    setup_backup
    setup_security
    generate_env_files
    show_final_instructions
}

# Script usage
usage() {
    echo "Usage: $0 [domain] [email]"
    echo "  domain: Your domain name (default: your-domain.com)"
    echo "  email:  Your email for SSL certificates (default: admin@your-domain.com)"
    echo ""
    echo "Examples:"
    echo "  $0 example.com admin@example.com"
    echo "  $0 chat.mycompany.com devops@mycompany.com"
    exit 1
}

# Check arguments
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
fi

# Run main function
main