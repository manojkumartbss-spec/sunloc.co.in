# Quick Reference - Docker Hub & Build Cloud Deployment

## TL;DR - Get Running in 5 Minutes

### 1. Push to Docker Hub (Manual)
```bash
# On your machine
docker login
docker build -t your-username/sunloc-server:latest .
docker push your-username/sunloc-server:latest

# Anyone can now run:
docker run -p 3000:3000 -v sunloc-db:/app/data your-username/sunloc-server:latest
```

### 2. Automated Builds with GitHub Actions
```bash
# Add secrets to GitHub repo:
# DOCKER_USERNAME = your Docker Hub username
# DOCKER_PASSWORD = your Personal Access Token

# Push to main branch and GitHub Actions will:
# ✅ Build multi-platform image (amd64, arm64, arm/v7)
# ✅ Cache layers for speed
# ✅ Push to Docker Hub automatically
# ✅ Update Docker Hub description
```

### 3. Automated Builds with Docker Build Cloud
```
1. Go to https://build.docker.com
2. Connect GitHub account
3. Select sunloc-server repository
4. Create build rule:
   - Branch: main → Tag: latest
   - Tag: v.* → Tag: {sourceref}
5. Save - builds start automatically on every push!
```

---

## Files Created

| File | Purpose |
|------|---------|
| `docker-bake.hcl` | Multi-platform build config |
| `.github/workflows/docker-build.yml` | GitHub Actions CI/CD |
| `DOCKER_README.md` | Docker Hub description |
| `DEPLOYMENT.md` | Comprehensive setup guide |
| `deploy.sh` | Linux/Mac deployment script |
| `deploy.ps1` | Windows PowerShell deployment script |

---

## Step-by-Step: First Deployment

### Prerequisites
- Docker Hub account: https://hub.docker.com
- Personal Access Token: https://hub.docker.com/settings/security
- GitHub account (for CI/CD, optional)

### Option A: Manual Push (Fastest)
```bash
docker login
docker build -t your-username/sunloc-server:latest .
docker push your-username/sunloc-server:latest
```

### Option B: Docker Bake (Multi-platform)
```bash
# Edit docker-bake.hcl:
# Change: variable "DOCKER_NAMESPACE" { default = "your-username" }

docker buildx bake --push
```

### Option C: Automated (GitHub Actions)
```bash
# 1. Add secrets to GitHub repo:
#    Settings → Secrets → DOCKER_USERNAME and DOCKER_PASSWORD
# 2. Commit and push changes
# 3. GitHub Actions automatically builds and pushes
# 4. Monitor at: repo → Actions → Build and Push to Docker Hub
```

### Option D: Automated (Docker Build Cloud)
```bash
# 1. Go to https://build.docker.com
# 2. Connect GitHub repo
# 3. Create build rule (branch: main → tag: latest)
# 4. Builds trigger automatically on every push
```

---

## Common Commands

### Build & Push
```bash
# Local build only
docker build -t your-username/sunloc-server:latest .

# Build + push to Docker Hub
docker push your-username/sunloc-server:latest

# Multi-platform build + push
docker buildx bake -f docker-bake.hcl --push

# Build specific version tag
docker build -t your-username/sunloc-server:v1.0.0 .
docker tag your-username/sunloc-server:v1.0.0 your-username/sunloc-server:latest
docker push your-username/sunloc-server:v1.0.0
docker push your-username/sunloc-server:latest
```

### Run from Docker Hub
```bash
# Latest version
docker run -d -p 3000:3000 -v sunloc-db:/app/data your-username/sunloc-server

# Specific version
docker run -d -p 3000:3000 -v sunloc-db:/app/data your-username/sunloc-server:v1.0.0

# With environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_PATH=/app/data/sunloc.db \
  -v sunloc-db:/app/data \
  your-username/sunloc-server:latest

# With docker-compose
docker-compose pull your-username/sunloc-server:latest
docker-compose up -d
```

### Verify Image
```bash
# Check image size
docker images your-username/sunloc-server

# Inspect image
docker inspect your-username/sunloc-server:latest

# Test run
docker run -it your-username/sunloc-server:latest /bin/sh
```

---

## Deployment Paths

### Solo Developer / Testing
```
Local build → Docker Hub → Pull & Run
docker build → docker push → docker run
```

### Team / Production CI/CD
```
Push to GitHub → GitHub Actions → Build & Test → Docker Hub → Deploy
                                 ↓
                          Docker Build Cloud → Push → Deploy
```

### Multi-Platform Support
- **amd64**: Intel/AMD servers, most cloud providers
- **arm64**: Apple Silicon, AWS Graviton, newer ARM servers
- **arm/v7**: Raspberry Pi, older ARM devices

Build once with `docker buildx bake --push` and all platforms are ready!

---

## Troubleshooting

**Q: "docker buildx" not found**
```bash
docker buildx create --use  # Create builder
```

**Q: "unauthorized" error when pushing**
```bash
docker logout
docker login  # Use Personal Access Token, not password
```

**Q: Build takes too long**
- Use GitHub Actions or Build Cloud (caching works better)
- Build for current platform only: `docker build` (not buildx)
- Skip the multiarch push: `docker build -t username/sunloc:latest .`

**Q: Image pulls very slowly**
- First pull is always slow (full download)
- Subsequent pulls use layer caching
- Use regional mirrors if available

**Q: Want to see build logs?**
```bash
# GitHub Actions: repo → Actions → Build and Push workflow → click run
# Build Cloud: https://build.docker.com → click repository → view builds
# Local build: docker buildx build --progress=plain
```

---

## Resources

- **Docker Hub**: https://hub.docker.com
- **Docker Build Cloud**: https://build.docker.com
- **Docker Docs**: https://docs.docker.com/build/
- **Buildx Manual**: https://docs.docker.com/build/architecture/overview/
- **Multi-arch builds**: https://docs.docker.com/build/building/multi-platform/

---

## Next: Deploy to Production

Once image is on Docker Hub, deploy to:

- **Docker Compose**: `docker-compose pull && docker-compose up -d`
- **Kubernetes**: Update deployment image, apply manifest
- **Docker Swarm**: `docker service update --image your-username/sunloc-server:latest`
- **AWS ECS**: Update task definition, restart service
- **Google Cloud Run**: Create service from image
- **Azure Container Instances**: Create container from image

See DEPLOYMENT.md for detailed instructions per platform.
