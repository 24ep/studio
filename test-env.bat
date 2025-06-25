@echo off
echo Testing environment configuration...
echo.

if not exist .env (
    echo ERROR: .env file not found!
    echo Please run setup-env.bat first to create your .env file.
    pause
    exit /b 1
)

echo Checking essential environment variables...
echo.

set /a missing_vars=0

REM Check essential variables
if "%NEXTAUTH_SECRET%"=="" (
    echo [MISSING] NEXTAUTH_SECRET - Required for authentication
    set /a missing_vars+=1
) else (
    echo [OK] NEXTAUTH_SECRET is set
)

if "%DATABASE_URL%"=="" (
    echo [MISSING] DATABASE_URL - Required for database connection
    set /a missing_vars+=1
) else (
    echo [OK] DATABASE_URL is set
)

if "%MINIO_ACCESS_KEY%"=="" (
    echo [MISSING] MINIO_ACCESS_KEY - Required for file storage
    set /a missing_vars+=1
) else (
    echo [OK] MINIO_ACCESS_KEY is set
)

if "%MINIO_SECRET_KEY%"=="" (
    echo [MISSING] MINIO_SECRET_KEY - Required for file storage
    set /a missing_vars+=1
) else (
    echo [OK] MINIO_SECRET_KEY is set
)

if "%NEXTAUTH_URL%"=="" (
    echo [MISSING] NEXTAUTH_URL - Required for authentication
    set /a missing_vars+=1
) else (
    echo [OK] NEXTAUTH_URL is set
)

if "%PROCESSOR_API_KEY%"=="" (
    echo [MISSING] PROCESSOR_API_KEY - Required for background processor
    set /a missing_vars+=1
) else (
    echo [OK] PROCESSOR_API_KEY is set
)

echo.
echo Checking optional variables...
echo.

if "%GOOGLE_API_KEY%"=="" (
    echo [INFO] GOOGLE_API_KEY not set - Google AI features will be disabled
) else (
    echo [OK] GOOGLE_API_KEY is set
)

if "%AZURE_AD_CLIENT_ID%"=="" (
    echo [INFO] AZURE_AD_CLIENT_ID not set - Azure AD SSO will be disabled
) else (
    echo [OK] AZURE_AD_CLIENT_ID is set
)

if "%N8N_RESUME_WEBHOOK_URL%"=="" (
    echo [INFO] N8N_RESUME_WEBHOOK_URL not set - n8n automation will be disabled
) else (
    echo [OK] N8N_RESUME_WEBHOOK_URL is set
)

if "%WS_QUEUE_BRIDGE_PORT%"=="" (
    echo [INFO] WS_QUEUE_BRIDGE_PORT not set - using default port 3002
) else (
    echo [OK] WS_QUEUE_BRIDGE_PORT is set
)

if "%NEXT_PUBLIC_WS_QUEUE_BRIDGE_URL%"=="" (
    echo [INFO] NEXT_PUBLIC_WS_QUEUE_BRIDGE_URL not set - using default ws://localhost:3002
) else (
    echo [OK] NEXT_PUBLIC_WS_QUEUE_BRIDGE_URL is set
)

echo.
echo ========================================
if %missing_vars% gtr 0 (
    echo TEST FAILED: %missing_vars% essential variables are missing!
    echo Please update your .env file with the required values.
) else (
    echo TEST PASSED: All essential variables are configured!
    echo You can now start the application with: docker-compose up -d
)
echo ========================================
echo.

pause 