# 🏛️ Oracle Cloud Complete Deployment Guide

**The Ultimate Guide to Deploy Your Chat Website on Oracle Cloud Always Free Tier**

Get **enterprise-level power** with **4 CPUs, 24GB RAM, 200GB storage** - completely **FREE FOREVER**!

---

## 📋 Table of Contents

1. [Overview & Benefits](#overview--benefits)
2. [Account Setup](#account-setup)
3. [VPS Instance Creation](#vps-instance-creation)
4. [Initial Server Configuration](#initial-server-configuration)
5. [Application Deployment](#application-deployment)
6. [Domain & SSL Setup](#domain--ssl-setup)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Configurations](#advanced-configurations)

---

## 🎯 Overview & Benefits

### What You'll Get (100% Free Forever)

```
🏆 Oracle Cloud Always Free Tier
├── 4 ARM Ampere CPUs (equivalent to 8 x86 CPUs)
├── 24GB RAM (more than $50/month paid VPS)
├── 200GB Block Storage
├── 10TB Monthly Transfer
├── 2 Load Balancers
├── Unlimited Time (no expiration)
└── Enterprise-grade infrastructure
```

### Power Comparison
```
Oracle Free:      4 CPUs, 24GB RAM, 200GB - $0/month ⭐
DigitalOcean:     2 CPUs, 4GB RAM, 80GB   - $24/month
AWS t3.medium:    2 CPUs, 4GB RAM, 30GB   - $30/month
Google Cloud:     2 CPUs, 7.5GB RAM, 20GB - $35/month
```

**Oracle's free tier is 6x more powerful than most paid options!**

---

## 🚀 Account Setup

### Step 1: Create Oracle Cloud Account

#### 1.1 Registration Process
1. **Go to Oracle Cloud**: [https://cloud.oracle.com](https://cloud.oracle.com)
2. **Click "Start for free"**
3. **Fill out registration form**:
   ```
   Account Type: Personal Use
   Country: [Your Country]
   First Name: [Your Name]
   Last Name: [Your Name]
   Email: [Your Email]
   ```

#### 1.2 Verification Requirements
```
📋 Required Information:
├── Valid email address
├── Phone number (for SMS verification)
├── Credit card (for identity verification only)
├── Home address
└── Government ID (in some regions)
```

**⚠️ Important Notes:**
- **Credit card is for verification only** - no charges will be made
- **Always Free resources never expire** and don't require payment
- **Choose "Always Free" tier** during signup

#### 1.3 Account Verification
1. **Verify email** - check inbox and click verification link
2. **Verify phone** - enter SMS code received
3. **Identity verification** - may take 24-48 hours
4. **Account activation** - you'll receive confirmation email

### Step 2: Initial Console Access

#### 2.1 First Login
1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Click **"Sign In"**
3. Enter your **Cloud Account Name** (provided in welcome email)
4. Enter **username** and **password**

#### 2.2 Choose Home Region
```
🌍 Recommended Regions (Always Free Available):
├── US East (Ashburn) - us-ashburn-1
├── US West (Phoenix) - us-phoenix-1
├── UK South (London) - uk-london-1
├── Germany Central (Frankfurt) - eu-frankfurt-1
├── Japan East (Tokyo) - ap-tokyo-1
└── Australia East (Sydney) - ap-sydney-1
```

**⚠️ Critical:** Once you choose a home region, you **cannot change it**. Choose the region closest to your users.

---

## 🖥️ VPS Instance Creation

### Step 3: Create Compute Instance

#### 3.1 Navigate to Compute
1. **Oracle Cloud Console** → **Hamburger Menu** (☰)
2. **Compute** → **Instances**
3. **Click "Create Instance"**

#### 3.2 Basic Configuration
```
Instance Configuration:
├── Name: chat-website-server
├── Compartment: root (default)
├── Availability Domain: AD-1 (or any available)
└── Fault Domain: Leave default
```

#### 3.3 Image and Shape Selection

**Image Selection:**
```
📀 Operating System: Ubuntu
├── Version: 22.04 (Latest LTS)
├── Image: Canonical Ubuntu 22.04
└── Architecture: ARM64 (for Always Free)
```

**Shape Configuration (Most Important):**
```
🔧 Shape Series: Ampere (ARM-based)
├── Shape: VM.Standard.A1.Flex
├── Number of CPUs: 4 (Maximum for Always Free)
├── Amount of Memory (GB): 24 (Maximum for Always Free)
└── Network Bandwidth (Gbps): 4
```

**⚠️ Critical Settings:**
- **Must use VM.Standard.A1.Flex** for Always Free
- **Maximum 4 CPUs and 24GB RAM** across all instances
- **ARM architecture** is required for Always Free

#### 3.4 Networking Configuration

**Primary VNIC:**
```
🌐 Network Configuration:
├── Virtual Cloud Network: Create new VCN
├── VCN Name: chat-website-vcn
├── Subnet: Create new public subnet
├── Subnet Name: chat-website-subnet
├── Assign Public IPv4 Address: ✅ Yes
└── Assign IPv6 Address: ❌ No (optional)
```

**Advanced Networking:**
```
🔧 Advanced Options:
├── Use Network Security Groups: ❌ No
├── Private IP Address: Automatic
└── Hostname: chat-website-server
```

#### 3.5 SSH Key Configuration

**Option 1: Generate New Key Pair**
```bash
# On your local machine (Windows/Mac/Linux)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_cloud_key

# This creates:
# ~/.ssh/oracle_cloud_key (private key - keep secure)
# ~/.ssh/oracle_cloud_key.pub (public key - upload to Oracle)
```

**Option 2: Use Existing Key**
- Upload your existing public key file
- Or paste public key content

**Upload Public Key:**
1. **Choose "Upload public key files (.pub)"**
2. **Browse and select** `oracle_cloud_key.pub`
3. **Or paste key content** in text area

#### 3.6 Boot Volume Configuration
```
💾 Boot Volume:
├── Size (GB): 200 (Maximum for Always Free)
├── Volume Performance: Balanced
├── Encryption: Oracle-managed keys
└── Backup Policy: None (to stay free)
```

#### 3.7 Review and Create
1. **Review all settings** carefully
2. **Verify "Always Free Eligible"** appears
3. **Click "Create"**
4. **Wait 2-5 minutes** for provisioning

---

## 🔧 Initial Server Configuration

### Step 4: Connect to Your Instance

#### 4.1 Get Instance Details
1. **Go to Compute** → **Instances**
2. **Click your instance name**
3. **Note the Public IP Address**
4. **Verify instance is "Running"**

#### 4.2 SSH Connection

**From Windows (using PowerShell or WSL):**
```powershell
# Using PowerShell
ssh -i C:\Users\YourName\.ssh\oracle_cloud_key ubuntu@YOUR_PUBLIC_IP

# Using WSL/Git Bash
ssh -i ~/.ssh/oracle_cloud_key ubuntu@YOUR_PUBLIC_IP
```

**From Mac/Linux:**
```bash
# Set correct permissions
chmod 600 ~/.ssh/oracle_cloud_key

# Connect to instance
ssh -i ~/.ssh/oracle_cloud_key ubuntu@YOUR_PUBLIC_IP
```

**First Connection:**
```bash
# You'll see something like:
The authenticity of host 'xxx.xxx.xxx.xxx' can't be established.
ECDSA key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no)? yes

# Type 'yes' and press Enter
```

#### 4.3 Initial System Update
```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop unzip software-properties-common

# Check system information
echo "🖥️ System Information:"
echo "CPU: $(nproc) cores"
echo "RAM: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $2}')"
echo "OS: $(lsb_release -d | cut -f2)"
```

### Step 5: Install Required Software

#### 5.1 Install Node.js 18 (LTS)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
```

#### 5.2 Install PM2 Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 startup script
pm2 startup
# Follow the instructions shown (copy and run the command)
```

#### 5.3 Install Nginx Web Server
```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test Nginx (should show default page)
curl -I http://localhost
```

#### 5.4 Install MongoDB (Optional - Local Database)
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod

# Test MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"
```

**Alternative: Use MongoDB Atlas (Recommended)**
- **Free tier**: 512MB storage
- **No server maintenance** required
- **Better for production**
- **Sign up**: [MongoDB Atlas](https://cloud.mongodb.com)

---

## 🚀 Application Deployment

### Step 6: Deploy Chat Website

#### 6.1 Clone Repository
```bash
# Create application directory
sudo mkdir -p /opt/chat-website
sudo chown ubuntu:ubuntu /opt/chat-website

# Clone your repository
cd /opt
git clone https://github.com/YOUR_USERNAME/chat-website.git
# Or if private repository:
# git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/chat-website.git

# Set ownership
sudo chown -R ubuntu:ubuntu chat-website
cd chat-website
```

#### 6.2 Backend Setup

**Install Dependencies:**
```bash
cd backend

# Install production dependencies
npm install --production

# Check for vulnerabilities
npm audit

# Fix vulnerabilities if any
npm audit fix
```

**Environment Configuration:**
```bash
# Create production environment file
cat > .env << EOF
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration (choose one)
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/chat-website

# Option 2: MongoDB Atlas (recommended)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-website?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://YOUR_PUBLIC_IP

# Optional: Redis Configuration
# REDIS_URL=redis://localhost:6379
EOF

# Secure the environment file
chmod 600 .env
```

**Test Backend:**
```bash
# Test backend startup
npm start

# In another terminal, test API
curl -I http://localhost:5000/health

# Stop test (Ctrl+C)
```

**Start with PM2:**
```bash
# Start backend with PM2
pm2 start src/server.js --name "chat-backend" --env production

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs chat-backend
```

#### 6.3 Frontend Setup

**Install Dependencies:**
```bash
cd ../frontend

# Install dependencies
npm install

# Check for vulnerabilities
npm audit fix
```

**Environment Configuration:**
```bash
# Create production environment file
cat > .env.production << EOF
# API Configuration
VITE_API_URL=http://YOUR_PUBLIC_IP/api
VITE_SOCKET_URL=http://YOUR_PUBLIC_IP

# Environment
VITE_NODE_ENV=production
EOF
```

**Build Frontend:**
```bash
# Build for production
npm run build

# Verify build
ls -la dist/

# Copy to web directory
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

### Step 7: Configure Nginx Reverse Proxy

#### 7.1 Create Nginx Configuration
```bash
# Create site configuration
sudo tee /etc/nginx/sites-available/chat-website << 'EOF'
server {
    listen 80;
    server_name YOUR_PUBLIC_IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend (React build)
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF
```

#### 7.2 Enable Site Configuration
```bash
# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Enable chat website
sudo ln -s /etc/nginx/sites-available/chat-website /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

### Step 8: Configure Oracle Cloud Networking

#### 8.1 Security List Configuration
1. **Go to Oracle Cloud Console**
2. **Networking** → **Virtual Cloud Networks**
3. **Click your VCN** (`chat-website-vcn`)
4. **Security Lists** → **Default Security List**
5. **Add Ingress Rules**:

```
🔧 Ingress Rules to Add:

Rule 1 - HTTP Traffic:
├── Source Type: CIDR
├── Source CIDR: 0.0.0.0/0
├── IP Protocol: TCP
├── Source Port Range: All
├── Destination Port Range: 80
└── Description: HTTP traffic

Rule 2 - HTTPS Traffic:
├── Source Type: CIDR
├── Source CIDR: 0.0.0.0/0
├── IP Protocol: TCP
├── Source Port Range: All
├── Destination Port Range: 443
└── Description: HTTPS traffic

Rule 3 - Backend API (Optional - for direct access):
├── Source Type: CIDR
├── Source CIDR: 0.0.0.0/0
├── IP Protocol: TCP
├── Source Port Range: All
├── Destination Port Range: 5000
└── Description: Backend API
```

#### 8.2 Server Firewall Configuration
```bash
# Install and configure UFW (Uncomplicated Firewall)
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (port 22)
sudo ufw allow ssh

# Allow HTTP (port 80)
sudo ufw allow 80

# Allow HTTPS (port 443)
sudo ufw allow 443

# Allow backend port (optional)
sudo ufw allow 5000

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### Step 9: Test Deployment

#### 9.1 Basic Functionality Test
```bash
# Test backend health
curl -I http://YOUR_PUBLIC_IP/health

# Test frontend
curl -I http://YOUR_PUBLIC_IP

# Test API endpoint
curl -X POST http://YOUR_PUBLIC_IP/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Check PM2 status
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
```

#### 9.2 Browser Testing
1. **Open browser** and go to `http://YOUR_PUBLIC_IP`
2. **Test signup** - create a new account
3. **Test signin** - login with created account
4. **Test chat creation** - search for users and create chat
5. **Test messaging** - send and receive messages
6. **Test real-time features** - typing indicators, online status

---

## 🌐 Domain & SSL Setup

### Step 10: Custom Domain Configuration

#### 10.1 Domain Options

**Option 1: Free Domains**
```
🆓 Free Domain Providers:
├── Freenom: .tk, .ml, .ga, .cf domains
├── DuckDNS: yourapp.duckdns.org
├── No-IP: yourapp.ddns.net
└── Afraid.org: Various free subdomains
```

**Option 2: Paid Domains**
```
💰 Paid Domain Registrars:
├── Namecheap: $8-15/year
├── GoDaddy: $10-20/year
├── Cloudflare: $8-12/year
└── Google Domains: $12-15/year
```

#### 10.2 DNS Configuration

**For Freenom (Free .tk domain example):**
1. **Go to [Freenom](https://freenom.com)**
2. **Search for available domain** (e.g., `mychatapp.tk`)
3. **Register domain** (free for 12 months)
4. **Go to "My Domains"** → **Manage Domain** → **Manage Freenom DNS**
5. **Add DNS records**:

```
DNS Records:
├── Type: A, Name: @, Target: YOUR_PUBLIC_IP, TTL: 300
├── Type: A, Name: www, Target: YOUR_PUBLIC_IP, TTL: 300
└── Type: CNAME, Name: api, Target: @, TTL: 300
```

#### 10.3 Update Application Configuration

**Update Nginx Configuration:**
```bash
# Update Nginx site configuration
sudo nano /etc/nginx/sites-available/chat-website

# Change server_name line:
server_name mychatapp.tk www.mychatapp.tk;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Update Backend Environment:**
```bash
# Update backend environment
cd /opt/chat-website/backend
nano .env

# Update FRONTEND_URL:
FRONTEND_URL=http://mychatapp.tk

# Restart backend
pm2 restart chat-backend
```

**Update Frontend Environment:**
```bash
# Update frontend environment
cd /opt/chat-website/frontend
nano .env.production

# Update URLs:
VITE_API_URL=http://mychatapp.tk/api
VITE_SOCKET_URL=http://mychatapp.tk

# Rebuild and deploy
npm run build
sudo cp -r dist/* /var/www/html/
```

### Step 11: SSL Certificate Setup

#### 11.1 Install Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

#### 11.2 Obtain SSL Certificate
```bash
# Get SSL certificate for your domain
sudo certbot --nginx -d mychatapp.tk -d www.mychatapp.tk

# Follow the prompts:
# 1. Enter email address
# 2. Agree to terms of service (Y)
# 3. Share email with EFF (Y/N - your choice)
# 4. Choose redirect option (2 - redirect HTTP to HTTPS)
```

#### 11.3 Verify SSL Configuration
```bash
# Test SSL certificate
curl -I https://mychatapp.tk

# Check certificate details
openssl s_client -connect mychatapp.tk:443 -servername mychatapp.tk

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 11.4 Update Application for HTTPS

**Update Backend Environment:**
```bash
cd /opt/chat-website/backend
nano .env

# Update FRONTEND_URL for HTTPS:
FRONTEND_URL=https://mychatapp.tk

# Restart backend
pm2 restart chat-backend
```

**Update Frontend Environment:**
```bash
cd /opt/chat-website/frontend
nano .env.production

# Update URLs for HTTPS:
VITE_API_URL=https://mychatapp.tk/api
VITE_SOCKET_URL=https://mychatapp.tk

# Rebuild and deploy
npm run build
sudo cp -r dist/* /var/www/html/
```

---

## 🛡️ Security Hardening

### Step 12: Advanced Security Configuration

#### 12.1 SSH Hardening
```bash
# Backup SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Apply these security settings:
```

```bash
# SSH Security Configuration
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Authentication
LoginGraceTime 60
PermitRootLogin no
StrictModes yes
MaxAuthTries 3
MaxSessions 2
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security options
X11Forwarding no
PrintMotd no
TCPKeepAlive yes
Compression delayed
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers ubuntu
```

```bash
# Restart SSH service
sudo systemctl restart ssh

# Test SSH connection in new terminal before closing current one
ssh -i ~/.ssh/oracle_cloud_key ubuntu@YOUR_PUBLIC_IP
```

#### 12.2 Install and Configure Fail2Ban
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create custom configuration
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban settings
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

# Email notifications (optional)
# destemail = your-email@example.com
# sendername = Fail2Ban
# mta = sendmail

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 600
EOF

# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

#### 12.3 System Security Updates
```bash
# Configure automatic security updates
sudo apt install unattended-upgrades apt-listchanges -y

# Configure unattended upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Edit configuration
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Ensure these lines are uncommented:
# "${distro_id}:${distro_codename}-security";
# Unattended-Upgrade::AutoFixInterruptedDpkg "true";
# Unattended-Upgrade::Remove-Unused-Dependencies "true";
# Unattended-Upgrade::Automatic-Reboot "false";
```

#### 12.4 Enhanced Nginx Security
```bash
# Update Nginx configuration with security headers
sudo nano /etc/nginx/sites-available/chat-website

# Add these security headers in the server block:
```

```nginx
# Enhanced Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: ws:; media-src 'self'; object-src 'none'; child-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Hide Nginx version
server_tokens off;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Apply rate limiting to API
location /api {
    limit_req zone=api burst=20 nodelay;
    # ... rest of proxy configuration
}

# Apply stricter rate limiting to auth endpoints
location /api/auth {
    limit_req zone=login burst=5 nodelay;
    # ... rest of proxy configuration
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitoring & Maintenance

### Step 13: System Monitoring Setup

#### 13.1 Install Monitoring Tools
```bash
# Install system monitoring tools
sudo apt install htop iotop nethogs ncdu -y

# Install log monitoring
sudo apt install logwatch -y

# Configure logwatch
sudo nano /etc/logwatch/conf/logwatch.conf
# Set: Detail = Med
# Set: MailTo = your-email@example.com (optional)
```

#### 13.2 PM2 Monitoring
```bash
# Install PM2 monitoring modules
pm2 install pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Setup PM2 web monitoring (optional)
pm2 web

# View monitoring dashboard
pm2 monit
```

#### 13.3 System Resource Monitoring
```bash
# Create system monitoring script
sudo tee /usr/local/bin/system-monitor.sh << 'EOF'
#!/bin/bash

# System Monitor Script
echo "=== System Monitor Report - $(date) ==="
echo

# CPU Usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5 $6 $7 $8}'
echo

# Memory Usage
echo "Memory Usage:"
free -h
echo

# Disk Usage
echo "Disk Usage:"
df -h /
echo

# Network Connections
echo "Active Network Connections:"
ss -tuln | grep -E ':(80|443|5000|22)'
echo

# PM2 Status
echo "PM2 Process Status:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) (CPU: \(.monit.cpu)%, Memory: \(.monit.memory/1024/1024 | floor)MB)"'
echo

# System Load
echo "System Load:"
uptime
echo

# Recent Failed Login Attempts
echo "Recent Failed Login Attempts:"
sudo grep "Failed password" /var/log/auth.log | tail -5
echo

echo "=== End Report ==="
EOF

# Make executable
sudo chmod +x /usr/local/bin/system-monitor.sh

# Test the script
sudo /usr/local/bin/system-monitor.sh
```

### Step 14: Backup Strategy

#### 14.1 Application Backup Script
```bash
# Create backup directory
sudo mkdir -p /home/ubuntu/backups
sudo chown ubuntu:ubuntu /home/ubuntu/backups

# Create application backup script
tee /home/ubuntu/backup-app.sh << 'EOF'
#!/bin/bash

# Application Backup Script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/opt/chat-website"

echo "Starting backup at $(date)"

# Create backup directory for this date
mkdir -p "$BACKUP_DIR/$DATE"

# Backup application code
echo "Backing up application code..."
tar -czf "$BACKUP_DIR/$DATE/app_code.tar.gz" -C /opt chat-website

# Backup Nginx configuration
echo "Backing up Nginx configuration..."
sudo tar -czf "$BACKUP_DIR/$DATE/nginx_config.tar.gz" /etc/nginx/sites-available/chat-website

# Backup environment files
echo "Backing up environment files..."
cp "$APP_DIR/backend/.env" "$BACKUP_DIR/$DATE/backend.env"
cp "$APP_DIR/frontend/.env.production" "$BACKUP_DIR/$DATE/frontend.env"

# Backup PM2 configuration
echo "Backing up PM2 configuration..."
pm2 save
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/$DATE/pm2_dump.pm2"

# Database backup (if using local MongoDB)
if systemctl is-active --quiet mongod; then
    echo "Backing up MongoDB database..."
    mongodump --out "$BACKUP_DIR/$DATE/mongodb_backup"
fi

# Create backup summary
echo "Backup Summary - $DATE" > "$BACKUP_DIR/$DATE/backup_info.txt"
echo "Application: $(du -sh $BACKUP_DIR/$DATE/app_code.tar.gz)" >> "$BACKUP_DIR/$DATE/backup_info.txt"
echo "Nginx Config: $(du -sh $BACKUP_DIR/$DATE/nginx_config.tar.gz)" >> "$BACKUP_DIR/$DATE/backup_info.txt"
echo "Total Size: $(du -sh $BACKUP_DIR/$DATE)" >> "$BACKUP_DIR/$DATE/backup_info.txt"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -type d -name "20*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed at $(date)"
echo "Backup location: $BACKUP_DIR/$DATE"
EOF

# Make executable
chmod +x /home/ubuntu/backup-app.sh

# Test backup
./backup-app.sh
```

#### 14.2 Automated Backup Schedule
```bash
# Setup cron jobs for automated backups
crontab -e

# Add these lines to crontab:
```

```bash
# Daily application backup at 2 AM
0 2 * * * /home/ubuntu/backup-app.sh >> /home/ubuntu/backup.log 2>&1

# Weekly system update check at 3 AM on Sundays
0 3 * * 0 sudo apt update && sudo apt list --upgradable >> /home/ubuntu/updates.log 2>&1

# Daily system monitor report at 6 AM
0 6 * * * /usr/local/bin/system-monitor.sh >> /home/ubuntu/monitor.log 2>&1

# PM2 log rotation daily at 1 AM
0 1 * * * pm2 flush
```

### Step 15: Update and Maintenance Procedures

#### 15.1 Application Update Script
```bash
# Create application update script
tee /home/ubuntu/update-app.sh << 'EOF'
#!/bin/bash

# Application Update Script
echo "Starting application update at $(date)"

# Backup before update
echo "Creating backup before update..."
/home/ubuntu/backup-app.sh

# Navigate to application directory
cd /opt/chat-website

# Pull latest changes
echo "Pulling latest changes from repository..."
git pull origin main

# Update backend
echo "Updating backend..."
cd backend
npm install --production
pm2 restart chat-backend

# Update frontend
echo "Updating frontend..."
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/

# Test application
echo "Testing application..."
sleep 5
curl -f http://localhost/health || echo "Health check failed!"

echo "Application update completed at $(date)"
EOF

# Make executable
chmod +x /home/ubuntu/update-app.sh
```

#### 15.2 System Maintenance Script
```bash
# Create system maintenance script
sudo tee /usr/local/bin/system-maintenance.sh << 'EOF'
#!/bin/bash

# System Maintenance Script
echo "Starting system maintenance at $(date)"

# Update package lists
echo "Updating package lists..."
apt update

# Upgrade packages
echo "Upgrading packages..."
apt upgrade -y

# Clean package cache
echo "Cleaning package cache..."
apt autoremove -y
apt autoclean

# Update Node.js packages
echo "Updating global Node.js packages..."
npm update -g

# Restart services if needed
echo "Checking if services need restart..."
if [ -f /var/run/reboot-required ]; then
    echo "System reboot required after updates"
    # Uncomment next line to auto-reboot
    # reboot
fi

# Clean logs
echo "Cleaning old logs..."
journalctl --vacuum-time=30d
find /var/log -name "*.log" -type f -mtime +30 -delete

# Check disk space
echo "Checking disk space..."
df -h

echo "System maintenance completed at $(date)"
EOF

# Make executable
sudo chmod +x /usr/local/bin/system-maintenance.sh

# Schedule monthly maintenance
sudo crontab -e
# Add: 0 4 1 * * /usr/local/bin/system-maintenance.sh >> /var/log/maintenance.log 2>&1
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Instance Won't Start
```bash
# Symptoms: Instance stuck in "Provisioning" state

# Solutions:
1. Check if you're in Always Free eligible region
2. Verify you haven't exceeded free tier limits
3. Try different Availability Domain
4. Ensure you selected VM.Standard.A1.Flex shape
5. Check Oracle Cloud service status
```

#### Issue 2: Can't Connect via SSH
```bash
# Symptoms: Connection timeout or refused

# Check SSH key:
ssh -i ~/.ssh/oracle_cloud_key -v ubuntu@YOUR_IP

# Check security list rules:
# Oracle Console → VCN → Security Lists → Ingress Rules
# Ensure port 22 is open from 0.0.0.0/0

# Check instance status:
# Ensure instance is "Running" in Oracle Console

# Check firewall:
sudo ufw status
```

#### Issue 3: Website Not Loading
```bash
# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check backend status
pm2 status
pm2 logs chat-backend

# Check ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000

# Check security list (Oracle Cloud)
# Ensure ports 80 and 443 are open

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

#### Issue 4: SSL Certificate Problems
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check Nginx SSL configuration
sudo nginx -t
```

#### Issue 5: High Memory Usage
```bash
# Check memory usage
free -h
htop

# Check PM2 processes
pm2 monit

# Restart services if needed
pm2 restart all
sudo systemctl restart nginx

# Check for memory leaks
ps aux --sort=-%mem | head -10
```

#### Issue 6: Database Connection Issues
```bash
# Check MongoDB status (if using local)
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ismaster')"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection from application
cd /opt/chat-website/backend
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-website')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
"
```

### Performance Optimization

#### Optimize Node.js Application
```bash
# Enable production optimizations in PM2
pm2 delete chat-backend
pm2 start src/server.js --name "chat-backend" --env production --instances max --exec-mode cluster

# Monitor performance
pm2 monit
```

#### Optimize Nginx
```bash
# Add to Nginx configuration
sudo nano /etc/nginx/nginx.conf

# Add in http block:
```

```nginx
# Worker processes (set to number of CPU cores)
worker_processes auto;

# Worker connections
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json
    image/svg+xml;

# File caching
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
```

---

## 🚀 Advanced Configurations

### Load Balancing Setup (Multiple Instances)

#### Create Additional Instances
```bash
# If you need more power, create additional instances
# Oracle Free Tier allows up to 4 CPUs total across all instances

# Example: 2 instances with 2 CPUs each
Instance 1: 2 CPUs, 12GB RAM
Instance 2: 2 CPUs, 12GB RAM
```

#### Configure Load Balancer
```bash
# Install HAProxy on main instance
sudo apt install haproxy -y

# Configure HAProxy
sudo tee /etc/haproxy/haproxy.cfg << 'EOF'
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend web_frontend
    bind *:80
    default_backend web_servers

backend web_servers
    balance roundrobin
    server web1 INSTANCE1_IP:5000 check
    server web2 INSTANCE2_IP:5000 check
EOF

# Start HAProxy
sudo systemctl start haproxy
sudo systemctl enable haproxy
```

### Docker Containerization

#### Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Create Docker Configuration
```bash
# Create Dockerfile for backend
cd /opt/chat-website/backend
tee Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 5000
CMD ["npm", "start"]
EOF

# Create docker-compose.yml
cd /opt/chat-website
tee docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/chat-website
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
EOF
```

### CI/CD Pipeline Setup

#### GitHub Actions Deployment
```bash
# Create GitHub Actions workflow
mkdir -p .github/workflows
tee .github/workflows/deploy.yml << 'EOF'
name: Deploy to Oracle Cloud

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/chat-website
          git pull origin main
          /home/ubuntu/update-app.sh
EOF
```

---

## ✅ Final Checklist

### Pre-Deployment Checklist
- [ ] Oracle Cloud account created and verified
- [ ] Always Free instance launched (4 CPUs, 24GB RAM)
- [ ] SSH access configured and tested
- [ ] Security lists configured (ports 22, 80, 443)
- [ ] Domain registered (optional)

### Deployment Checklist
- [ ] System updated and software installed
- [ ] Application code deployed
- [ ] Backend configured and running with PM2
- [ ] Frontend built and deployed
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured

### Security Checklist
- [ ] SSH hardened (key-only authentication)
- [ ] Fail2Ban installed and configured
- [ ] Automatic security updates enabled
- [ ] Nginx security headers configured
- [ ] Rate limiting implemented

### Monitoring Checklist
- [ ] System monitoring tools installed
- [ ] PM2 monitoring configured
- [ ] Backup scripts created and scheduled
- [ ] Log rotation configured
- [ ] Maintenance procedures documented

### Testing Checklist
- [ ] Website loads correctly
- [ ] User registration works
- [ ] User authentication works
- [ ] Chat creation works
- [ ] Real-time messaging works
- [ ] WebSocket connections stable
- [ ] SSL certificate valid (if using HTTPS)

---

## 🎉 Congratulations!

You now have a **professional chat website** deployed on **Oracle Cloud's Always Free tier** with:

- ✅ **Enterprise-grade infrastructure** (4 CPUs, 24GB RAM)
- ✅ **Professional domain** with SSL certificate
- ✅ **Advanced security** hardening
- ✅ **Monitoring and backups**
- ✅ **Zero ongoing costs**

Your chat website is now **production-ready** and can handle **thousands of concurrent users** - all for **completely free**!

### 📞 Support and Resources

- **Oracle Cloud Documentation**: [docs.oracle.com](https://docs.oracle.com/en-us/iaas/)
- **Oracle Cloud Community**: [community.oracle.com](https://community.oracle.com/)
- **Always Free Resources**: [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)

**Happy chatting!** 🚀💬