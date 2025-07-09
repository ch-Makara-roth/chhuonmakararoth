# 🚀 Quick Start Guide - Deploy Your Portfolio in 5 Minutes

This guide will get your Next.js portfolio application running on your cloud server **immediately**.

## 🎯 Prerequisites

- Ubuntu 20.04+ server with root access
- At least 2GB RAM and 20GB storage
- Domain name (optional, can use IP address)

## ⚡ Option 1: Automated Setup (Recommended)

### Step 1: Connect to Your Server
```bash
ssh root@114.29.237.114
```

### Step 2: Run the Setup Script
```bash
# Download and run the automated setup
curl -fsSL https://raw.githubusercontent.com/yourusername/portfolio/main/scripts/server-setup.sh -o server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

### Step 3: Clone Your Repository
```bash
git clone https://github.com/yourusername/portfolio.git /opt/portfolio
cd /opt/portfolio
```

### Step 4: Configure Environment
```bash
# Copy production environment template
cp .env.production .env

# Edit with your settings
nano .env
```

**Required environment variables:**
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-very-secure-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure-password-here
DATABASE_URL=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin
```

### Step 5: Deploy
```bash
sudo ./scripts/deploy.sh deploy
```

**That's it!** Your application will be running at `https://your-domain.com`

---

## 🔧 Option 2: Manual Setup (If automated fails)

### Step 1: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### Step 2: Clone and Configure
```bash
# Clone repository
git clone https://github.com/yourusername/portfolio.git /opt/portfolio
cd /opt/portfolio

# Set up environment
cp .env.production .env
nano .env  # Edit with your settings
```

### Step 3: Fix Database Connection
```bash
sudo ./scripts/fix-database.sh fix
```

### Step 4: Deploy
```bash
sudo ./scripts/deploy.sh deploy
```

---

## 🛠️ Common Issues & Quick Fixes

### Issue 1: Database Connection Failed
```bash
sudo ./scripts/fix-database.sh reset
```

### Issue 2: Application Not Starting
```bash
# Check logs
sudo ./scripts/deploy.sh logs

# Restart services
docker-compose down && docker-compose up -d
```

### Issue 3: Port Already in Use
```bash
# Kill processes on port 3000
sudo lsof -ti:3000 | xargs sudo kill -9

# Kill processes on port 80
sudo lsof -ti:80 | xargs sudo kill -9
```

### Issue 4: Permission Denied
```bash
# Fix permissions
sudo chown -R 1001:1001 /opt/portfolio/public/uploads
sudo chmod -R 755 /opt/portfolio/public/uploads
```

### Issue 5: SSL Certificate Issues
```bash
# Generate new self-signed certificate
sudo mkdir -p /opt/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/nginx/ssl/private.key \
  -out /opt/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

---

## 📋 Verification Checklist

After deployment, verify everything is working:

- [ ] **Health Check**: Visit `http://your-server-ip/health`
- [ ] **Application**: Visit `http://your-server-ip` 
- [ ] **Database**: Check `docker-compose logs mongodb`
- [ ] **Containers**: Run `docker-compose ps`
- [ ] **SSL**: Check certificate validity (if using HTTPS)

---

## 🎛️ Management Commands

### Check Status
```bash
sudo ./scripts/deploy.sh status
```

### View Logs
```bash
sudo ./scripts/deploy.sh logs
```

### Update Application
```bash
sudo ./scripts/deploy.sh update
```

### Troubleshoot Issues
```bash
sudo ./scripts/troubleshoot.sh
```

### Monitor System
```bash
sudo ./scripts/monitor.sh status
```

---

## 🔐 Security Hardening (Optional)

### Configure Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Set up SSL with Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 3 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
```bash
# Check system health
sudo ./scripts/monitor.sh check

# Check application logs
sudo ./scripts/deploy.sh logs | tail -50
```

### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up Docker
docker system prune -f

# Backup database
sudo ./scripts/deploy.sh backup
```

---

## 🆘 Emergency Procedures

### Application Down
```bash
# Quick restart
docker-compose down && docker-compose up -d

# Full reset
sudo ./scripts/deploy.sh deploy
```

### Database Corrupted
```bash
# Reset database
sudo ./scripts/fix-database.sh reset

# Restore from backup
docker-compose exec mongodb mongorestore --drop /path/to/backup
```

### Server Crashed
```bash
# Restart all services
sudo systemctl restart docker
cd /opt/portfolio
sudo ./scripts/deploy.sh deploy
```

---

## 📞 Support & Troubleshooting

### Get Help
1. **Run diagnostics**: `sudo ./scripts/troubleshoot.sh`
2. **Check logs**: `sudo ./scripts/deploy.sh logs`
3. **Generate report**: `sudo ./scripts/troubleshoot.sh report`

### Common Log Locations
- Application logs: `docker-compose logs app`
- Database logs: `docker-compose logs mongodb`
- Nginx logs: `docker-compose logs nginx`
- System logs: `/var/log/syslog`

### Performance Tuning
```bash
# Monitor resources
htop
docker stats

# Optimize database
docker-compose exec mongodb mongosh --eval "db.runCommand({compact: 'contributions'})"
```

---

## 🎉 Success!

Your portfolio should now be running at:
- **HTTP**: `http://your-server-ip`
- **HTTPS**: `https://your-domain.com` (if SSL configured)
- **Health**: `http://your-server-ip/health`

### Next Steps
1. **Customize**: Edit your portfolio content
2. **Monitor**: Set up monitoring alerts
3. **Backup**: Configure automated backups
4. **Scale**: Add load balancing if needed

---

## 📝 Configuration Files Summary

- **`docker-compose.yml`**: Main container configuration
- **`docker-compose.prod.yml`**: Production deployment
- **`.env`**: Environment variables
- **`nginx/nginx.conf`**: Web server configuration
- **`scripts/deploy.sh`**: Deployment automation
- **`scripts/fix-database.sh`**: Database fixes
- **`scripts/troubleshoot.sh`**: Problem diagnosis
- **`scripts/monitor.sh`**: System monitoring

---

**🚀 You're all set! Your portfolio is now live and ready to showcase your work!**

For detailed documentation, see `DEPLOYMENT.md`.