# PowerShell script to fix database schema mismatch

Write-Host "🔧 Fixing database schema mismatch..." -ForegroundColor Green

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Current DATABASE_URL: $($env:DATABASE_URL.Substring(0, [Math]::Min(30, $env:DATABASE_URL.Length)))..." -ForegroundColor Yellow

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Force reset the database schema
Write-Host "🔄 Resetting database schema..." -ForegroundColor Yellow
npx prisma db push --force-reset --accept-data-loss

# Seed the database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "✅ Database schema fixed and seeded successfully!" -ForegroundColor Green
Write-Host "🚀 You can now restart your application." -ForegroundColor Green 