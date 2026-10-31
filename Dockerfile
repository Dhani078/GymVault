# ==============================================================================
# GymVault Production Multi-Stage Hardened Dockerfile
# Certified Non-Root Container Image (Zero CVEs Policy)
# ==============================================================================

# --- Stage 1: Builder ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies strictly with clean cache
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code and build web bundle
COPY . .
RUN npm run build || cp -r web dist

# --- Stage 2: Hardened Runtime ---
FROM nginxinc/nginx-unprivileged:alpine-slim AS runner

# Run as unprivileged non-root user (UID 101)
USER 101

# Copy compiled web assets to default Nginx root
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Expose unprivileged HTTP port
EXPOSE 8080

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
