@echo off
echo ========================================
echo Installing React Native WebView
echo ========================================
echo.

echo Step 1: Removing broken Ondato SDK dependency...
call npm uninstall ondato-sdk-react-native

echo.
echo Step 2: Installing WebView package...
call npm install react-native-webview --save --legacy-peer-deps

if %errorlevel% neq 0 (
    echo ERROR: Installation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. For iOS: Run 'npx pod-install'
echo 2. Uncomment WebView code in src/screens/auth/OndatoVerification.tsx
echo 3. Rebuild your app
echo.
echo See WEBVIEW_IMPLEMENTATION.md for details
echo.
pause
