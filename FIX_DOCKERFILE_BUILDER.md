# 🔧 FIX: Configure Railway to Build from Dockerfile

## The Problem

Railway is trying to pull a pre-built image instead of building from your Dockerfile.

Error:
```
The image `sunloc.co.in` could not be found.
```

## ✅ The Solution

Tell Railway to use your Dockerfile (which is in GitHub).

### Step 1: Go to Railway Dashboard
https://railway.app

### Step 2: Go to Your Service Settings
1. Click **wonderful-acceptance** project
2. Click **sunloc.co.in** service
3. Click **Settings** (gear icon, top right)

### Step 3: Change the Builder

Look for **"Builder"** setting:

**Current (Wrong):**
```
Builder: Image  ← This is wrong
```

**Change to (Correct):**
```
Builder: Dockerfile  ← This is correct!
```

### Step 4: Save & Deploy

1. Select **Dockerfile** from the dropdown
2. Make sure **Dockerfile path** shows: `./Dockerfile`
3. Scroll down and click **Deploy** button
4. Wait 3-5 minutes

---

## 📊 What Will Happen

Once you change to Dockerfile builder:

```
Railway detects Dockerfile
        ↓
Pulls your code from GitHub
        ↓
Builds Docker image (207MB)
        ↓
Deploys container
        ↓
Your API goes LIVE! ✅
```

---

## 🎯 Step-by-Step Screenshots

### In Railway Dashboard:

**1. Click Service Settings:**
```
sunloc.co.in → Settings (gear icon)
```

**2. Find Builder Section:**
```
┌─────────────────────────────┐
│ Builder                     │
│ ┌─────────────────────────┐ │
│ │ Image        ▼          │ │  ← Click dropdown
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**3. Select Dockerfile:**
```
Options:
- Image
- Dockerfile  ← SELECT THIS
- Buildpack
```

**4. Confirm Path:**
```
Dockerfile path: ./Dockerfile  ← Should show this
```

**5. Click Deploy:**
```
[Deploy] button (usually green, top right)
```

---

## ⏱️ Timeline After Change

| Step | Time |
|------|------|
| Change Builder to Dockerfile | Instant |
| Click Deploy | Instant |
| Build starts | 10-30 sec |
| Build image | 2-3 minutes |
| Deploy container | 30 sec |
| API LIVE | 3-5 minutes |

---

## ✅ After Deployment

Once deployed (🟢 Running):

**Your URL will work:**
```
https://sumloccoin-production.up.railway.app/api/health
```

Should return:
```json
{
  "ok": true,
  "server": "Sunloc Integrated Server v1.0",
  "uptime": "45s"
}
```

---

## 🚀 Try Now!

1. Go to Railway dashboard
2. Click Settings on sunloc.co.in
3. Change Builder to **Dockerfile**
4. Click **Deploy**
5. Wait 3-5 minutes
6. Test your URL

**That's it!** 🎉

---

## 💡 Why This Works

Your GitHub repo has:
- ✅ Dockerfile (tells Railway how to build)
- ✅ package.json (Node.js dependencies)
- ✅ server.js (your app code)
- ✅ .dockerignore (build optimization)

Railway just needs to know to **use the Dockerfile**!

---

## 🆘 Still Not Working?

After changing to Dockerfile:

1. Check deployment **Status** (should be 🟢 Running)
2. View **Logs** tab for any errors
3. Make sure it shows "Building..." then "Running"

Let me know what you see! 🚀
