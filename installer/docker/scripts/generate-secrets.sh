#!/bin/bash
# =============================================================================
# WhatPro Hub - Secrets Generator
# =============================================================================
# Generates cryptographically secure secrets for production deployment
# Usage: ./generate-secrets.sh > .env.production
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}WhatPro Hub - Production Secrets Generator${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Generate random string with specified length
generate_secret() {
    local length=$1
    openssl rand -base64 $((length * 3 / 4)) | tr -d '\n' | head -c $length
}

# Generate UUID
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        cat /proc/sys/kernel/random/uuid
    fi
}

# Generate 256-bit hex key (64 characters)
generate_hex_key() {
    openssl rand -hex 32
}

echo "# ============================================================================="
echo "# WhatPro Hub - Production Environment Variables"
echo "# ============================================================================="
echo "# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "# CRITICAL: Keep this file secure. Never commit to version control."
echo "# ============================================================================="
echo ""

echo "# ============================================================================="
echo "# PostgreSQL"
echo "# ============================================================================="
POSTGRES_PASSWORD=$(generate_secret 64)
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
echo "POSTGRES_DB=whatpro_hub"
echo ""

echo "# ============================================================================="
echo "# Redis"
echo "# ============================================================================="
REDIS_PASSWORD=$(generate_secret 64)
echo "REDIS_PASSWORD=${REDIS_PASSWORD}"
echo ""

echo "# ============================================================================="
echo "# Chatwoot"
echo "# ============================================================================="
CHATWOOT_SECRET=$(generate_hex_key)$(generate_hex_key) # 128 characters
echo "CHATWOOT_SECRET_KEY_BASE=${CHATWOOT_SECRET}"
echo "INSTALLATION_ENV=docker"
echo "FRONTEND_URL=https://chat.yourdomain.com  # UPDATE THIS"
echo "ENABLE_ACCOUNT_SIGNUP=false  # Disable in production"
echo ""

echo "# ============================================================================="
echo "# WhatPro Hub API"
echo "# ============================================================================="
echo "APP_ENV=production"
echo "APP_PORT=3000"
echo "DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@pgvector:5432/whatpro_hub?sslmode=require"
echo "REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379"
echo "CHATWOOT_URL=http://chatwoot_app:3000"
echo ""
echo "# IMPORTANT: Set this after Chatwoot is configured"
echo "CHATWOOT_API_KEY=YOUR_CHATWOOT_SUPER_ADMIN_API_KEY_HERE"
echo ""

JWT_SECRET=$(generate_hex_key)
echo "JWT_SECRET=${JWT_SECRET}"
echo ""

ENCRYPTION_KEY=$(generate_secret 32) # Exactly 32 bytes for AES-256
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}"
echo ""

echo "# CORS: Update with your frontend domain"
echo "CORS_ORIGINS=https://app.yourdomain.com,https://chat.yourdomain.com"
echo ""

echo "# ============================================================================="
echo "# Traefik"
echo "# ============================================================================="
echo "TRAEFIK_DASHBOARD=true"
TRAEFIK_USER="admin"
TRAEFIK_PASSWORD=$(generate_secret 32)
# Generate bcrypt hash for BasicAuth (requires htpasswd)
if command -v htpasswd &> /dev/null; then
    TRAEFIK_AUTH=$(htpasswd -nbB "$TRAEFIK_USER" "$TRAEFIK_PASSWORD" | sed -e 's/\$/\$\$/g')
    echo "TRAEFIK_AUTH_USER=${TRAEFIK_AUTH}"
else
    echo "TRAEFIK_AUTH_USER=${TRAEFIK_USER}:${TRAEFIK_PASSWORD}  # ENCODE WITH htpasswd"
fi
echo ""

echo "# Let's Encrypt Email for SSL certificates"
echo "LETSENCRYPT_EMAIL=admin@yourdomain.com  # UPDATE THIS"
echo ""

echo "# ============================================================================="
echo "# Backup Configuration"
echo "# ============================================================================="
echo "BACKUP_RETENTION_DAYS=30"
echo "BACKUP_S3_BUCKET=  # Optional: S3 bucket for offsite backups"
echo "BACKUP_S3_ACCESS_KEY=  # Optional"
echo "BACKUP_S3_SECRET_KEY=  # Optional"
echo ""

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Secrets generated successfully!${NC}"
echo -e "${YELLOW}IMPORTANT NEXT STEPS:${NC}"
echo -e "1. Save output to: ${GREEN}.env.production${NC}"
echo -e "2. Update placeholders: ${YELLOW}CHATWOOT_API_KEY, FRONTEND_URL, LETSENCRYPT_EMAIL${NC}"
echo -e "3. Secure the file: ${GREEN}chmod 600 .env.production${NC}"
echo -e "4. Never commit to git!"
echo -e "${GREEN}==============================================================================${NC}"
