@echo off
echo Installing APK...
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    echo Make sure:
    echo 1. Device is connected (run: adb devices)
    echo 2. APK exists (run build first if needed)
    pause
    exit /b 1
)

echo.
echo ========================================
echo APK Installed Successfully!
echo ========================================
echo.
echo Now the network config is applied.
echo Test "Start Verification" button.
echo.
pause
