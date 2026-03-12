# ============================================
# HRM Frontend - Enterprise Dockerfile
# Multi-stage: build with Node, serve with nginx
# ============================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build args for API URL at build time
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .

# Build production bundle
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Install runtime tools
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root user (nginx alpine runs as nginx by default)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:80/healthz >/dev/null || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
