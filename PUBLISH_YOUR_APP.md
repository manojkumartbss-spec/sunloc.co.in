# 🚀 Publishing Your Sunloc Server - Complete Guide

## Option 1: Railway (Already Deployed!) ✅

Your app is **already live on Railway**. Here's how to find your URL:

### Get Your Railway URL

1. Go to: https://railway.app
2. Click your **sunloc.co.in** project
3. Click the service (sunloc-server)
4. Look for the URL at the top right
5. It will be: `https://sunloc-xxxxxx.railway.app`

### Test Your Live API

```bash
# Replace with your actual Railway URL
curl https://sunloc-xxxxxx.railway.app/api/health

# You should get:
{
  "ok": true,
  "server": "Sunloc Integrated Server v1.0",
  "uptime": "45s"
}
```

### Your App is Already Public!

- ✅ Live on the internet
- ✅ Accessible worldwide
- ✅ Auto-scales on Railway
- ✅ Auto-restarts on crash
- ✅ Auto-deploys on git push

---

## Option 2: Connect Custom Domain (sunloc.co.in)

If you own the domain **sunloc.co.in**, connect it to Railway:

### Step 1: Go to Railway Settings
1. Railway Dashboard → sunloc.co.in project
2. Click **Settings** (gear icon)
3. Look for "Domains" section

### Step 2: Add Your Domain
1. Click **+ Add Domain**
2. Enter: `sunloc.co.in`
3. Railway gives you DNS settings

### Step 3: Update DNS Records
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS settings
3. Add the CNAME or A record Railway provides
4. Wait 15-30 minutes for DNS to propagate
5. Your domain will point to Railway!

### After DNS Update
- `https://sunloc.co.in` → Your live app
- `https://api.sunloc.co.in` → Optional subdomain

---

## Option 3: Tunnel localhost (Quick Testing)

If you want to share your **local** http://localhost:3000 online temporarily:

### Using ngrok (Easiest)

```bash
# 1. Download ngrok from https://ngrok.com/download

# 2. Run ngrok
ngrok http 3000

# 3. You get a public URL like: https://abcd-1234.ngrok.io
# 4. Share that URL with anyone
# 5. They can access your localhost!
```

### Using Cloudflare Tunnel

```bash
# 1. Install Cloudflare Tunnel CLI
# 2. Run:
cloudflared tunnel --url http://localhost:3000

# 3. Get a public URL
# 4. Share it
```

### Using LocalTunnel

```bash
# 1. Install
npm install -g localtunnel

# 2. Run
lt --port 3000

# 3. Get public URL
# 4. Share it
```

---

## ⚡ Comparison

| Method | Status | Best For | Setup Time |
|--------|--------|----------|-----------|
| **Railway (Current)** | ✅ LIVE | Production | Done |
| **Custom Domain** | 🔄 Setup | Professional | 15-30 min |
| **ngrok** | Quick | Testing | 2 min |
| **Cloudflare Tunnel** | Quick | Development | 5 min |
| **LocalTunnel** | Quick | Quick share | 1 min |

---

## 🎯 RECOMMENDED: Use Your Railway URL

Since your app is **already on Railway**, just use that:

```
Your Public URL: https://sunloc-xxxxxx.railway.app
```

**Advantages:**
- ✅ Already live and running
- ✅ Auto-restarts on crash
- ✅ Auto-updates on git push
- ✅ No extra setup needed
- ✅ Production-grade infrastructure
- ✅ Works worldwide
- ✅ Monitoring included

---

## 📍 Find Your Railway URL

1. Go to: https://railway.app
2. Log in
3. Click **sunloc.co.in** project
4. Click the service/deployment
5. **URL** is shown at the top

It looks like: `https://sunloc-xxxxxx.railway.app`

---

## 🧪 Test Your Live URL

```bash
# Health check
curl https://your-railway-url/api/health

# Get orders
curl https://your-railway-url/api/orders/active

# Get planning state
curl https://your-railway-url/api/planning/state
```

All these should work from anywhere in the world!

---

## 🔗 Share Your API

Once you have your Railway URL:

```
Tell users to use:
https://sunloc-xxxxxx.railway.app

They can access:
- https://sunloc-xxxxxx.railway.app/api/health
- https://sunloc-xxxxxx.railway.app/api/orders/active
- https://sunloc-xxxxxx.railway.app/api/planning/state
- And all other endpoints!
```

---

## ✅ Checklist

- [x] App is deployed on Railway
- [x] App is live and running
- [x] Auto-deploy is active
- [x] Database is persisted
- [x] Health checks working
- [ ] Find your Railway URL (next step)
- [ ] Test the URL (next step)
- [ ] Share with users (next step)

---

## 🚀 Quick Start

1. **Go to**: https://railway.app
2. **Find** your Railway URL
3. **Test it**: `curl https://your-url/api/health`
4. **Share** with your team!

Your app is **already published** on the internet! 🎉
