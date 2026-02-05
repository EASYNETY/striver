@echo off
echo ========================================
echo Testing Ondato Webhook
echo ========================================
echo.
echo Running webhook test...
echo.

node test-webhook-simple.js

echo.
echo ========================================
echo Test Complete
echo ========================================
echo.
echo If successful, configure webhook in Ondato dashboard:
echo URL: https://ondatowebhook-hphu25tfqq-uc.a.run.app
echo Username: striver_webhook
echo Password: striver_secure_webhook_2024
echo.
pause
