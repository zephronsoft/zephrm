# ============================================
# HRM Backend - Enterprise Dockerfile
# Multi-stage build for minimal production image
# ============================================

# ---- Build stage ----
FROM node:20-alpine AS builder

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
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

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
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

EXPOSE 5000

# Default: run migrations and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null || true && node dist/index.js"]
