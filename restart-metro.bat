@echo off
echo ========================================
echo RESTART METRO WITH INCREASED MEMORY
echo ========================================
echo.
echo This will:
echo 1. Kill all Node.js processes (including Metro)
echo 2. Clear Metro cache
echo 3. Start Metro with 8GB memory limit
echo.
echo WARNING: This will close ALL Node.js processes!
echo.
pause

echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes found running.
) else (
    echo ✓ Killed Node.js processes
)
timeout /t 2 /nobreak >nul
echo.

echo Step 2: Starting Metro with 8GB memory limit...
echo.
echo Metro will start in a new window.
echo Keep this window open while developing.
echo.
echo To stop Metro, press Ctrl+C in the Metro window.
echo.

REM Set Node.js memory limit to 8GB
set NODE_OPTIONS=--max-old-space-size=8192

REM Start Metro with reset cache
start "Metro Bundler (8GB Memory)" cmd /k "npx react-native start --reset-cache"

echo.
echo ✓ Metro started with increased memory!
echo.
echo If you see any errors in the Metro window:
echo 1. Make sure you're in the project root directory
echo 2. Try running: npm install
echo 3. Check that all dependencies are installed
echo.
pause
