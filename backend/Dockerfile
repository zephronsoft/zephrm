# ============================================
# HRM Backend - Enterprise Dockerfile
# Multi-stage build - Debian slim for Prisma/OpenSSL compatibility
# ============================================

# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package*.json ./
RUN npm ci

# Copy source and Prisma schema
COPY . .
COPY prisma ./prisma/

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies for smaller production image
RUN npm prune --omit=dev

# ---- Production stage ----
FROM node:20-slim AS production

# Install wget for health check + OpenSSL/libs for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Security: run as non-root user
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -m appuser

WORKDIR /app

# Create data directory for SQLite (persistent volume mount)
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Generate Prisma client for production runtime
RUN npx prisma generate

USER appuser

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q --spider http://localhost:5000/health || exit 1

EXPOSE 5000

# Default: run migrations and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null || true && node dist/index.js"]
