param (
    [string]$Registry = "registry.example.com",
    [string]$Namespace = "ba",
    [string]$ImageName = "hri",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

function Verify-Docker {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker is not running or not accessible."
    }
}

$FullImageName = "$Registry/$Namespace/$ImageName"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Registry:  $Registry"
Write-Host "  Namespace: $Namespace"
Write-Host "  Image:     $ImageName"
Write-Host "  Tag:       $Tag"
Write-Host "  Full Name: ${FullImageName}:$Tag"
Write-Host ""

# Check Docker connection
Verify-Docker

Write-Host "Building Docker image..." -ForegroundColor Cyan
# Build
docker build -t "${FullImageName}:$Tag" -f Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed."
}

Write-Host "Pushing to registry..." -ForegroundColor Cyan
docker push "${FullImageName}:$Tag"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed. Ensure you are logged in using: docker login $Registry -u <username> -p <password>"
}

Write-Host "Success! Image pushed to ${FullImageName}:$Tag" -ForegroundColor Green
