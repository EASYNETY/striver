@echo off
echo ========================================
echo Quick Android Build Fix
echo ========================================
echo.

echo Cleaning everything...
cd android
call gradlew clean
cd ..

echo.
echo Rebuilding from scratch...
npm run android

pause
