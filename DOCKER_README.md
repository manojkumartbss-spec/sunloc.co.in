# Sunloc Server

Integrated backend server for Sunloc Planning App + DPR App.

**Stack:** Node.js + Express + SQLite (better-sqlite3)

## Quick Start

```bash
docker run -d \
  --name sunloc-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -v sunloc-db:/app/data \
  your-docker-username/sunloc-server:latest
```

## Features

- **Planning App API**: Full state management, order tracking, machine assignment
- **DPR App API**: Daily production records, shift tracking, actuals sync
- **Tracking App**: Label generation, scanning, wastage tracking, dispatch records
- **SQLite Database**: Built-in persistence with WAL mode for concurrent access
- **Health Checks**: Automatic liveness and readiness probes
- **Multi-platform**: Runs on amd64, arm64, arm/v7

## Environment Variables

```
NODE_ENV=production    # Node environment (default: production)
PORT=3000              # Server port (default: 3000)
DB_PATH=/app/data/sunloc.db  # Database location (default shown)
```

## Volume Mounts

- `/app/data` - SQLite database persistence (create named volume or bind mount)

## Health Check

```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "ok": true,
  "server": "Sunloc Integrated Server v1.0",
  "db": "/app/data/sunloc.db",
  "planningSavedAt": null,
  "dprRecords": 0,
  "actualsEntries": 0,
  "uptime": "5s"
}
```

## API Endpoints

### Planning App
- `GET /api/planning/state` - Fetch full planning state with enriched actuals
- `POST /api/planning/state` - Save planning state
- `GET /api/orders/machine/:machineId` - Get active orders for a machine
- `GET /api/orders/active` - Get all active orders (summary)

### DPR App
- `GET /api/dpr/:floor/:date` - Get DPR record for floor + date
- `POST /api/dpr/save` - Save DPR record + extract actuals
- `GET /api/dpr/dates/:floor` - Get all DPR dates for floor
- `GET /api/actuals/machine/:machineId` - Get machine actuals (90-day limit)
- `GET /api/actuals/order/:orderId` - Get order actuals with totals

### Tracking App
- `GET /api/tracking/state` - Fetch full tracking state
- `POST /api/tracking/labels` - Save labels
- `POST /api/tracking/scan` - Record scan (IN/OUT per department)
- `POST /api/tracking/wastage` - Record salvage/remelt
- `POST /api/tracking/stage-close` - Close production stage
- `POST /api/tracking/dispatch-record` - Record dispatch
- `GET /api/tracking/wip-summary` - Get WIP summary per batch

## Docker Compose

```yaml
version: '3.9'

services:
  sunloc-server:
    image: your-docker-username/sunloc-server:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_PATH=/app/data/sunloc.db
    volumes:
      - sunloc-db:/app/data
    restart: unless-stopped

volumes:
  sunloc-db:
    driver: local
```

## Supported Platforms

- `linux/amd64` - Intel/AMD 64-bit (x86-64)
- `linux/arm64` - ARM 64-bit (Apple Silicon, Graviton, etc.)
- `linux/arm/v7` - 32-bit ARM (Raspberry Pi, older devices)

## Security

- Runs as non-root user (nodejs:1001)
- Uses tini for proper signal handling
- CA certificates bundled
- Health checks for container orchestration

## Logging

- JSON-file driver with 10MB rotation
- 3-file retention policy
- Labels: `service=sunloc-server,env=production`

## License

See repository for license details.
