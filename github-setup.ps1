# Quick Git & GitHub Setup Script (Windows PowerShell)
# This script pushes your Sunloc Server to GitHub

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Sunloc Server - GitHub Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git not found. Install from https://git-scm.com" -ForegroundColor Red
    exit 1
}

Write-Host "Enter your GitHub details:" -ForegroundColor Yellow
Write-Host ""

$GITHUB_USER = Read-Host "GitHub Username"
$REPO_NAME = Read-Host "Repository name (default: sunloc-server)"

if ([string]::IsNullOrEmpty($REPO_NAME)) {
    $REPO_NAME = "sunloc-server"
}

$REPO_URL = "https://github.com/$GITHUB_USER/$REPO_NAME.git"

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  Username: $GITHUB_USER"
Write-Host "  Repository: $REPO_NAME"
Write-Host "  URL: $REPO_URL"
Write-Host ""

# Configure git
Write-Host "Configuring Git..." -ForegroundColor Yellow
git config --global user.name "Sunloc Developer" 2>$null
git config --global user.email "developer@sunloc.local" 2>$null

# Initialize repo
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git repository already initialized" -ForegroundColor Green
}

# Add files
Write-Host "Staging files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Creating commit..." -ForegroundColor Yellow
git commit -m "Initial Sunloc Server - Docker configured for Railway deployment" 2>$null

# Set remote
Write-Host "Setting remote repository..." -ForegroundColor Yellow
$remotes = git remote
if ($remotes -contains "origin") {
    Write-Host "  Updating existing remote..." -ForegroundColor Gray
    git remote set-url origin "$REPO_URL"
} else {
    Write-Host "  Adding new remote..." -ForegroundColor Gray
    git remote add origin "$REPO_URL"
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "  You will be prompted for GitHub credentials" -ForegroundColor Gray
Write-Host ""

git branch -M main
git push -u origin main

Write-Host ""
Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Your repository:" -ForegroundColor Cyan
Write-Host "  $REPO_URL"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to https://railway.app"
Write-Host "  2. Click + New Project"
Write-Host "  3. Select GitHub Repo"
Write-Host "  4. Choose: $REPO_NAME"
Write-Host "  5. Click Deploy"
Write-Host ""
