# Complete Production Deployment Guide

## Overview

This comprehensive guide provides step-by-step instructions for deploying the Chat Website application to production environments. It covers multiple deployment options, from simple single-server setups to scalable cloud deployments, ensuring you can successfully deploy the application regardless of your infrastructure preferences.

## Table of Contents

1. [Prerequisites & Requirements](#prerequisites--requirements)
2. [Deployment Options](#deployment-options)
3. [Quick Start (Automated)](#quick-start-automated)
4. [Manual Deployment](#manual-deployment)
5. [Cloud Platform Deployments](#cloud-platform-deployments)
6. [Environment Configuration](#environment-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Database Configuration](#database-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Security Hardening](#security-hardening)
11. [Performance Optimization](#performance-optimization)
12. [Backup & Recovery](#backup--recovery)
13. [Troubleshooting](#troubleshooting)
14. [Maintenance](#maintenance)

## Prerequisites & Requirements

### Server Requirements

**Minimum Requirements (Small Scale):**
- 2 CPU cores (2.0 GHz+)
- 4GB RAM
- 50GB SSD storage
- 10 Mbps network connection
- Ubuntu 20.04 LTS or newer (or equivalent)

**Recommended for Production (Medium Scale):**
- 4+ CPU cores (2.5 GHz+)
- 8GB+ RAM
- 100GB+ SSD storage
- 100 Mbps network connection
- Load balancer for high availability

**High-Scale Production:**
- 8+ CPU cores per server
- 16GB+ RAM per server
- 200GB+ SSD storage
- Multiple servers with load balancing
- CDN for static assets
- Dedicated database servers

### Operating System Support

**Fully Supported:**
- Ubuntu 20.04 LTS / 22.04 LTS
- CentOS 8 / Rocky Linux 8+
- Debian 11+
- Amazon Linux 2

**Partially Supported:**
- Windows Server 2019+ (with Docker Desktop)
- macOS (development only)

### Software Requirements

**Essential:**
- Docker 20.10+ and Docker Compose 2.0+
- Git 2.25+
- curl/wget
- A domain name (for SSL certificates)

**Optional but Recommended:**
- Node.js 18+ (for local development/debugging)
- Nginx (if not using containerized reverse proxy)
- Fail2ban (for security)
- UFW/iptables (firewall)

### Network Requirements

**Ports to Open:**
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 5000 (Backend API - can be internal only)
- 3001 (Grafana monitoring - restrict access)
- 9090 (Prometheus - restrict access)

**Domain Requirements:**
- Primary domain (e.g., `chat.example.com`)
- API subdomain (e.g., `api.chat.example.com`) - optional but recommended
- Monitoring subdomain (e.g., `monitoring.chat.example.com`) - optional

## Deployment Options

### Option 1: Single Server Deployment (Recommended for Small-Medium Scale)
- All services on one server
- Docker Compose orchestration
- Built-in monitoring
- Automated backups
- SSL with Let's Encrypt

### Option 2: Multi-Server Deployment
- Separate database server
- Load balancer
- Horizontal scaling
- High availability

### Option 3: Cloud Platform Deployment
- AWS ECS/EKS
- Google Cloud Run/GKE
- Azure Container Instances/AKS
- DigitalOcean App Platform

### Option 4: Kubernetes Deployment
- Full Kubernetes manifests
- Helm charts
- Auto-scaling
- Service mesh integration

## Quick Start (Automated)

### Prerequisites Check

Before starting, ensure you have:
- A fresh Ubuntu 20.04+ server with root access
- A domain name pointing to your server's IP address
- SSH access to the server

### 1. Clone the Repository

```bash
# On your local machine or directly on the server
git clone https://github.com/your-username/chat-website.git
cd chat-website

# Make scripts executable
chmod +x scripts/setup-production.sh scripts/deploy.sh
```

### 2. Run Automated Setup

```bash
# Replace with your actual domain and email
sudo ./scripts/setup-production.sh chat.example.com admin@example.com
```

**What this script does:**
- Updates system packages
- Installs Docker and Docker Compose
- Creates application user and directories
- Configures firewall (UFW)
- Sets up SSL certificates with Let's Encrypt
- Configures monitoring (Prometheus, Grafana)
- Sets up automated backups
- Applies security hardening
- Generates secure environment files

### 3. Deploy the Application

```bash
# Switch to application user
sudo su - chatapp

# Navigate to application directory
cd /opt/chat-website/app

# Deploy to production
./scripts/deploy.sh production
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check application health
curl http://localhost:5000/health
curl http://localhost/

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Access Your Application

- **Main Application:** `https://your-domain.com`
- **API Endpoint:** `https://api.your-domain.com` (or `https://your-domain.com/api`)
- **Monitoring Dashboard:** `https://your-domain.com:3001` (Grafana)
- **Metrics:** `https://your-domain.com:9090` (Prometheus)

**Default Credentials:**
- Grafana: `admin` / (check generated password in setup output)

## Manual Deployment

If you prefer manual setup or need custom configuration:

#### Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### Configure Firewall

```bash
# Install and configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Setup SSL Certificates

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com
```

## Cloud Platform Deployments

### AWS Deployment

#### Option A: AWS ECS (Elastic Container Service)

**1. Create ECS Cluster:**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name chat-website-cluster
```

**2. Create Task Definitions:**
```json
{
  "family": "chat-website-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/chat-website-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/chat-website-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**3. Deploy Services:**
```bash
# Create services
aws ecs create-service \
  --cluster chat-website-cluster \
  --service-name chat-website-backend \
  --task-definition chat-website-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

#### Option B: AWS App Runner

**1. Create apprunner.yaml:**
```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - cd backend && npm ci --only=production
run:
  runtime-version: 18
  command: cd backend && npm start
  network:
    port: 5000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

**2. Deploy with App Runner:**
```bash
aws apprunner create-service \
  --service-name chat-website \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "your-account.dkr.ecr.region.amazonaws.com/chat-website:latest",
      "ImageConfiguration": {
        "Port": "5000"
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }'
```

### Google Cloud Platform Deployment

#### Option A: Cloud Run

**1. Build and Push Images:**
```bash
# Configure gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chat-website-backend backend/

# Build and push frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chat-website-frontend frontend/
```

**2. Deploy Services:**
```bash
# Deploy backend
gcloud run deploy chat-website-backend \
  --image gcr.io/YOUR_PROJECT_ID/chat-website-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 1Gi \
  --cpu 1

# Deploy frontend
gcloud run deploy chat-website-frontend \
  --image gcr.io/YOUR_PROJECT_ID/chat-website-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

#### Option B: Google Kubernetes Engine (GKE)

**1. Create GKE Cluster:**
```bash
gcloud container clusters create chat-website-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10
```

**2. Deploy with Kubernetes:**
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-website-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-website-backend
  template:
    metadata:
      labels:
        app: chat-website-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/YOUR_PROJECT_ID/chat-website-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: production
```

### Azure Deployment

#### Option A: Azure Container Instances

**1. Create Resource Group:**
```bash
az group create --name chat-website-rg --location eastus
```

**2. Deploy Container:**
```bash
az container create \
  --resource-group chat-website-rg \
  --name chat-website-backend \
  --image your-registry.azurecr.io/chat-website-backend:latest \
  --cpu 1 \
  --memory 2 \
  --ports 5000 \
  --environment-variables NODE_ENV=production
```

#### Option B: Azure App Service

**1. Create App Service Plan:**
```bash
az appservice plan create \
  --name chat-website-plan \
  --resource-group chat-website-rg \
  --sku B1 \
  --is-linux
```

**2. Create Web App:**
```bash
az webapp create \
  --resource-group chat-website-rg \
  --plan chat-website-plan \
  --name chat-website-app \
  --deployment-container-image-name your-registry.azurecr.io/chat-website:latest
```

### DigitalOcean Deployment

#### Option A: App Platform

**1. Create app.yaml:**
```yaml
name: chat-website
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/chat-website
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  routes:
  - path: /api
- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/chat-website
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
databases:
- name: chat-website-db
  engine: MONGODB
  version: "5"
```

**2. Deploy:**
```bash
# Install doctl
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Create app
doctl apps create app.yaml
```

#### Option B: Droplets with Docker

**1. Create Droplet:**
```bash
doctl compute droplet create chat-website \
  --size s-2vcpu-4gb \
  --image docker-20-04 \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID
```

**2. Deploy Application:**
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Clone and deploy
git clone https://github.com/your-username/chat-website.git
cd chat-website
chmod +x scripts/setup-production.sh scripts/deploy.sh
./scripts/setup-production.sh your-domain.com admin@your-domain.com
```

## Environment Configuration

### 1. Backend Environment

Create `backend/.env.production`:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-website-prod
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/your-domain.crt
SSL_KEY_PATH=/etc/ssl/private/your-domain.key

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/chat-website/app.log

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### 2. Frontend Environment

Create `frontend/.env.production`:

```env
# API Configuration
VITE_API_URL=https://api.your-domain.com/api
VITE_SOCKET_URL=https://api.your-domain.com

# Application Configuration
VITE_APP_NAME=Chat Website
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Deployment Process

### 1. Automated Deployment

```bash
# Clone repository
git clone https://github.com/your-username/chat-website.git
cd chat-website

# Run deployment script
./scripts/deploy.sh production
```

### 2. Manual Deployment

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Health Checks

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost/health.html

# Check detailed health status
curl http://localhost:5000/health/detailed
```

## SSL/HTTPS Configuration

### 1. Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --standalone \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d api.your-domain.com

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 2. Custom SSL Certificates

```bash
# Copy certificates to SSL directory
sudo mkdir -p /etc/ssl/chat-website
sudo cp your-domain.crt /etc/ssl/chat-website/
sudo cp your-domain.key /etc/ssl/chat-website/

# Set proper permissions
sudo chown root:docker /etc/ssl/chat-website/*
sudo chmod 640 /etc/ssl/chat-website/*
```

### 3. SSL Configuration in Docker Compose

Update `docker-compose.prod.yml` to mount SSL certificates:

```yaml
backend:
  volumes:
    - /etc/letsencrypt/live/your-domain.com:/etc/ssl/certs:ro
```

## Monitoring & Logging

### Built-in Monitoring Stack

The application includes a comprehensive monitoring stack:

**Components:**
- **Prometheus:** Metrics collection and storage
- **Grafana:** Visualization and dashboards
- **ELK Stack:** Log aggregation and analysis
- **Node Exporter:** System metrics
- **Redis Exporter:** Redis metrics
- **MongoDB Exporter:** Database metrics

### Setting Up Monitoring

#### 1. Enable Monitoring Services

```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml up -d prometheus grafana elasticsearch logstash kibana

# Check status
docker-compose -f docker-compose.prod.yml ps
```

#### 2. Configure Prometheus Targets

Create `monitoring/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

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

  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### 3. Create Alert Rules

Create `monitoring/alert_rules.yml`:
```yaml
groups:
- name: chat-website-alerts
  rules:
  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 80% for more than 5 minutes"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is above 85% for more than 5 minutes"

  - alert: ApplicationDown
    expr: up{job="chat-website-backend"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Chat Website Backend is down"
      description: "The backend service has been down for more than 1 minute"

  - alert: DatabaseConnectionFailed
    expr: mongodb_up == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "MongoDB connection failed"
      description: "Cannot connect to MongoDB for more than 2 minutes"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 5% for more than 5 minutes"
```

#### 4. Configure Grafana Dashboards

Access Grafana at `http://your-domain.com:3001` and import these dashboard IDs:
- **Node Exporter Full:** 1860
- **MongoDB Dashboard:** 2583
- **Redis Dashboard:** 763
- **Nginx Dashboard:** 9614

**Custom Application Dashboard JSON:**
```json
{
  "dashboard": {
    "id": null,
    "title": "Chat Website Application",
    "tags": ["chat-website"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "chat_website_active_users",
            "refId": "A"
          }
        ]
      },
      {
        "title": "Messages per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(chat_website_messages_total[1m])",
            "refId": "A"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "refId": "A"
          }
        ]
      }
    ]
  }
}
```

### Log Management

#### 1. Configure Application Logging

Update backend logging configuration:
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chat-website-backend' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/chat-website/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/var/log/chat-website/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

#### 2. Set Up Log Rotation

Create `/etc/logrotate.d/chat-website`:
```bash
/var/log/chat-website/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 chatapp chatapp
    postrotate
        docker exec chat-website-backend kill -USR1 1 2>/dev/null || true
    endscript
}
```

#### 3. Configure ELK Stack

**Elasticsearch Configuration:**
```yaml
# monitoring/elasticsearch/elasticsearch.yml
cluster.name: "chat-website-logs"
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true
```

**Logstash Pipeline:**
```ruby
# monitoring/logstash/pipeline/logstash.conf
input {
  file {
    path => "/var/log/chat-website/*.log"
    start_position => "beginning"
    codec => "json"
  }
  
  beats {
    port => 5044
  }
}

filter {
  if [level] {
    mutate {
      uppercase => [ "level" ]
    }
  }
  
  if [message] =~ /ERROR/ {
    mutate {
      add_tag => [ "error" ]
    }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "chat-website-logs-%{+YYYY.MM.dd}"
  }
  
  if "error" in [tags] {
    email {
      to => "admin@your-domain.com"
      subject => "Chat Website Error Alert"
      body => "Error detected: %{message}"
    }
  }
}
```

### External Monitoring Services

#### 1. Uptime Monitoring

**UptimeRobot Setup:**
```bash
# Add monitors for:
# - https://your-domain.com (HTTP)
# - https://api.your-domain.com/health (HTTP)
# - your-server-ip:5000 (Port)
```

**Pingdom Setup:**
```javascript
// Add synthetic monitoring script
if (window.location.pathname === '/') {
  // Check if chat interface loads
  const chatContainer = document.querySelector('.chat-container');
  if (!chatContainer) {
    throw new Error('Chat interface not loaded');
  }
}
```

#### 2. Error Tracking

**Sentry Integration:**
```javascript
// frontend/src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

```javascript
// backend/src/app.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 3. Performance Monitoring

**New Relic Setup:**
```javascript
// backend/newrelic.js
exports.config = {
  app_name: ['Chat Website Backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
};
```

### Alerting Configuration

#### 1. Slack Notifications

```bash
# Create webhook in Slack and add to environment
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

```javascript
// monitoring/alertmanager/config.yml
global:
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  slack_configs:
  - channel: '#alerts'
    title: 'Chat Website Alert'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

#### 2. Email Notifications

```yaml
# monitoring/alertmanager/config.yml
receivers:
- name: 'email-notifications'
  email_configs:
  - to: 'admin@your-domain.com'
    from: 'alerts@your-domain.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'alerts@your-domain.com'
    auth_password: 'your-app-password'
    subject: 'Chat Website Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

### Health Checks

#### 1. Application Health Endpoints

```javascript
// backend/src/routes/health.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('../config/redis');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});

router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check MongoDB
  try {
    await mongoose.connection.db.admin().ping();
    health.services.mongodb = { status: 'healthy' };
  } catch (error) {
    health.services.mongodb = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = { status: 'healthy' };
  } catch (error) {
    health.services.redis = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

#### 2. Docker Health Checks

```dockerfile
# Dockerfile.backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1
```

```dockerfile
# Dockerfile.frontend
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1
```

### 1. Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'chat-website-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### 2. Grafana Dashboards

Access Grafana at `http://your-domain.com:3001`:
- Username: `admin`
- Password: Check environment variables

Import pre-built dashboards for:
- Application metrics
- System metrics
- Database performance
- Error tracking

### 3. Log Aggregation

Configure ELK stack (Elasticsearch, Logstash, Kibana):

```bash
# Start ELK services
docker-compose -f docker-compose.prod.yml up -d elasticsearch logstash kibana

# Access Kibana
open http://your-domain.com:5601
```

## Database Configuration

### 1. MongoDB Production Setup

```bash
# Initialize replica set (for production)
docker exec -it chat-website-mongodb mongo --eval "rs.initiate()"

# Create application database and user
docker exec -it chat-website-mongodb mongo admin --eval "
  db.createUser({
    user: 'chatapp',
    pwd: 'secure-password',
    roles: [{ role: 'readWrite', db: 'chat-website' }]
  })
"
```

### 2. Redis Configuration

Create `redis.conf`:

```conf
# Security
requirepass your-redis-password
bind 127.0.0.1

# Persistence
save 900 1
save 300 10
save 60 10000

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

## Backup and Recovery

### 1. Automated Backups

The setup script creates a backup system that runs daily:

```bash
# Manual backup
/opt/chat-website/backup.sh

# Restore from backup
./scripts/restore.sh /path/to/backup.tar.gz
```

### 2. Database Backups

```bash
# MongoDB backup
docker exec chat-website-mongodb mongodump --out /tmp/backup
docker cp chat-website-mongodb:/tmp/backup ./mongodb-backup

# Redis backup
docker exec chat-website-redis redis-cli BGSAVE
docker cp chat-website-redis:/data/dump.rdb ./redis-backup.rdb
```

### 3. File Backups

```bash
# Backup uploaded files
tar -czf uploads-backup.tar.gz uploads/

# Backup logs
tar -czf logs-backup.tar.gz logs/
```

## Security Hardening

### 1. Server Security

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### 2. Application Security

- Use strong JWT secrets (32+ characters)
- Enable rate limiting
- Configure CORS properly
- Use HTTPS everywhere
- Regular security updates

### 3. Database Security

```bash
# MongoDB security
# - Enable authentication
# - Use strong passwords
# - Limit network access
# - Regular backups

# Redis security
# - Set password
# - Bind to localhost
# - Disable dangerous commands
```

## Performance Optimization

### 1. Application Optimization

```bash
# Enable gzip compression in Nginx
# Configure caching headers
# Optimize database queries
# Use connection pooling
```

### 2. System Optimization

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 3. Docker Optimization

```bash
# Limit container resources
# Use multi-stage builds
# Optimize image sizes
# Configure logging drivers
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Application Won't Start

**Symptoms:**
- Containers exit immediately
- "Connection refused" errors
- Services not responding

**Diagnosis:**
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs for specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs mongodb

# Check system resources
htop
df -h
free -h

# Check port availability
netstat -tulpn | grep :5000
netstat -tulpn | grep :80
```

**Solutions:**
```bash
# Fix permission issues
sudo chown -R chatapp:chatapp /opt/chat-website
sudo chmod -R 755 /opt/chat-website

# Clear Docker cache
docker system prune -a
docker volume prune

# Restart Docker daemon
sudo systemctl restart docker

# Check environment files
ls -la backend/.env*
cat backend/.env.production
```

#### 2. Database Connection Issues

**MongoDB Issues:**
```bash
# Check MongoDB status
docker exec chat-website-mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB logs
docker logs chat-website-mongodb

# Test connection from backend
docker exec chat-website-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"

# Fix MongoDB authentication
docker exec -it chat-website-mongodb mongosh admin
# > db.createUser({user: 'root', pwd: 'password', roles: ['root']})
```

**Redis Issues:**
```bash
# Check Redis status
docker exec chat-website-redis redis-cli ping

# Check Redis logs
docker logs chat-website-redis

# Test Redis connection
docker exec chat-website-redis redis-cli -a your-password ping

# Clear Redis data (if needed)
docker exec chat-website-redis redis-cli -a your-password FLUSHALL
```

#### 3. SSL/HTTPS Issues

**Certificate Problems:**
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates

# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Renew certificates manually
sudo certbot renew --dry-run
sudo certbot renew --force-renewal
```

**Let's Encrypt Issues:**
```bash
# Check Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Verify domain DNS
nslookup your-domain.com
dig your-domain.com

# Stop services before renewal
sudo systemctl stop nginx
docker-compose -f docker-compose.prod.yml stop frontend

# Generate new certificate
sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com
```

#### 4. Performance Issues

**High CPU Usage:**
```bash
# Identify CPU-intensive processes
top -p $(docker inspect --format='{{.State.Pid}}' chat-website-backend)
htop

# Check application metrics
curl http://localhost:5000/metrics | grep cpu

# Analyze Node.js performance
docker exec chat-website-backend node --prof src/server.js
# Generate profile report
docker exec chat-website-backend node --prof-process isolate-*.log > profile.txt
```

**Memory Issues:**
```bash
# Check memory usage
free -h
docker stats

# Check for memory leaks
docker exec chat-website-backend node --inspect=0.0.0.0:9229 src/server.js
# Use Chrome DevTools to connect and analyze

# Increase container memory limits
# Edit docker-compose.prod.yml:
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 2G
```

**Database Performance:**
```bash
# MongoDB performance analysis
docker exec chat-website-mongodb mongosh --eval "
db.runCommand({serverStatus: 1}).metrics
"

# Check slow queries
docker exec chat-website-mongodb mongosh --eval "
db.setProfilingLevel(2, {slowms: 100})
db.system.profile.find().sort({ts: -1}).limit(5)
"

# Redis performance
docker exec chat-website-redis redis-cli --latency-history -i 1
docker exec chat-website-redis redis-cli info memory
```

#### 5. Network Issues

**Connection Problems:**
```bash
# Check firewall rules
sudo ufw status verbose
sudo iptables -L

# Test internal connectivity
docker exec chat-website-backend curl http://mongodb:27017
docker exec chat-website-backend curl http://redis:6379

# Check DNS resolution
docker exec chat-website-backend nslookup mongodb
docker exec chat-website-backend nslookup redis

# Test external connectivity
curl -I http://your-domain.com
curl -I https://your-domain.com
curl -I https://api.your-domain.com/health
```

**WebSocket Issues:**
```bash
# Test WebSocket connection
npm install -g wscat
wscat -c ws://your-domain.com/socket.io/?EIO=4&transport=websocket

# Check Socket.IO logs
docker logs chat-website-backend | grep socket

# Verify CORS settings
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.your-domain.com/socket.io/
```

### Recovery Procedures

#### 1. Service Recovery

**Graceful Restart:**
```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Rolling restart (zero downtime)
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
```

**Emergency Recovery:**
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Clear containers and networks
docker system prune -f

# Restore from backup
BACKUP_PATH=$(cat .last_backup)
sudo cp -r "$BACKUP_PATH/uploads" ./
sudo cp -r "$BACKUP_PATH/logs" ./

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Database Recovery

**MongoDB Recovery:**
```bash
# Create backup before recovery
docker exec chat-website-mongodb mongodump --out /tmp/current-backup

# Stop application
docker-compose -f docker-compose.prod.yml stop backend

# Restore from backup
BACKUP_PATH=$(cat .last_backup)
docker cp "$BACKUP_PATH/mongodb" chat-website-mongodb:/tmp/restore
docker exec chat-website-mongodb mongorestore --drop /tmp/restore

# Restart application
docker-compose -f docker-compose.prod.yml start backend
```

**Redis Recovery:**
```bash
# Save current state
docker exec chat-website-redis redis-cli -a your-password BGSAVE

# Stop Redis
docker-compose -f docker-compose.prod.yml stop redis

# Restore backup
BACKUP_PATH=$(cat .last_backup)
docker cp "$BACKUP_PATH/redis_dump.rdb" chat-website-redis:/data/dump.rdb

# Start Redis
docker-compose -f docker-compose.prod.yml start redis
```

#### 3. Complete System Recovery

**Disaster Recovery:**
```bash
# 1. Prepare new server
sudo ./scripts/setup-production.sh your-domain.com admin@your-domain.com

# 2. Restore application code
git clone https://github.com/your-username/chat-website.git
cd chat-website

# 3. Restore environment files
scp user@old-server:/opt/chat-website/.env.production backend/

# 4. Restore data
scp -r user@old-server:/opt/chat-website/backups/latest ./restore-data

# 5. Deploy with restored data
./scripts/deploy.sh production

# 6. Restore databases
docker cp restore-data/mongodb chat-website-mongodb:/tmp/restore
docker exec chat-website-mongodb mongorestore --drop /tmp/restore

docker cp restore-data/redis_dump.rdb chat-website-redis:/data/dump.rdb
docker restart chat-website-redis
```

### Debugging Tools

#### 1. Log Analysis

**Real-time Log Monitoring:**
```bash
# Follow all logs
docker-compose -f docker-compose.prod.yml logs -f

# Follow specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Search logs for errors
docker-compose -f docker-compose.prod.yml logs backend | grep -i error

# Analyze log patterns
tail -f /var/log/chat-website/app.log | grep -E "(ERROR|WARN|FATAL)"
```

**Log Analysis Scripts:**
```bash
#!/bin/bash
# analyze-logs.sh

LOG_FILE="/var/log/chat-website/app.log"
TIME_RANGE="1 hour ago"

echo "=== Error Summary (last hour) ==="
grep -E "ERROR|FATAL" "$LOG_FILE" | \
  awk -v since="$(date -d "$TIME_RANGE" +%s)" '
    {
      timestamp = substr($1, 2, 19)
      cmd = "date -d \"" timestamp "\" +%s"
      cmd | getline epoch
      close(cmd)
      if (epoch >= since) print $0
    }
  ' | \
  cut -d' ' -f3- | \
  sort | uniq -c | sort -nr

echo -e "\n=== Top Error Messages ==="
grep ERROR "$LOG_FILE" | \
  sed 's/.*ERROR: //' | \
  sort | uniq -c | sort -nr | head -10
```

#### 2. Performance Profiling

**Node.js Profiling:**
```bash
# Enable profiling
docker exec chat-website-backend node --prof src/server.js &

# Generate load
ab -n 1000 -c 10 http://localhost:5000/api/health

# Stop profiling and analyze
docker exec chat-website-backend node --prof-process isolate-*.log > profile.txt
```

**Database Profiling:**
```javascript
// MongoDB profiling
db.setProfilingLevel(2, {slowms: 100});
db.system.profile.find().sort({ts: -1}).limit(10);

// Redis profiling
redis-cli --latency-history -i 1
redis-cli --stat
```

#### 3. Network Debugging

**Connection Testing:**
```bash
# Test internal service connectivity
docker exec chat-website-backend nc -zv mongodb 27017
docker exec chat-website-backend nc -zv redis 6379

# Test external connectivity
curl -v http://your-domain.com
curl -v https://api.your-domain.com/health

# WebSocket testing
wscat -c ws://localhost:5000/socket.io/?EIO=4&transport=websocket
```

### Emergency Contacts & Procedures

#### 1. Incident Response

**Severity Levels:**
- **P0 (Critical):** Complete service outage
- **P1 (High):** Major functionality impaired
- **P2 (Medium):** Minor functionality issues
- **P3 (Low):** Cosmetic or enhancement requests

**Response Times:**
- P0: Immediate (< 15 minutes)
- P1: 1 hour
- P2: 4 hours
- P3: Next business day

#### 2. Escalation Procedures

```bash
# 1. Check service status
curl -f https://your-domain.com/health || echo "Service DOWN"

# 2. Check monitoring dashboards
# - Grafana: https://your-domain.com:3001
# - Prometheus: https://your-domain.com:9090

# 3. Review recent changes
git log --oneline -10
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"

# 4. Implement immediate fix or rollback
git revert HEAD  # If code issue
./scripts/deploy.sh production  # Redeploy

# 5. Document incident
echo "$(date): Incident description and resolution" >> /var/log/incidents.log
```

## Maintenance

### Regular Maintenance Schedule

#### Daily Tasks (Automated)
```bash
#!/bin/bash
# daily-maintenance.sh

# Check service health
curl -f https://your-domain.com/health || echo "ALERT: Service health check failed"

# Check disk space
df -h | awk '$5 > 80 {print "ALERT: Disk usage high on " $1 ": " $5}'

# Check memory usage
free | awk 'NR==2{printf "Memory Usage: %s/%sMB (%.2f%%)\n", $3,$2,$3*100/$2 }'

# Rotate logs
docker exec chat-website-backend kill -USR1 1

# Clean old Docker images
docker image prune -f --filter "until=24h"

# Backup database
/opt/chat-website/backup.sh
```

#### Weekly Tasks
```bash
#!/bin/bash
# weekly-maintenance.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Check SSL certificate expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates

# Review application metrics
curl -s http://localhost:5000/metrics | grep -E "(cpu|memory|requests)"

# Clean old backups (keep last 4 weeks)
find /opt/chat-website/backups -name "backup_*.tar.gz" -mtime +28 -delete

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
```

#### Monthly Tasks
```bash
#!/bin/bash
# monthly-maintenance.sh

# Security audit
sudo lynis audit system

# Performance review
docker stats --no-stream
docker exec chat-website-mongodb mongosh --eval "db.stats()"

# Database optimization
docker exec chat-website-mongodb mongosh --eval "
  db.runCommand({compact: 'users'});
  db.runCommand({compact: 'messages'});
  db.runCommand({reIndex: 'users'});
  db.runCommand({reIndex: 'messages'});
"

# Check for application updates
git fetch origin
git log HEAD..origin/main --oneline
```

#### Quarterly Tasks
- Disaster recovery testing
- Security penetration testing
- Performance benchmarking
- Capacity planning review
- Documentation updates

### Update Procedures

#### 1. Application Updates

**Minor Updates (Patches):**
```bash
# 1. Check current version
git log --oneline -1

# 2. Pull latest changes
git fetch origin
git log HEAD..origin/main --oneline

# 3. Create backup
./scripts/backup.sh

# 4. Deploy update
git pull origin main
./scripts/deploy.sh production

# 5. Verify deployment
curl -f https://your-domain.com/health
curl -f https://api.your-domain.com/health
```

**Major Updates (Features):**
```bash
# 1. Deploy to staging first
git checkout staging
git pull origin staging
./scripts/deploy.sh staging

# 2. Run tests
npm run test:all

# 3. Performance testing
ab -n 1000 -c 10 https://staging.your-domain.com/

# 4. Deploy to production
git checkout main
git pull origin main
./scripts/deploy.sh production
```

#### 2. System Updates

**Operating System Updates:**
```bash
# 1. Check current packages
apt list --upgradable

# 2. Update package lists
sudo apt update

# 3. Upgrade packages (non-interactive)
sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y

# 4. Reboot if kernel updated
if [ -f /var/run/reboot-required ]; then
    echo "Reboot required"
    sudo reboot
fi
```

**Docker Updates:**
```bash
# 1. Update Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Update Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Restart Docker service
sudo systemctl restart docker

# 4. Verify installation
docker --version
docker-compose --version
```

#### 3. Database Maintenance

**MongoDB Maintenance:**
```javascript
// Connect to MongoDB
docker exec -it chat-website-mongodb mongosh

// Database statistics
db.stats()

// Collection statistics
db.users.stats()
db.messages.stats()

// Index analysis
db.users.getIndexes()
db.messages.getIndexes()

// Compact collections (reduces disk usage)
db.runCommand({compact: "users"})
db.runCommand({compact: "messages"})

// Rebuild indexes
db.users.reIndex()
db.messages.reIndex()

// Check for slow queries
db.setProfilingLevel(2, {slowms: 100})
db.system.profile.find().sort({ts: -1}).limit(10)
```

**Redis Maintenance:**
```bash
# Connect to Redis
docker exec -it chat-website-redis redis-cli -a your-password

# Memory usage
INFO memory

# Key statistics
INFO keyspace

# Clean expired keys
FLUSHDB  # Only if needed

# Optimize memory
CONFIG SET save "900 1 300 10 60 10000"
BGSAVE
```

### Monitoring & Alerting Setup

#### 1. System Monitoring

**CPU and Memory Alerts:**
```yaml
# prometheus/alert_rules.yml
- alert: HighCPUUsage
  expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage detected"
    description: "CPU usage is above 80% for more than 5 minutes"

- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage detected"
    description: "Memory usage is above 85% for more than 5 minutes"
```

**Disk Space Monitoring:**
```bash
# Add to crontab
0 */6 * * * df -h | awk '$5 > 80 {print "ALERT: Disk usage high on " $1 ": " $5}' | mail -s "Disk Space Alert" admin@your-domain.com
```

#### 2. Application Monitoring

**Health Check Monitoring:**
```bash
#!/bin/bash
# health-monitor.sh

ENDPOINTS=(
    "https://your-domain.com"
    "https://api.your-domain.com/health"
    "https://your-domain.com:3001"  # Grafana
)

for endpoint in "${ENDPOINTS[@]}"; do
    if ! curl -f -s "$endpoint" > /dev/null; then
        echo "ALERT: $endpoint is not responding" | \
        mail -s "Service Down Alert" admin@your-domain.com
    fi
done
```

**SSL Certificate Monitoring:**
```bash
#!/bin/bash
# ssl-monitor.sh

DOMAIN="your-domain.com"
EXPIRY_DATE=$(openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "ALERT: SSL certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days" | \
    mail -s "SSL Certificate Expiry Alert" admin@your-domain.com
fi
```

### Backup & Recovery Procedures

#### 1. Automated Backup System

**Complete Backup Script:**
```bash
#!/bin/bash
# comprehensive-backup.sh

BACKUP_DIR="/opt/chat-website/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"
S3_BUCKET="your-backup-bucket"  # Optional

mkdir -p "$BACKUP_PATH"

# 1. Application files
tar -czf "$BACKUP_PATH/app_files.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    /opt/chat-website/app

# 2. Database backups
echo "Backing up MongoDB..."
docker exec chat-website-mongodb mongodump --out /tmp/backup
docker cp chat-website-mongodb:/tmp/backup "$BACKUP_PATH/mongodb"

echo "Backing up Redis..."
docker exec chat-website-redis redis-cli -a your-password BGSAVE
docker cp chat-website-redis:/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"

# 3. Configuration files
cp -r /opt/chat-website/.env* "$BACKUP_PATH/"
cp -r /etc/nginx/sites-available "$BACKUP_PATH/nginx_config"
cp -r /etc/ssl/chat-website "$BACKUP_PATH/ssl_certs"

# 4. Logs
tar -czf "$BACKUP_PATH/logs.tar.gz" /var/log/chat-website

# 5. Uploads
if [ -d "/opt/chat-website/uploads" ]; then
    tar -czf "$BACKUP_PATH/uploads.tar.gz" /opt/chat-website/uploads
fi

# 6. Create manifest
cat > "$BACKUP_PATH/manifest.txt" << EOF
Backup created: $(date)
Server: $(hostname)
Application version: $(cd /opt/chat-website/app && git log --oneline -1)
Docker images:
$(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}")
EOF

# 7. Compress entire backup
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"
rm -rf "$BACKUP_PATH"

# 8. Upload to S3 (optional)
if [ -n "$S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_PATH.tar.gz" "s3://$S3_BUCKET/chat-website/"
fi

# 9. Clean old backups (keep last 7 days locally)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_PATH.tar.gz"
```

#### 2. Recovery Procedures

**Complete System Recovery:**
```bash
#!/bin/bash
# restore-system.sh

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

# 1. Extract backup
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# 2. Stop services
docker-compose -f docker-compose.prod.yml down

# 3. Restore application files
tar -xzf "$RESTORE_DIR/backup_*/app_files.tar.gz" -C /

# 4. Restore configuration
cp -r "$RESTORE_DIR/backup_*/.env*" /opt/chat-website/
cp -r "$RESTORE_DIR/backup_*/nginx_config/*" /etc/nginx/sites-available/
cp -r "$RESTORE_DIR/backup_*/ssl_certs/*" /etc/ssl/chat-website/

# 5. Start services
docker-compose -f docker-compose.prod.yml up -d

# 6. Wait for services to start
sleep 30

# 7. Restore databases
docker cp "$RESTORE_DIR/backup_*/mongodb" chat-website-mongodb:/tmp/restore
docker exec chat-website-mongodb mongorestore --drop /tmp/restore

docker cp "$RESTORE_DIR/backup_*/redis_dump.rdb" chat-website-redis:/data/dump.rdb
docker restart chat-website-redis

# 8. Restore uploads
if [ -f "$RESTORE_DIR/backup_*/uploads.tar.gz" ]; then
    tar -xzf "$RESTORE_DIR/backup_*/uploads.tar.gz" -C /opt/chat-website/
fi

# 9. Verify restoration
curl -f http://localhost:5000/health
curl -f http://localhost/

echo "System restoration completed"
rm -rf "$RESTORE_DIR"
```

### Performance Optimization

#### 1. Application Optimization

**Node.js Optimization:**
```javascript
// backend/src/config/optimization.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Worker process
  require('./server');
}
```

**Database Optimization:**
```javascript
// MongoDB indexes
db.users.createIndex({ "uniqueUserId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.messages.createIndex({ "chatId": 1, "timestamp": -1 })
db.messages.createIndex({ "sender": 1, "timestamp": -1 })

// Connection pooling
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

#### 2. Infrastructure Optimization

**Nginx Optimization:**
```nginx
# nginx.conf
worker_processes auto;
worker_connections 1024;

http {
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Enable caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend:5000;
    }

    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend:5000;
    }
}
```

**Docker Optimization:**
```yaml
# docker-compose.prod.yml optimizations
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    environment:
      - NODE_OPTIONS=--max-old-space-size=1536
```

### Security Maintenance

#### 1. Security Updates

**Automated Security Updates:**
```bash
# /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

#### 2. Security Auditing

**Regular Security Checks:**
```bash
#!/bin/bash
# security-audit.sh

# Check for security updates
apt list --upgradable | grep -i security

# Scan for vulnerabilities
npm audit --audit-level moderate

# Check Docker security
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    -v /tmp:/tmp aquasec/trivy image chat-website-backend:latest

# Check SSL configuration
testssl.sh https://your-domain.com

# Check open ports
nmap -sS -O localhost

# Check file permissions
find /opt/chat-website -type f -perm /o+w -exec ls -l {} \;
```

### Documentation & Support

#### 1. Runbook Creation

Create operational runbooks for:
- **Incident Response:** Step-by-step procedures for common issues
- **Deployment Process:** Detailed deployment checklist
- **Backup/Recovery:** Recovery procedures for different scenarios
- **Monitoring:** How to interpret metrics and alerts

#### 2. Knowledge Base

Maintain documentation for:
- Architecture diagrams
- API documentation
- Configuration management
- Troubleshooting guides
- Performance benchmarks

### Final Checklist

Before going live, ensure:

- [ ] All services are running and healthy
- [ ] SSL certificates are installed and valid
- [ ] Monitoring and alerting are configured
- [ ] Backups are automated and tested
- [ ] Security hardening is applied
- [ ] Performance testing is completed
- [ ] Documentation is up to date
- [ ] Emergency procedures are documented
- [ ] Team is trained on operational procedures

## Support and Documentation

### Resources
- **Application Logs:** `/var/log/chat-website/`
- **System Logs:** `/var/log/syslog`
- **Monitoring Dashboard:** `https://your-domain.com:3001` (Grafana)
- **Metrics Endpoint:** `https://your-domain.com:9090` (Prometheus)
- **API Documentation:** `docs/api-documentation.md`
- **Mobile Integration:** `docs/mobile-integration-guide.md`

### Emergency Contacts
- **Primary Admin:** admin@your-domain.com
- **Secondary Admin:** backup-admin@your-domain.com
- **Hosting Provider Support:** [Provider contact info]
- **Domain Registrar:** [Registrar contact info]

### Useful Commands Reference

```bash
# Quick health check
curl -f https://your-domain.com/health && echo "OK" || echo "FAILED"

# View recent logs
docker-compose -f docker-compose.prod.yml logs --tail=100 -f

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Emergency stop all services
docker-compose -f docker-compose.prod.yml down

# Quick backup
/opt/chat-website/backup.sh

# Check system resources
htop && df -h && free -h
```

---

**Congratulations!** You now have a comprehensive deployment guide that covers every aspect of deploying your Chat Website application. This guide should enable successful deployment regardless of your chosen platform or infrastructure setup.

## Scaling Considerations

### 1. Horizontal Scaling

- Load balancer configuration
- Database clustering
- Redis clustering
- CDN setup

### 2. Vertical Scaling

- Increase server resources
- Optimize database performance
- Configure caching layers

### 3. High Availability

- Multi-region deployment
- Database replication
- Automated failover
- Health checks and monitoring

## Support and Documentation

- **Application Logs:** `/var/log/chat-website/`
- **System Logs:** `/var/log/syslog`
- **Monitoring:** `http://your-domain.com:3001` (Grafana)
- **Metrics:** `http://your-domain.com:9090` (Prometheus)

For additional support, refer to the API documentation and mobile integration guide.