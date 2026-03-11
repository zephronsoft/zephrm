#!/bin/bash
# ============================================
# HRM Data Backup Script
# Backs up SQLite DB and optional uploads
# ============================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="${CONTAINER_NAME:-hrm-backend}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting HRM backup..."

# Option 1: Backup from running container
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if ! docker cp "${CONTAINER_NAME}:/app/data/dev.db" "${BACKUP_DIR}/hrm_${TIMESTAMP}.db" 2>/dev/null; then
    echo "ERROR: Could not copy DB from container. Ensure backend has run and created dev.db."
    exit 1
  fi
  echo "Backed up from container: ${BACKUP_DIR}/hrm_${TIMESTAMP}.db"
else
  # Option 2: Backup from Docker volume (when backend not running)
  VOLUME_NAME="${VOLUME_NAME:-hrm_data}"
  if docker volume inspect "$VOLUME_NAME" &>/dev/null; then
    if docker run --rm -v "${VOLUME_NAME}:/data" -v "$(pwd)/${BACKUP_DIR}:/backup" alpine \
      sh -c "cp /data/dev.db /backup/hrm_${TIMESTAMP}.db 2>/dev/null || exit 1"; then
      echo "Backed up from volume: ${BACKUP_DIR}/hrm_${TIMESTAMP}.db"
    else
      echo "WARN: No dev.db in volume. Run backup after first backend start."
      exit 1
    fi
  else
    # Option 3: Backup from local dev.db
    if [ -f "./backend/prisma/dev.db" ]; then
      cp "./backend/prisma/dev.db" "${BACKUP_DIR}/hrm_${TIMESTAMP}.db"
      echo "Backed up from local: ${BACKUP_DIR}/hrm_${TIMESTAMP}.db"
    else
      echo "ERROR: No data source found. Start the app first or check paths."
      exit 1
    fi
  fi
fi

# Compress backup
gzip -f "${BACKUP_DIR}/hrm_${TIMESTAMP}.db"
echo "[$(date)] Backup complete: ${BACKUP_DIR}/hrm_${TIMESTAMP}.db.gz"
