# Railway Auto-Setup Script for Windows PowerShell
# This script configures your project for Railway deployment

Write-Host "Railway Auto-Setup for Sunloc Server" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "OK: .env created" -ForegroundColor Green
} else {
    Write-Host "OK: .env already exists" -ForegroundColor Green
}

# Create railway.json if it doesn't exist
if (-not (Test-Path "railway.json")) {
    Write-Host "Creating railway.json..." -ForegroundColor Yellow
    $content = @"
{
  `"build`": {
    `"builder`": `"dockerfile`"
  }
}
"@
    $content | Out-File -FilePath "railway.json" -Encoding UTF8
    Write-Host "OK: railway.json created" -ForegroundColor Green
} else {
    Write-Host "OK: railway.json already exists" -ForegroundColor Green
}

# Create Procfile if it doesn't exist
if (-not (Test-Path "Procfile")) {
    Write-Host "Creating Procfile..." -ForegroundColor Yellow
    "web: node server.js" | Out-File -FilePath "Procfile" -Encoding UTF8
    Write-Host "OK: Procfile created" -ForegroundColor Green
} else {
    Write-Host "OK: Procfile already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "All configuration files ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "  * Dockerfile - Multi-stage build (207MB)"
Write-Host "  * railway.json - Build configuration"
Write-Host "  * Procfile - Start command"
Write-Host "  * .env - Environment variables"
Write-Host "  * .dockerignore - Build context"
Write-Host ""
Write-Host "Next Steps (Use Railway Dashboard):" -ForegroundColor Yellow
Write-Host "  1. Go to https://railway.app"
Write-Host "  2. Click your sunloc.co.in service"
Write-Host "  3. Go to Settings"
Write-Host "  4. Change Builder to Dockerfile"
Write-Host "  5. Click Deploy"
Write-Host ""
