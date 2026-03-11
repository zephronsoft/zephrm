# HRM Application — Enterprise Setup Guide

Step-by-step environment setup for deploying the HRM (Human Resource Management) application in an enterprise organization.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Development Environment](#3-development-environment)
4. [Production Environment](#4-production-environment)
5. [Docker Deployment](#5-docker-deployment)
6. [Database & Seeding](#6-database--seeding)
7. [Security & Secrets](#7-security--secrets)
8. [Backup & Recovery](#8-backup--recovery)
9. [Monitoring & Health](#9-monitoring--health)
10. [Enterprise Checklist](#10-enterprise-checklist)

---

## 1. Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x LTS | 20.x LTS |
| npm | 9.x | 10.x |
| RAM | 2 GB | 4 GB+ |
| Disk | 500 MB | 2 GB+ |

### Required Software

- **Node.js** — [nodejs.org](https://nodejs.org/) (LTS)
- **npm** — Bundled with Node.js
- **Git** — For repository clone
- **Docker & Docker Compose** — For containerized deployment (optional)

### Verify Installation

```bash
node -v    # v18.x or v20.x
npm -v     # 9.x or 10.x
git -v
docker -v  # If using Docker
```

---

## 2. Repository Setup

### Step 2.1 — Clone Repository

```bash
git clone <repository-url> hrm-app
cd hrm-app
```

### Step 2.2 — Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both backend and frontend.

---

## 3. Development Environment

### Step 3.1 — Backend Configuration

Create `backend/.env`:

```bash
cd backend
cp .env.example .env   # If .env.example exists, otherwise create manually
```

**Required variables for `backend/.env`:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | `your_secure_random_secret_here` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | Backend port | `5000` |
| `NODE_ENV` | Environment | `development` |

**Example `backend/.env`:**

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secure_random_secret_min_32_chars"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
```

### Step 3.2 — Frontend Configuration

Create `frontend/.env` (optional for dev):

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_PROXY_TARGET` | Backend URL for Vite proxy | `http://localhost:5000` |
| `VITE_DEV_PORT` | Frontend dev server port | `5173` |
| `VITE_API_BASE_URL` | API base (use `/api` for proxy) | `/api` |

### Step 3.3 — Database Setup

```bash
npm run db:setup
```

This runs `prisma db push` and `prisma generate` to create the schema and Prisma client.

### Step 3.4 — Seed Initial Data (Optional)

```bash
npm run seed
```

Creates:

- **Admin user**: `admin@hrm.com` / `admin123` (role: SUPER_ADMIN)
- Sample departments, positions, employees, leave types

**Important:** Change the admin password immediately after first login.

### Step 3.5 — Run Development Server

**Option A — Combined (single command):**

```bash
npm run dev
```

- Backend: http://localhost:5000  
- Frontend: http://localhost:5173  

**Option B — Separate (microservices):**

Terminal 1:
```bash
npm run dev:backend
```

Terminal 2:
```bash
npm run dev:frontend
```

---

## 4. Production Environment

### Step 4.1 — Build

```bash
npm run build:all
```

### Step 4.2 — Production Configuration

**Backend** — Set in `backend/.env` or environment:

```env
NODE_ENV=production
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="<strong-random-secret-32-chars-minimum>"
JWT_EXPIRES_IN="7d"
PORT=5000
```

**Frontend** — Set before build:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Then rebuild: `npm run build:frontend`

### Step 4.3 — Run Production

Terminal 1 (Backend):
```bash
npm run start:backend
```

Terminal 2 (Frontend):
```bash
npm run start:frontend
```

Or serve the `frontend/dist` folder with nginx/Apache.

---

## 5. Docker Deployment

### Step 5.1 — Prepare Environment

```bash
cp env.docker.example .env
```

Edit `.env` and set:

```env
JWT_SECRET=<strong-random-secret-for-production>
BACKEND_PORT=5000
FRONTEND_PORT=80
```

### Step 5.2 — Build and Run

```bash
docker compose up -d --build
```

### Step 5.3 — Access

- **Frontend:** http://localhost (or http://localhost:80)
- **Backend API:** http://localhost:5000

### Step 5.4 — Seed Data (Docker)

```bash
docker exec -it hrm-backend npx prisma db push
docker exec -it hrm-backend npm run seed
```

See [DOCKER.md](./DOCKER.md) for full Docker documentation.

---

## 6. Database & Seeding

### Schema

- **Provider:** SQLite (file-based)
- **Location:** `backend/prisma/dev.db` (dev) or `/app/data/dev.db` (Docker)
- **ORM:** Prisma

### Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Create schema + generate Prisma client |
| `npm run seed` | Seed admin, departments, positions, sample data |

### Default Admin (after seed)

| Field | Value |
|-------|-------|
| Email | `admin@hrm.com` |
| Password | `admin123` |
| Role | SUPER_ADMIN |

**Change this password immediately in production.**

### User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full access, organization owner |
| ADMIN | Administrative access |
| HR_MANAGER | HR operations |
| MANAGER | Team management |
| EMPLOYEE | Basic access |

---

## 7. Security & Secrets

### JWT Secret

- **Length:** Minimum 32 characters
- **Generation (Linux/macOS):** `openssl rand -base64 32`
- **Generation (PowerShell):** `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`

### Environment Files

- Never commit `.env` files
- Use `.env.example` as a template only
- Store production secrets in a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager)

### CORS (when frontend/backend on different hosts)

Set in backend environment:

```env
CORS_ORIGIN=https://hrm.yourdomain.com,https://app.yourdomain.com
```

---

## 8. Backup & Recovery

### Backup

**Linux/macOS:**
```bash
./scripts/backup.sh
```

**Windows:**
```powershell
.\scripts\backup.ps1
```

Backups are saved to `./backups/` as `hrm_YYYYMMDD_HHMMSS.db.gz`.

### Restore

```bash
./scripts/restore.sh ./backups/hrm_20250112_143022.db.gz
```

**Windows:**
```powershell
.\scripts\restore.ps1 .\backups\hrm_20250112_143022.db.gz
```

### Scheduled Backups

**Linux (cron):**
```cron
0 2 * * * /path/to/hrm-app/scripts/backup.sh
```

**Windows Task Scheduler:** Create a task to run `scripts\backup.ps1` daily.

---

## 9. Monitoring & Health

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /status` | API status (JSON) |
| `GET /status/page` | API status (HTML) |

### Docker Health Checks

Backend and frontend containers include health checks. View status:

```bash
docker compose ps
```

---

## 10. Enterprise Checklist

### Pre-Deployment

- [ ] Node.js 18+ or 20+ installed
- [ ] Dependencies installed (`npm run install:all`)
- [ ] `backend/.env` created with valid `JWT_SECRET`
- [ ] Database schema applied (`npm run db:setup`)
- [ ] Seed run if needed (`npm run seed`)
- [ ] Default admin password changed

### Production

- [ ] `JWT_SECRET` is strong and unique (32+ chars)
- [ ] `NODE_ENV=production` set
- [ ] HTTPS configured (reverse proxy)
- [ ] Backup schedule configured
- [ ] Restore procedure tested
- [ ] CORS configured for production domains

### Docker

- [ ] `.env` created from `env.docker.example`
- [ ] `JWT_SECRET` set in `.env`
- [ ] Volumes persist data (`hrm_data`)
- [ ] Backup before `docker compose down -v`

### Post-Deployment

- [ ] Health endpoints responding
- [ ] Login works with admin credentials
- [ ] API accessible from frontend
- [ ] Backup script runs successfully

---

## One-Command Setup Scripts

### Local (without Docker)

**Linux/macOS:**
```bash
./scripts/setup-local.sh
# or: npm run setup:local
```

**Windows (PowerShell):**
```powershell
.\scripts\setup-local.ps1
```

Installs deps, creates `.env`, sets up DB, seeds data. Then run `npm run dev`.

### Docker

**Linux/macOS:**
```bash
./scripts/setup-docker.sh
# or: npm run setup:docker
```

**Windows (PowerShell):**
```powershell
.\scripts\setup-docker.ps1
```

Builds images, starts containers, seeds data. App at http://localhost.

---

## Quick Reference

| Task | Command |
|------|---------|
| Full setup (local) | `npm run setup` or `./scripts/setup-local.sh` |
| Dev (combined) | `npm run dev` |
| Dev (separate) | `npm run dev:backend` + `npm run dev:frontend` |
| Build | `npm run build:all` |
| Seed | `npm run seed` |
| Docker up | `docker compose up -d --build` |
| Docker down | `docker compose down` |
| Backup | `./scripts/backup.sh` or `.\scripts\backup.ps1` |

---

## Related Documentation

- [RUN.md](./RUN.md) — Running the application
- [DOCKER.md](./DOCKER.md) — Docker deployment
- [APIREADME.md](./APIREADME.md) — API reference
- [postman.md](./postman.md) — Postman usage
