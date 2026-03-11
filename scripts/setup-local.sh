#!/bin/bash
# ============================================
# HRM - Local Environment Setup (without Docker)
# Run from project root: ./scripts/setup-local.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================"
echo "  HRM - Local Environment Setup"
echo "============================================"

# --- 1. Check prerequisites ---
echo ""
echo "[1/6] Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install from https://nodejs.org/"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "ERROR: npm not found. Install Node.js from https://nodejs.org/"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "WARN: Node.js 18+ recommended. Current: $(node -v)"
fi

echo "  Node: $(node -v)"
echo "  npm:  $(npm -v)"

# --- 2. Install dependencies ---
echo ""
echo "[2/6] Installing dependencies..."
npm run install:all

# --- 3. Backend .env ---
echo ""
echo "[3/6] Configuring backend environment..."
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  cat > "$BACKEND_ENV" << 'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="hrm_dev_secret_change_in_production_32chars_min"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
EOF
  echo "  Created backend/.env"
else
  echo "  backend/.env already exists"
fi

# --- 4. Frontend .env ---
echo ""
echo "[4/6] Configuring frontend environment..."
FRONTEND_ENV="$PROJECT_ROOT/frontend/.env"
if [ ! -f "$FRONTEND_ENV" ]; then
  cat > "$FRONTEND_ENV" << 'EOF'
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_DEV_PORT=5173
EOF
  echo "  Created frontend/.env"
else
  echo "  frontend/.env already exists"
fi

# --- 5. Database setup ---
echo ""
echo "[5/6] Setting up database..."
cd "$PROJECT_ROOT"
npm run db:setup

# --- 6. Seed (optional) ---
echo ""
echo "[6/6] Seeding initial data..."
if npm run seed 2>/dev/null; then
  echo "  Seed complete. Default admin: admin@hrm.com / admin123"
else
  echo "  Seed skipped or failed (may already have data)"
fi

# --- Done ---
echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "Run the app:"
echo "  npm run dev"
echo ""
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Default admin (if seeded): admin@hrm.com / admin123"
echo ""
