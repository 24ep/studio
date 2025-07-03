# Debug Session Issues Script
# This script helps diagnose session-related problems

Write-Host "=== Session Debug Script ===" -ForegroundColor Green
Write-Host ""

# Check if we can connect to the health endpoint
Write-Host "1. Testing application health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://159.89.193.226:9846/api/health" -Method GET -TimeoutSec 10
    Write-Host "   ✓ Application is responding" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Cyan
    Write-Host "   Database Status: $($healthResponse.database.status)" -ForegroundColor Cyan
    Write-Host "   User Count: $($healthResponse.database.userCount)" -ForegroundColor Cyan
} catch {
    Write-Host "   ✗ Application health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check if we can access the signin page
Write-Host "2. Testing signin page accessibility..." -ForegroundColor Yellow
try {
    $signinResponse = Invoke-WebRequest -Uri "http://159.89.193.226:9846/auth/signin" -Method GET -TimeoutSec 10
    Write-Host "   ✓ Signin page is accessible (Status: $($signinResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Signin page access failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check if we can access the validate-session endpoint
Write-Host "3. Testing session validation endpoint..." -ForegroundColor Yellow
try {
    $validateResponse = Invoke-WebRequest -Uri "http://159.89.193.226:9846/api/auth/validate-session" -Method GET -TimeoutSec 10
    Write-Host "   ✓ Session validation endpoint is accessible (Status: $($validateResponse.StatusCode))" -ForegroundColor Green
    $validateContent = $validateResponse.Content | ConvertFrom-Json
    Write-Host "   Response: $($validateContent | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "   ✗ Session validation endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check environment variables (if running locally)
Write-Host "4. Checking environment configuration..." -ForegroundColor Yellow
$envVars = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET", 
    "NEXTAUTH_URL"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "   ✓ $var is set" -ForegroundColor Green
        if ($var -eq "DATABASE_URL") {
            # Mask the password in the URL
            $maskedUrl = $value -replace "://[^:]+:[^@]+@", "://***:***@"
            Write-Host "   Value: $maskedUrl" -ForegroundColor Cyan
        } else {
            Write-Host "   Value: $($value.Substring(0, [Math]::Min(20, $value.Length)))..." -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ✗ $var is not set" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Debug Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "If you're still experiencing session issues:" -ForegroundColor Yellow
Write-Host "1. Check the application logs for '[SESSION VALIDATION]' messages" -ForegroundColor White
Write-Host "2. Verify the database contains valid user records" -ForegroundColor White
Write-Host "3. Ensure NEXTAUTH_SECRET is consistent across deployments" -ForegroundColor White
Write-Host "4. Check if the database connection is stable" -ForegroundColor White 