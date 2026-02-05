@echo off
echo ========================================
echo Deploying Ondato Proxy Worker
echo ========================================
echo.

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Wrangler CLI not found!
    echo Please install it with: npm install -g wrangler
    echo.
    pause
    exit /b 1
)

echo Step 1: Checking Wrangler login status...
wrangler whoami
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo You need to login to Cloudflare first.
    echo Running: wrangler login
    echo.
    wrangler login
)

echo.
echo Step 2: Deploying worker...
echo.
wrangler deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Worker deployed successfully!
    echo ========================================
    echo.
    echo Your worker URL should be:
    echo https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev
    echo.
    echo Next steps:
    echo 1. Update CLOUDFLARE_WORKER_URL in src/services/ondatoService.ts
    echo 2. Test the worker with: curl https://your-worker-url/health
    echo 3. Update Ondato credentials in the worker code
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Deployment failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause
