#!/bin/bash
# =============================================================================
# WhatPro Hub - Automated Backup Script
# =============================================================================
# Backs up PostgreSQL, Redis, and application volumes
# Usage: ./backup.sh [--upload-s3]
# Cron: 0 2 * * * /path/to/backup.sh >> /var/log/whatpro-backup.log 2>&1
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups/whatpro}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="whatpro-backup-${TIMESTAMP}"
TEMP_DIR="/tmp/${BACKUP_NAME}"

# S3 Configuration (optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Cleanup on exit
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        log "Cleaned up temporary directory"
    fi
}
trap cleanup EXIT

# Create directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

log "Starting WhatPro Hub backup: $BACKUP_NAME"

# =============================================================================
# 1. PostgreSQL Backup
# =============================================================================
log "Backing up PostgreSQL databases..."

POSTGRES_PASSWORD=$(docker exec whatpro_pgvector printenv POSTGRES_PASSWORD)

# Backup WhatPro Hub database
docker exec whatpro_pgvector pg_dump -U postgres -F c -b -v whatpro_hub \
    > "$TEMP_DIR/whatpro_hub.dump" 2>/dev/null

if [ $? -eq 0 ]; then
    log "✓ WhatPro Hub database backed up"
else
    error "Failed to backup WhatPro Hub database"
    exit 1
fi

# Backup Chatwoot database
docker exec whatpro_pgvector pg_dump -U postgres -F c -b -v chatwoot \
    > "$TEMP_DIR/chatwoot.dump" 2>/dev/null

if [ $? -eq 0 ]; then
    log "✓ Chatwoot database backed up"
else
    warn "Failed to backup Chatwoot database (may not exist yet)"
fi

# =============================================================================
# 2. Redis Backup
# =============================================================================
log "Backing up Redis..."

# Trigger Redis save
docker exec whatpro_redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" BGSAVE

# Wait for save to complete
sleep 5

# Copy RDB file
docker cp whatpro_redis:/data/dump.rdb "$TEMP_DIR/redis-dump.rdb"

if [ $? -eq 0 ]; then
    log "✓ Redis data backed up"
else
    warn "Failed to backup Redis"
fi

# =============================================================================
# 3. Volume Backups
# =============================================================================
log "Backing up Docker volumes..."

# Chatwoot storage
docker run --rm -v whatpro-hub_chatwoot_storage:/data -v "$TEMP_DIR":/backup \
    alpine tar czf /backup/chatwoot_storage.tar.gz -C /data .

if [ $? -eq 0 ]; then
    log "✓ Chatwoot storage backed up"
fi

# =============================================================================
# 4. Configuration Backup
# =============================================================================
log "Backing up configuration files..."

cd "$(dirname "$0")/.." || exit 1
tar czf "$TEMP_DIR/configs.tar.gz" \
    configs/ \
    scripts/ \
    .env.production.example \
    docker-compose.yml

log "✓ Configuration files backed up"

# =============================================================================
# 5. Create Final Archive
# =============================================================================
log "Creating final backup archive..."

cd "$TEMP_DIR" || exit 1
tar czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" ./*

BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
log "✓ Backup completed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# =============================================================================
# 6. Upload to S3 (Optional)
# =============================================================================
if [ -n "$S3_BUCKET" ] && [ "$1" == "--upload-s3" ]; then
    log "Uploading to S3: s3://${S3_BUCKET}/whatpro-backups/"
    
    if command -v aws &> /dev/null; then
        AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
        AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
        aws s3 cp \
            "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" \
            "s3://${S3_BUCKET}/whatpro-backups/${BACKUP_name}.tar.gz"
        
        log "✓ Uploaded to S3"
    else
        warn "AWS CLI not installed. Skipping S3 upload."
    fi
fi

# =============================================================================
# 7. Cleanup Old Backups
# =============================================================================
log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."

find "$BACKUP_DIR" -name "whatpro-backup-*.tar.gz" -mtime +${RETENTION_DAYS} -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "whatpro-backup-*.tar.gz" | wc -l)
log "✓ ${REMAINING_BACKUPS} backup(s) retained"

# =============================================================================
# 8. Summary
# =============================================================================
echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Backup Summary:"
log "  Name: ${BACKUP_NAME}.tar.gz"
log "  Size: ${BACKUP_SIZE}"
log "  Location: ${BACKUP_DIR}"
log "  Retention: ${RETENTION_DAYS} days"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verification
log "Verifying backup integrity..."
if tar tzf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" > /dev/null 2>&1; then
    log "✓ Backup archive is valid"
else
    error "Backup archive is corrupted!"
    exit 1
fi

echo ""
log "🎉 Backup completed successfully!"
