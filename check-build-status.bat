@echo off
echo ========================================
echo Checking Build Status
echo ========================================
echo.

echo Checking if APK exists...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ✅ BUILD COMPLETE!
    echo.
    echo APK found at: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Next step: Run ./install-apk-now.bat
    echo.
) else (
    echo.
    echo ⏳ BUILD STILL RUNNING...
    echo.
    echo Wait for the build to complete, then run this script again.
    echo You'll see "BUILD SUCCESSFUL" message when done.
    echo.
)

pause
