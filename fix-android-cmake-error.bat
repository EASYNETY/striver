@echo off
echo ========================================
echo FIX ANDROID CMAKE ERROR
echo ========================================
echo.
echo This will fix the react-native-reanimated CMake build error by:
echo 1. Cleaning all build artifacts
echo 2. Clearing Gradle cache
echo 3. Reinstalling node_modules
echo 4. Rebuilding the app
echo.
echo This may take 10-15 minutes.
echo.
pause

echo Step 1: Cleaning Android build artifacts...
cd android
if exist .gradle rmdir /s /q .gradle
if exist build rmdir /s /q build
if exist app\build rmdir /s /q app\build
if exist app\.cxx rmdir /s /q app\.cxx
echo ✓ Cleaned Android build artifacts
echo.

echo Step 2: Cleaning Gradle cache...
call gradlew clean
echo ✓ Cleaned Gradle cache
echo.

cd ..

echo Step 3: Cleaning node_modules for react-native-reanimated...
if exist "node_modules\react-native-reanimated\android\.cxx" rmdir /s /q "node_modules\react-native-reanimated\android\.cxx"
if exist "node_modules\react-native-reanimated\android\build" rmdir /s /q "node_modules\react-native-reanimated\android\build"
echo ✓ Cleaned reanimated build artifacts
echo.

echo Step 4: Reinstalling react-native-reanimated...
npm uninstall react-native-reanimated
npm install react-native-reanimated@3.15.1
echo ✓ Reinstalled react-native-reanimated
echo.

echo Step 5: Rebuilding Android app...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo ========================================
    echo.
    echo The build still failed. Try these additional steps:
    echo.
    echo 1. Update Android NDK:
    echo    - Open Android Studio
    echo    - Go to Tools ^> SDK Manager ^> SDK Tools
    echo    - Install NDK (Side by side) version 25.1.8937393
    echo.
    echo 2. Check CMake version:
    echo    - Make sure CMake 3.22.1 is installed
    echo    - Install from SDK Manager if missing
    echo.
    echo 3. Try building with Android Studio:
    echo    - Open android folder in Android Studio
    echo    - Let it sync and index
    echo    - Build ^> Make Project
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Next steps:
echo 1. Install on device: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo 2. Or run: npm run android
echo.
pause
