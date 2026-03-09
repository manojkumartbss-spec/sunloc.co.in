# Docker Hub & Build Cloud Deployment Checklist

## Pre-Deployment Setup

- [ ] Create Docker Hub account: https://hub.docker.com
- [ ] Create Personal Access Token: https://hub.docker.com/settings/security
  - [ ] Token name: `sunloc-deploy`
  - [ ] Permissions: `Read & Write`
  - [ ] Save token securely
- [ ] Create Docker Hub repository: `sunloc-server` (public or private)
- [ ] Verify Docker CLI is installed: `docker --version`
- [ ] Install docker buildx (if building multi-platform): `docker buildx create --use`

---

## Option A: Manual Push (Quickest)

- [ ] Login to Docker Hub: `docker login`
- [ ] Build image: `docker build -t your-username/sunloc-server:latest .`
- [ ] Push to registry: `docker push your-username/sunloc-server:latest`
- [ ] Verify on Docker Hub: https://hub.docker.com/r/your-username/sunloc-server
- [ ] Test pull: `docker pull your-username/sunloc-server:latest`

---

## Option B: Docker Bake (Multi-Platform)

- [ ] Edit `docker-bake.hcl` - change `DOCKER_NAMESPACE` to your username
- [ ] Create buildx builder: `docker buildx create --use`
- [ ] Build locally: `docker buildx bake`
- [ ] Build + push: `docker buildx bake --push`
- [ ] Monitor build: Check Docker Hub for image status

---

## Option C: GitHub Actions (Recommended for Teams)

### GitHub Setup
- [ ] Push code to GitHub repository
- [ ] Go to repo → Settings → Secrets and variables → Actions
- [ ] Add secret: `DOCKER_USERNAME` = your Docker Hub username
- [ ] Add secret: `DOCKER_PASSWORD` = your Personal Access Token
- [ ] Verify workflow file exists: `.github/workflows/docker-build.yml`

### Trigger & Monitor
- [ ] Commit and push any change to `main` branch
- [ ] Go to repo → Actions tab
- [ ] Click **Build and Push to Docker Hub** workflow
- [ ] Monitor build progress in real-time
- [ ] Once complete, image appears on Docker Hub

### Automated Triggers
- [ ] ✅ Builds trigger on: `push` to `main` branch
- [ ] ✅ Builds trigger on: `push` to `develop` branch
- [ ] ✅ Builds trigger on: Git tags matching `v*` (e.g., v1.0.0)
- [ ] ✅ Builds skip for: Pull requests (but can be enabled)

---

## Option D: Docker Build Cloud (Best for Production)

### Account & Connection
- [ ] Go to https://build.docker.com
- [ ] Sign in with Docker Hub account
- [ ] Click **Settings** → **Connected Accounts**
- [ ] Connect GitHub account (authorize OAuth)

### Create Build Configuration
- [ ] Go to Dashboard
- [ ] Click **Create** → **Repository**
- [ ] Select `sunloc-server` from GitHub
- [ ] Configure Build Rules:

#### Build Rule 1: Main Branch
- [ ] Source Type: `Branch`
- [ ] Source: `main`
- [ ] Docker Tag: `latest`
- [ ] Dockerfile: `Dockerfile`
- [ ] Build Context: `/`
- [ ] Platforms: `linux/amd64,linux/arm64,linux/arm/v7`

#### Build Rule 2: Version Tags (Optional)
- [ ] Source Type: `Tag`
- [ ] Source: `v.*`
- [ ] Docker Tag: `{sourceref}`
- [ ] Dockerfile: `Dockerfile`
- [ ] Build Context: `/`
- [ ] Platforms: `linux/amd64,linux/arm64,linux/arm/v7`

### Verify Setup
- [ ] Click **Save and Build** → First build starts automatically
- [ ] Monitor build at https://build.docker.com/dashboard
- [ ] Once complete, check Docker Hub for image

---

## Post-Deployment Verification

### Docker Hub
- [ ] Image appears at: `https://hub.docker.com/r/your-username/sunloc-server`
- [ ] Tags visible: `latest`, version tags, platform tags
- [ ] Description matches: `DOCKER_README.md` content
- [ ] Pull command shows: `docker pull your-username/sunloc-server:latest`

### Test Pull & Run
```bash
# Pull image
docker pull your-username/sunloc-server:latest

# Run container
docker run -d -p 3000:3000 \
  -v sunloc-db:/app/data \
  your-username/sunloc-server:latest

# Test health check
docker exec <container_id> \
  curl http://localhost:3000/api/health
```

- [ ] Image pulls successfully
- [ ] Container starts without errors
- [ ] Health check responds with HTTP 200
- [ ] API is accessible at http://localhost:3000

---

## Continuous Deployment Setup

### GitHub Actions (Already Configured)
- [ ] Workflow auto-triggers on push to `main`
- [ ] Workflow auto-triggers on tag `v*`
- [ ] View workflow runs: repo → Actions
- [ ] Check build logs: Actions → Run → Logs
- [ ] Image pushed to Docker Hub on success

### Docker Build Cloud (Already Configured)
- [ ] Build Cloud auto-triggers on webhook
- [ ] View builds: https://build.docker.com → Repository → Builds
- [ ] Check build status: In-progress, completed, failed
- [ ] Download build logs: Click build → view full log

### Deployment Webhook (Optional)
- [ ] Configure webhook on Docker Hub to trigger deployment
- [ ] Webhook URL: (e.g., deployment service webhook)
- [ ] When image pushed → webhook fires → deployment updates
- [ ] Supports: AWS, Kubernetes, custom endpoints

---

## Troubleshooting Checklist

### Build Fails: "rate limit exceeded"
- [ ] Verify logged in: `docker login`
- [ ] Use Personal Access Token (not password)
- [ ] Wait 24 hours or switch account
- [ ] Docker Build Cloud bypasses rate limits (use that instead)

### Build Fails: "dockerfile not found"
- [ ] Verify Dockerfile exists in repo root
- [ ] Check spelling: `Dockerfile` (capital D)
- [ ] Ensure file is committed to git

### Build Fails: "package not found"
- [ ] Check package.json exists
- [ ] Check package-lock.json exists (or will be generated)
- [ ] Verify npm dependencies are correct
- [ ] Retry build (npm registry can be slow)

### Push Fails: "unauthorized"
- [ ] Run: `docker logout && docker login`
- [ ] Use Personal Access Token, not password
- [ ] Verify PAT has `Read & Write` permissions
- [ ] Check Docker Hub username is correct

### Multi-platform Build Fails Locally
- [ ] Requires buildx builder: `docker buildx create --use`
- [ ] Use Docker Build Cloud instead (handles this automatically)
- [ ] Or build single platform: `docker build` (not buildx)

### Image Pulls Very Slowly
- [ ] First pull downloads entire image (expected)
- [ ] Subsequent pulls use layer cache (faster)
- [ ] Check internet connection speed
- [ ] Use regional mirror if available

### Container Won't Start
- [ ] Check logs: `docker logs <container_id>`
- [ ] Verify volume mounted: `docker inspect <container_id>`
- [ ] Verify port available: `docker port <container_id>`
- [ ] Check resource limits: `docker stats <container_id>`

---

## Production Deployment Checklist

### Before First Release
- [ ] Image tested locally with `docker run`
- [ ] Health checks pass: `curl /api/health`
- [ ] Database persists: volume mounts work
- [ ] Environment variables set correctly
- [ ] Resource limits appropriate for workload

### Production Environment
- [ ] Set NODE_ENV=production
- [ ] Set DB_PATH to persistent volume
- [ ] Configure resource limits (CPU, memory)
- [ ] Enable health checks in orchestrator
- [ ] Configure restart policy: `unless-stopped`
- [ ] Set up monitoring/alerting

### Deployment Strategy
- [ ] Create image tag: `v1.0.0` (semantic versioning)
- [ ] Tag image: `docker tag sunloc-server:latest sunloc-server:v1.0.0`
- [ ] Push both tags: `docker push` (latest + version)
- [ ] Test image in staging
- [ ] Update production deployment with new tag
- [ ] Monitor for errors: Check container logs

### Rollback Plan
- [ ] Keep previous image: `docker tag sunloc-server:v1.0.0`
- [ ] If new deployment fails: Revert to previous tag
- [ ] Command: `docker service update --image your-username/sunloc-server:v1.0.0`

---

## Monitoring & Maintenance

### Monitor Builds
- [ ] Check build status weekly: https://build.docker.com
- [ ] Verify automatic builds are triggering
- [ ] Monitor build duration trends
- [ ] Check for repeated failures

### Monitor Running Containers
- [ ] Health checks: `docker ps` (should show "healthy")
- [ ] Resource usage: `docker stats`
- [ ] Logs: `docker logs -f`
- [ ] Errors: `docker logs --tail 100`

### Update Strategy
- [ ] Weekly: Check for npm security updates
- [ ] Monthly: Update base image (node:18-alpine)
- [ ] Quarterly: Update build configuration
- [ ] Always: Test updates in dev before production

### Cleanup
- [ ] Remove old image tags: `docker image prune`
- [ ] Remove unused volumes: `docker volume prune`
- [ ] Remove old builds: Docker Hub → Repository → Delete Tag
- [ ] Disk space: `docker system df`

---

## Success Criteria ✅

When you're done:
- [ ] Image published on Docker Hub
- [ ] Image can be pulled and run
- [ ] Health check passes
- [ ] Database persists across restarts
- [ ] At least one automated build triggered successfully
- [ ] Team can pull and run image: `docker run your-username/sunloc-server`

---

## Quick Links

- Docker Hub: https://hub.docker.com
- Docker Build Cloud: https://build.docker.com
- Docker CLI Docs: https://docs.docker.com/engine/reference/commandline/
- Buildx Docs: https://docs.docker.com/build/
- Multi-Platform Builds: https://docs.docker.com/build/building/multi-platform/

---

## Next Steps

1. **Complete Pre-Deployment Setup** (5 min)
2. **Choose deployment method** (Option A-D)
3. **Follow checklist for chosen method** (10-30 min)
4. **Verify on Docker Hub** (5 min)
5. **Test pull and run** (5 min)
6. **Set up monitoring** (10 min)

**Total time: 45-60 minutes for full production setup**

Questions? See:
- QUICKSTART.md - Fast reference
- DEPLOYMENT.md - Detailed guide
- ARCHITECTURE.md - System overview
