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
| mailpit   | 1025 / 8025 | Internal SMTP + web inbox |
| smtp (optional) | 2525 / 2587 | Internal Postfix SMTP relay for external delivery |

- **Data**: SQLite database stored in Docker volume `hrm_data`
- **API proxy**: Nginx proxies `/api`, `/health`, `/status` to backend
- **Email**: Mailpit is bundled for local/internal SMTP testing at `http://localhost:8025`

## SMTP

By default, Docker starts an internal SMTP server using Mailpit:

- SMTP host: `mailpit`
- SMTP port: `1025`
- Web inbox: `http://localhost:8025`

The backend automatically uses this internal SMTP server unless you provide external SMTP settings in `.env`.

### Use internal SMTP

Keep these variables empty or unset in `.env`:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Override with external SMTP

Set these values in `.env` and they will override the internal Mailpit container:

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM_NAME=HRM Pro
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
APP_BASE_URL=https://hrm.yourdomain.com
```

### Gmail SMTP

Use an App Password (recommended) and set:

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youraccount@gmail.com
SMTP_PASS=your-16-char-app-password
MAIL_FROM_NAME=HRM Pro
MAIL_FROM_ADDRESS=youraccount@gmail.com
```

Notes:
- Enable 2-Step Verification on the Gmail account.
- Generate an App Password and use it as `SMTP_PASS`.

### Outlook / Microsoft 365 SMTP

Set:

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youraccount@outlook.com
SMTP_PASS=your-password-or-app-password
MAIL_FROM_NAME=HRM Pro
MAIL_FROM_ADDRESS=youraccount@outlook.com
```

Notes:
- For MFA-enabled accounts, use an app password if required by your tenant policy.

### What uses SMTP

- New joiner account creation sends login credentials to the employee email address.
- If SMTP delivery fails, employee creation still succeeds and the backend returns the default password to the UI.

## Internal SMTP relay for external mails

If you want to use an **internal SMTP host** but still deliver to external recipients (Gmail/Outlook/any domain), use the `smtp` container profile.

### 1) Configure relay credentials in `.env`

```env
SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_USERNAME=youraccount@gmail.com
SMTP_RELAY_PASSWORD=your-16-char-app-password
```

For Outlook/M365 use:

```env
SMTP_RELAY_HOST=smtp.office365.com
SMTP_RELAY_PORT=587
SMTP_RELAY_USERNAME=youraccount@outlook.com
SMTP_RELAY_PASSWORD=your-password-or-app-password
```

### 2) Point backend SMTP to internal relay

```env
SMTP_ENABLED=true
SMTP_HOST=smtp
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

### 3) Start Docker with relay profile

```bash
docker compose --profile relay up -d --build
```

Now backend sends to `smtp` (internal), and `smtp` forwards outbound email through your configured provider.

### Notes

- `mailpit` is for inbox testing only and does not deliver real external email.
- `smtp` profile service is for external delivery.
- You can keep both running; backend decides which one to use via `SMTP_HOST`.

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

**Mail not sending**
- Check backend logs: `docker compose logs backend`
- Check Mailpit inbox UI: `http://localhost:8025`
- Verify external SMTP env vars if overriding internal SMTP

**Backup fails**
- Ensure backend has run at least once (creates dev.db)
- Or run with volume: `docker compose up -d` then backup
