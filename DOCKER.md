# HRM Application - Docker Deployment

Enterprise-grade Docker setup with data persistence and backup support.

## Quick Start

```bash
# 1. Copy env template
cp env.docker.example .env

# 2. Set a strong JWT_SECRET in .env for production

# 3. Build and run
docker compose up -d --build

# 4. Access the app
# Frontend: http://localhost (or http://localhost:80)
# Backend API: http://localhost:5000
```

## Architecture

| Service   | Port | Description                    |
|-----------|------|--------------------------------|
| frontend  | 80   | React SPA served by nginx      |
| backend   | 5000 | Express API + Prisma/SQLite    |

- **Data**: SQLite database stored in Docker volume `hrm_data`
- **API proxy**: Nginx proxies `/api`, `/health`, `/status` to backend

## Data Backup & Restore

### Backup

**Linux/macOS:**
```bash
# From project root - backs up to ./backups/
./scripts/backup.sh

# Custom backup directory
BACKUP_DIR=/mnt/backups ./scripts/backup.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\backup.ps1
```

Backups are compressed (`.db.gz`). Schedule with cron (Linux) or Task Scheduler (Windows).

### Restore

**Linux/macOS:**
```bash
./scripts/restore.sh ./backups/hrm_20250112_143022.db.gz
```

**Windows:**
```powershell
.\scripts\restore.ps1 .\backups\hrm_20250112_143022.db.gz
```

Restart backend after restore: `docker restart hrm-backend`

## Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d --build` | Build and run in background |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f` | Follow logs |
| `docker compose ps` | List running services |

## Production Checklist

1. **Secrets**: Set `JWT_SECRET` to a strong random value (32+ chars)
2. **Backup**: Schedule daily backups; test restore periodically
3. **HTTPS**: Put behind a reverse proxy (nginx, Traefik, Caddy) for TLS
4. **Monitoring**: Use `docker compose logs` or integrate with your logging stack
5. **Updates**: Rebuild images after code changes: `docker compose up -d --build`

## Volume & Data

- **Volume**: `hrm_data` stores `/app/data/dev.db` (SQLite)
- **Persists** across container restarts
- **Backup** before `docker compose down -v` (removes volumes)

## Troubleshooting

**Backend unhealthy / won't start**
- Check logs: `docker compose logs backend`
- Ensure port 5000 is free
- Verify `DATABASE_URL=file:/app/data/dev.db` (volume mount)

**Frontend 502**
- Backend must be healthy first (depends_on)
- Check nginx logs: `docker compose logs frontend`

**Backup fails**
- Ensure backend has run at least once (creates dev.db)
- Or run with volume: `docker compose up -d` then backup
