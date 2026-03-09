# 🔄 Auto-Deploy Setup Guide

## What is Auto-Deploy?

When you push code to GitHub, Railway **automatically**:
1. Detects the push
2. Rebuilds your Docker image
3. Deploys the new version
4. Updates your live API

**No manual steps needed!**

---

## ✅ Auto-Deploy is Already Configured

Your repository is set up for auto-deploy because:

1. ✅ Code is on GitHub
2. ✅ Railway can access GitHub (webhook enabled)
3. ✅ Dockerfile is in the repo
4. ✅ Railway auto-detects changes

---

## 🚀 How to Use Auto-Deploy

### Make a Code Change

Edit any file in your project:

```bash
# Example: Update server.js
nano server.js

# Make a change, then save (Ctrl+O, Enter, Ctrl+X)
```

### Commit and Push to GitHub

```bash
# Stage changes
git add .

# Commit with a message
git commit -m "Update: added new feature"

# Push to GitHub
git push
```

### Railway Auto-Builds & Deploys

Once you push:

1. GitHub sends webhook to Railway
2. Railway starts building (automatic)
3. Build takes 2-3 minutes
4. New version goes live automatically
5. Old version stops, new version takes over

**Zero downtime! ✨**

---

## 📊 Auto-Deploy Workflow

```
Your Local Machine
        ↓
   Code changes
        ↓
   git add .
   git commit -m "message"
   git push
        ↓
GitHub Repository
        ↓
  (webhook triggered)
        ↓
Railway Dashboard
        ↓
  Auto-build starts
        ↓
  Build in progress (~2-3 min)
        ↓
  Deploy to production
        ↓
  Live API Updated ✅
```

---

## 📋 Quick Reference Commands

### Push a single file

```bash
git add server.js
git commit -m "Update server configuration"
git push
```

### Push all changes

```bash
git add .
git commit -m "Update: added new features"
git push
```

### View commit history

```bash
git log --oneline
```

### View remote URL

```bash
git remote -v
```

### Push to specific branch

```bash
git push origin main
```

---

## 🔍 Monitor Auto-Deploy

### In Railway Dashboard:

1. Go to https://railway.app
2. Click your **sunloc.co.in** project
3. Go to **Deployments** tab
4. You'll see:
   - Current deployment (green = running)
   - Previous deployments
   - Build logs for each deployment

### View Build Logs:

1. Click a deployment
2. Scroll to **Build Logs**
3. See real-time build progress

### View App Logs:

1. Click your service
2. Go to **Logs** tab
3. See live application output

---

## ✨ Example Auto-Deploy Scenarios

### Scenario 1: Fix a Bug

```bash
# 1. Fix bug in server.js locally
nano server.js

# 2. Push to GitHub
git add server.js
git commit -m "Fix: corrected API response format"
git push

# 3. Railway auto-deploys (2-3 min)
# 4. Your fix is live!
```

### Scenario 2: Add New Feature

```bash
# 1. Add new endpoint in server.js
nano server.js

# 2. Update package.json if needed
# 3. Test locally first

# 4. Commit and push
git add .
git commit -m "Feature: added new tracking endpoint"
git push

# 5. Railway auto-builds & deploys
# 6. Feature is live!
```

### Scenario 3: Database Migration

```bash
# 1. Update database schema in server.js
nano server.js

# 2. Commit changes
git add .
git commit -m "Migration: added new tracking tables"
git push

# 3. Railway auto-deploys with new schema
# 4. Database updates automatically (SQLite)
```

---

## 🆘 Troubleshooting Auto-Deploy

### Build Failed

1. Go to Railway dashboard
2. Click **Deployments**
3. Click the failed deployment
4. View **Build Logs**
5. Look for error messages
6. Common issues:
   - Syntax error in code
   - Missing npm package
   - Memory/resource limits

### Auto-Deploy Didn't Trigger

1. Verify push was successful: `git log --oneline`
2. Check GitHub webhook: GitHub Repo → Settings → Webhooks
3. Verify Railway has GitHub access

### Old Version Still Running

1. Wait 2-3 minutes for build to complete
2. Check Railway dashboard for "Running" status
3. Clear browser cache (Ctrl+Shift+Delete)
4. Refresh API endpoint

---

## 📈 Best Practices

### 1. Always Test Locally First

```bash
# Test with docker-compose locally
docker compose up
# Visit http://localhost:3000 in browser
```

### 2. Write Good Commit Messages

```bash
# Good
git commit -m "Fix: corrected health check endpoint"

# Bad
git commit -m "update"
```

### 3. Commit Frequently

Small, focused commits are easier to debug:

```bash
# Good: one change per commit
git add file1.js
git commit -m "Add feature X"

# Bad: too many changes at once
git add .
git commit -m "Multiple updates"
```

### 4. Check Before Pushing

```bash
# View what will be pushed
git status

# Review changes
git diff

# Then push
git push
```

---

## 🔐 Security Practices

### Never Commit Secrets

```bash
# Bad: committing secrets
git add .env
git push

# Good: use .env.example instead
# Edit .env locally (never commit)
# Set variables in Railway dashboard
```

### Use .gitignore

Your `.gitignore` already includes:
- `.env` (environment variables)
- `node_modules/` (dependencies)
- `.git/` (git metadata)
- Build artifacts

---

## 📞 Support & Documentation

### In Your Repository:

- **RAILWAY_DEPLOYMENT_FINAL.md** - Deployment guide
- **00_START_HERE.md** - Quick start
- **DOCKER_BEST_PRACTICES.md** - Docker reference
- **Makefile** - Local development commands

### External Resources:

- Railway Docs: https://railway.app/docs
- GitHub Docs: https://docs.github.com
- Git Docs: https://git-scm.com/doc

---

## ✅ Auto-Deploy Checklist

- [x] Code on GitHub
- [x] Dockerfile in repo
- [x] Railway connected to GitHub
- [x] Webhook configured
- [x] Ready for auto-deploy

---

## 🎊 You're All Set!

Auto-deploy is **ready to use**. Just:

1. Make code changes locally
2. `git add .`
3. `git commit -m "message"`
4. `git push`
5. Railway auto-deploys in 2-3 minutes!

---

## 🚀 Test Auto-Deploy

Try it now:

1. Make a small change to a file
2. Commit and push
3. Watch Railway dashboard
4. See your changes go live automatically!

**That's all there is to it!** 🎉
