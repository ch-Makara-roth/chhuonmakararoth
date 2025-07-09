#!/bin/bash

# Production Deployment Script
# This script handles the deployment of the Next.js application with Docker, nginx, and MongoDB

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/deployment.log"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi

    if ! command -v nginx &> /dev/null; then
        warn "Nginx is not installed on host system (using containerized version)"
    fi

    log "Dependencies check passed"
}

# Backup database
backup_database() {
    log "Creating database backup..."

    mkdir -p "$BACKUP_DIR"

    if docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongodump --db portfolio --out /tmp/backup; then
        docker-compose -f "$COMPOSE_FILE" exec -T mongodb tar -czf "/tmp/backup-$(date +%Y%m%d_%H%M%S).tar.gz" -C /tmp/backup .
        docker cp "$(docker-compose -f "$COMPOSE_FILE" ps -q mongodb):/tmp/backup-$(date +%Y%m%d_%H%M%S).tar.gz" "$BACKUP_DIR/"
        log "Database backup completed"
    else
        warn "Database backup failed (this is normal on first deployment)"
    fi
}

# Setup environment
setup_environment() {
    log "Setting up environment..."

    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please copy from .env.production and configure."
    fi

    # Create necessary directories
    mkdir -p /opt/nginx/ssl
    mkdir -p /opt/nginx/logs
    mkdir -p /opt/uploads
    mkdir -p /opt/logs

    # Set proper permissions
    chown -R 1001:1001 /opt/uploads
    chown -R 1001:1001 /opt/logs

    log "Environment setup completed"
}

# Generate SSL certificates (self-signed for development)
setup_ssl() {
    log "Setting up SSL certificates..."

    SSL_DIR="/opt/nginx/ssl"

    if [[ ! -f "$SSL_DIR/cert.pem" ]] || [[ ! -f "$SSL_DIR/private.key" ]]; then
        log "Generating self-signed SSL certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/private.key" \
            -out "$SSL_DIR/cert.pem" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

        chmod 600 "$SSL_DIR/private.key"
        chmod 644 "$SSL_DIR/cert.pem"

        log "SSL certificates generated"
    else
        log "SSL certificates already exist"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."

    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull

    # Build application
    log "Building application..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache app

    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down

    # Start services
    log "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30

    # Check health
    check_health

    log "Deployment completed successfully"
}

# Health check
check_health() {
    log "Performing health checks..."

    # Check nginx
    if docker-compose -f "$COMPOSE_FILE" exec nginx nginx -t; then
        log "Nginx configuration is valid"
    else
        error "Nginx configuration is invalid"
    fi

    # Check application
    if curl -f http://localhost/health; then
        log "Application is healthy"
    else
        error "Application health check failed"
    fi

    # Check database
    if docker-compose -f "$COMPOSE_FILE" exec mongodb mongo --eval "db.adminCommand('ping')"; then
        log "Database is healthy"
    else
        error "Database health check failed"
    fi
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker images and containers..."

    docker system prune -f
    docker volume prune -f

    log "Cleanup completed"
}

# Update application (zero-downtime deployment)
update() {
    log "Performing zero-downtime update..."

    # Build new image
    docker-compose -f "$COMPOSE_FILE" build app

    # Rolling update
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps app

    # Wait for new container to be ready
    sleep 30

    # Check health
    check_health

    log "Update completed successfully"
}

# Show logs
show_logs() {
    log "Showing application logs..."
    docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# Stop services
stop() {
    log "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    log "Services stopped"
}

# Show status
status() {
    log "Service status:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Main execution
case "$1" in
    "deploy")
        check_root
        check_dependencies
        setup_environment
        setup_ssl
        backup_database
        deploy
        cleanup
        ;;
    "update")
        check_root
        backup_database
        update
        ;;
    "stop")
        check_root
        stop
        ;;
    "logs")
        show_logs
        ;;
    "status")
        status
        ;;
    "health")
        check_health
        ;;
    "cleanup")
        check_root
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|update|stop|logs|status|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment with backup"
        echo "  update  - Zero-downtime update"
        echo "  stop    - Stop all services"
        echo "  logs    - Show application logs"
        echo "  status  - Show service status"
        echo "  health  - Perform health checks"
        echo "  cleanup - Clean up old Docker resources"
        exit 1
        ;;
esac
