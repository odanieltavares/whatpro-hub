#!/bin/bash
# =============================================================================
# WhatPro Hub - Complete Infrastructure Validation
# =============================================================================
# Comprehensive end-to-end testing of entire stack
# Usage: ./validate-infrastructure.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  WhatPro Hub - Complete Infrastructure Validation Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

test_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    if [ "$result" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        ((PASSED++))
    elif [ "$result" == "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC} - $test_name: $message"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠ WARN${NC} - $test_name: $message"
        ((WARNINGS++))
    fi
}

# =============================================================================
# PHASE 1: Pre-Flight Checks
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 1: Pre-Flight Checks${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check Docker installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    test_result "Docker installed" "PASS"
    echo -e "  ${CYAN}Version: $DOCKER_VERSION${NC}"
else
    test_result "Docker installed" "FAIL" "Docker not found"
    exit 1
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    test_result "Docker Compose installed" "PASS"
    echo -e "  ${CYAN}Version: $COMPOSE_VERSION${NC}"
else
    test_result "Docker Compose installed" "FAIL" "Docker Compose not found"
    exit 1
fi

# Check .env file
if [ -f ".env" ]; then
    test_result ".env file exists" "PASS"
    
    # Check critical variables
    source .env
    if [ -n "$POSTGRES_PASSWORD" ]; then
        test_result "POSTGRES_PASSWORD set" "PASS"
    else test_result "POSTGRES_PASSWORD set" "FAIL" "Not configured"
    fi
    
    if [ -n "$REDIS_PASSWORD" ]; then
        test_result "REDIS_PASSWORD set" "PASS"
    else
        test_result "REDIS_PASSWORD set" "FAIL" "Not configured"
    fi
    
    if [ -n "$ENCRYPTION_KEY" ]; then
        if [ ${#ENCRYPTION_KEY} -eq 32 ]; then
            test_result "ENCRYPTION_KEY (32 bytes)" "PASS"
        else
            test_result "ENCRYPTION_KEY (32 bytes)" "WARN" "Length is ${#ENCRYPTION_KEY}"
        fi
    else
        test_result "ENCRYPTION_KEY set" "FAIL" "Not configured"
    fi
else
    test_result ".env file exists" "FAIL" "File not found"
    echo -e "${YELLOW}Run: ./scripts/generate-secrets.sh > .env${NC}"
    exit 1
fi

echo ""

# =============================================================================
# PHASE 2: Deploy Stack
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 2: Deploying Stack${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}Stopping existing containers...${NC}"
docker compose down -v > /dev/null 2>&1 || true

echo -e "${CYAN}Building and starting all services...${NC}"
if docker compose up -d --build; then
    test_result "Stack deployment" "PASS"
else
    test_result "Stack deployment" "FAIL" "docker compose up failed"
    exit 1
fi

echo -e "${CYAN}Waiting for services to initialize (30s)...${NC}"
sleep 30

echo ""

# =============================================================================
# PHASE 3: Container Status Check
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 3: Container Status${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

EXPECTED_CONTAINERS=(
    "whatpro_pgvector"
    "whatpro_redis"
    "whatpro_chatwoot_app"
    "whatpro_chatwoot_sidekiq"
    "whatpro_api"
    "whatpro_worker"
    "whatpro_traefik"
)

for container in "${EXPECTED_CONTAINERS[@]}"; do
    if docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container")
        if [ "$STATUS" == "running" ]; then
            test_result "$container running" "PASS"
            
            # Check health if healthcheck exists
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
            if [ "$HEALTH" != "none" ]; then
                if [ "$HEALTH" == "healthy" ]; then
                    echo -e "  ${GREEN}↳ Health: healthy${NC}"
                else
                    echo -e "  ${YELLOW}↳ Health: $HEALTH${NC}"
                fi
            fi
        else
            test_result "$container running" "FAIL" "Status: $STATUS"
        fi
    else
        test_result "$container exists" "FAIL" "Container not found"
    fi
done

# Check Portainer (optional)
if docker ps --filter "name=whatpro_portainer" | grep -q whatpro_portainer; then
    test_result "Portainer (optional)" "PASS"
else
    test_result "Portainer (optional)" "WARN" "Not running (use --profile monitoring)"
fi

echo ""

# =============================================================================
# PHASE 4: Network Isolation Tests
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 4: Network Security${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# PostgreSQL should NOT be accessible
if timeout 2 nc -zv localhost 5432 2>&1 | grep -q refused; then
    test_result "PostgreSQL port 5432 isolated" "PASS"
else
    test_result "PostgreSQL port 5432 isolated" "FAIL" "Port is accessible!"
fi

# Redis should NOT be accessible
if timeout 2 nc -zv localhost 6379 2>&1 | grep -q refused; then
    test_result "Redis port 6379 isolated" "PASS"
else
    test_result "Redis port 6379 isolated" "FAIL" "Port is accessible!"
fi

# Test internal connectivity
if docker exec whatpro_api pg_isready -h pgvector -U postgres > /dev/null 2>&1; then
    test_result "API → PostgreSQL (internal)" "PASS"
else
    test_result "API → PostgreSQL (internal)" "FAIL" "Cannot connect"
fi

if docker exec whatpro_api sh -c 'timeout 2 nc -zv redis 6379' > /dev/null 2>&1; then
    test_result "API → Redis (internal)" "PASS"
else
    test_result "API → Redis (internal)" "FAIL" "Cannot connect"
fi

echo ""

# =============================================================================
# PHASE 5: Service Ports Check
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 5: Exposed Ports${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check expected exposed ports
declare -A PORTS=(
    ["80"]="Traefik HTTP"
    ["443"]="Traefik HTTPS"
    ["4000"]="WhatPro API"
    ["8080"]="Chatwoot"
    ["8081"]="Traefik Dashboard"
    ["9000"]="Portainer (optional)"
)

for port in "${!PORTS[@]}"; do
    if timeout 2 nc -zv localhost $port 2>&1 | grep -q succeeded; then
        test_result "Port $port accessible (${PORTS[$port]})" "PASS"
    else
        if [ "$port" == "9000" ]; then
            test_result "Port $port accessible (${PORTS[$port]})" "WARN" "Not configured (optional)"
        else
            test_result "Port $port accessible (${PORTS[$port]})" "FAIL" "Not responding"
        fi
    fi
done

echo ""

# =============================================================================
# PHASE 6: API Health Checks
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 6: API Health Checks${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Wait extra 10s for API to be fully ready
sleep 10

# Test /health/live
if curl -f -s http://localhost:4000/health/live > /dev/null 2>&1; then
    test_result "GET /health/live" "PASS"
    LIVE_RESPONSE=$(curl -s http://localhost:4000/health/live)
    echo -e "  ${CYAN}Response: $LIVE_RESPONSE${NC}"
else
    test_result "GET /health/live" "FAIL" "Endpoint not responding"
fi

# Test /health/ready
if curl -f -s http://localhost:4000/health/ready > /dev/null 2>&1; then
    test_result "GET /health/ready" "PASS"
    READY_RESPONSE=$(curl -s http://localhost:4000/health/ready)
    echo -e "  ${CYAN}Response: $READY_RESPONSE${NC}"
else
    test_result "GET /health/ready" "FAIL" "Endpoint not responding"
fi

# Test /health/deep
if curl -f -s http://localhost:4000/health/deep > /dev/null 2>&1; then
    test_result "GET /health/deep" "PASS"
    DEEP_RESPONSE=$(curl -s http://localhost:4000/health/deep | jq '.')
    echo -e "  ${CYAN}Response:${NC}"
    echo "$DEEP_RESPONSE" | sed 's/^/    /'
else
    test_result "GET /health/deep" "WARN" "Endpoint may still be initializing"
fi

echo ""

# =============================================================================
# PHASE 7: Redis Authentication
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 7: Redis Authentication${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test auth required
if docker exec whatpro_redis redis-cli ping 2>&1 | grep -q "NOAUTH"; then
    test_result "Redis requires authentication" "PASS"
else
    test_result "Redis requires authentication" "FAIL" "No auth required!"
fi

# Test correct password works
if docker exec whatpro_redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping 2>&1 | grep -q "PONG"; then
    test_result "Redis accepts correct password" "PASS"
else
    test_result "Redis accepts correct password" "FAIL" "Auth failed"
fi

echo ""

# =============================================================================
# PHASE 8: Worker Status
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 8: Background Workers${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check worker logs for scheduler startup
if docker logs whatpro_worker 2>&1 | grep -q "Scheduler"; then
    test_result "Asynq scheduler initialized" "PASS"
    
    # Show scheduler status
    echo -e "  ${CYAN}Recent worker logs:${NC}"
    docker logs --tail=5 whatpro_worker 2>&1 | sed 's/^/    /'
else
    test_result "Asynq scheduler initialized" "WARN" "No scheduler logs yet"
fi

# Check Chatwoot Sidekiq
if docker logs whatpro_chatwoot_sidekiq 2>&1 | grep -q "Sidekiq"; then
    test_result "Chatwoot Sidekiq running" "PASS"
else
    test_result "Chatwoot Sidekiq running" "WARN" "No Sidekiq logs yet"
fi

echo ""

# =============================================================================
# PHASE 9: Log Rotation Check
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 9: Log Rotation${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

for container in whatpro_api whatpro_worker whatpro_pgvector; do
    LOG_CONFIG=$(docker inspect "$container" --format '{{.HostConfig.LogConfig.Config}}' 2>/dev/null)
    if echo "$LOG_CONFIG" | grep -q "max-size"; then
        MAX_SIZE=$(echo "$LOG_CONFIG" | grep -oP 'max-size:\K[^}]+')
        test_result "$container log rotation" "PASS"
        echo -e "  ${CYAN}Config: $MAX_SIZE${NC}"
    else
        test_result "$container log rotation" "WARN" "Not configured"
    fi
done

echo ""

# =============================================================================
# PHASE 10: Security Headers
# =============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 10: Security Headers${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HEADERS=$(curl -s -I http://localhost:4000/health/live)

if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    test_result "X-Frame-Options header" "PASS"
else
    test_result "X-Frame-Options header" "WARN" "Not set"
fi

if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
    test_result "X-Content-Type-Options header" "PASS"
else
    test_result "X-Content-Type-Options header" "WARN" "Not set"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Passed:${NC}   $PASSED"
echo -e "${RED}✗ Failed:${NC}   $FAILED"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL CRITICAL TESTS PASSED - STACK IS READY!           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Access Points:${NC}"
    echo -e "  • WhatPro API:      ${GREEN}http://localhost:4000${NC}"
    echo -e "  • Chatwoot:         ${GREEN}http://localhost:8080${NC}"
    echo -e "  • Traefik Dashboard:${GREEN}http://localhost:8081${NC}"
    echo -e "  • Portainer:        ${GREEN}http://localhost:9000${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ SOME TESTS FAILED - REVIEW AND FIX                    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}View logs:${NC} docker compose logs -f"
    echo ""
    exit 1
fi
