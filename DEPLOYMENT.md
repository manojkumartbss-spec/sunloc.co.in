# Sunloc Server - Docker Hub & Build Cloud Deployment Guide

## Prerequisites

1. **Docker Hub Account**: Sign up at https://hub.docker.com
2. **Docker CLI**: Version 20.10+ with buildx support
3. **GitHub Account** (for automated builds)

---

## Step 1: Set Up Local Docker Hub Push

### 1a. Create Docker Hub Repository

1. Go to https://hub.docker.com/repositories
2. Click **Create Repository**
3. Name: `sunloc-server`
4. Visibility: `Public` (or Private)
5. Click **Create**

### 1b. Authenticate Locally

```bash
docker login
# Enter Docker Hub username and Personal Access Token (not password)
```

**Get Personal Access Token:**
1. Go to https://hub.docker.com/settings/security
2. Click **New Access Token**
3. Name: `sunloc-deploy`
4. Permissions: `Read & Write`
5. Generate and save the token

---

## Step 2: Push to Docker Hub Manually

### Option A: Using Docker Bake (Recommended)

```bash
# Edit docker-bake.hcl and set your Docker username:
# variable "DOCKER_NAMESPACE" { default = "your-username" }

# Build for your current platform only (faster):
docker buildx bake

# Push to Docker Hub (requires docker buildx driver):
docker buildx bake --push

# Build for multiple platforms and push:
docker buildx bake -f docker-bake.hcl --push \
  --set "*.platform=linux/amd64,linux/arm64"
```

### Option B: Using docker build (Simple)

```bash
# Build image
docker build -t your-username/sunloc-server:latest .

# Push to Docker Hub
docker push your-username/sunloc-server:latest

# Tag as version
docker tag your-username/sunloc-server:latest your-username/sunloc-server:v1.0.0
docker push your-username/sunloc-server:v1.0.0
```

---

## Step 3: Set Up Docker Build Cloud (Automated Builds)

### 3a. Connect Docker Hub to Build Cloud

1. Go to https://build.docker.com
2. Click **Settings** → **Connected Accounts**
3. Connect your GitHub account (or GitLab, Bitbucket)
4. Authorize Docker Build Cloud to access your repositories

### 3b. Create Build Configuration

1. Go to https://build.docker.com/dashboard
2. Click **Create** → **Repository**
3. Select your `sunloc-server` GitHub repository
4. Configure build rules:

**Build Rule 1: Main Branch**
- Source Type: `Branch`
- Source: `main`
- Docker Tag: `latest`
- Dockerfile: `Dockerfile`
- Build Context: `/`
- Platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`

**Build Rule 2: Version Tags**
- Source Type: `Tag`
- Source: `v.*`
- Docker Tag: `{sourceref}`
- Dockerfile: `Dockerfile`
- Build Context: `/`

5. Click **Save and Build**

Build Cloud will now:
- Automatically build on every push to `main` or tag
- Cache layers across builds (faster)
- Build for multiple platforms in parallel
- Push to Docker Hub automatically

---

## Step 4: GitHub Actions (Optional, for Full CI/CD)

GitHub Actions is faster for pull requests and provides detailed logs.

### 4a. Add GitHub Secrets

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub Personal Access Token

### 4b. Workflow is Ready

The workflow file `.github/workflows/docker-build.yml` is already created. It will:

- Trigger on `push` to `main` or `develop`
- Trigger on all git tags `v*`
- Build for `linux/amd64`, `linux/arm64`, `linux/arm/v7`
- Cache builds using GitHub Actions cache (faster than always rebuilding)
- Push to Docker Hub only on successful builds
- Update Docker Hub description from `DOCKER_README.md`

**View workflow runs:**
1. Go to your repository → **Actions**
2. Click **Build and Push to Docker Hub** workflow
3. View logs for any build

---

## Step 5: Pull and Run from Docker Hub

Once images are pushed, anyone can run:

```bash
# Run latest
docker run -d \
  --name sunloc \
  -p 3000:3000 \
  -v sunloc-db:/app/data \
  your-username/sunloc-server:latest

# Run specific version
docker run -d \
  --name sunloc-v1 \
  -p 3001:3000 \
  -v sunloc-db-v1:/app/data \
  your-username/sunloc-server:v1.0.0

# Using docker-compose
docker compose pull your-username/sunloc-server:latest
docker compose up -d
```

---

## Build Cloud vs GitHub Actions

| Feature | Build Cloud | GitHub Actions |
|---------|-------------|-----------------|
| Setup | UI-based, automatic | YAML config, manual |
| Platforms | Parallel (faster) | Sequential |
| Cache | Docker registry cache | GitHub cache (built-in) |
| Cost | Free tier limits | Generous free tier |
| Logs | Web UI | GitHub Actions UI |
| Best for | Multi-platform builds | Quick iteration |

**Recommendation:** Use Build Cloud for production releases, GitHub Actions for PR checks.

---

## Continuous Deployment (CD)

After images are pushed to Docker Hub, deploy to your target:

### AWS ECS
```bash
aws ecs update-service \
  --cluster sunloc-cluster \
  --service sunloc-server \
  --force-new-deployment
```

### Kubernetes
```bash
kubectl set image deployment/sunloc sunloc=your-username/sunloc-server:latest
```

### Docker Swarm
```bash
docker service update --image your-username/sunloc-server:latest sunloc-server
```

### Single Host (via docker-compose)
```bash
docker compose pull
docker compose up -d
```

---

## Troubleshooting

### Build fails: "rate limit exceeded"
- Wait 24 hours or authenticate with Personal Access Token
- Docker Build Cloud has no rate limits for authenticated builds

### Multi-platform build fails locally
- Requires buildx builder: `docker buildx create --use`
- Or use Docker Build Cloud (handles this automatically)

### Push fails: "unauthorized"
- Run `docker logout` then `docker login` again
- Verify Personal Access Token has `Read & Write` permissions

### Image pulls slowly
- Use a region-specific registry mirror
- Cache layers with `--cache-from type=registry`

---

## Next Steps

1. ✅ Push first image: `docker buildx bake --push`
2. ✅ Test pull: `docker run your-username/sunloc-server:latest`
3. ✅ Set up Build Cloud for automation
4. ✅ Add GitHub secrets for CI/CD
5. ✅ Deploy to your target platform

**Resources:**
- Docker Hub: https://hub.docker.com
- Docker Build Cloud: https://build.docker.com
- Buildx docs: https://docs.docker.com/build/architecture/overview/
