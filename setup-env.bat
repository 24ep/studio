@echo off
echo Setting up environment variables...

if exist .env (
    echo .env file already exists!
    echo Please backup your current .env file and run this script again.
    pause
    exit /b 1
)

if not exist .env.example (
    echo .env.example file not found!
    echo Please make sure .env.example exists in the current directory.
    pause
    exit /b 1
)

echo Copying .env.example to .env...
copy .env.example .env

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Environment file created successfully!
    echo ========================================
    echo.
    echo Please edit the .env file with your actual values:
    echo - Update database credentials
    echo - Set your NextAuth secret
    echo - Configure MinIO settings
    echo - Add your API keys
    echo - Update webhook URLs
    echo.
    echo After editing .env, you can start the services with:
    echo docker-compose up -d
    echo.
) else (
    echo Failed to create .env file!
)

pause 