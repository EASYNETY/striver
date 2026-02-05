@echo off
echo ========================================
echo Fixing Android Build Issues
echo ========================================
echo.

echo Step 1: Cleaning build cache...
cd android
call gradlew clean
cd ..

echo.
echo Step 2: Clearing React Native cache...
npx react-native start --reset-cache &
timeout /t 3
taskkill /F /IM node.exe

echo.
echo Step 3: Removing build folders...
rmdir /s /q android\app\build
rmdir /s /q android\build

echo.
echo Step 4: Clearing Gradle cache...
cd android
call gradlew cleanBuildCache
cd ..

echo.
echo Step 5: Rebuilding...
cd android
call gradlew assembleDebug
cd ..

echo.
echo ========================================
echo Build Fixed!
echo ========================================
echo.
echo Now run: npm run android
echo.
pause
