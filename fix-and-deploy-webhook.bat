@echo off
echo ========================================
echo Fix and Deploy Webhook with Debugging
echo ========================================
echo.

echo Step 0: Check firebase.json...
if not exist "firebase.json" (
    if exist "firebase-new.json" (
        copy firebase-new.json firebase.json >nul
        echo ✓ Created firebase.json from firebase-new.json
    ) else (
        echo ✗ ERROR: No firebase.json or firebase-new.json found!
        pause
        exit /b 1
    )
) else (
    echo ✓ firebase.json exists
)

echo.
echo Step 1: Verify .env file...
if not exist "functions\.env" (
    echo ✗ ERROR: functions/.env file not found!
    echo.
    echo Creating .env file with webhook credentials...
    (
        echo # Cloudflare Stream Configuration
        echo CLOUDFLARE_ACCOUNT_ID=8a5b8c863ae28bcd1ac70a41b12c0630
        echo CLOUDFLARE_API_TOKEN=DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi
        echo.
        echo # Ondato Age Verification
        echo ONDATO_CLIENT_ID=app.ondato.striver-technoloigies-limited.b653f
        echo ONDATO_CLIENT_SECRET=988801522c607b82cff1b06786cb6499e2e4a97b11443705da2ec42fd486e09b
        echo ONDATO_SETUP_ID=896724ce-42f4-47d3-96b3-db599d07bfe3
        echo ONDATO_API_URL=https://idvapi.ondato.com
        echo ONDATO_AUTH_URL=https://id.ondato.com/connect/token
        echo.
        echo # Ondato Webhook Authentication ^(Basic Auth^)
        echo ONDATO_USERNAME=striver_webhook
        echo ONDATO_PASSWORD=striver_secure_webhook_2024
    ) > functions\.env
    echo ✓ Created .env file
) else (
    echo ✓ .env file exists
)

echo.
echo Step 2: Check webhook credentials in .env...
findstr /C:"ONDATO_USERNAME" functions\.env >nul
if %errorlevel% equ 0 (
    echo ✓ ONDATO_USERNAME found
) else (
    echo ✗ ONDATO_USERNAME missing - adding it...
    echo ONDATO_USERNAME=striver_webhook >> functions\.env
)

findstr /C:"ONDATO_PASSWORD" functions\.env >nul
if %errorlevel% equ 0 (
    echo ✓ ONDATO_PASSWORD found
) else (
    echo ✗ ONDATO_PASSWORD missing - adding it...
    echo ONDATO_PASSWORD=striver_secure_webhook_2024 >> functions\.env
)

echo.
echo Step 3: Build TypeScript functions...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo ✗ Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Step 4: Deploy functions to Firebase...
call firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ✗ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ Deployment Complete!
echo ========================================
echo.
echo Webhook URL: https://ondatowebhook-hphu25tfqq-uc.a.run.app
echo.
echo Next Steps:
echo 1. Check Firebase logs: firebase functions:log --only ondatoWebhook
echo 2. Test webhook: node test-webhook-simple.js
echo.
pause
