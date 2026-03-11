#!/bin/bash
# ============================================
# HRM Data Restore Script
# Restores SQLite DB from backup
# Usage: ./restore.sh <backup_file.db.gz>
# ============================================

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.db.gz>"
  echo "Example: $0 ./backups/hrm_20250112_143022.db.gz"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-hrm-backend}"
VOLUME_NAME="${VOLUME_NAME:-hrm_data}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from $BACKUP_FILE..."

# Decompress if needed
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  RESTORE_FILE="${BACKUP_FILE%.gz}"
  gunzip -c "$BACKUP_FILE" > "$RESTORE_FILE"
  trap "rm -f $RESTORE_FILE" EXIT
fi

# Option 1: Restore to running container
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker cp "$RESTORE_FILE" "${CONTAINER_NAME}:/app/data/dev.db"
  echo "Restored to container. Restart backend to apply: docker restart $CONTAINER_NAME"
  exit 0
fi

# Option 2: Restore to volume (when containers are stopped)
if docker volume inspect "$VOLUME_NAME" &>/dev/null; then
  ABS_PATH="$(cd "$(dirname "$RESTORE_FILE")" && pwd)/$(basename "$RESTORE_FILE")"
  docker run --rm -v "${VOLUME_NAME}:/data" -v "${ABS_PATH}:/restore.db:ro" alpine \
    cp /restore.db /data/dev.db
  echo "Restored to volume. Start containers: docker compose up -d"
  exit 0
fi

# Option 3: Restore to local dev
mkdir -p ./backend/prisma
cp "$RESTORE_FILE" ./backend/prisma/dev.db
echo "Restored to backend/prisma/dev.db"
