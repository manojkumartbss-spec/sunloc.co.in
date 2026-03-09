# 🚀 Railway Deployment Guide for sunloc.co.in

## Your GitHub Repository
```
https://github.com/manojkumartbss-spec/sunloc.co.in
```

---

## Step-by-Step Railway Deployment

### Step 1: Open Railway Dashboard
Go to: **https://railway.app**

### Step 2: Create New Project
1. Click the **+ New Project** button (top right)
2. Select **GitHub Repo** option
3. If prompted, click **Connect GitHub**
4. Authorize Railway to access your GitHub account

### Step 3: Select Your Repository
1. Look for: **sunloc.co.in**
2. Click on it to select it
3. Click **Deploy** button

### Step 4: Railway Auto-Detection
Railway will:
- ✅ Auto-detect your Dockerfile
- ✅ Auto-detect package.json
- ✅ Recognize it as a Node.js + Docker app
- ✅ Start building the image

### Step 5: Monitor Build Progress
You'll see:
```
Building...
  ├─ Fetching dependencies
  ├─ Building Docker image
  ├─ Pushing to registry
  └─ Deploying container
```

This takes **3-5 minutes**

### Step 6: Verify Deployment
Once complete, you'll see:
```
✅ Running
   Railway URL: https://sunloc-xxxxxx.railway.app
```

---

## 🧪 Test Your Deployment

Once Railway shows "Running", test your API:

```bash
# Health check
curl https://your-railway-url/api/health

# Active orders
curl https://your-railway-url/api/orders/active

# Planning state
curl https://your-railway-url/api/planning/state
```

Expected response from health check:
```json
{
  "ok": true,
  "server": "Sunloc Integrated Server v1.0",
  "db": "/app/data/sunloc.db",
  "planningSavedAt": null,
  "dprRecords": 0,
  "actualsEntries": 0,
  "uptime": "45s"
}
```

---

## 📊 What Gets Deployed

From your GitHub repository:

```
✓ Dockerfile           → Builds 207MB optimized image
✓ package.json         → Installs Node.js dependencies
✓ server.js            → Express + SQLite application
✓ public/              → Frontend files (HTML, JS)
✓ .dockerignore        → Optimized build context
✓ .env                 → Environment variables
```

---

## 🔧 Configure Environment Variables (Optional)

If you need to set custom environment variables:

1. In Railway dashboard, click your **sunloc.co.in** service
2. Go to **Settings** tab
3. Click **Variables**
4. Add any custom env vars (example: custom PORT, DB path, etc.)

Default variables already set:
```
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/sunloc.db
```

---

## 🌐 Connect Custom Domain (Optional)

To use **sunloc.co.in** as your domain (instead of Railway's URL):

1. In Railway dashboard, go to **Settings**
2. Look for "Domain" section
3. Click **+ Add Domain**
4. Enter: **sunloc.co.in**
5. Follow DNS configuration steps provided by Railway

---

## 📊 Expected Deployment Times

| Stage | Time |
|-------|------|
| Build start | Immediate |
| Dependency install | ~30 sec |
| Docker build | ~1-2 min |
| Image push | ~1 min |
| Container deploy | ~30 sec |
| **Total** | **3-5 minutes** |

---

## ✨ After First Deployment

### Continuous Deployment (Auto)

Now whenever you push code to GitHub, Railway automatically:

```
Local change → git push → GitHub webhook → Railway rebuild → Live
```

Timeline: 2-3 minutes from push to live

### Example Update Flow

```bash
# 1. Make a code change locally
echo "console.log('Updated');" >> server.js

# 2. Commit and push
git add .
git commit -m "Update logging"
git push

# 3. Railway automatically rebuilds and deploys
# (Check Railway dashboard for status)

# 4. Your updates are live in 2-3 minutes
```

---

## 🆘 Troubleshooting

### "Build Failed"
1. Click the failed deployment
2. View **Build Logs**
3. Look for error messages
4. Common issues:
   - Missing npm dependencies → check package.json
   - Node version mismatch → we use Node 18
   - Memory issues → Railway provides enough for SQLite

### "Application crashed"
1. Check Railway **Logs** tab
2. Look for error messages in server output
3. Common fixes:
   - Check environment variables
   - Verify database permissions
   - Check port conflicts

### "Can't access API endpoint"
1. Verify Railway shows "Running" status
2. Copy the exact Railway URL from dashboard
3. Test: `curl https://your-url/api/health`
4. If still fails, check deployment logs

---

## 📈 Monitoring

In Railway Dashboard:

- **Logs** → View real-time server logs
- **Deployments** → See deployment history
- **Metrics** → CPU, memory, network usage
- **Settings** → Configure app behavior

---

## 💾 Database & Persistence

Your SQLite database:
- **Location**: `/app/data/sunloc.db`
- **Persists**: Survives app restarts ✓
- **Backed by**: Railway volume (automatic)
- **Accessible**: Only from inside container

### Backup Your Database

Before major updates:
```bash
# Locally (from docker-compose)
make db-backup

# Creates: sunloc-backup-YYYYMMDD-HHMMSS.tar.gz
```

---

## 🎯 Summary

| Task | Status |
|------|--------|
| GitHub repo | ✅ https://github.com/manojkumartbss-spec/sunloc.co.in |
| Docker config | ✅ Dockerfile ready |
| Code pushed | ✅ All files in repo |
| Railway setup | ⏳ Ready to deploy |
| Deployment | ⏳ Next step |

---

## 🚀 Ready?

**Now go to https://railway.app and:**

1. Click **+ New Project**
2. Select **GitHub Repo**
3. Choose **sunloc.co.in**
4. Click **Deploy**
5. Wait 3-5 minutes
6. Your Sunloc Server is **LIVE!** 🎉

---

**You've got this! Go deploy now!** 💪
