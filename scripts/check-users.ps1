# Check Users Script
# This script helps verify user data in the database

Write-Host "=== User Data Check Script ===" -ForegroundColor Green
Write-Host ""

# Database connection parameters (update these as needed)
$dbHost = "159.89.193.226"
$dbPort = "5432"
$dbName = "studio_db"
$dbUser = "studio_user"
$dbPassword = "StudioSecurePass2024!"

Write-Host "1. Testing database connection..." -ForegroundColor Yellow

try {
    # Test connection using psql (if available)
    $testQuery = "SELECT version();"
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $testQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Database connection failed" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ✗ psql command not found or failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please ensure PostgreSQL client tools are installed" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "2. Checking user table structure..." -ForegroundColor Yellow

try {
    $structureQuery = @"
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;
"@
    
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $structureQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ User table structure retrieved" -ForegroundColor Green
        Write-Host "   Columns found:" -ForegroundColor Cyan
        $result | Select-String -Pattern "^\s*\w+" | ForEach-Object {
            $line = $_.ToString().Trim()
            if ($line -and -not $line.StartsWith("column_name")) {
                Write-Host "     $line" -ForegroundColor White
            }
        }
    } else {
        Write-Host "   ✗ Failed to get table structure" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error checking table structure: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

Write-Host "3. Checking user count..." -ForegroundColor Yellow

try {
    $countQuery = "SELECT COUNT(*) as user_count FROM \"User\";"
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $countQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $userCount = ($result | Select-String -Pattern "\d+").ToString().Trim()
        Write-Host "   ✓ Total users in database: $userCount" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Failed to get user count" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error getting user count: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

Write-Host "4. Checking sample user data..." -ForegroundColor Yellow

try {
    $sampleQuery = @"
SELECT 
    id, 
    name, 
    email, 
    role, 
    "createdAt",
    "authenticationMethod"
FROM "User" 
LIMIT 5;
"@
    
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $sampleQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Sample user data retrieved" -ForegroundColor Green
        Write-Host "   Sample users:" -ForegroundColor Cyan
        $result | Select-String -Pattern "^\s*\w+" | ForEach-Object {
            $line = $_.ToString().Trim()
            if ($line -and -not $line.StartsWith("id")) {
                Write-Host "     $line" -ForegroundColor White
            }
        }
    } else {
        Write-Host "   ✗ Failed to get sample user data" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error getting sample user data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

Write-Host "5. Checking for users with missing data..." -ForegroundColor Yellow

try {
    $missingQuery = @"
SELECT 
    COUNT(*) as missing_count,
    'Missing email' as issue
FROM "User" 
WHERE email IS NULL OR email = ''
UNION ALL
SELECT 
    COUNT(*) as missing_count,
    'Missing name' as issue
FROM "User" 
WHERE name IS NULL OR name = ''
UNION ALL
SELECT 
    COUNT(*) as missing_count,
    'Missing role' as issue
FROM "User" 
WHERE role IS NULL OR role = '';
"@
    
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $missingQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Data integrity check completed" -ForegroundColor Green
        $result | Select-String -Pattern "^\s*\d+" | ForEach-Object {
            $line = $_.ToString().Trim()
            if ($line) {
                $parts = $line -split "\s+"
                if ($parts.Length -ge 2) {
                    $count = $parts[0]
                    $issue = $parts[1..($parts.Length-1)] -join " "
                    if ([int]$count -gt 0) {
                        Write-Host "     ⚠ $issue: $count users" -ForegroundColor Yellow
                    } else {
                        Write-Host "     ✓ $issue: $count users" -ForegroundColor Green
                    }
                }
            }
        }
    } else {
        Write-Host "   ✗ Failed to check data integrity" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error checking data integrity: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== User Data Check Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host "1. Ensure all users have valid email, name, and role values" -ForegroundColor White
Write-Host "2. Check that user IDs are properly formatted UUIDs" -ForegroundColor White
Write-Host "3. Verify that passwords are properly hashed" -ForegroundColor White
Write-Host "4. Ensure the database connection is stable" -ForegroundColor White 