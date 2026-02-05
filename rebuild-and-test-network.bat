@echo off
echo ========================================
echo Rebuild Android App with Network Config
echo ========================================
echo.

echo Step 1: Clean build cache...
cd android
call gradlew clean
cd ..

echo.
echo Step 2: Rebuild APK...
cd android
call gradlew assembleDebug
cd ..

echo.
echo Step 3: Install on device...
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

echo.
echo ========================================
echo Done! Now start Metro bundler:
echo   npm start
echo.
echo Then test the "Start Verification" button
echo ========================================
pause
