#!/bin/bash
# Quick Git & GitHub Setup Script
# This script pushes your Sunloc Server to GitHub

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Sunloc Server → GitHub Setup         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git from https://git-scm.com"
    exit 1
fi

echo "📋 Enter your GitHub details:"
echo ""

read -p "GitHub Username (or Organization): " GITHUB_USER
read -p "Repository name (default: sunloc-server): " REPO_NAME

REPO_NAME=${REPO_NAME:-sunloc-server}
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "Configuration:"
echo "  Username: $GITHUB_USER"
echo "  Repository: $REPO_NAME"
echo "  URL: $REPO_URL"
echo ""

# Configure git
echo "⚙️  Configuring Git..."
git config --global user.name "Sunloc Developer" 2>/dev/null || true
git config --global user.email "developer@sunloc.local" 2>/dev/null || true

# Initialize repo
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Add files
echo "📦 Staging files..."
git add .
git status

# Commit
echo ""
echo "💾 Creating commit..."
git commit -m "Initial Sunloc Server - Docker configured and ready for Railway deployment" || true

# Set remote
echo "🔗 Setting remote repository..."
if git remote | grep -q origin; then
    echo "  Updating existing remote..."
    git remote set-url origin "$REPO_URL"
else
    echo "  Adding new remote..."
    git remote add origin "$REPO_URL"
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
echo "   Note: You'll be prompted for GitHub credentials"
echo ""

git branch -M main
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📍 Your repository:"
echo "   $REPO_URL"
echo ""
echo "🎉 Next: Connect to Railway"
echo "   1. Go to https://railway.app"
echo "   2. Click + New Project"
echo "   3. Select GitHub Repo"
echo "   4. Choose: $REPO_NAME"
echo "   5. Click Deploy"
echo ""
