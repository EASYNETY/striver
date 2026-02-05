@echo off
echo ========================================
echo Deploying Ondato Webhook to Firebase
echo ========================================
echo.

echo Step 1: Building TypeScript functions...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Deploying all functions (to avoid timeout)...
call firebase deploy --only functions --config firebase-new.json

if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Copy the webhook URL from the output above
echo 2. Open ONDATO_WEBHOOK_SETUP.md for configuration instructions
echo 3. Configure the webhook in Ondato dashboard
echo.
echo Webhook URL format:
echo https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
echo.
echo Basic Auth Credentials:
echo Username: striver_webhook
echo Password: striver_secure_webhook_2024
echo.
pause
