@echo off
echo ========================================
echo Rebuilding Striver App with Ondato
echo ========================================
echo.

echo Step 1: Cleaning previous build...
cd android
call gradlew clean
echo.

echo Step 2: Building debug APK...
call gradlew assembleDebug
echo.

echo Step 3: Uninstalling old app...
adb uninstall com.striverapp
echo.

echo Step 4: Installing new app...
adb install -r app\build\outputs\apk\debug\app-debug.apk
echo.

echo Step 5: Restarting app...
adb shell am force-stop com.striverapp
timeout /t 2 /nobreak >nul
adb shell am start -n com.striverapp/.MainActivity
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Test Steps:
echo 1. Create a new account
echo 2. Select "Family Account"
echo 3. Enter phone number and verify OTP
echo 4. Enter date of birth (18+)
echo 5. Should see "Parent Age Verification" screen (Ondato)
echo 6. Click "Start Verification"
echo 7. Ondato should open in browser
echo.
echo If you see "Position your face" instead, the old app is still running.
echo Try: adb uninstall com.striverapp and reinstall.
echo.

cd ..
pause
