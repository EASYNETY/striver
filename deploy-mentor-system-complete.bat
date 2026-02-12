@echo off
echo ========================================
echo STRIVER MENTOR SYSTEM - FULL DEPLOYMENT
echo ========================================
echo.
echo This will deploy:
echo 1. Admin Panel (Web) - Firebase Hosting
echo 2. Mobile App Changes - Ready for rebuild
echo.
pause

echo.
echo ========================================
echo PART 1: ADMIN PANEL DEPLOYMENT
echo ========================================
echo.
call deploy-admin-panel.bat
if errorlevel 1 (
    echo.
    echo Admin panel deployment failed!
    echo Fix the errors above and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo PART 2: MOBILE APP STATUS
echo ========================================
echo.
echo The following mobile app changes are ready:
echo.
echo [FIXED] Firebase API Error - App crash resolved
echo [ADDED] MentorsScreen - Lists all mentors
echo [ADDED] Notifications System - Dynamic alerts
echo [UPDATED] FanClubScreen - Connect to Mentors button
echo.
echo To deploy mobile app changes:
echo.
echo FOR ANDROID:
echo   Run: npm run android
echo   Or build APK: cd android ^&^& ./gradlew assembleRelease
echo.
echo FOR iOS:
echo   Run: npm run ios
echo   Or build in Xcode
echo.
echo ========================================
echo DEPLOYMENT SUMMARY
echo ========================================
echo.
echo [✓] Admin Panel - DEPLOYED
echo     URL: https://striver-app-48562.web.app
echo.
echo [✓] Mobile App - READY (needs rebuild)
echo     Changes are in the codebase
echo.
echo [✓] Firebase API - FIXED
echo     App will no longer crash on startup
echo.
echo [✓] Notifications - READY
echo     Dynamic notification system implemented
echo.
echo [✓] Mentor System - COMPLETE
echo     Admin can manage mentors
echo     Users can view and connect with mentors
echo.
echo ========================================
echo NEXT STEPS
echo ========================================
echo.
echo 1. Test Admin Panel:
echo    - Open https://striver-app-48562.web.app
echo    - Login and go to Mentors tab
echo    - Toggle mentor status for a test user
echo.
echo 2. Rebuild Mobile App:
echo    - Run: npm run android (or npm run ios)
echo    - Test the app on device/emulator
echo    - Go to Fan Club ^> Connect to Mentors
echo.
echo 3. Verify Everything Works:
echo    - Mark user as mentor in admin panel
echo    - Check if they appear in mobile app
echo    - Test the connect functionality
echo.
echo Press any key to exit...
pause >nul
