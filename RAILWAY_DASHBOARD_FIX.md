# 🎯 Railway Dashboard: 5-Minute Fix

## The Problem
Railway is looking for a pre-built Docker image instead of building from your Dockerfile.

## The Solution
Tell Railway to **build from Dockerfile** instead of pulling an image.

---

## Step-by-Step Fix

### Step 1: Open Your Railway Project
```
URL: https://railway.app/project/32ba2d1e-735b-454c-9627-a39c0f0d75ef
```
or click your project from the dashboard.

---

### Step 2: Click Your Service
In the main project view, you'll see:

```
┌─────────────────────┐
│  sunloc.co.in      │
│  Build failed       │
│  2 minutes ago      │
└─────────────────────┘
```

**Click on this card** to open the service details.

---

### Step 3: Open Settings
Once inside the service, look for the **Settings icon** (⚙️) in the top-right corner.

```
  [← Back] Service: sunloc.co.in        ⚙️ Settings
```

**Click Settings**.

---

### Step 4: Find the Builder Section
Scroll down in the Settings tab until you see the **"Builder"** section.

You'll see something like:

```
┌─────────────────────────────────┐
│ Builder                         │
│ ┌─────────────────────────────┐ │
│ │ Image        ▼              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

### Step 5: Change Builder to Dockerfile
**Click the dropdown** that currently shows "Image".

You'll see options:
- Image
- **Dockerfile** ← Select this
- Buildpack

**Click "Dockerfile"**.

---

### Step 6: Confirm Dockerfile Path
After selecting Dockerfile, you should see:

```
┌──────────────────────────────────┐
│ Builder: Dockerfile              │
│ Dockerfile path: ./Dockerfile    │
└──────────────────────────────────┘
```

The path should be `./Dockerfile` (which is correct).

---

### Step 7: Deploy
**Scroll up** and look for a **"Deploy" button** (usually green, top right).

**Click Deploy**.

---

### Step 8: Wait for Build
You'll see the deployment status:

```
Deployment: Building...
  ├─ Build started
  ├─ Installing dependencies...
  ├─ Building image...
  └─ Deploying container...
```

This takes **3-5 minutes**.

---

### Step 9: Verify Success
Once complete, you should see:

```
✅ Deployment successful
   Status: Running
   URL: https://sunloc-xxxxxx.railway.app
```

---

## 🧪 Test Your Deployment

Once running, test the health endpoint:

```bash
curl https://your-railway-url/api/health
```

You should get:
```json
{
  "ok": true,
  "server": "Sunloc Integrated Server v1.0",
  "db": "/app/data/sunloc.db",
  "uptime": "45s"
}
```

---

## 📸 Screenshots Reference

### Before (Wrong)
```
Builder: Image  ← ❌ Tries to pull from registry
```

### After (Correct)
```
Builder: Dockerfile  ← ✅ Builds from your Dockerfile
Dockerfile path: ./Dockerfile
```

---

## ⚡ Common Issues

### "Still says Image not found"
1. Make sure you clicked "Dockerfile" (not "Image")
2. Click "Deploy" button
3. Wait for build to complete
4. Check "Deployments" tab to see build logs

### Build still fails
1. Click the failed deployment
2. View "Build Logs" tab
3. Look for error messages
4. Common: Node modules not installing → check package.json

### Can't find Settings
- Top right corner, look for ⚙️ icon
- Or right-click the service card → "Settings"

---

## ✅ Checklist

- [ ] Go to https://railway.app/project/32ba2d1e-735b-454c-9627-a39c0f0d75ef
- [ ] Click sunloc.co.in service
- [ ] Open Settings (⚙️)
- [ ] Change Builder from "Image" to "Dockerfile"
- [ ] Click Deploy
- [ ] Wait 3-5 minutes
- [ ] Test with: curl https://your-url/api/health
- [ ] Done! 🎉

---

**Estimated Time**: 5-10 minutes

You've got this! 🚀
