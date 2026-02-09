@echo off
echo ========================================
echo QUICK FIX FOR CMAKE ERROR
echo ========================================
echo.
echo This will clean the CMake cache and rebuild.
echo.
pause

echo Cleaning CMake cache for react-native-reanimated...
if exist "node_modules\react-native-reanimated\android\.cxx" (
    rmdir /s /q "node_modules\react-native-reanimated\android\.cxx"
    echo ✓ Cleaned .cxx directory
)

if exist "node_modules\react-native-reanimated\android\build" (
    rmdir /s /q "node_modules\react-native-reanimated\android\build"
    echo ✓ Cleaned build directory
)

echo.
echo Cleaning Android build cache...
cd android
if exist app\.cxx rmdir /s /q app\.cxx
if exist app\build rmdir /s /q app\build
call gradlew clean
echo ✓ Cleaned Android cache
echo.

echo Rebuilding app...
call gradlew assembleDebug --no-daemon --stacktrace

if errorlevel 1 (
    echo.
    echo BUILD FAILED - Try the full fix:
    echo   ./fix-android-cmake-error.bat
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
pause
