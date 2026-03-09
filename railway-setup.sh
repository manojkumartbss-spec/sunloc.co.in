#!/bin/bash
# Railway Auto-Setup Script
# This script configures your project for Railway deployment

set -e

echo "🚀 Railway Auto-Setup for Sunloc Server"
echo "========================================"

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created"
fi

# Check if railway.json exists
if [ ! -f "railway.json" ]; then
    echo "📝 Creating railway.json..."
    cat > railway.json << 'EOF'
{
  "build": {
    "builder": "dockerfile"
  }
}
EOF
    echo "✅ railway.json created"
fi

# Check if Procfile exists
if [ ! -f "Procfile" ]; then
    echo "📝 Creating Procfile..."
    echo "web: node server.js" > Procfile
    echo "✅ Procfile created"
fi

echo ""
echo "✅ All configuration files ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Set your Railway token: export RAILWAY_TOKEN=your_token"
echo "2. Link to Railway project: railway project link"
echo "3. Deploy: railway up"
echo ""
echo "Or use Railway Dashboard:"
echo "1. Go to https://railway.app"
echo "2. Click your 'sunloc.co.in' service"
echo "3. Go to Settings"
echo "4. Set Builder to 'Dockerfile'"
echo "5. Click Deploy"
