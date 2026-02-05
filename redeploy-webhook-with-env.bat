@echo off
echo ========================================
echo Redeploying Webhook with Environment Variables
echo ========================================
echo.

echo Step 1: Checking .env file exists...
if exist "functions\.env" (
    echo ✓ .env file found
) else (
    echo ✗ .env file NOT found!
    echo Please ensure functions/.env exists with webhook credentials
    pause
    exit /b 1
)

echo.
echo Step 2: Building functions...
cd functions
call npm run build

echo.
echo Step 3: Deploying all functions (includes webhook)...
cd ..
call firebase deploy --only functions

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Webhook URL: https://ondatowebhook-hphu25tfqq-uc.a.run.app
echo.
echo Next: Test the webhook
echo Run: node test-webhook-simple.js
echo.
pause
