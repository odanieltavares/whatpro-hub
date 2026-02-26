#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== WhatPro Hub Dev Runner ===${NC}"

# 1. Start Infrastructure
echo -e "\n${YELLOW}🐳 Starting Infrastructure (Docker)...${NC}"
# Cleanup potential zombie containers to avoid conflicts
docker rm -f whatpro_redis whatpro_pgvector 2>/dev/null
docker compose -f deploy/docker/docker-compose.yml up -d pgvector redis

# Check if Docker started successfully
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker containers. Make sure Docker Desktop is running."
    exit 1
fi

echo -e "${GREEN}✔ Infrastructure is up!${NC}"

# 2. Function to kill processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# 3. Start Backend
echo -e "\n${BLUE}🚀 Starting Backend API (Go)...${NC}"
cd apps/api || exit
# Ensure dependencies are tidy
go mod tidy 2>/dev/null
# Run backend in background
go run cmd/server/main.go &
BACKEND_PID=$!
cd ../..

# 4. Start Frontend
echo -e "\n${BLUE}🎨 Starting Frontend (Vite)...${NC}"
cd apps/frontend || exit
# Run frontend in background
npm run dev &
FRONTEND_PID=$!
cd ../..

echo -e "\n${GREEN}✅ System Running!${NC}"
echo -e "   - Frontend: http://localhost:5173"
echo -e "   - Backend:  http://localhost:4000"
echo -e "   (Press Ctrl+C to stop both)"

# Wait for processes
wait
