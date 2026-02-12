@echo off
echo ========================================
echo STRIVER APP - STATUS CHECK
echo ========================================
echo.

echo [1/5] Checking Node.js version...
node --version
echo Required for Firebase Functions: v20.x.x
echo.

echo [2/5] Checking if Metro is running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ Metro/Node.js is running
) else (
    echo ✗ Metro is not running
    echo   Run: restart-metro.bat
)
echo.

echo [3/5] Checking Android build status...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ✓ Debug APK exists
    for %%I in ("android\app\build\outputs\apk\debug\app-debug.apk") do echo   Size: %%~zI bytes
    echo   Last modified:
    dir "android\app\build\outputs\apk\debug\app-debug.apk" | find "app-debug.apk"
) else (
    echo ✗ Debug APK not found
    echo   Run: build-android-arm-only.bat
)
echo.

echo [4/5] Checking Firebase Functions build...
if exist "functions\lib\index.js" (
    echo ✓ Functions compiled
    echo   Files in lib directory:
    dir /B functions\lib\*.js
) else (
    echo ✗ Functions not compiled
    echo   Run: cd functions ^&^& npm run build
)
echo.

echo [5/5] Checking package installations...
if exist "node_modules\@react-native-firebase\messaging" (
    echo ✓ @react-native-firebase/messaging installed
) else (
    echo ✗ @react-native-firebase/messaging NOT installed
    echo   Run: npm install
)

if exist "functions\node_modules\firebase-functions" (
    echo ✓ firebase-functions installed
) else (
    echo ✗ firebase-functions NOT installed
    echo   Run: cd functions ^&^& npm install
)
echo.

echo ========================================
echo SUMMARY
echo ========================================
echo.
echo To fix issues:
echo 1. Node.js version mismatch → Install Node.js 20 LTS
echo 2. Metro not running → Run: restart-metro.bat
echo 3. APK not built → Run: build-android-arm-only.bat
echo 4. Functions not compiled → Run: cd functions ^&^& npm run build
echo 5. Packages missing → Run: npm install
echo.
echo To deploy Firebase Functions:
echo   Run: deploy-notifications-final.bat
echo.
echo To test the app:
echo   1. Make sure Metro is running
echo   2. Run: npm run android
echo.
pause
