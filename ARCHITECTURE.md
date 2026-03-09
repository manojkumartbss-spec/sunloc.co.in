# Sunloc Server - Deployment Architecture

## Deployment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         YOUR LOCAL MACHINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐                                                    │
│  │  Source Code     │                                                    │
│  │  (Git Repo)      │                                                    │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ├─ Option A: Push to GitHub                                   │
│           │            ↓                                                 │
│           │   ┌────────────────────────┐                                │
│           │   │ GitHub Repository      │                                │
│           │   └────────┬───────────────┘                                │
│           │            │                                                 │
│           │            ├─→ GitHub Actions Workflow (.github/workflows/) │
│           │            │   ├─ Trigger: push to main, tags v*           │
│           │            │   ├─ Build multi-platform (amd64/arm64/arm/v7)│
│           │            │   ├─ Push to Docker Hub                        │
│           │            │   └─ Update description (DOCKER_README.md)     │
│           │            │                                                 │
│           │            ├─→ Docker Build Cloud (https://build.docker.com)│
│           │            │   ├─ Automatic webhook trigger                 │
│           │            │   ├─ Parallel multi-platform build             │
│           │            │   ├─ Cache layers across builds                │
│           │            │   └─ Push to Docker Hub                        │
│           │            │                                                 │
│           ├─ Option B: Build Locally                                    │
│           │            ↓                                                 │
│           │   ┌──────────────────────────┐                              │
│           │   │ docker build (Dockerfile)│                              │
│           │   │ docker buildx bake       │                              │
│           │   │ (docker-bake.hcl)        │                              │
│           │   └──────────┬───────────────┘                              │
│           │              │                                               │
│           │              └─→ Docker Registry (Docker Hub)               │
│           │                  ├─ your-username/sunloc-server:latest     │
│           │                  ├─ your-username/sunloc-server:v1.0.0    │
│           │                  └─ your-username/sunloc-server:arm64       │
│           │                                                              │
└───────────┼──────────────────────────────────────────────────────────────┘
            │
            │
            ▼
    ┌───────────────────────┐
    │   DOCKER HUB / REGISTRY   │
    ├───────────────────────┤
    │ your-username/        │
    │ sunloc-server         │
    │                       │
    │ Tags:                 │
    │ • latest              │
    │ • v1.0.0              │
    │ • main-abc123...      │
    │ • linux/amd64         │
    │ • linux/arm64         │
    │ • linux/arm/v7        │
    └───────────────────────┘
            │
            │ docker pull / compose pull
            │
    ┌───────┴────────────────────────────┬─────────────────────────────┐
    │                                    │                             │
    ▼                                    ▼                             ▼
┌──────────────┐              ┌─────────────────┐        ┌──────────────────┐
│   LOCAL DEV  │              │   STAGING ENV   │        │ PRODUCTION       │
│              │              │                 │        │                  │
│ docker run   │              │ docker-compose  │        │ Kubernetes       │
│              │              │ (test server)   │        │ Docker Swarm     │
│ Single       │              │                 │        │ AWS ECS          │
│ container    │              │ 3+ replicas     │        │ Google Cloud Run │
│              │              │                 │        │ Azure ACI        │
└──────────────┘              └─────────────────┘        └──────────────────┘
```

---

## Build Process Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                      DOCKER BUILD PROCESS                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. DEPENDENCIES STAGE (docker-bake.hcl or Dockerfile)            │
│     ├─ Base: node:18-alpine                                       │
│     ├─ Install: python3, make, g++, bash (build tools)            │
│     ├─ Copy: package.json, package-lock.json                      │
│     └─ Run: npm ci / npm install (cached layer)                   │
│         │                                                          │
│         └─ Output: /build/node_modules (107 packages)             │
│                                                                    │
│  2. RUNTIME STAGE (lightweight final image)                        │
│     ├─ Base: node:18-alpine (clean layer)                         │
│     ├─ Install: ca-certificates, tini, create nodejs user         │
│     ├─ Copy: node_modules from deps stage (cache hit!)            │
│     ├─ Copy: app code (server.js, public/)                        │
│     ├─ Create: /app/data directory (for SQLite)                   │
│     ├─ Set: NODE_ENV=production, PORT=3000, DB_PATH               │
│     ├─ User: switch to non-root (nodejs:1001)                     │
│     ├─ Expose: 3000/tcp                                           │
│     ├─ Entrypoint: tini (signal handler)                          │
│     ├─ Cmd: node server.js                                        │
│     └─ Healthcheck: GET /api/health (30s interval)                │
│                                                                    │
│  3. OUTPUT                                                         │
│     ├─ Image name: docker.io/your-username/sunloc-server         │
│     ├─ Size: ~200-300MB (with node_modules)                       │
│     └─ Multi-platform: amd64, arm64, arm/v7 (if using buildx)    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Methods

### Method 1: Manual Docker Commands
```
Local git repo
    ↓
docker build -t your-username/sunloc-server:latest .
    ↓
docker push your-username/sunloc-server:latest
    ↓
docker run / docker-compose up
```
**Best for:** One-off deployments, testing
**Time:** 5-10 minutes setup
**Platforms:** Current platform only

---

### Method 2: GitHub Actions (Recommended)
```
Push to GitHub (main branch or v* tag)
    ↓
GitHub Actions workflow triggered (.github/workflows/docker-build.yml)
    ↓
Build multi-platform image (parallel for amd64/arm64/arm/v7)
    ↓
Push to Docker Hub
    ↓
Update Docker Hub description
    ↓
Deployment webhook (optional) → Deploy to production
```
**Best for:** Continuous deployment, teams
**Time:** 15-20 minutes setup + CI on every commit
**Platforms:** All 3 architectures auto-built

---

### Method 3: Docker Build Cloud (Advanced)
```
Push to GitHub (any branch or tag)
    ↓
Webhook → Docker Build Cloud (build.docker.com)
    ↓
Parse build rules (branch main → tag latest, tag v* → tag {ref})
    ↓
Build multi-platform image (parallel on cloud infrastructure)
    ↓
Cache layers in Docker's registry (persistent between builds)
    ↓
Push to Docker Hub
    ↓
Status webhook back to GitHub (build status badge)
```
**Best for:** Production builds, multi-platform support
**Time:** 20 minutes UI setup + automatic on push
**Platforms:** All 3 architectures, faster caching

---

## Files & Their Purpose

```
Project Root
│
├── Dockerfile                          # Multi-stage build definition
├── docker-compose.yml                  # Production config (resource limits)
├── docker-compose.dev.yml              # Dev config (hot reload)
├── docker-bake.hcl                     # Buildx multi-platform config
│
├── .github/
│   └── workflows/
│       └── docker-build.yml            # GitHub Actions CI/CD pipeline
│
├── .dockerignore                       # Files to exclude from build context
│
├── DEPLOYMENT.md                       # Full deployment guide (6000+ words)
├── QUICKSTART.md                       # Quick reference (TL;DR)
│
├── deploy.sh                           # Bash script (Linux/Mac)
├── deploy.ps1                          # PowerShell script (Windows)
│
├── DOCKER_README.md                    # Docker Hub description
│
└── server.js                           # Application code
```

---

## Layer Caching Strategy

```
Layer 1 (Base): node:18-alpine
    ↓ (pulled once, reused for all builds)
    
Layer 2 (Build tools): apk add python3 make g++
    ↓ (cached, rebuilt only if Dockerfile changes)
    
Layer 3 (Dependencies): npm ci --omit=dev
    ↓ (CACHED with --mount=type=cache)
    │ (only downloaded once, persisted across builds!)
    │ (rebuilds only if package*.json changes)
    │
Layer 4 (Runtime libs): ca-certificates, tini
    ↓ (cached)
    
Layer 5 (App code): COPY server.js, public/
    ↓ (rebuilt on every source change)
    
Layer 6 (Final): CMD node server.js
    ↓ (metadata only, no rebuild)

RESULT: Second build is 5-10x faster!
```

---

## Security Features

```
✅ Non-root user (nodejs:1001)
   └─ Prevents privilege escalation attacks

✅ Tini init system
   └─ Proper PID 1 signal handling
   └─ Prevents zombie processes

✅ CA certificates bundled
   └─ Supports HTTPS connections

✅ Read-only layers (except /app/data)
   └─ Immutable deployment

✅ Health checks
   └─ Orchestrators can detect failures
   └─ Auto-restart on failure

✅ Resource limits (docker-compose.yml)
   └─ CPU: max 1.0, reserved 0.5
   └─ Memory: max 512MB, reserved 256MB
   └─ Prevents runaway processes
```

---

## Next Steps

1. **First deployment:**
   ```bash
   docker login  # Add Docker Hub credentials
   docker build -t your-username/sunloc-server:latest .
   docker push your-username/sunloc-server:latest
   ```

2. **Verify on Docker Hub:**
   - Visit: https://hub.docker.com/r/your-username/sunloc-server
   - Check image details, supported architectures

3. **Set up CI/CD (Choose one):**
   - **GitHub Actions:** Add secrets (DOCKER_USERNAME, DOCKER_PASSWORD) → Workflow auto-triggers
   - **Docker Build Cloud:** Go to build.docker.com → Connect GitHub → Create build rules

4. **Deploy to production:**
   - **Compose:** `docker-compose pull && docker-compose up -d`
   - **Kubernetes:** Update image, deploy manifest
   - **Cloud:** AWS ECS, Google Cloud Run, Azure ACI, etc.

See DEPLOYMENT.md for step-by-step instructions.
