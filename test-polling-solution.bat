@echo off
echo ========================================
echo Testing Polling Solution
echo ========================================
echo.
echo This will test the Cloudflare Worker
echo that powers the polling solution.
echo.
echo ========================================
echo Test 1: Check Status Endpoint
echo ========================================
echo.
echo Testing: https://ondato-proxy.striverapp.workers.dev/check-status
echo.

curl "https://ondato-proxy.striverapp.workers.dev/check-status?identificationId=test-123"

echo.
echo.
echo ========================================
echo Test 2: Create Session Endpoint
echo ========================================
echo.
echo Testing: https://ondato-proxy.striverapp.workers.dev/create-session
echo.

curl -X POST "https://ondato-proxy.striverapp.workers.dev/create-session" ^
  -H "Content-Type: application/json" ^
  -d "{\"externalReferenceId\":\"test_%date:~-4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%\",\"language\":\"en\"}"

echo.
echo.
echo ========================================
echo Summary
echo ========================================
echo.
echo If both tests returned JSON responses,
echo your polling solution is working!
echo.
echo Next steps:
echo 1. Build your app: npm run android (or ios)
echo 2. Test verification flow
echo 3. Watch console for polling messages
echo.
echo Expected console output:
echo [useOndatoVerification] Starting auto-polling...
echo [useOndatoVerification] Auto-polling status...
echo [useOndatoVerification] Status: pending
echo [useOndatoVerification] Status: completed
echo.
pause
