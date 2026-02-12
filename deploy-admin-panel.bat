@echo off
echo ========================================
echo STRIVER ADMIN PANEL DEPLOYMENT
echo ========================================
echo.
echo This will build and deploy the admin panel
echo to Firebase Hosting
echo.
echo Project: striver-app-48562
echo Target: admin
echo.
pause

echo.
echo [1/4] Checking Firebase CLI...
echo ========================================
call firebase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI not found!
    echo.
    echo Please install Firebase CLI:
    echo npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)
echo Firebase CLI found!

echo.
echo [2/4] Building Admin Panel...
echo ========================================
cd admin-panel
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    cd ..
    pause
    exit /b 1
)

echo.
echo Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Build complete!

echo.
echo [3/4] Deploying to Firebase Hosting...
echo ========================================
call firebase deploy --only hosting:admin
if errorlevel 1 (
    echo ERROR: Deployment failed!
    echo.
    echo Common issues:
    echo - Not logged in: Run 'firebase login'
    echo - Wrong project: Run 'firebase use striver-app-48562'
    echo - Permission denied: Check Firebase project permissions
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Deployment Complete!
echo ========================================
echo.
echo Your admin panel is now live at:
echo https://striver-app-48562.web.app
echo.
echo Next steps:
echo 1. Open the URL above
echo 2. Login with your admin credentials
echo 3. Go to Mentors tab to manage mentors
echo.
echo Press any key to exit...
pause >nul
