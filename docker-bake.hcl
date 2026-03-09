# Docker Bake configuration for multi-platform builds
# Usage: docker buildx bake -f docker-bake.hcl
# Usage (push to registry): docker buildx bake -f docker-bake.hcl --push

variable "DOCKER_REGISTRY" {
  default = "docker.io"
}

variable "DOCKER_NAMESPACE" {
  default = "your-docker-username"  # CHANGE THIS to your Docker Hub username
}

variable "IMAGE_NAME" {
  default = "sunloc-server"
}

variable "IMAGE_TAG" {
  default = "latest"
}

variable "DOCKER_PUSH" {
  default = false  # Set to true when pushing to registry
}

group "default" {
  targets = ["sunloc-server"]
}

target "sunloc-server" {
  dockerfile = "Dockerfile"
  context    = "."
  
  # Multi-platform build support
  platforms = [
    "linux/amd64",    # Intel/AMD 64-bit
    "linux/arm64",    # Apple Silicon, ARM servers
    "linux/arm/v7"    # 32-bit ARM (Raspberry Pi, older devices)
  ]
  
  # Image metadata
  tags = [
    "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}",
    "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${IMAGE_NAME}:latest"
  ]
  
  # Build arguments
  args = {
    NODE_ENV = "production"
  }
  
  # Build cache settings
  cache-from = [
    "type=gha"  # GitHub Actions cache (if using GitHub Actions)
  ]
  cache-to = [
    "type=gha,mode=max"  # Upload cache for next builds
  ]
  
  # Push to registry (enable with --push flag)
  push = DOCKER_PUSH
}
