#!/bin/bash
# Quick deployment script for Sunloc Server to Docker Hub

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-""}
DOCKER_REGISTRY="docker.io"
IMAGE_NAME="sunloc-server"
BUILD_PLATFORMS="linux/amd64,linux/arm64,linux/arm/v7"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Sunloc Server Docker Hub Deployment ===${NC}\n"

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker buildx &> /dev/null; then
    echo -e "${RED}❌ Docker buildx is not installed${NC}"
    echo "Install it with: docker buildx create --use"
    exit 1
fi

# Step 2: Get Docker Hub credentials
if [ -z "$DOCKER_USERNAME" ]; then
    echo -e "\n${YELLOW}Step 2: Docker Hub Authentication${NC}"
    read -p "Enter your Docker Hub username: " DOCKER_USERNAME
fi

# Check if logged in
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
    echo -e "${YELLOW}Not authenticated. Please log in to Docker Hub...${NC}"
    docker login
fi

echo -e "${GREEN}✅ Authenticated as $DOCKER_USERNAME${NC}\n"

# Step 3: Build options
echo -e "${YELLOW}Step 3: Build Options${NC}"
echo "1. Build for current platform only (fast, local test)"
echo "2. Build for all platforms & push to Docker Hub (slow, but multiarch)"
echo "3. Build for current platform & push (faster multiarch test)"
read -p "Choose option (1-3): " BUILD_OPTION

case $BUILD_OPTION in
    1)
        echo -e "\n${YELLOW}Building for current platform...${NC}"
        docker buildx bake -f docker-bake.hcl \
            --set "DOCKER_NAMESPACE=$DOCKER_USERNAME"
        echo -e "${GREEN}✅ Build complete. Image: $DOCKER_REGISTRY/$DOCKER_USERNAME/$IMAGE_NAME:latest${NC}"
        ;;
    2)
        echo -e "\n${YELLOW}Building for all platforms and pushing...${NC}"
        docker buildx bake -f docker-bake.hcl --push \
            --set "DOCKER_NAMESPACE=$DOCKER_USERNAME"
        echo -e "${GREEN}✅ Image pushed to Docker Hub!${NC}"
        echo -e "Access at: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
        ;;
    3)
        echo -e "\n${YELLOW}Building current platform and pushing...${NC}"
        docker build -t $DOCKER_REGISTRY/$DOCKER_USERNAME/$IMAGE_NAME:latest .
        docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/$IMAGE_NAME:latest
        echo -e "${GREEN}✅ Image pushed to Docker Hub!${NC}"
        echo -e "Access at: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

# Step 4: Verify push
echo -e "\n${YELLOW}Step 4: Verifying image...${NC}"
if docker pull $DOCKER_REGISTRY/$DOCKER_USERNAME/$IMAGE_NAME:latest &> /dev/null; then
    echo -e "${GREEN}✅ Image verified and pulled successfully${NC}"
else
    echo -e "${RED}❌ Failed to pull image${NC}"
    exit 1
fi

# Step 5: Display next steps
echo -e "\n${YELLOW}=== Deployment Complete ===${NC}"
echo -e "\n${GREEN}Next steps:${NC}"
echo "1. View on Docker Hub: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
echo "2. Test locally: docker run -p 3000:3000 $DOCKER_REGISTRY/$DOCKER_USERNAME/$IMAGE_NAME:latest"
echo "3. Deploy with compose:"
echo "   docker-compose up -d"
echo "4. Set up automated builds:"
echo "   - Go to https://build.docker.com"
echo "   - Connect your GitHub repository"
echo "   - Enable auto-builds on push"
echo -e "\n${YELLOW}Documentation: See DEPLOYMENT.md for full guide${NC}"
