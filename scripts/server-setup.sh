#!/bin/bash

# Server Setup Script for Next.js Portfolio Application
# This script sets up the entire server environment from scratch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="portfolio"
APP_DIR="/opt/portfolio"
DOMAIN=""
EMAIL=""

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Get user input
get_user_input() {
    info "Setting up your portfolio server..."

    read -p "Enter your domain name (or press Enter to skip): " DOMAIN
    if [[ -n "$DOMAIN" ]]; then
        read -p "Enter your email for SSL certificates: " EMAIL
    fi

    echo ""
    info "Configuration:"
    info "Domain: ${DOMAIN:-'localhost (IP address)'}"
    info "Email: ${EMAIL:-'Not provided'}"
    info "App directory: $APP_DIR"
    echo ""

    read -p "Continue with setup? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Setup cancelled"
    fi
}

# Update system
update_system() {
    log "Updating system packages..."

    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

    log "System updated successfully"
}

# Install Docker
install_docker() {
    log "Installing Docker..."

    # Remove old Docker versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Install Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Start Docker service
    systemctl enable docker
    systemctl start docker

    log "Docker installed successfully"
}

# Install Node.js and NPM
install_nodejs() {
    log "Installing Node.js..."

    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs

    # Install global packages
    npm install -g pm2

    log "Node.js installed successfully"
}

# Install nginx
install_nginx() {
    log "Installing nginx..."

    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx

    log "nginx installed successfully"
}

# Install SSL certificates
install_ssl() {
    if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
        log "Installing SSL certificates with Let's Encrypt..."

        # Install certbot
        apt install -y certbot python3-certbot-nginx

        # Get certificate
        certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

        log "SSL certificates installed successfully"
    else
        warn "Skipping SSL certificate installation (domain not provided)"
    fi
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."

    # Install UFW
    apt install -y ufw

    # Configure UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # Allow necessary ports
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp  # For development

    # Enable UFW
    ufw --force enable

    log "Firewall configured successfully"
}

# Create application user
create_app_user() {
    log "Creating application user..."

    # Create user if doesn't exist
    if ! id "$APP_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$APP_USER"
        usermod -aG docker "$APP_USER"
        log "User $APP_USER created"
    else
        log "User $APP_USER already exists"
    fi

    # Create application directory
    mkdir -p "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"

    log "Application user setup completed"
}

# Setup application
setup_application() {
    log "Setting up application..."

    # Clone repository (if not already present)
    if [[ ! -d "$APP_DIR/.git" ]]; then
        warn "Please clone your repository to $APP_DIR manually"
        warn "Example: git clone https://github.com/yourusername/portfolio.git $APP_DIR"
        return
    fi

    # Change to app directory
    cd "$APP_DIR"

    # Set ownership
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"

    # Create environment file
    if [[ ! -f ".env" ]]; then
        cp ".env.production" ".env" 2>/dev/null || {
            warn "Please create .env file manually"
            return
        }

        # Update environment variables
        if [[ -n "$DOMAIN" ]]; then
            sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|g" .env
            sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|g" .env
        fi

        log "Environment file created"
    fi

    log "Application setup completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."

    # Install htop and other monitoring tools
    apt install -y htop iotop nethogs

    # Setup log rotation
    cat > /etc/logrotate.d/portfolio << 'EOF'
/var/log/portfolio/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOF

    log "Monitoring setup completed"
}

# Setup backup
setup_backup() {
    log "Setting up backup system..."

    # Create backup directory
    mkdir -p /opt/backups
    chown -R "$APP_USER:$APP_USER" /opt/backups

    # Create backup script
    cat > /opt/backups/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/portfolio"

# Create backup
cd "$APP_DIR"
docker-compose exec -T mongodb mongodump --db portfolio --out /tmp/backup_$DATE
docker cp "$(docker-compose ps -q mongodb):/tmp/backup_$DATE" "$BACKUP_DIR/"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
EOF

    chmod +x /opt/backups/backup.sh

    # Setup cron job for daily backup
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/backups/backup.sh") | crontab -

    log "Backup system setup completed"
}

# Show final instructions
show_instructions() {
    echo ""
    echo "=================================="
    info "Server Setup Completed Successfully!"
    echo "=================================="
    echo ""

    info "Next steps:"
    echo "1. Clone your repository to $APP_DIR"
    echo "   git clone https://github.com/yourusername/portfolio.git $APP_DIR"
    echo ""

    echo "2. Configure environment variables in $APP_DIR/.env"
    echo ""

    echo "3. Deploy the application:"
    echo "   cd $APP_DIR"
    echo "   sudo ./scripts/deploy.sh deploy"
    echo ""

    info "Useful commands:"
    echo "- Check status: sudo ./scripts/deploy.sh status"
    echo "- View logs: sudo ./scripts/deploy.sh logs"
    echo "- Fix database: sudo ./scripts/fix-database.sh fix"
    echo "- Update app: sudo ./scripts/deploy.sh update"
    echo ""

    info "Server access:"
    if [[ -n "$DOMAIN" ]]; then
        echo "- Website: https://$DOMAIN"
        echo "- Health check: https://$DOMAIN/health"
    else
        echo "- Website: http://$(curl -s ifconfig.me)"
        echo "- Health check: http://$(curl -s ifconfig.me)/health"
    fi
    echo ""

    info "Important files:"
    echo "- Application: $APP_DIR"
    echo "- Logs: /var/log/nginx/"
    echo "- Backups: /opt/backups/"
    echo "- SSL certificates: /etc/letsencrypt/"
    echo ""

    warn "Security reminders:"
    echo "- Change default passwords in .env file"
    echo "- Setup regular security updates"
    echo "- Monitor application logs"
    echo "- Test backup restoration"
    echo ""
}

# Main execution
main() {
    check_root
    get_user_input

    log "Starting server setup..."

    update_system
    install_docker
    install_nodejs
    install_nginx
    install_ssl
    setup_firewall
    create_app_user
    setup_application
    setup_monitoring
    setup_backup

    show_instructions

    log "Server setup completed successfully!"
}

# Run main function
main "$@"
