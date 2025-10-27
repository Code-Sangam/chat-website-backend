# 🌐 Custom Domain Deployment Guide

Complete guide for deploying your chat website on a custom domain with professional setup.

## 📋 Overview

This guide covers deploying your chat website to a custom domain using various hosting providers and domain registrars.

## 🎯 Prerequisites

- ✅ Custom domain name (e.g., `mychatapp.com`)
- ✅ Domain registrar access (GoDaddy, Namecheap, Cloudflare, etc.)
- ✅ Hosting provider account
- ✅ Working chat website code

## 🏗️ Architecture Options

### Option 1: Vercel + Render (Recommended)
```
Frontend (Vercel) ──→ Custom Domain (mychatapp.com)
Backend (Render)  ──→ Subdomain (api.mychatapp.com)
```

### Option 2: Full VPS Deployment
```
Frontend + Backend ──→ VPS (DigitalOcean/AWS/Linode)
                   ──→ Custom Domain (mychatapp.com)
```

### Option 3: Netlify + Railway
```
Frontend (Netlify) ──→ Custom Domain (mychatapp.com)
Backend (Railway)  ──→ Subdomain (api.mychatapp.com)
```

---

## 🚀 Method 1: Vercel + Render (Easiest)

### Step 1: Domain Setup

#### 1.1 Purchase Domain
- Go to domain registrar (Namecheap, GoDaddy, Cloudflare)
- Purchase your desired domain (e.g., `mychatapp.com`)
- Note down nameservers

#### 1.2 Configure DNS Records
Add these DNS records in your domain registrar:

```dns
Type    Name    Value                           TTL
A       @       76.76.19.19                    300
A       www     76.76.19.19                    300
CNAME   api     chat-website-backend-3d1p.onrender.com    300
```

### Step 2: Frontend Domain Setup (Vercel)

#### 2.1 Add Custom Domain in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings** → **Domains**
4. Add domain: `mychatapp.com`
5. Add domain: `www.mychatapp.com`
6. Vercel will provide DNS instructions

#### 2.2 Update Frontend Environment
Update `frontend/.env.production`:
```env
# Production Environment Variables
VITE_API_URL=https://api.mychatapp.com/api
VITE_SOCKET_URL=https://api.mychatapp.com
VITE_NODE_ENV=production
```

#### 2.3 Redeploy Frontend
```bash
cd frontend
git add .
git commit -m "Update production URLs for custom domain"
git push origin main
```

### Step 3: Backend Domain Setup (Render)

#### 3.1 Add Custom Domain in Render
1. Go to [Render Dashboard](https://render.com/dashboard)
2. Select your backend service
3. Go to **Settings** → **Custom Domains**
4. Add domain: `api.mychatapp.com`
5. Render will provide CNAME record

#### 3.2 Update Backend CORS
Update `backend/src/app.js` CORS configuration:
```javascript
// Update CORS for custom domain
const corsOptions = {
  origin: [
    'https://mychatapp.com',
    'https://www.mychatapp.com',
    'http://localhost:3000' // Keep for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};
```

#### 3.3 Update Environment Variables
In Render dashboard, update environment variables:
```env
FRONTEND_URL=https://mychatapp.com
NODE_ENV=production
```

### Step 4: SSL Certificate Setup

#### 4.1 Vercel SSL (Automatic)
- Vercel automatically provides SSL certificates
- No additional configuration needed

#### 4.2 Render SSL (Automatic)
- Render automatically provides SSL certificates
- Verify SSL is working: `https://api.mychatapp.com/health`

### Step 5: Testing

#### 5.1 DNS Propagation Check
```bash
# Check if DNS has propagated
nslookup mychatapp.com
nslookup api.mychatapp.com
```

#### 5.2 Test Endpoints
```bash
# Test frontend
curl -I https://mychatapp.com

# Test backend
curl -I https://api.mychatapp.com/health

# Test API
curl -X POST https://api.mychatapp.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

---

## 🖥️ Method 2: VPS Deployment (Advanced)

### Step 1: VPS Setup

#### 1.1 Choose VPS Provider
- **DigitalOcean**: $5/month droplet
- **Linode**: $5/month nanode
- **AWS EC2**: t2.micro (free tier)
- **Vultr**: $2.50/month instance

#### 1.2 Create VPS Instance
```bash
# Example: Ubuntu 22.04 LTS
# 1GB RAM, 1 CPU, 25GB SSD
# Choose datacenter closest to your users
```

#### 1.3 Initial Server Setup
```bash
# Connect to VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (Process Manager)
npm install -g pm2

# Install Nginx
apt install nginx -y

# Install Certbot (SSL)
apt install certbot python3-certbot-nginx -y
```

### Step 2: Domain Configuration

#### 2.1 Point Domain to VPS
Update DNS records:
```dns
Type    Name    Value               TTL
A       @       YOUR_VPS_IP         300
A       www     YOUR_VPS_IP         300
```

#### 2.2 Verify DNS
```bash
# Check DNS propagation
dig mychatapp.com
ping mychatapp.com
```

### Step 3: Deploy Application

#### 3.1 Clone Repository
```bash
# On VPS
cd /var/www
git clone https://github.com/yourusername/chat-website.git
cd chat-website
```

#### 3.2 Setup Backend
```bash
# Install backend dependencies
cd backend
npm install --production

# Create production environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secure_jwt_secret
FRONTEND_URL=https://mychatapp.com
EOF

# Start backend with PM2
pm2 start src/server.js --name "chat-backend"
pm2 save
pm2 startup
```

#### 3.3 Build Frontend
```bash
# Build frontend
cd ../frontend
npm install
npm run build

# Copy build to web directory
cp -r dist/* /var/www/html/
```

### Step 4: Nginx Configuration

#### 4.1 Create Nginx Config
```bash
cat > /etc/nginx/sites-available/mychatapp.com << 'EOF'
server {
    listen 80;
    server_name mychatapp.com www.mychatapp.com;
    
    # Frontend (React build)
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
    
    # WebSocket support
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

#### 4.2 Enable Site
```bash
# Enable site
ln -s /etc/nginx/sites-available/mychatapp.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 5: SSL Certificate

#### 5.1 Install SSL Certificate
```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d mychatapp.com -d www.mychatapp.com

# Verify auto-renewal
certbot renew --dry-run
```

#### 5.2 Update Frontend Config
Update frontend environment for production:
```bash
# Update frontend/.env.production
cat > frontend/.env.production << EOF
VITE_API_URL=https://mychatapp.com/api
VITE_SOCKET_URL=https://mychatapp.com
VITE_NODE_ENV=production
EOF

# Rebuild and redeploy
npm run build
cp -r dist/* /var/www/html/
```

---

## 🔧 Method 3: Netlify + Railway

### Step 1: Frontend on Netlify

#### 1.1 Deploy to Netlify
1. Go to [Netlify](https://netlify.com)
2. Connect GitHub repository (frontend)
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### 1.2 Add Custom Domain
1. Go to **Site Settings** → **Domain Management**
2. Add custom domain: `mychatapp.com`
3. Configure DNS as instructed

### Step 2: Backend on Railway

#### 1.1 Deploy to Railway
1. Go to [Railway](https://railway.app)
2. Connect GitHub repository (backend)
3. Railway auto-detects Node.js

#### 1.2 Add Custom Domain
1. Go to project settings
2. Add custom domain: `api.mychatapp.com`
3. Configure CNAME record

### Step 3: Environment Configuration

#### 3.1 Update Frontend Environment
```env
# In Netlify environment variables
VITE_API_URL=https://api.mychatapp.com/api
VITE_SOCKET_URL=https://api.mychatapp.com
```

#### 3.2 Update Backend Environment
```env
# In Railway environment variables
FRONTEND_URL=https://mychatapp.com
NODE_ENV=production
```

---

## 🛡️ Security Considerations

### 1. SSL/TLS Configuration
```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name mychatapp.com www.mychatapp.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. Security Headers
```nginx
# Add security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 3. Firewall Configuration
```bash
# UFW firewall setup
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### 4. Rate Limiting
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    # ... rest of proxy config
}
```

---

## 📊 Monitoring & Maintenance

### 1. Server Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Check application status
pm2 status
pm2 logs
pm2 monit
```

### 2. Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/backup_$DATE"
```

### 3. Update Process
```bash
# Application update script
#!/bin/bash
cd /var/www/chat-website
git pull origin main
cd backend && npm install --production
cd ../frontend && npm run build
cp -r dist/* /var/www/html/
pm2 restart chat-backend
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. DNS Not Propagating
```bash
# Check DNS propagation
dig mychatapp.com @8.8.8.8
nslookup mychatapp.com 1.1.1.1
```

#### 2. SSL Certificate Issues
```bash
# Check SSL certificate
openssl s_client -connect mychatapp.com:443 -servername mychatapp.com

# Renew certificate
certbot renew --force-renewal
```

#### 3. Backend Connection Issues
```bash
# Check backend status
pm2 status
pm2 logs chat-backend

# Check port binding
netstat -tlnp | grep :5000
```

#### 4. CORS Issues
```javascript
// Update CORS configuration
const corsOptions = {
  origin: [
    'https://mychatapp.com',
    'https://www.mychatapp.com'
  ],
  credentials: true
};
```

---

## 💰 Cost Breakdown

### Option 1: Vercel + Render
- **Domain**: $10-15/year
- **Vercel Pro**: $20/month (optional)
- **Render**: $7/month (paid tier for stability)
- **Total**: ~$27/month + domain

### Option 2: VPS Deployment
- **Domain**: $10-15/year
- **VPS**: $5-10/month
- **Total**: ~$5-10/month + domain

### Option 3: Netlify + Railway
- **Domain**: $10-15/year
- **Netlify Pro**: $19/month (optional)
- **Railway**: $5/month
- **Total**: ~$5-24/month + domain

---

## 🎯 Performance Optimization

### 1. CDN Setup
```javascript
// Use CDN for static assets
const CDN_URL = 'https://cdn.mychatapp.com';
```

### 2. Caching Strategy
```nginx
# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Compression
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

---

## ✅ Final Checklist

### Pre-Launch
- [ ] Domain purchased and configured
- [ ] DNS records properly set
- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Database connection tested
- [ ] API endpoints tested

### Post-Launch
- [ ] Monitor server performance
- [ ] Set up automated backups
- [ ] Configure monitoring alerts
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Plan maintenance schedule

---

## 📞 Support Resources

### Documentation
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Render Custom Domains](https://render.com/docs/custom-domains)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Render Community](https://community.render.com/)
- [DigitalOcean Community](https://www.digitalocean.com/community)

---

**🎉 Congratulations! Your chat website is now live on a custom domain!**

For additional help or custom deployment needs, refer to the specific hosting provider documentation or reach out to their support teams.