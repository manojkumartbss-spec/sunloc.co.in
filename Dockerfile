# Multi-stage build for Node.js + better-sqlite3 with security & caching optimizations
# Stage 1: Dependency builder
FROM node:18-alpine AS deps

WORKDIR /build

# Install build tools required for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ bash

# Copy package files (lock file for reproducibility)
COPY package*.json ./

# Install dependencies with npm cache mount for faster rebuilds
# Use npm ci if lock file exists, fallback to npm install for package.json-only projects
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi && \
    npm cache clean --force

# Stage 2: Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies only (ca-certificates for HTTPS, tini for signal handling)
RUN apk add --no-cache ca-certificates tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules from builder stage (this layer is cached effectively)
COPY --from=deps --chown=nodejs:nodejs /build/node_modules ./node_modules

# Copy package.json for reference and version tracking
COPY --chown=nodejs:nodejs package*.json ./

# Copy application code
COPY --chown=nodejs:nodejs server.js sunloc-api-client.js ./
COPY --chown=nodejs:nodejs public ./public

# Create data directory for SQLite database (persist in volume)
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/sunloc.db

# Switch to non-root user for security
USER nodejs

# Expose port
EXPOSE 3000

# Use tini to handle signals properly (PID 1 issue)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

# Health check: verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
