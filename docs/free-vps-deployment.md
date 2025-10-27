# 🆓 Free VPS Deployment Guide

Complete guide for deploying your chat website on **FREE VPS providers** with full server control and zero cost.

## 🎯 Overview

Deploy your chat website with **maximum power** and **zero cost** using legitimate free VPS providers. Get enterprise-level control without paying a penny!

## 🏆 Best Free VPS Providers (2024)

### 1. 🥇 **Oracle Cloud Always Free** (Most Powerful)
```
💪 Power Level: ████████████ 100%
💰 Cost:       FREE FOREVER
⏰ Time Limit: UNLIMITED
🔧 Resources:  4 ARM CPUs, 24GB RAM, 200GB Storage
```

**What You Get:**
- **4 ARM Ampere CPUs** (equivalent to 8 x86 CPUs)
- **24GB RAM** (more than most paid VPS)
- **200GB Block Storage**
- **10TB monthly transfer**
- **2 Load Balancers**
- **Always Free** (no time limit)

### 2. 🥈 **Google Cloud Platform (GCP)** 
```
💪 Power Level: ██████████░░ 85%
💰 Cost:       FREE for 12 months + $300 credit
⏰ Time Limit: 12 months (then pay-as-you-go)
🔧 Resources:  1 vCPU, 3.75GB RAM, 30GB Storage
```

**What You Get:**
- **$300 free credits** for 12 months
- **e2-micro instance** always free (limited)
- **30GB persistent disk**
- **1GB network egress** per month
- **Global infrastructure**

### 3. 🥉 **Amazon AWS EC2** 
```
💪 Power Level: ██████████░░ 85%
💰 Cost:       FREE for 12 months
⏰ Time Limit: 12 months
🔧 Resources:  1 vCPU, 1GB RAM, 30GB Storage
```

**What You Get:**
- **t2.micro instance** (750 hours/month)
- **1GB RAM, 1 vCPU**
- **30GB EBS storage**
- **15GB bandwidth**
- **12 months free**

### 4. 🏅 **Microsoft Azure**
```
💪 Power Level: ████████░░░░ 70%
💰 Cost:       FREE for 12 months + $200 credit
⏰ Time Limit: 12 months
🔧 Resources:  1 vCPU, 1GB RAM, 64GB Storage
```

**What You Get:**
- **$200 free credits** for 30 days
- **B1S instance** free for 12 months
- **64GB managed disk**
- **15GB bandwidth**

### 5. 🎖️ **Linode (Akamai)** 
```
💪 Power Level: ████████░░░░ 70%
💰 Cost:       FREE for 2 months ($100 credit)
⏰ Time Limit: 2 months
🔧 Resources:  1 vCPU, 1GB RAM, 25GB Storage
```

**What You Get:**
- **$100 free credits** for 60 days
- **Nanode 1GB** instance
- **25GB SSD storage**
- **1TB transfer**

---

## 🚀 **Recommended: Oracle Cloud Always Free Setup**

Oracle Cloud is the **most powerful free option** with no time limits. Here's the complete setup:

### Step 1: Oracle Cloud Account Setup

#### 1.1 Create Account
1. Go to [Oracle Cloud](https://cloud.oracle.com)
2. Click **"Start for free"**
3. Fill registration (requires credit card for verification)
4. **No charges** - it's for identity verification only
5. Choose **"Always Free"** tier

#### 1.2 Verify Account
- Verify email and phone number
- Complete identity verification
- Access Oracle Cloud Console

### Step 2: Create Free VPS Instance

#### 2.1 Launch Compute Instance
```bash
# In Oracle Cloud Console:
1. Go to "Compute" → "Instances"
2. Click "Create Instance"
3. Choose configuration:
   - Name: chat-website-server
   - Image: Ubuntu 22.04 (Always Free eligible)
   - Shape: VM.Standard.A1.Flex (ARM-based)
   - CPUs: 4 (maximum free)
   - Memory: 24GB (maximum free)
   - Boot Volume: 200GB (maximum free)
```

#### 2.2 Network Configuration
```bash
# Configure networking:
1. Create new VCN (Virtual Cloud Network)
2. Enable "Assign public IP"
3. Configure security list:
   - Allow SSH (port 22)
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
   - Allow custom port 5000 (for backend)
```

#### 2.3 SSH Key Setup
```bash
# Generate SSH key pair (on your local machine)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_cloud_key

# Upload public key during instance creation
# Or add it later in instance details
```

### Step 3: Initial Server Setup

#### 3.1 Connect to Server
```bash
# Connect via SSH
ssh -i ~/.ssh/oracle_cloud_key ubuntu@YOUR_INSTANCE_IP

# Update system
sudo apt update && sudo apt upgrade -y
```

#### 3.2 Install Required Software
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y

# Install MongoDB (optional - or use MongoDB Atlas free tier)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 4: Deploy Chat Application

#### 4.1 Clone and Setup Backend
```bash
# Clone your repository
cd /opt
sudo git clone https://github.com/yourusername/chat-website.git
sudo chown -R ubuntu:ubuntu chat-website
cd chat-website/backend

# Install dependencies
npm install --production

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-website
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://YOUR_INSTANCE_IP
EOF

# Start backend with PM2
pm2 start src/server.js --name "chat-backend"
pm2 save
pm2 startup
```

#### 4.2 Build and Deploy Frontend
```bash
# Build frontend
cd ../frontend

# Update environment for production
cat > .env.production << EOF
VITE_API_URL=http://YOUR_INSTANCE_IP:5000/api
VITE_SOCKET_URL=http://YOUR_INSTANCE_IP:5000
VITE_NODE_ENV=production
EOF

# Install dependencies and build
npm install
npm run build

# Copy to web directory
sudo cp -r dist/* /var/www/html/
```

### Step 5: Configure Nginx

#### 5.1 Create Nginx Configuration
```bash
sudo tee /etc/nginx/sites-available/chat-website << 'EOF'
server {
    listen 80;
    server_name YOUR_INSTANCE_IP;
    
    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
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
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

#### 5.2 Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/chat-website /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Configure Firewall

#### 6.1 Oracle Cloud Security Lists
```bash
# In Oracle Cloud Console:
1. Go to "Networking" → "Virtual Cloud Networks"
2. Click your VCN → "Security Lists"
3. Add Ingress Rules:
   - Source: 0.0.0.0/0, Protocol: TCP, Port: 80
   - Source: 0.0.0.0/0, Protocol: TCP, Port: 443
   - Source: 0.0.0.0/0, Protocol: TCP, Port: 5000
```

#### 6.2 Server Firewall
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw enable
```

---

## 🌐 **Adding Custom Domain (Free)**

### Step 1: Free Domain Options

#### Option 1: Freenom (Free Domains)
- Get free domains: `.tk`, `.ml`, `.ga`, `.cf`
- Go to [Freenom](https://freenom.com)
- Search and register free domain

#### Option 2: Free Subdomains
- **DuckDNS**: `yourapp.duckdns.org`
- **No-IP**: `yourapp.ddns.net`
- **Afraid.org**: Various free subdomains

### Step 2: Configure DNS
```bash
# Point domain to your Oracle Cloud instance IP
Type: A
Name: @
Value: YOUR_INSTANCE_IP
TTL: 300

Type: A
Name: www
Value: YOUR_INSTANCE_IP
TTL: 300
```

### Step 3: SSL Certificate (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.tk -d www.yourdomain.tk

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **Free VPS Performance Comparison**

### Oracle Cloud Always Free
```
Performance: ████████████ 100%
- 4 ARM CPUs (equivalent to 8 x86)
- 24GB RAM
- 200GB Storage
- 10TB Transfer
- UNLIMITED time
- Best for: Production apps
```

### Google Cloud Free Tier
```
Performance: ████████░░░░ 70%
- 1 vCPU
- 3.75GB RAM
- 30GB Storage
- 1GB Transfer
- 12 months + $300 credits
- Best for: Development/testing
```

### AWS Free Tier
```
Performance: ██████░░░░░░ 50%
- 1 vCPU
- 1GB RAM
- 30GB Storage
- 15GB Transfer
- 12 months
- Best for: Learning/prototypes
```

---

## 🛡️ **Security Best Practices**

### 1. SSH Hardening
```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no

sudo systemctl restart ssh
```

### 2. Automatic Updates
```bash
# Enable automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Fail2Ban Protection
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

sudo systemctl restart fail2ban
```

---

## 📈 **Monitoring & Maintenance**

### 1. System Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop -y

# Check system resources
htop
df -h
free -h
```

### 2. Application Monitoring
```bash
# PM2 monitoring
pm2 status
pm2 logs
pm2 monit

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Backup Strategy
```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/chat-website

# Backup database
mongodump --out $BACKUP_DIR/db_backup_$DATE

# Keep only last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "db_backup_*" -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /home/ubuntu/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

---

## 🚨 **Troubleshooting**

### Common Issues

#### 1. Instance Won't Start
```bash
# Check Oracle Cloud limits
- Verify you're in Always Free eligible region
- Check if you've exceeded free tier limits
- Try different availability domain
```

#### 2. Can't Connect via SSH
```bash
# Check security list rules
- Ensure port 22 is open in security list
- Verify SSH key is correct
- Check instance public IP
```

#### 3. Website Not Loading
```bash
# Check services
sudo systemctl status nginx
pm2 status

# Check ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000

# Check logs
sudo tail -f /var/log/nginx/error.log
pm2 logs chat-backend
```

---

## 💡 **Pro Tips for Free VPS**

### 1. Maximize Oracle Cloud Free Tier
```bash
# Use ARM instances (more powerful)
# Always choose VM.Standard.A1.Flex
# Max out: 4 CPUs, 24GB RAM, 200GB storage
# Use all available always-free services
```

### 2. Resource Optimization
```bash
# Optimize for limited resources
- Use PM2 cluster mode
- Enable Nginx gzip compression
- Use MongoDB with limited memory
- Implement proper caching
```

### 3. Cost Monitoring
```bash
# Set up billing alerts
- Monitor usage in cloud console
- Set spending limits
- Use cost calculators
- Track free tier usage
```

---

## ✅ **Free VPS Deployment Checklist**

### Pre-Deployment
- [ ] Oracle Cloud account created
- [ ] Always Free instance launched
- [ ] SSH access configured
- [ ] Security lists configured
- [ ] Domain/subdomain ready (optional)

### Deployment
- [ ] Server software installed
- [ ] Application deployed
- [ ] Nginx configured
- [ ] SSL certificate installed (if domain)
- [ ] Firewall configured

### Post-Deployment
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security hardening applied
- [ ] Performance testing completed
- [ ] Documentation updated

---

## 🎉 **Conclusion**

**Free VPS deployment gives you:**
- ✅ **Maximum power** (4 CPUs, 24GB RAM with Oracle)
- ✅ **Full control** (root access, custom software)
- ✅ **Zero cost** (truly free forever)
- ✅ **Professional setup** (custom domain, SSL)
- ✅ **Enterprise features** (monitoring, backups)

**Oracle Cloud Always Free is the winner** - it's more powerful than most paid VPS options and costs absolutely nothing!

**Ready to deploy your chat website on a free VPS with enterprise-level power?** 🚀