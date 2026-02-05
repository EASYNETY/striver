@echo off
echo ========================================
echo Deploy Webhook with Environment Variables
echo ========================================
echo.

REM Check firebase.json
if not exist "firebase.json" (
    if exist "firebase-new.json" (
        copy firebase-new.json firebase.json >nul
        echo Created firebase.json
    )
)

REM Build functions
echo Building functions...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

REM Deploy
echo.
echo Deploying to Firebase...
call firebase deploy --only functions

echo.
echo ========================================
echo Done! Test with: node test-webhook-simple.js
echo ========================================
pause
