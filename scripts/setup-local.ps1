# ============================================
# HRM - Local Environment Setup (without Docker)
# Run from project root: .\scripts\setup-local.ps1
# ============================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

Write-Host "============================================"
Write-Host "  HRM - Local Environment Setup"
Write-Host "============================================"

# --- 1. Check prerequisites ---
Write-Host ""
Write-Host "[1/6] Checking prerequisites..."

try {
    $nodeVer = node -v
    $npmVer = npm -v
} catch {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org/"
    exit 1
}

Write-Host "  Node: $nodeVer"
Write-Host "  npm:  $npmVer"

# --- 2. Install dependencies ---
Write-Host ""
Write-Host "[2/6] Installing dependencies..."
npm run install:all

# --- 3. Backend .env ---
Write-Host ""
Write-Host "[3/6] Configuring backend environment..."
$BackendEnv = Join-Path $ProjectRoot "backend\.env"
if (-not (Test-Path $BackendEnv)) {
    @"
DATABASE_URL="file:./dev.db"
JWT_SECRET="hrm_dev_secret_change_in_production_32chars_min"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
"@ | Set-Content $BackendEnv -Encoding UTF8
    Write-Host "  Created backend\.env"
} else {
    Write-Host "  backend\.env already exists"
}

# --- 4. Frontend .env ---
Write-Host ""
Write-Host "[4/6] Configuring frontend environment..."
$FrontendEnv = Join-Path $ProjectRoot "frontend\.env"
if (-not (Test-Path $FrontendEnv)) {
    @"
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_DEV_PORT=5173
"@ | Set-Content $FrontendEnv -Encoding UTF8
    Write-Host "  Created frontend\.env"
} else {
    Write-Host "  frontend\.env already exists"
}

# --- 5. Database setup ---
Write-Host ""
Write-Host "[5/6] Setting up database..."
npm run db:setup

# --- 6. Seed ---
Write-Host ""
Write-Host "[6/6] Seeding initial data..."
try {
    npm run seed 2>$null
    Write-Host "  Seed complete. Default admin: admin@hrm.com / admin123"
} catch {
    Write-Host "  Seed skipped or failed (may already have data)"
}

# --- Done ---
Write-Host ""
Write-Host "============================================"
Write-Host "  Setup complete!"
Write-Host "============================================"
Write-Host ""
Write-Host "Run the app:"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "  Backend:  http://localhost:5000"
Write-Host "  Frontend: http://localhost:5173"
Write-Host ""
Write-Host "Default admin (if seeded): admin@hrm.com / admin123"
Write-Host ""
