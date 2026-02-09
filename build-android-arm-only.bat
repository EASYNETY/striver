@echo off
echo ========================================
echo BUILD ANDROID APP - ARM ONLY (FASTER)
echo ========================================
echo.
echo This builds ONLY for ARM devices (real phones).
echo This skips x86/x86_64 which is causing the CMake error.
echo.
echo Use this if:
echo - You're testing on a real Android device
echo - You want a faster build
echo - CMake is failing on x86_64
echo.
echo Don't use this if:
echo - You need to test on an emulator
echo.
pause

echo Cleaning build artifacts...
cd android
if exist app\build rmdir /s /q app\build
if exist app\.cxx rmdir /s /q app\.cxx
call gradlew clean
echo ✓ Cleaned
echo.

echo Building for ARM devices only...
echo This should be much faster (5-10 minutes)...
echo.
call gradlew assembleDebug -PreactNativeArchitectures=armeabi-v7a,arm64-v8a

if errorlevel 1 (
    echo.
    echo BUILD FAILED
    echo Try the full build: ./build-android-fixed.bat
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
echo APK built for ARM devices only (real phones).
echo.
echo To install on your phone:
echo   1. Enable USB debugging on your phone
echo   2. Connect via USB
echo   3. Run: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Or simply run: npm run android
echo.
pause
