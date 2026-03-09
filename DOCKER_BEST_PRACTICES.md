# Sunloc Server – Docker Best Practices Guide

## Overview

Your project is containerized following Docker best practices:

- **Multi-stage build**: Reduces image size by separating build dependencies from runtime
- **Non-root user**: Runs as `nodejs` (UID 1001) for security
- **Alpine Linux**: Minimal base image (~5MB) for small footprint
- **Health checks**: Automatic container health monitoring
- **Resource limits**: Prevents runaway memory/CPU consumption
- **Structured logging**: JSON format for log aggregation
- **SQLite WAL mode**: Optimized for concurrent read/write
- **Signal handling**: Uses `tini` for proper PID 1 signal handling

## Files Structure

```
sunloc-server/
├── Dockerfile                    # Production multi-stage build
├── docker-compose.yml            # Production compose (default)
├── docker-compose.dev.yml        # Development with hot reload
├── docker-compose.prod.yml       # Explicit production config
├── docker-compose.override.yml   # Environment-specific overrides
├── .dockerignore                 # Optimize build context
├── .env.example                  # Environment variables template
├── Makefile                      # Docker commands shortcuts
├── server.js                     # Express + SQLite app
├── package.json                  # Node.js dependencies
└── public/                       # Static frontend files
```

## Quick Start

### Development (with hot reload)

```bash
# Option 1: Using Makefile
make dev

# Option 2: Direct docker compose
docker compose -f docker-compose.dev.yml up --watch

# Access at http://localhost:3000
```

The `--watch` flag syncs code changes automatically. Files like `server.js` reload instantly without rebuilding.

### Production

```bash
# Option 1: Using Makefile
make prod

# Option 2: Direct docker compose
docker compose up -d

# View logs
docker compose logs -f
```

### Manual Build

```bash
# Build the image
docker build -t sunloc:latest .

# Run container
docker run -d \
  --name sunloc-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_PATH=/app/data/sunloc.db \
  -v sunloc-db-data:/app/data \
  --restart unless-stopped \
  sunloc:latest
```

## Docker Compose Files Explained

### `docker-compose.yml` (Production Default)
- No `version` field (latest Compose spec)
- Resource limits: 1 CPU, 512MB memory
- JSON-file logging with rotation
- Volume mount for persistent SQLite database
- Health checks enabled
- Restart policy: `unless-stopped`

### `docker-compose.dev.yml` (Development)
- `develop.watch` for automatic file sync
- Bind mounts for instant code reload
- NODE_ENV=development
- Same health checks as production
- Useful for iterative development

### `docker-compose.prod.yml` (Explicit Production)
- `read_only_root_filesystem` for security
- `tmpfs` for temporary files
- `user: nodejs:nodejs` explicit non-root
- Cache hints for faster rebuilds
- `pull_policy: never` (use pre-built images)

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit as needed:

```
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/sunloc.db
```

Load automatically:

```bash
# With docker compose (auto-loads .env)
docker compose up

# With docker run (manually pass)
docker run --env-file .env -d sunloc:latest
```

## Database Management

### Backup SQLite Database

```bash
make db-backup
# Creates: sunloc-backup-20260309-123045.tar.gz
```

Or manually:

```bash
docker run --rm \
  -v sunloc-server_sunloc-db-data:/app/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup.tar.gz -C /app/data .
```

### Restore Backup

```bash
make db-restore BACKUP_FILE=sunloc-backup-20260309-123045.tar.gz
```

### Access SQLite Shell Inside Container

```bash
docker exec -it sunloc-server sqlite3 /app/data/sunloc.db
```

### Verify Database Health

```bash
docker exec -it sunloc-server sqlite3 /app/data/sunloc.db "PRAGMA integrity_check;"
```

## Debugging

### View Logs

```bash
# Live logs
docker compose logs -f

# Last 50 lines
docker compose logs --tail=50

# Dev logs
docker compose -f docker-compose.dev.yml logs -f
```

### Access Container Shell

```bash
make shell          # sunloc-server
make shell-dev      # sunloc-server-dev
```

### Check Container Status

```bash
make status
# or
docker compose ps
```

### Test Health Check

```bash
make test-health
# or
curl http://localhost:3000/api/health | jq
```

### Inspect Running Container

```bash
docker inspect sunloc-server
docker stats sunloc-server  # CPU, memory, network
```

## Production Deployment

### Deploy with docker compose

```bash
# Pull latest image (if using registry)
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml up -d

# Verify health
docker compose -f docker-compose.prod.yml ps
```

### Deploy to Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml sunloc
```

### Deploy to Kubernetes

Convert to Kubernetes manifests:

```bash
# Using Kompose (install from kompose.io)
kompose convert -f docker-compose.prod.yml -o k8s/
kubectl apply -f k8s/
```

## Optimization Best Practices

### 1. **Image Size**
- Alpine Linux base: 5MB
- Unused dependencies excluded via `.dockerignore`
- Multi-stage build separates dev and runtime

```bash
# Check image size
docker images sunloc:latest
```

### 2. **Build Cache**
- Layer order: dependencies → code
- `package*.json` copied separately (cached if unchanged)
- Native module build cached via `--mount=type=cache`

### 3. **Security**
- Non-root user (nodejs:1001)
- Read-only filesystem (prod)
- No secrets in Dockerfile
- tini for signal handling
- Resource limits prevent DoS

### 4. **Reliability**
- Health checks every 30s
- Automatic restart on failure
- Structured JSON logging
- WAL mode for concurrent access

### 5. **Performance**
- SQLite in WAL mode for better concurrency
- Resource reservations for predictable performance
- Log rotation to prevent disk fill

## Troubleshooting

### Container exits immediately

```bash
docker compose logs sunloc-server
# Check for errors in Node.js startup
```

### Port already in use

```bash
# Change port in docker-compose.yml
# From: "3000:3000"
# To: "3001:3000"
```

### Database locked errors

```bash
# WAL mode should prevent this. If persists:
docker exec -it sunloc-server sqlite3 /app/data/sunloc.db "PRAGMA wal_checkpoint(RESTART);"
```

### High memory usage

Check resource limits in compose file and increase if needed:

```yaml
deploy:
  resources:
    limits:
      memory: 1024M  # Increase from 512M
```

### Slow performance

Monitor stats:

```bash
docker stats sunloc-server
```

If CPU/memory high, check queries in `server.js` or increase limits.

## Advanced Usage

### Mount custom directories

```yaml
# docker-compose.override.yml
services:
  sunloc-server:
    volumes:
      - sunloc-db-data:/app/data
      - ./custom-data:/app/custom:ro  # Read-only
      - ./backups:/app/backups  # Read-write
```

### Use external database volume

```bash
# Create named volume with driver options
docker volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,vers=4,soft,timeo=180 \
  --opt device=:/export/sunloc \
  sunloc-nfs-data
```

### Build with custom BuildKit options

```bash
# Enable inline cache for faster rebuilds
docker buildx build \
  --cache-to type=inline \
  --cache-from type=registry,ref=registry.example.com/sunloc:latest \
  -t sunloc:latest .
```

### Push to Docker Hub or Registry

```bash
# Tag image
docker tag sunloc:latest username/sunloc:1.0

# Login (one time)
docker login

# Push
docker push username/sunloc:1.0

# Pull from registry
docker pull username/sunloc:1.0
```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `make build` | Build Docker image |
| `make dev` | Development with hot reload |
| `make prod` | Production environment |
| `make up` | Start services |
| `make down` | Stop services |
| `make logs` | View logs |
| `make shell` | Access container shell |
| `make db-backup` | Backup database |
| `make status` | Show container status |

## Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/reference/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)

---

**Last Updated**: 2026-03-09
**Project**: Sunloc Server v1.0
