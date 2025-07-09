# Production Deployment Guide

This guide will help you deploy your Next.js portfolio application to a cloud server with Docker, nginx, and MongoDB.

## Prerequisites

Before starting the deployment, ensure you have:

- A cloud server (Ubuntu 20.04+ recommended)
- Root access to the server
- Docker and Docker Compose installed
- Domain name (optional, can use IP address)
- At least 2GB RAM and 20GB storage

## Quick Start

1. **Clone the repository to your server:**
```bash
git clone <your-repository-url>
cd chhuonmakararoth
```

2. **Set up environment variables:**
```bash
cp .env.production .env
# Edit .env with your production settings
nano .env
```

3. **Run the deployment script:**
```bash
sudo ./scripts/deploy.sh deploy
```

## Detailed Setup

### 1. Server Preparation

#### Install Docker
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

#### Install additional tools
```bash
sudo apt install -y nginx-utils openssl wget curl
```

### 2. Environment Configuration

Copy the production environment template:
```bash
cp .env.production .env
```

Edit the environment file with your production settings:
```bash
nano .env
```

**Important environment variables to configure:**

```env
# Database Configuration
DATABASE_URL=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin
MONGODB_URI=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin

# MongoDB Authentication
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-mongodb-password-here

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-very-secure-nextauth-secret-key-minimum-32-characters

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Google API (if using)
GOOGLE_API_KEY=your-google-api-key-here
```

### 3. SSL Certificate Setup

#### Option 1: Self-signed certificate (for testing)
The deployment script will automatically generate a self-signed certificate.

#### Option 2: Let's Encrypt certificate (recommended for production)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Create SSL directory
sudo mkdir -p /opt/nginx/ssl

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/nginx/ssl/private.key
```

### 4. Deployment Options

#### Option A: Full Deployment (Recommended)
```bash
sudo ./scripts/deploy.sh deploy
```

This will:
- Check dependencies
- Set up environment
- Generate SSL certificates
- Backup existing database
- Build and deploy containers
- Perform health checks

#### Option B: Manual Deployment
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Post-Deployment

#### Verify the deployment
```bash
# Check service status
sudo ./scripts/deploy.sh status

# Perform health checks
sudo ./scripts/deploy.sh health

# Test the application
curl -f http://localhost/health
```

#### Set up monitoring
```bash
# View logs
sudo ./scripts/deploy.sh logs

# Monitor resource usage
docker stats
```

## Configuration Files

### Nginx Configuration

The project includes two nginx configurations:

1. **nginx/nginx.conf** - Basic HTTP configuration
2. **nginx/nginx-ssl.conf** - HTTPS configuration with SSL

To use SSL configuration:
```bash
# Copy SSL config
cp nginx/nginx-ssl.conf nginx/nginx.conf

# Update docker-compose to mount SSL certificates
# (This is already configured in docker-compose.prod.yml)
```

### Database Configuration

MongoDB is configured with:
- Replica set for better reliability
- Authentication enabled
- Automatic indexes for performance
- Health checks

## Management Commands

### Update Application
```bash
# Zero-downtime update
sudo ./scripts/deploy.sh update
```

### Backup Database
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --db portfolio --out /tmp/backup
```

### Restore Database
```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec mongodb mongorestore --db portfolio /tmp/backup/portfolio
```

### Scale Services
```bash
# Scale application containers
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check MongoDB status
docker-compose -f docker-compose.prod.yml logs mongodb

# Restart MongoDB
docker-compose -f docker-compose.prod.yml restart mongodb
```

#### 2. Application Not Starting
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env
```

#### 3. Nginx Configuration Error
```bash
# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /opt/nginx/ssl/cert.pem -text -noout

# Regenerate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/nginx/ssl/private.key \
  -out /opt/nginx/ssl/cert.pem
```

### Performance Optimization

#### 1. Database Optimization
- Ensure indexes are created (done automatically)
- Monitor database performance with MongoDB Compass
- Set up regular database maintenance

#### 2. Application Optimization
- Enable Next.js optimization features
- Use CDN for static assets
- Implement caching strategies

#### 3. Server Optimization
- Configure system limits for Docker
- Set up log rotation
- Monitor server resources

## Security Considerations

### 1. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
sudo ./scripts/deploy.sh update
```

### 3. Backup Strategy
- Set up automated daily backups
- Store backups in secure location
- Test backup restoration regularly

## Monitoring and Logging

### 1. Application Monitoring
- Use the `/health` endpoint for monitoring
- Set up alerts for service failures
- Monitor application performance

### 2. Log Management
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# View database logs
docker-compose -f docker-compose.prod.yml logs -f mongodb
```

### 3. Resource Monitoring
```bash
# Monitor container resources
docker stats

# Monitor system resources
htop
df -h
```

## Production Checklist

Before going live, ensure:

- [ ] Environment variables are properly configured
- [ ] SSL certificates are installed and valid
- [ ] Database is properly secured with authentication
- [ ] Backups are configured and tested
- [ ] Monitoring is set up
- [ ] Firewall is configured
- [ ] Performance testing is completed
- [ ] Security testing is completed
- [ ] Documentation is updated

## Support

If you encounter issues:

1. Check the logs using the deployment script
2. Verify environment configuration
3. Test database connectivity
4. Check network connectivity
5. Review nginx configuration

For additional help, create an issue in the repository with:
- Error messages
- System configuration
- Steps to reproduce
- Expected vs actual behavior

## Maintenance

### Daily Tasks
- Monitor application health
- Check log files for errors
- Verify backup completion

### Weekly Tasks
- Update system packages
- Review security logs
- Check disk usage

### Monthly Tasks
- Update Docker images
- Review and rotate logs
- Test backup restoration
- Review security configuration

This deployment setup provides a robust, scalable, and secure foundation for your Next.js portfolio application in production.