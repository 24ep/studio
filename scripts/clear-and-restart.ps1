# Clear and Restart Script
# This script clears Next.js cache, stops all node processes, and restarts the dev server

Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Cyan

# Remove .next directory
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

# Remove node_modules/.cache if it exists
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "🛑 Stopping all Node processes..." -ForegroundColor Cyan

# Stop all node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
Write-Host "✅ Stopped all Node processes" -ForegroundColor Green

Write-Host ""
Write-Host "⏳ Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host ""

# Start the dev server
npm run dev
