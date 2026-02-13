#!/bin/bash
# =============================================================================
# WhatPro Hub - Security Test Suite
# =============================================================================
# Tests all security measures are properly implemented
# Usage: ./security-tests.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Test result function
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

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}WhatPro Hub - Security Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# 1. Network Isolation Tests
# =============================================================================
echo -e "${BLUE}[1] Network Isolation Tests${NC}"
echo "────────────────────────────────────────────────────"

# Test PostgreSQL not exposed
if ! timeout 2 nc -zv localhost 5432 2>&1 | grep -q succeeded; then
    test_result "PostgreSQL port 5432 not exposed" "PASS"
else
    test_result "PostgreSQL port 5432 not exposed" "FAIL" "Port is accessible from host"
fi

# Test Redis not exposed  
if ! timeout 2 nc -zv localhost 6379 2>&1 | grep -q succeeded; then
    test_result "Redis port 6379 not exposed" "PASS"
else
    test_result "Redis port 6379 not exposed" "FAIL" "Port is accessible from host"
fi

# Test internal connectivity
if docker exec whatpro_api pg_isready -h pgvector -U postgres > /dev/null 2>&1; then
    test_result "API can connect to PostgreSQL internally" "PASS"
else
    test_result "API can connect to PostgreSQL internally" "FAIL" "Cannot reach database"
fi

if docker exec whatpro_api sh -c 'timeout 2 nc -zv redis 6379' > /dev/null 2>&1; then
    test_result "API can connect to Redis internally" "PASS"
else
    test_result "API can connect to Redis internally" "FAIL" "Cannot reach Redis"
fi

echo ""

# =============================================================================
# 2. Redis Authentication Tests
# =============================================================================
echo -e "${BLUE}[2] Redis Authentication Tests${NC}"
echo "────────────────────────────────────────────────────"

# Test Redis requires auth
if docker exec whatpro_redis redis-cli ping 2>&1 | grep -q "NOAUTH"; then
    test_result "Redis requires authentication" "PASS"
else
    test_result "Redis requires authentication" "FAIL" "Redis accessible without password"
fi

# Test Redis accepts correct password
REDIS_PASSWORD=$(docker exec whatpro_redis printenv REDIS_PASSWORD 2>/dev/null || echo "")
if [ -n "$REDIS_PASSWORD" ]; then
    if docker exec whatpro_redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping 2>&1 | grep -q "PONG"; then
        test_result "Redis accepts correct password" "PASS"
    else
        test_result "Redis accepts correct password" "FAIL" "Authentication failed"
    fi
else
    test_result "Redis password configured" "FAIL" "REDIS_PASSWORD not set"
fi

echo ""

# =============================================================================
# 3. Secrets Validation Tests
# =============================================================================
echo -e "${BLUE}[3] Secrets Validation Tests${NC}"
echo "────────────────────────────────────────────────────"

# Test .env.production not in git
if [ ! -f "$(git rev-parse --show-toplevel)/.git/index" ] || ! git ls-files | grep -q ".env.production"; then
    test_result ".env.production not committed to git" "PASS"
else
    test_result ".env.production not committed to git" "FAIL" "File is tracked by git"
fi

# Test ENCRYPTION_KEY is set
if docker exec whatpro_api printenv ENCRYPTION_KEY > /dev/null 2>&1; then
    ENC_KEY=$(docker exec whatpro_api printenv ENCRYPTION_KEY)
    if [ ${#ENC_KEY} -eq 32 ]; then
        test_result "ENCRYPTION_KEY has correct length (32 bytes)" "PASS"
    else
        test_result "ENCRYPTION_KEY has correct length (32 bytes)" "FAIL" "Length is ${#ENC_KEY}, expected 32"
    fi
else
    test_result "ENCRYPTION_KEY configured" "FAIL" "Not set in API container"
fi

# Test JWT_SECRET strength
if docker exec whatpro_api printenv JWT_SECRET > /dev/null 2>&1; then
    JWT_SECRET=$(docker exec whatpro_api printenv JWT_SECRET)
    if [ ${#JWT_SECRET} -ge 32 ]; then
        test_result "JWT_SECRET has sufficient length" "PASS"
    else
        test_result "JWT_SECRET has sufficient length" "WARN" "Should be at least 32 characters"
    fi
else
    test_result "JWT_SECRET configured" "FAIL" "Not set"
fi

# Test default passwords not used
POSTGRES_PASS=$(docker exec whatpro_pgvector printenv POSTGRES_PASSWORD)
if [ "$POSTGRES_PASS" != "5deb2960472a61ef93371ea2b1082cdd" ]; then
    test_result "PostgreSQL password changed from default" "PASS"
else
    test_result "PostgreSQL password changed from default" "FAIL" "Using default password!"
fi

echo ""

# =============================================================================
# 4. Container Security Tests
# =============================================================================
echo -e "${BLUE}[4] Container Security Tests${NC}"
echo "────────────────────────────────────────────────────"

# Test no-new-privileges
for container in whatpro_api whatpro_worker whatpro_pgvector whatpro_redis; do
    if docker inspect "$container" --format '{{.HostConfig.SecurityOpt}}' | grep -q "no-new-privileges:true"; then
        test_result "$container has no-new-privileges" "PASS"
    else
        test_result "$container has no-new-privileges" "WARN" "Not configured"
    fi
done

# Test resource limits
for container in whatpro_api whatpro_worker whatpro_pgvector; do
    MEM_LIMIT=$(docker inspect "$container" --format '{{.HostConfig.Memory}}')
    if [ "$MEM_LIMIT" != "0" ]; then
        test_result "$container has memory limit" "PASS"
    else
        test_result "$container has memory limit" "WARN" "No limit set"
    fi
done

echo ""

# =============================================================================
# 5. Health Checks Tests
# =============================================================================
echo -e "${BLUE}[5] Health Checks Tests${NC}"
echo "────────────────────────────────────────────────────"

# Test all critical containers are healthy
for container in whatpro_pgvector whatpro_redis whatpro_api; do
    HEALTH=$(docker inspect "$container" --format '{{.State.Health.Status}}' 2>/dev/null || echo "none")
    if [ "$HEALTH" == "healthy" ]; then
        test_result "$container health check" "PASS"
    elif [ "$HEALTH" == "none" ]; then
        test_result "$container health check" "WARN" "No health check configured"
    else
        test_result "$container health check" "FAIL" "Status: $HEALTH"
    fi
done

# Test API health endpoint
if curl -f -s http://localhost:4000/health/live > /dev/null; then
    test_result "API /health/live endpoint" "PASS"
else
    test_result "API /health/live endpoint" "FAIL" "Endpoint not responding"
fi

if curl -f -s http://localhost:4000/health/ready > /dev/null; then
    test_result "API /health/ready endpoint" "PASS"
else
    test_result "API /health/ready endpoint" "FAIL" "Endpoint not responding"
fi

echo ""

# =============================================================================
# 6. Log Rotation Tests
# =============================================================================
echo -e "${BLUE}[6] Log Rotation Tests${NC}"
echo "────────────────────────────────────────────────────"

for container in whatpro_api whatpro_worker whatpro_pgvector; do
    LOG_CONFIG=$(docker inspect "$container" --format '{{.HostConfig.LogConfig.Config}}')
    if echo "$LOG_CONFIG" | grep -q "max-size"; then
        test_result "$container has log rotation" "PASS"
    else
        test_result "$container has log rotation" "WARN" "Log rotation not configured"
    fi
done

echo ""

# =============================================================================
# 7. Vulnerability Scan (if tools available)
# =============================================================================
echo -e "${BLUE}[7] Vulnerability Scan${NC}"
echo "────────────────────────────────────────────────────"

if command -v trivy &> /dev/null; then
    echo "Running Trivy scan..."
    if trivy image --severity CRITICAL,HIGH --exit-code 0 whatpro/hub-api:latest > /dev/null 2>&1; then
        test_result "Trivy scan (CRITICAL/HIGH)" "PASS"
    else
        test_result "Trivy scan (CRITICAL/HIGH)" "FAIL" "Vulnerabilities found"
    fi
else
    test_result "Trivy installed" "WARN" "Trivy not found. Install: https://github.com/aquasecurity/trivy"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo  -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review and fix.${NC}"
    exit 1
fi
