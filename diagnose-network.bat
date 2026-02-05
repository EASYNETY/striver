@echo off
echo ========================================
echo Network Diagnostics
echo ========================================
echo.

echo Test 1: Check if Cloudflare Worker is accessible...
echo.
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://ondato-proxy.striverapp.workers.dev/health' -Method GET; Write-Host 'SUCCESS: Worker is responding' -ForegroundColor Green; Write-Host $response.Content } catch { Write-Host 'FAILED: Worker not accessible' -ForegroundColor Red; Write-Host $_.Exception.Message }"

echo.
echo.
echo Test 2: Check if device is connected...
echo.
adb devices
if errorlevel 1 (
    echo ERROR: ADB not found or device not connected
) else (
    echo SUCCESS: Device connected
)

echo.
echo.
echo Test 3: Check if Metro bundler is running...
echo.
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8081/status' -Method GET -TimeoutSec 2; Write-Host 'SUCCESS: Metro bundler is running' -ForegroundColor Green } catch { Write-Host 'FAILED: Metro bundler not running' -ForegroundColor Red; Write-Host 'Run: npm start' }"

echo.
echo.
echo Test 4: Check network_security_config.xml exists...
echo.
if exist "android\app\src\main\res\xml\network_security_config.xml" (
    echo SUCCESS: network_security_config.xml exists
) else (
    echo ERROR: network_security_config.xml missing!
)

echo.
echo.
echo ========================================
echo Diagnostics Complete
echo ========================================
echo.
echo If all tests pass, the issue is likely:
echo 1. App needs to be rebuilt: ./fix-network-and-run.bat
echo 2. Metro bundler needs to be running: npm start
echo.
pause
