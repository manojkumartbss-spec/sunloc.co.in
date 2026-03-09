# Quick deployment script for Sunloc Server to Docker Hub (PowerShell)
# Usage: .\deploy.ps1

param(
    [string]$DockerUsername = ""
)

# Configuration
$DOCKER_REGISTRY = "docker.io"
$IMAGE_NAME = "sunloc-server"
$BUILD_PLATFORMS = "linux/amd64,linux/arm64,linux/arm/v7"

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Warning "=== Sunloc Server Docker Hub Deployment ==="
Write-Host ""

# Step 1: Check prerequisites
Write-Warning "Step 1: Checking prerequisites..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Docker is not installed"
    exit 1
}

$dockerVersion = docker version --format='{{.Server.Version}}'
Write-Success "✅ Docker version: $dockerVersion"

# Step 2: Get Docker Hub credentials
if ([string]::IsNullOrEmpty($DockerUsername)) {
    Write-Warning "Step 2: Docker Hub Authentication"
    $DockerUsername = Read-Host "Enter your Docker Hub username"
}

# Check if logged in
$isLoggedIn = docker info 2>&1 | Select-String -Pattern "Username: $DockerUsername"
if (-not $isLoggedIn) {
    Write-Warning "Not authenticated. Please log in to Docker Hub..."
    docker login
}

Write-Success "✅ Authenticated as $DockerUsername"
Write-Host ""

# Step 3: Build options
Write-Warning "Step 3: Build Options"
Write-Host "1. Build for current platform only (fast, local test)"
Write-Host "2. Build for all platforms & push to Docker Hub (slow, but multiarch)"
Write-Host "3. Build for current platform & push (faster multiarch test)"
$buildOption = Read-Host "Choose option (1-3)"

switch ($buildOption) {
    "1" {
        Write-Warning "`nBuilding for current platform..."
        docker buildx bake -f docker-bake.hcl `
            --set "DOCKER_NAMESPACE=$DockerUsername"
        Write-Success "✅ Build complete. Image: $DOCKER_REGISTRY/$DockerUsername/$IMAGE_NAME`:latest"
    }
    "2" {
        Write-Warning "`nBuilding for all platforms and pushing..."
        docker buildx bake -f docker-bake.hcl --push `
            --set "DOCKER_NAMESPACE=$DockerUsername"
        Write-Success "✅ Image pushed to Docker Hub!"
        Write-Host "Access at: https://hub.docker.com/r/$DockerUsername/$IMAGE_NAME"
    }
    "3" {
        Write-Warning "`nBuilding current platform and pushing..."
        docker build -t "$DOCKER_REGISTRY/$DockerUsername/$IMAGE_NAME`:latest" .
        docker push "$DOCKER_REGISTRY/$DockerUsername/$IMAGE_NAME`:latest"
        Write-Success "✅ Image pushed to Docker Hub!"
        Write-Host "Access at: https://hub.docker.com/r/$DockerUsername/$IMAGE_NAME"
    }
    default {
        Write-Error "Invalid option"
        exit 1
    }
}

# Step 4: Verify push
Write-Warning "`nStep 4: Verifying image..."
$pullResult = docker pull "$DOCKER_REGISTRY/$DockerUsername/$IMAGE_NAME`:latest" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "✅ Image verified and pulled successfully"
} else {
    Write-Error "❌ Failed to pull image"
    exit 1
}

# Step 5: Display next steps
Write-Warning "`n=== Deployment Complete ==="
Write-Success "`nNext steps:"
Write-Host "1. View on Docker Hub: https://hub.docker.com/r/$DockerUsername/$IMAGE_NAME"
Write-Host "2. Test locally: docker run -p 3000:3000 $DOCKER_REGISTRY/$DockerUsername/$IMAGE_NAME`:latest"
Write-Host "3. Deploy with compose: docker-compose up -d"
Write-Host "4. Set up automated builds:"
Write-Host "   - Go to https://build.docker.com"
Write-Host "   - Connect your GitHub repository"
Write-Host "   - Enable auto-builds on push"
Write-Warning "`nDocumentation: See DEPLOYMENT.md for full guide"
