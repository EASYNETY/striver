@echo off
echo ========================================
echo INSTALL VIDEO TRIMMING LIBRARY
echo ========================================
echo.
echo This will install react-native-ffmpeg
echo for client-side video trimming.
echo.
pause

echo Installing react-native-ffmpeg...
call npm install react-native-ffmpeg --save

echo.
echo Cleaning Android build...
cd android
call gradlew clean
cd ..

echo.
echo ========================================
echo INSTALLATION COMPLETE
echo ========================================
echo.
echo Next steps:
echo 1. Rebuild the Android app: build-android-arm-only.bat
echo 2. Test video trimming in the upload screen
echo.
echo Note: Videos will now be trimmed on-device before upload
echo This saves bandwidth and ensures only the selected portion is uploaded.
echo.
pause
