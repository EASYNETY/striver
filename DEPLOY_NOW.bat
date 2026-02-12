@echo off
echo.
echo ╔════════════════════════════════════════╗
echo ║   STRIVER MENTOR SYSTEM DEPLOYMENT    ║
echo ╚════════════════════════════════════════╝
echo.
echo Ready to deploy? This will:
echo.
echo  1. Check if everything is ready
echo  2. Build the admin panel
echo  3. Deploy to Firebase Hosting
echo  4. Show you the live URL
echo.
echo Press any key to start, or Ctrl+C to cancel...
pause >nul

cls
call check-deployment-ready.bat

echo.
echo.
echo Continue with deployment? (Y/N)
set /p CONTINUE=
if /i not "%CONTINUE%"=="Y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

cls
call deploy-admin-panel.bat

echo.
echo ╔════════════════════════════════════════╗
echo ║         DEPLOYMENT COMPLETE!           ║
echo ╚════════════════════════════════════════╝
echo.
echo Your admin panel is live!
echo.
echo Next: Rebuild your mobile app
echo   npm run android
echo   or
echo   npm run ios
echo.
pause
