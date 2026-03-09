# Railway Deployment Guide

## Issue Fixed

The deployment failed because Railway was trying to pull a Docker image (`sunloc1`) that doesn't exist in a public registry. 

**Solution**: Added configuration files to tell Railway to **build** your Dockerfile instead.

---

## Files Added

### `railway.json` (NEW)
Tells Railway to:
- Use Dockerfile as the build source
- Start the app with `node server.js`
- Restart on failures (max 5 retries)
- Deploy 1 replica

### `Procfile` (NEW)
Fallback process file for Railway. Specifies the web process.

---

## Deployment Steps

### 1. Ensure You're Authenticated
```bash
# Set your Railway token (get from https://railway.app/account/tokens)
set RAILWAY_TOKEN=your_token_here
```

### 2. Link Your Railway Project
```bash
railway project link
```
This will prompt you to select or create a Railway project.

### 3. Deploy
```bash
railway up
```

Railway will now:
1. ✅ Build your Dockerfile (instead of pulling an image)
2. ✅ Push the built image to Railway's registry
3. ✅ Deploy the container
4. ✅ Expose it on a Railway-provided URL

### 4. View Logs
```bash
railway logs
```

### 5. Check Deployment Status
```bash
railway status
```

---

## Environment Variables on Railway

Your app uses these environment variables (already set in `docker-compose.yml`):

```
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/sunloc.db
```

**To set custom variables in Railway dashboard:**
1. Go to your Railway project
2. Click "Variables" tab
3. Add any overrides (Railway sets PORT automatically)

---

## Database Persistence

Your SQLite database is stored in a **volume** (`sunloc-db-data`). On Railway:

- The volume persists across deployments
- Database file: `/app/data/sunloc.db`
- WAL mode enabled for concurrent access

**Important**: Railway volumes are project-scoped. If you delete the Railway project, the data is lost.

### Backup Before Deployment
```bash
# Backup locally before deploying
make db-backup
```

---

## Troubleshooting

### "Image not found" Error
✅ **Fixed** - railway.json now tells Railway to build the Dockerfile

### Port Binding Issues
- Railway automatically assigns `PORT` env var
- Your app respects `PORT` env var (configured in server.js)
- ✅ Should work automatically

### Database Locked Errors
- SQLite WAL mode is enabled
- If issues persist, Railway support can help with volume issues

### Health Check Failures
- Railway doesn't require explicit health checks
- Your Docker health check is still available for monitoring

---

## Next Deployment

Simply run:
```bash
railway up
```

Railway will:
1. Detect changes
2. Rebuild the Dockerfile
3. Redeploy automatically

---

## Useful Railway Commands

```bash
railway login              # Authenticate with Railway
railway project link      # Link current directory to a project
railway project list      # List your projects
railway up                # Deploy to Railway
railway down              # Remove deployment
railway logs              # View live logs
railway open              # Open project in browser
railway status            # Check deployment status
railway variables         # View/edit environment variables
```

---

## Production Checklist

Before going live:

- [ ] Set `NODE_ENV=production` on Railway
- [ ] Backup database regularly (Railway volumes are recoverable but set reminders)
- [ ] Monitor logs: `railway logs`
- [ ] Test health endpoint: `curl https://your-railway-url/api/health`
- [ ] Set up error monitoring/alerts (Railway integrations available)

---

**Status**: 🚀 Ready to deploy

Try deploying again with: `railway up`
