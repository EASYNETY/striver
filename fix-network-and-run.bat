@echo off
echo ========================================
echo Fix Network Request Failed Error
echo ========================================
echo.

echo This script will:
echo 1. Clean Android build cache
echo 2. Rebuild the app with network config
echo 3. Install on your device
echo 4. Start Metro bundler
echo.
pause

echo.
echo Step 1: Cleaning Android build...
cd android
call gradlew clean
if errorlevel 1 (
    echo ERROR: Clean failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Building APK with network security config...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Step 3: Installing on device...
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
if errorlevel 1 (
    echo ERROR: Installation failed! Make sure device is connected.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build successful!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Metro bundler will start automatically
echo 2. Wait for "Bundled successfully" message
echo 3. Open the app on your device
echo 4. Click "Start Verification" button
echo 5. Check logs for network requests
echo.
echo Starting Metro bundler...
echo.

start "Metro Bundler" cmd /k "npm start"

echo.
echo ========================================
echo Metro bundler started in new window
echo ========================================
echo.
echo The app should now work!
echo Test the "Start Verification" button.
echo.
pause
