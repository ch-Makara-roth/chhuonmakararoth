#!/bin/bash

# Production Monitoring Script for Next.js Portfolio Application
# This script monitors system health, application performance, and alerts on issues

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
LOG_DIR="/var/log/portfolio"
ALERT_EMAIL=""
SLACK_WEBHOOK=""
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=5000
HEALTH_CHECK_URL="http://localhost:3000/health"
MONITOR_INTERVAL=60

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_DIR/monitor.log"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_DIR/monitor.log"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_DIR/monitor.log"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_DIR/monitor.log"
}

# Function to send alerts
send_alert() {
    local severity="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] ALERT [$severity]: $message" >> "$LOG_DIR/alerts.log"

    # Send email alert if configured
    if [[ -n "$ALERT_EMAIL" ]]; then
        echo "Subject: Portfolio Alert [$severity]" | mail -s "Portfolio Alert" "$ALERT_EMAIL" << EOF
Portfolio Application Alert

Severity: $severity
Time: $timestamp
Message: $message

System Information:
- Host: $(hostname)
- Load: $(uptime)
- Memory: $(free -h | grep Mem)
- Disk: $(df -h / | tail -1)

Please check the application status immediately.
EOF
    fi

    # Send Slack alert if configured
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Portfolio Alert [$severity]\\n$message\\nTime: $timestamp\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# Function to check system resources
check_system_resources() {
    local alerts=0

    # Check CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    cpu_usage=${cpu_usage%.*}  # Remove decimal part

    if [[ $cpu_usage -gt $ALERT_THRESHOLD_CPU ]]; then
        send_alert "HIGH" "High CPU usage detected: ${cpu_usage}%"
        ((alerts++))
    fi

    # Check memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

    if [[ $memory_usage -gt $ALERT_THRESHOLD_MEMORY ]]; then
        send_alert "HIGH" "High memory usage detected: ${memory_usage}%"
        ((alerts++))
    fi

    # Check disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

    if [[ $disk_usage -gt $ALERT_THRESHOLD_DISK ]]; then
        send_alert "CRITICAL" "High disk usage detected: ${disk_usage}%"
        ((alerts++))
    fi

    # Check load average
    local load_avg=$(uptime | awk '{print $(NF-2)}' | cut -d',' -f1)
    local cpu_cores=$(nproc)
    local load_percentage=$(echo "scale=2; $load_avg / $cpu_cores * 100" | bc)

    if (( $(echo "$load_percentage > 100" | bc -l) )); then
        send_alert "HIGH" "High system load detected: $load_avg (${load_percentage}%)"
        ((alerts++))
    fi

    # Log current metrics
    cat >> "$LOG_DIR/metrics.log" << EOF
$(date '+%Y-%m-%d %H:%M:%S'),CPU,${cpu_usage}%
$(date '+%Y-%m-%d %H:%M:%S'),Memory,${memory_usage}%
$(date '+%Y-%m-%d %H:%M:%S'),Disk,${disk_usage}%
$(date '+%Y-%m-%d %H:%M:%S'),Load,${load_avg}
EOF

    return $alerts
}

# Function to check Docker containers
check_containers() {
    local alerts=0
    local compose_file="$COMPOSE_FILE"

    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check if containers are running
    local services=$(docker-compose -f "$compose_file" config --services 2>/dev/null || echo "")

    for service in $services; do
        local container_id=$(docker-compose -f "$compose_file" ps -q "$service" 2>/dev/null)

        if [[ -n "$container_id" ]]; then
            local status=$(docker inspect --format='{{.State.Status}}' "$container_id" 2>/dev/null || echo "unknown")

            if [[ "$status" != "running" ]]; then
                send_alert "CRITICAL" "Container $service is not running (status: $status)"
                ((alerts++))
            fi

            # Check container health
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "none")

            if [[ "$health" == "unhealthy" ]]; then
                send_alert "HIGH" "Container $service is unhealthy"
                ((alerts++))
            fi

            # Check container resource usage
            local stats=$(docker stats --no-stream --format "table {{.Container}},{{.CPUPerc}},{{.MemUsage}}" "$container_id" 2>/dev/null | tail -1)

            if [[ -n "$stats" ]]; then
                echo "$(date '+%Y-%m-%d %H:%M:%S'),$service,$stats" >> "$LOG_DIR/container_metrics.log"
            fi
        else
            send_alert "CRITICAL" "Container $service not found"
            ((alerts++))
        fi
    done

    return $alerts
}

# Function to check application health
check_application_health() {
    local alerts=0
    local start_time=$(date +%s%3N)

    # Check health endpoint
    local health_response=$(curl -s -w "%{http_code}" -o /tmp/health_check.json "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    if [[ "$health_response" != "200" ]]; then
        send_alert "CRITICAL" "Application health check failed (HTTP $health_response)"
        ((alerts++))
    elif [[ $response_time -gt $ALERT_THRESHOLD_RESPONSE_TIME ]]; then
        send_alert "HIGH" "Slow application response time: ${response_time}ms"
        ((alerts++))
    fi

    # Parse health check response
    if [[ -f "/tmp/health_check.json" ]]; then
        local db_status=$(jq -r '.checks.database.status' /tmp/health_check.json 2>/dev/null || echo "unknown")

        if [[ "$db_status" != "healthy" ]]; then
            send_alert "CRITICAL" "Database health check failed: $db_status"
            ((alerts++))
        fi

        # Log metrics
        local memory_used=$(jq -r '.checks.memory.used' /tmp/health_check.json 2>/dev/null || echo "0")
        local db_response_time=$(jq -r '.checks.database.responseTime' /tmp/health_check.json 2>/dev/null || echo "0")

        cat >> "$LOG_DIR/app_metrics.log" << EOF
$(date '+%Y-%m-%d %H:%M:%S'),ResponseTime,${response_time}ms
$(date '+%Y-%m-%d %H:%M:%S'),DatabaseResponseTime,${db_response_time}
$(date '+%Y-%m-%d %H:%M:%S'),MemoryUsed,${memory_used}MB
EOF
    fi

    return $alerts
}

# Function to check database
check_database() {
    local alerts=0
    local compose_file="$COMPOSE_FILE"

    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check MongoDB connection
    if ! docker-compose -f "$compose_file" exec -T mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
        send_alert "CRITICAL" "MongoDB connection failed"
        ((alerts++))
    fi

    # Check replica set status
    local rs_status=$(docker-compose -f "$compose_file" exec -T mongodb mongosh --eval "rs.status().ok" --quiet 2>/dev/null || echo "0")

    if [[ "$rs_status" != "1" ]]; then
        send_alert "HIGH" "MongoDB replica set is not healthy"
        ((alerts++))
    fi

    # Check database size
    local db_size=$(docker-compose -f "$compose_file" exec -T mongodb mongosh --eval "db.stats().dataSize" --quiet 2>/dev/null || echo "0")

    if [[ $db_size -gt 1073741824 ]]; then  # 1GB
        local db_size_mb=$((db_size / 1024 / 1024))
        warn "Database size is large: ${db_size_mb}MB"
    fi

    return $alerts
}

# Function to check network connectivity
check_network() {
    local alerts=0

    # Check essential ports
    local ports=("80" "443" "3000" "27017")

    for port in "${ports[@]}"; do
        if ! netstat -tuln | grep -q ":$port "; then
            send_alert "HIGH" "Port $port is not listening"
            ((alerts++))
        fi
    done

    # Check external connectivity
    if ! curl -s --connect-timeout 5 https://google.com &>/dev/null; then
        send_alert "HIGH" "External network connectivity issue"
        ((alerts++))
    fi

    return $alerts
}

# Function to check log files for errors
check_logs() {
    local alerts=0
    local compose_file="$COMPOSE_FILE"

    if [[ -f "$PROD_COMPOSE_FILE" ]]; then
        compose_file="$PROD_COMPOSE_FILE"
    fi

    # Check for recent errors in application logs
    local recent_errors=$(docker-compose -f "$compose_file" logs --since="5m" app 2>/dev/null | grep -i error | wc -l)

    if [[ $recent_errors -gt 10 ]]; then
        send_alert "HIGH" "High number of application errors in last 5 minutes: $recent_errors"
        ((alerts++))
    fi

    # Check for MongoDB errors
    local mongo_errors=$(docker-compose -f "$compose_file" logs --since="5m" mongodb 2>/dev/null | grep -i error | wc -l)

    if [[ $mongo_errors -gt 5 ]]; then
        send_alert "HIGH" "MongoDB errors detected in last 5 minutes: $mongo_errors"
        ((alerts++))
    fi

    return $alerts
}

# Function to check SSL certificates
check_ssl() {
    local alerts=0
    local ssl_paths=("/etc/nginx/ssl" "/opt/nginx/ssl" "./nginx/ssl")

    for ssl_path in "${ssl_paths[@]}"; do
        if [[ -f "$ssl_path/cert.pem" ]]; then
            local cert_expiry=$(openssl x509 -in "$ssl_path/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
            local cert_expiry_epoch=$(date -d "$cert_expiry" +%s)
            local current_epoch=$(date +%s)
            local days_until_expiry=$(( (cert_expiry_epoch - current_epoch) / 86400 ))

            if [[ $days_until_expiry -lt 30 ]]; then
                send_alert "HIGH" "SSL certificate expires in $days_until_expiry days"
                ((alerts++))
            elif [[ $days_until_expiry -lt 7 ]]; then
                send_alert "CRITICAL" "SSL certificate expires in $days_until_expiry days"
                ((alerts++))
            fi

            break
        fi
    done

    return $alerts
}

# Function to generate monitoring report
generate_report() {
    local report_file="$LOG_DIR/monitoring_report_$(date +%Y%m%d_%H%M%S).json"

    cat > "$report_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$(hostname)",
    "system": {
        "uptime": "$(uptime -p)",
        "load": "$(uptime | awk '{print $(NF-2)}' | cut -d',' -f1)",
        "cpu_usage": "$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%",
        "memory_usage": "$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%",
        "disk_usage": "$(df / | tail -1 | awk '{print $5}')"
    },
    "application": {
        "health_status": "$(curl -s $HEALTH_CHECK_URL | jq -r '.status' 2>/dev/null || echo 'unknown')",
        "response_time": "$(curl -s -w '%{time_total}' -o /dev/null $HEALTH_CHECK_URL 2>/dev/null || echo '0')s"
    },
    "database": {
        "status": "$(docker-compose exec -T mongodb mongosh --eval 'db.adminCommand(\"ping\").ok' --quiet 2>/dev/null || echo '0')",
        "replica_set": "$(docker-compose exec -T mongodb mongosh --eval 'rs.status().ok' --quiet 2>/dev/null || echo '0')"
    }
}
EOF

    info "Monitoring report generated: $report_file"
}

# Function to cleanup old logs
cleanup_logs() {
    info "Cleaning up old log files..."

    # Remove logs older than 30 days
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

    # Rotate large log files
    for log_file in "$LOG_DIR"/*.log; do
        if [[ -f "$log_file" && $(stat -c%s "$log_file") -gt 10485760 ]]; then  # 10MB
            mv "$log_file" "${log_file}.old"
            touch "$log_file"
        fi
    done

    info "Log cleanup completed"
}

# Function to run all checks
run_monitoring() {
    local total_alerts=0

    info "Starting monitoring cycle..."

    check_system_resources
    total_alerts=$((total_alerts + $?))

    check_containers
    total_alerts=$((total_alerts + $?))

    check_application_health
    total_alerts=$((total_alerts + $?))

    check_database
    total_alerts=$((total_alerts + $?))

    check_network
    total_alerts=$((total_alerts + $?))

    check_logs
    total_alerts=$((total_alerts + $?))

    check_ssl
    total_alerts=$((total_alerts + $?))

    if [[ $total_alerts -eq 0 ]]; then
        info "Monitoring cycle completed - All systems healthy"
    else
        warn "Monitoring cycle completed - $total_alerts alerts generated"
    fi

    return $total_alerts
}

# Function to start continuous monitoring
start_daemon() {
    info "Starting monitoring daemon (interval: ${MONITOR_INTERVAL}s)..."

    while true; do
        run_monitoring
        sleep "$MONITOR_INTERVAL"
    done
}

# Function to show current status
show_status() {
    info "Current System Status:"
    echo ""

    echo "=== SYSTEM RESOURCES ==="
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%"
    echo "Disk Usage: $(df / | tail -1 | awk '{print $5}')"
    echo "Load Average: $(uptime | awk '{print $(NF-2)}' | cut -d',' -f1)"
    echo ""

    echo "=== APPLICATION STATUS ==="
    local health_status=$(curl -s "$HEALTH_CHECK_URL" 2>/dev/null | jq -r '.status' 2>/dev/null || echo "unknown")
    echo "Health Status: $health_status"

    if [[ "$health_status" == "healthy" ]]; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application issues detected"
    fi
    echo ""

    echo "=== CONTAINER STATUS ==="
    docker-compose ps 2>/dev/null || echo "No containers found"
    echo ""

    echo "=== RECENT ALERTS ==="
    tail -5 "$LOG_DIR/alerts.log" 2>/dev/null || echo "No recent alerts"
}

# Main execution
case "$1" in
    "start"|"daemon")
        start_daemon
        ;;
    "check"|"run")
        run_monitoring
        ;;
    "status")
        show_status
        ;;
    "report")
        generate_report
        ;;
    "cleanup")
        cleanup_logs
        ;;
    "test-alert")
        send_alert "TEST" "This is a test alert from the monitoring system"
        ;;
    *)
        echo "Usage: $0 {start|check|status|report|cleanup|test-alert}"
        echo ""
        echo "Commands:"
        echo "  start       - Start continuous monitoring daemon"
        echo "  check       - Run monitoring checks once"
        echo "  status      - Show current system status"
        echo "  report      - Generate monitoring report"
        echo "  cleanup     - Clean up old log files"
        echo "  test-alert  - Send test alert"
        echo ""
        echo "Configuration (edit script to change):"
        echo "  MONITOR_INTERVAL=$MONITOR_INTERVAL seconds"
        echo "  CPU_THRESHOLD=$ALERT_THRESHOLD_CPU%"
        echo "  MEMORY_THRESHOLD=$ALERT_THRESHOLD_MEMORY%"
        echo "  DISK_THRESHOLD=$ALERT_THRESHOLD_DISK%"
        echo "  RESPONSE_TIME_THRESHOLD=${ALERT_THRESHOLD_RESPONSE_TIME}ms"
        exit 1
        ;;
esac
