@echo off
REM Android Build Script for StriverApp (Windows)
REM React Native 0.75.4 + Android Gradle Plugin 8.6.0

echo 🤖 Starting Android build process...
echo.

REM Check if we're in the android directory
if not exist "build.gradle" (
    echo ❌ Error: Must run from android\ directory
    exit /b 1
)

REM Check for google-services.json
if not exist "app\google-services.json" (
    echo ⚠️  Warning: google-services.json not found
    echo    Firebase features may not work properly
)

REM Clean previous builds
echo 🧹 Cleaning previous builds...
call gradlew.bat clean

REM Build debug APK
echo.
echo 🔨 Building debug APK...
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo.
    echo 📦 APK location:
    echo    app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on device/emulator, run:
    echo    adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Or run the app directly:
    echo    cd .. ^&^& npx react-native run-android
) else (
    echo.
    echo ❌ Build failed!
    exit /b 1
)
