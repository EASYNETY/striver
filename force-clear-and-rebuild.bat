@echo off
echo ========================================
echo FORCE CLEAR AND REBUILD
echo ========================================
echo.

echo Step 1: Force stop app...
adb shell am force-stop com.striverapp
echo.

echo Step 2: Completely uninstall app...
adb uninstall com.striverapp
echo.

echo Step 3: Clear Metro bundler cache...
cd android
call gradlew clean
cd ..
rmdir /s /q node_modules\.cache 2>nul
echo.

echo Step 4: Clean Android build...
cd android
rmdir /s /q app\build 2>nul
rmdir /s /q build 2>nul
echo.

echo Step 5: Build fresh APK...
call gradlew assembleDebug
echo.

echo Step 6: Install fresh app...
adb install app\build\outputs\apk\debug\app-debug.apk
echo.

echo Step 7: Clear app data...
adb shell pm clear com.striverapp
echo.

echo Step 8: Start app...
adb shell am start -n com.striverapp/.MainActivity
echo.

echo ========================================
echo COMPLETE! App is now fresh.
echo ========================================
echo.
echo Now test:
echo 1. Select "Family Account"
echo 2. Enter phone and verify
echo 3. Enter DOB (18+)
echo 4. Should see "Parent Age Verification" with Ondato
echo.

cd ..
pause
