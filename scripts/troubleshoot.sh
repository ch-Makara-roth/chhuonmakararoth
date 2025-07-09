#!/bin/bash

# Troubleshooting Script for Next.js Portfolio Application
# This script helps diagnose and fix common deployment issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="/tmp/troubleshoot.log"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        warn "Some operations require root privileges. Consider running with sudo."
        return 1
    fi
    return 0
}

# Function to check system requirements
check_system_requirements() {
    info "Checking system requirements..."

    # Check available memory
    local memory_mb=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $memory_mb -lt 1024 ]]; then
        warn "Low memory detected: ${memory_mb}MB (recommended: 2GB+)"
    else
        success "Memory: ${memory_mb}MB"
    fi

    # Check available disk space
    local disk_gb=$(df -h / | awk 'NR==2{printf "%.0f", $4}')
    if [[ ${disk_gb%G} -lt 5 ]]; then
        warn "Low disk space detected: ${disk_gb} (recommended: 20GB+)"
    else
        success "Disk space: ${disk_gb} available"
    fi

    # Check CPU cores
    local cpu_cores=$(nproc)
    success "CPU cores: $cpu_cores"

    # Check if Docker is installed
    if command -v docker &> /dev/null; then
        success "Docker is installed: $(docker --version)"
    else
        error "Docker is not installed"
        return 1
    fi

    # Check if Docker Compose is installed
    if command -v docker-compose &> /dev/null; then
        success "Docker Compose is installed: $(docker-compose --version)"
    else
        error "Docker Compose is not installed"
        return 1
    fi

    # Check Docker service status
    if systemctl is-active --quiet docker; then
        success "Docker service is running"
    else
        error "Docker service is not running"
        return 1
    fi

    return 0
}

# Function to check Docker containers
check_containers() {
    info "Checking Docker containers..."

    local compose_file="$COMPOSE_FILE"
    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check if containers are running
    local containers=$(docker-compose -f "$compose_file" ps --services)

    for container in $containers; do
        local status=$(docker-compose -f "$compose_file" ps -q "$container" | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null || echo "not found")

        if [[ "$status" == "running" ]]; then
            success "Container $container is running"
        else
            error "Container $container is $status"
        fi
    done

    # Check container health
    info "Checking container health..."
    local unhealthy_containers=$(docker ps --filter "health=unhealthy" --format "table {{.Names}}")

    if [[ -n "$unhealthy_containers" ]]; then
        error "Unhealthy containers found:"
        echo "$unhealthy_containers"
    else
        success "All containers are healthy"
    fi
}

# Function to check network connectivity
check_network() {
    info "Checking network connectivity..."

    # Check if ports are open
    local ports=("80" "443" "3000" "27017")

    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            success "Port $port is open"
        else
            warn "Port $port is not open"
        fi
    done

    # Check Docker networks
    local networks=$(docker network ls --format "{{.Name}}")

    for network in $networks; do
        if [[ "$network" != "bridge" && "$network" != "host" && "$network" != "none" ]]; then
            success "Docker network $network exists"
        fi
    done
}

# Function to check MongoDB
check_mongodb() {
    info "Checking MongoDB..."

    local compose_file="$COMPOSE_FILE"
    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check if MongoDB container is running
    if docker-compose -f "$compose_file" ps mongodb | grep -q "Up"; then
        success "MongoDB container is running"
    else
        error "MongoDB container is not running"
        return 1
    fi

    # Check MongoDB connectivity
    if docker-compose -f "$compose_file" exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        success "MongoDB is responding"
    else
        error "MongoDB is not responding"
        return 1
    fi

    # Check replica set status
    local rs_status=$(docker-compose -f "$compose_file" exec -T mongodb mongosh --eval "rs.status().ok" --quiet 2>/dev/null || echo "0")

    if [[ "$rs_status" == "1" ]]; then
        success "MongoDB replica set is initialized"
    else
        warn "MongoDB replica set is not initialized"
        info "Attempting to initialize replica set..."

        docker-compose -f "$compose_file" exec -T mongodb mongosh --eval '
            rs.initiate({
                _id: "rs0",
                members: [
                    { _id: 0, host: "mongodb:27017" }
                ]
            })
        ' &> /dev/null && success "Replica set initialized" || error "Failed to initialize replica set"
    fi

    # Check database existence
    local db_exists=$(docker-compose -f "$compose_file" exec -T mongodb mongosh --eval "db.adminCommand('listDatabases').databases.find(d => d.name === 'portfolio')" --quiet 2>/dev/null || echo "null")

    if [[ "$db_exists" != "null" ]]; then
        success "Portfolio database exists"
    else
        warn "Portfolio database does not exist"
    fi
}

# Function to check Next.js application
check_nextjs() {
    info "Checking Next.js application..."

    local compose_file="$COMPOSE_FILE"
    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check if app container is running
    if docker-compose -f "$compose_file" ps app | grep -q "Up"; then
        success "Next.js container is running"
    else
        error "Next.js container is not running"
        return 1
    fi

    # Check application health endpoint
    local health_check_url="http://localhost:3000/health"

    if curl -f -s "$health_check_url" &> /dev/null; then
        success "Application health check passed"

        # Get health details
        local health_response=$(curl -s "$health_check_url")
        echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
    else
        error "Application health check failed"
        return 1
    fi

    # Check environment variables
    info "Checking environment variables..."

    local required_vars=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET")

    for var in "${required_vars[@]}"; do
        if docker-compose -f "$compose_file" exec -T app env | grep -q "^$var="; then
            success "Environment variable $var is set"
        else
            error "Environment variable $var is not set"
        fi
    done
}

# Function to check nginx (if running)
check_nginx() {
    info "Checking nginx..."

    local compose_file="$COMPOSE_FILE"
    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check if nginx container exists
    if docker-compose -f "$compose_file" ps nginx &> /dev/null; then
        if docker-compose -f "$compose_file" ps nginx | grep -q "Up"; then
            success "Nginx container is running"

            # Test nginx configuration
            if docker-compose -f "$compose_file" exec -T nginx nginx -t &> /dev/null; then
                success "Nginx configuration is valid"
            else
                error "Nginx configuration is invalid"
            fi
        else
            error "Nginx container is not running"
        fi
    else
        info "Nginx container not found (may not be configured)"
    fi

    # Check if nginx is running on host
    if systemctl is-active --quiet nginx 2>/dev/null; then
        success "Host nginx service is running"
    else
        info "Host nginx service is not running (this is normal for containerized setup)"
    fi
}

# Function to check SSL certificates
check_ssl() {
    info "Checking SSL certificates..."

    local ssl_paths=("/etc/nginx/ssl" "/opt/nginx/ssl" "./nginx/ssl")

    for ssl_path in "${ssl_paths[@]}"; do
        if [[ -d "$ssl_path" ]]; then
            if [[ -f "$ssl_path/cert.pem" && -f "$ssl_path/private.key" ]]; then
                success "SSL certificates found in $ssl_path"

                # Check certificate validity
                local cert_info=$(openssl x509 -in "$ssl_path/cert.pem" -noout -dates 2>/dev/null || echo "Invalid certificate")
                echo "$cert_info"
            else
                warn "SSL certificate files not found in $ssl_path"
            fi
        fi
    done
}

# Function to check logs for errors
check_logs() {
    info "Checking logs for errors..."

    local compose_file="$COMPOSE_FILE"
    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check application logs
    info "Recent application errors:"
    docker-compose -f "$compose_file" logs --tail=20 app 2>/dev/null | grep -i error || echo "No recent errors found"

    # Check MongoDB logs
    info "Recent MongoDB errors:"
    docker-compose -f "$compose_file" logs --tail=20 mongodb 2>/dev/null | grep -i error || echo "No recent errors found"

    # Check nginx logs (if available)
    if docker-compose -f "$compose_file" ps nginx &> /dev/null; then
        info "Recent nginx errors:"
        docker-compose -f "$compose_file" logs --tail=20 nginx 2>/dev/null | grep -i error || echo "No recent errors found"
    fi
}

# Function to check file permissions
check_permissions() {
    info "Checking file permissions..."

    # Check uploads directory
    if [[ -d "./public/uploads" ]]; then
        local uploads_owner=$(stat -c "%U:%G" ./public/uploads 2>/dev/null || echo "unknown")
        local uploads_perms=$(stat -c "%a" ./public/uploads 2>/dev/null || echo "unknown")

        success "Uploads directory: owner=$uploads_owner, permissions=$uploads_perms"
    else
        warn "Uploads directory not found"
    fi

    # Check environment files
    if [[ -f ".env" ]]; then
        local env_perms=$(stat -c "%a" .env 2>/dev/null || echo "unknown")
        success "Environment file permissions: $env_perms"
    else
        warn "Environment file not found"
    fi
}

# Function to suggest fixes
suggest_fixes() {
    info "Suggested fixes for common issues..."

    echo ""
    echo "=== COMMON FIXES ==="
    echo ""

    echo "1. Database connection issues:"
    echo "   sudo ./scripts/fix-database.sh fix"
    echo ""

    echo "2. Restart all services:"
    echo "   docker-compose down && docker-compose up -d"
    echo ""

    echo "3. Reset MongoDB data:"
    echo "   sudo ./scripts/fix-database.sh reset"
    echo ""

    echo "4. Check detailed logs:"
    echo "   docker-compose logs -f"
    echo ""

    echo "5. Rebuild containers:"
    echo "   docker-compose down && docker-compose up -d --build"
    echo ""

    echo "6. Update application:"
    echo "   sudo ./scripts/deploy.sh update"
    echo ""

    echo "7. Full redeployment:"
    echo "   sudo ./scripts/deploy.sh deploy"
    echo ""

    echo "8. Generate new SSL certificates:"
    echo "   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
    echo "     -keyout /opt/nginx/ssl/private.key \\"
    echo "     -out /opt/nginx/ssl/cert.pem"
    echo ""
}

# Function to generate diagnostic report
generate_report() {
    info "Generating diagnostic report..."

    local report_file="/tmp/diagnostic_report_$(date +%Y%m%d_%H%M%S).txt"

    cat > "$report_file" << EOF
Portfolio Application Diagnostic Report
Generated: $(date)
System: $(uname -a)

=== SYSTEM INFORMATION ===
Memory: $(free -h | grep Mem)
Disk: $(df -h /)
CPU: $(nproc) cores
Load: $(uptime)

=== DOCKER INFORMATION ===
Docker Version: $(docker --version)
Docker Compose Version: $(docker-compose --version)
Docker Service Status: $(systemctl is-active docker)

=== CONTAINER STATUS ===
$(docker-compose ps 2>/dev/null || echo "No containers found")

=== NETWORK STATUS ===
$(netstat -tuln | grep -E ':(80|443|3000|27017) ')

=== RECENT LOGS ===
$(docker-compose logs --tail=50 2>/dev/null || echo "No logs available")

=== ENVIRONMENT VARIABLES ===
$(env | grep -E '^(NODE_ENV|DATABASE_URL|NEXTAUTH_URL)' | sed 's/=.*/=***/' || echo "No relevant environment variables found")

EOF

    success "Diagnostic report generated: $report_file"
    echo "You can share this report for troubleshooting assistance."
}

# Main troubleshooting function
run_full_check() {
    info "Running complete system check..."

    local issues=0

    check_system_requirements || ((issues++))
    check_containers || ((issues++))
    check_network || ((issues++))
    check_mongodb || ((issues++))
    check_nextjs || ((issues++))
    check_nginx || ((issues++))
    check_ssl || ((issues++))
    check_permissions || ((issues++))
    check_logs

    echo ""
    if [[ $issues -eq 0 ]]; then
        success "All checks passed! Your application should be working correctly."
    else
        warn "Found $issues issue(s). See suggestions below."
        suggest_fixes
    fi

    echo ""
    info "For detailed troubleshooting, run: $0 report"
}

# Main execution
case "$1" in
    "system")
        check_system_requirements
        ;;
    "containers")
        check_containers
        ;;
    "network")
        check_network
        ;;
    "mongodb")
        check_mongodb
        ;;
    "nextjs")
        check_nextjs
        ;;
    "nginx")
        check_nginx
        ;;
    "ssl")
        check_ssl
        ;;
    "logs")
        check_logs
        ;;
    "permissions")
        check_permissions
        ;;
    "fixes")
        suggest_fixes
        ;;
    "report")
        generate_report
        ;;
    "full"|"")
        run_full_check
        ;;
    *)
        echo "Usage: $0 {system|containers|network|mongodb|nextjs|nginx|ssl|logs|permissions|fixes|report|full}"
        echo ""
        echo "Commands:"
        echo "  system      - Check system requirements"
        echo "  containers  - Check Docker containers"
        echo "  network     - Check network connectivity"
        echo "  mongodb     - Check MongoDB status"
        echo "  nextjs      - Check Next.js application"
        echo "  nginx       - Check nginx configuration"
        echo "  ssl         - Check SSL certificates"
        echo "  logs        - Check logs for errors"
        echo "  permissions - Check file permissions"
        echo "  fixes       - Show suggested fixes"
        echo "  report      - Generate diagnostic report"
        echo "  full        - Run all checks (default)"
        exit 1
        ;;
esac
