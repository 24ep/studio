Write-Host "🔧 Setting up environment configuration..." -ForegroundColor Green

# Check if .env file already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists. Backing up to .env.backup" -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup"
}

# Generate a secure API key
$timestamp = Get-Date -UFormat %s
$random = Get-Random -Minimum 100000 -Maximum 999999
$API_KEY = "studio_processor_key_${timestamp}_${random}"

Write-Host "🔑 Generated PROCESSOR_API_KEY: $API_KEY" -ForegroundColor Cyan

# Copy template and replace placeholder values
Copy-Item "env.internal.template" ".env"

# Replace the PROCESSOR_API_KEY placeholder
$content = Get-Content ".env" -Raw
$content = $content -replace "# PROCESSOR_API_KEY=your_processor_api_key", "PROCESSOR_API_KEY=$API_KEY"
Set-Content ".env" $content

Write-Host "✅ Environment file created with PROCESSOR_API_KEY" -ForegroundColor Green
Write-Host "📝 Please review .env file and update other values as needed" -ForegroundColor Yellow
Write-Host "🚀 To start all services including queue processor, run:" -ForegroundColor Cyan
Write-Host "   docker-compose up -d" -ForegroundColor White 