@echo off
echo ========================================
echo BUILD ANDROID APP - FIXED VERSION
echo ========================================
echo.
echo This will build the Android app with proper CMake configuration.
echo.
echo Changes made:
echo - Enabled Reanimated C++ build (required for gestures)
echo - Increased Gradle memory to 6GB
echo - Clean build from scratch
echo.
pause

echo Step 1: Stopping Gradle daemon...
cd android
call gradlew --stop
timeout /t 2 /nobreak >nul
echo ✓ Gradle daemon stopped
echo.

echo Step 2: Cleaning all build artifacts...
if exist .gradle rmdir /s /q .gradle
if exist build rmdir /s /q build
if exist app\build rmdir /s /q app\build
if exist app\.cxx rmdir /s /q app\.cxx
call gradlew clean
echo ✓ Cleaned build artifacts
echo.

echo Step 3: Cleaning CMake cache for react-native-reanimated...
cd ..
if exist "node_modules\react-native-reanimated\android\.cxx" rmdir /s /q "node_modules\react-native-reanimated\android\.cxx"
if exist "node_modules\react-native-reanimated\android\build" rmdir /s /q "node_modules\react-native-reanimated\android\build"
echo ✓ Cleaned CMake cache
echo.

echo Step 4: Building Android app...
echo This may take 10-20 minutes on first build...
echo.
cd android
call gradlew assembleDebug --no-daemon --info

if errorlevel 1 (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo ========================================
    echo.
    echo Common issues and solutions:
    echo.
    echo 1. NDK not installed or wrong version:
    echo    - Open Android Studio
    echo    - Tools ^> SDK Manager ^> SDK Tools
    echo    - Install "NDK (Side by side)" version 25.1.8937393
    echo.
    echo 2. CMake not installed:
    echo    - In SDK Manager, install "CMake" version 3.22.1
    echo.
    echo 3. Out of memory:
    echo    - Close other applications
    echo    - Increase system RAM if possible
    echo.
    echo 4. Path issues (spaces in path):
    echo    - Your project path has spaces: "Jack Shaw"
    echo    - Consider moving to: E:\Users\HP\Downloads\Striver
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
echo To install on device:
echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Or run:
echo   npm run android
echo.
pause
