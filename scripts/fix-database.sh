#!/bin/bash

# Database Connection Fix Script
# This script fixes common database connection issues between Next.js and MongoDB

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Fix MongoDB connection string
fix_connection_string() {
    log "Fixing MongoDB connection string..."

    # Update database URL in environment
    if [[ -f ".env" ]]; then
        sed -i 's|DATABASE_URL=mongodb://mongodb:27017/portfolio?replicaSet=rs0$|DATABASE_URL=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin|g' .env
        sed -i 's|MONGODB_URI=mongodb://mongodb:27017/portfolio?replicaSet=rs0$|MONGODB_URI=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin|g' .env
        log "Updated .env file"
    fi

    if [[ -f ".env.local" ]]; then
        sed -i 's|DATABASE_URL=mongodb://mongodb:27017/portfolio?replicaSet=rs0$|DATABASE_URL=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin|g' .env.local
        sed -i 's|MONGODB_URI=mongodb://mongodb:27017/portfolio?replicaSet=rs0$|MONGODB_URI=mongodb://mongodb:27017/portfolio?replicaSet=rs0&authSource=admin|g' .env.local
        log "Updated .env.local file"
    fi
}

# Initialize MongoDB replica set
init_replica_set() {
    log "Initializing MongoDB replica set..."

    # Wait for MongoDB to be ready
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            log "MongoDB is ready"
            break
        fi

        log "Waiting for MongoDB... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done

    if [[ $attempt -gt $max_attempts ]]; then
        error "MongoDB failed to start after $max_attempts attempts"
    fi

    # Initialize replica set
    log "Configuring replica set..."
    docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval '
        try {
            rs.initiate({
                _id: "rs0",
                members: [
                    { _id: 0, host: "mongodb:27017" }
                ]
            });
            print("Replica set initialized successfully");
        } catch (e) {
            print("Replica set may already be initialized: " + e);
        }
    ' || warn "Replica set initialization failed (may already exist)"
}

# Reset MongoDB data
reset_mongodb() {
    log "Resetting MongoDB data..."

    # Stop services
    docker-compose -f "$COMPOSE_FILE" down -v

    # Remove MongoDB volumes
    docker volume rm $(docker volume ls -q | grep mongodb) 2>/dev/null || true

    # Restart services
    docker-compose -f "$COMPOSE_FILE" up -d mongodb

    # Wait for MongoDB to be ready
    sleep 10

    # Initialize replica set
    init_replica_set

    log "MongoDB reset completed"
}

# Fix Prisma connection
fix_prisma_connection() {
    log "Fixing Prisma connection..."

    # Generate Prisma client
    docker-compose -f "$COMPOSE_FILE" exec -T app npx prisma generate || warn "Prisma generate failed"

    # Push database schema
    docker-compose -f "$COMPOSE_FILE" exec -T app npx prisma db push --accept-data-loss || warn "Prisma db push failed"

    # Seed database
    docker-compose -f "$COMPOSE_FILE" exec -T app npm run prisma:seed || warn "Database seeding failed"

    log "Prisma connection fixed"
}

# Test database connection
test_connection() {
    log "Testing database connection..."

    # Test MongoDB connection
    if docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        log "✓ MongoDB connection successful"
    else
        error "✗ MongoDB connection failed"
    fi

    # Test application database connection
    if docker-compose -f "$COMPOSE_FILE" exec -T app node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect().then(() => {
            console.log('✓ Application database connection successful');
            process.exit(0);
        }).catch((e) => {
            console.log('✗ Application database connection failed:', e.message);
            process.exit(1);
        });
    "; then
        log "✓ Application database connection successful"
    else
        error "✗ Application database connection failed"
    fi
}

# Restart services
restart_services() {
    log "Restarting services..."

    # Restart in correct order
    docker-compose -f "$COMPOSE_FILE" restart mongodb
    sleep 10

    docker-compose -f "$COMPOSE_FILE" restart app
    sleep 5

    log "Services restarted"
}

# Show connection status
show_status() {
    log "Connection Status:"

    echo "=== Docker Containers ==="
    docker-compose -f "$COMPOSE_FILE" ps

    echo "=== MongoDB Status ==="
    docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval "
        try {
            print('MongoDB Version:', db.version());
            print('Replica Set Status:', rs.status().ok ? 'OK' : 'FAILED');
            print('Database List:', db.adminCommand('listDatabases').databases.map(d => d.name).join(', '));
        } catch (e) {
            print('MongoDB Error:', e.message);
        }
    " || warn "Could not get MongoDB status"

    echo "=== Application Health ==="
    if curl -f http://localhost:3000/health 2>/dev/null; then
        echo "✓ Application health check passed"
    else
        echo "✗ Application health check failed"
    fi
}

# Show logs
show_logs() {
    log "Showing recent logs..."

    echo "=== MongoDB Logs ==="
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 mongodb

    echo "=== Application Logs ==="
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 app
}

# Main execution
case "$1" in
    "fix")
        check_root
        log "Starting database connection fix..."
        fix_connection_string
        restart_services
        init_replica_set
        fix_prisma_connection
        test_connection
        log "Database connection fix completed"
        ;;
    "reset")
        check_root
        log "Starting database reset..."
        reset_mongodb
        fix_prisma_connection
        test_connection
        log "Database reset completed"
        ;;
    "test")
        test_connection
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        check_root
        restart_services
        ;;
    "init")
        check_root
        init_replica_set
        ;;
    *)
        echo "Usage: $0 {fix|reset|test|status|logs|restart|init}"
        echo ""
        echo "Commands:"
        echo "  fix     - Fix database connection issues"
        echo "  reset   - Reset MongoDB data and reinitialize"
        echo "  test    - Test database connection"
        echo "  status  - Show connection status"
        echo "  logs    - Show recent logs"
        echo "  restart - Restart services"
        echo "  init    - Initialize replica set"
        exit 1
        ;;
esac
