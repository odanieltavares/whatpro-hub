#!/bin/bash

# WhatPro Hub - Quick Test Script
# Tests if the backend is working correctly

set -e

echo "🧪 Testing WhatPro Hub Backend..."
echo ""

BASE_URL="http://localhost:4000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Live
echo "1. Testing /health/live..."
if curl -s -f "$BASE_URL/health/live" > /dev/null; then
    echo -e "${GREEN}✅ Health Live OK${NC}"
else
    echo -e "${RED}❌ Health Live FAILED${NC}"
    exit 1
fi

# Test 2: Health Ready
echo "2. Testing /health/ready..."
if curl -s -f "$BASE_URL/health/ready" > /dev/null; then
    echo -e "${GREEN}✅ Health Ready OK${NC}"
else
    echo -e "${RED}❌ Health Ready FAILED${NC}"
    exit 1
fi

# Test 3: Health Deep
echo "3. Testing /health/deep..."
curl -s "$BASE_URL/health/deep" | jq .

# Test 4: SSO (will fail without valid token, but tests the endpoint exists)
echo "4. Testing /api/v1/auth/sso (expect 400/401)..."
curl -s -X POST "$BASE_URL/api/v1/auth/sso" \
    -H "Content-Type: application/json" \
    -d '{}' | jq .

# Test 5: List Accounts (requires auth, expect 401)
echo "5. Testing /api/v1/accounts (expect 401)..."
curl -s "$BASE_URL/api/v1/accounts" | jq .

echo ""
echo -e "${GREEN}🎉 Basic tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Get a valid Chatwoot token"
echo "2. Test SSO endpoint with real token"
echo "3. Test Account CRUD operations"
