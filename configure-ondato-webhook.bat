@echo off
echo ========================================
echo Ondato Webhook Configuration Helper
echo ========================================
echo.
echo This script will help you configure the webhook in Ondato dashboard.
echo.
echo STEP 1: Opening Ondato Dashboard...
echo.
start https://admin.ondato.com
echo.
echo ========================================
echo CONFIGURATION DETAILS (Copy These)
echo ========================================
echo.
echo Webhook URL:
echo https://ondatowebhook-hphu25tfqq-uc.a.run.app
echo.
echo Authentication Type:
echo Basic Auth
echo.
echo Username:
echo striver_webhook
echo.
echo Password:
echo striver_secure_webhook_2024
echo.
echo Events to Subscribe:
echo - KycIdentification.Approved
echo - KycIdentification.Rejected
echo.
echo ========================================
echo MANUAL STEPS IN ONDATO DASHBOARD
echo ========================================
echo.
echo 1. Log in to Ondato dashboard (opened in browser)
echo 2. Navigate to: Settings ^> Webhooks
echo 3. Click "Add Webhook" or "Configure Webhook"
echo 4. Copy-paste the details above:
echo    - Webhook URL
echo    - Select "Basic Auth"
echo    - Enter Username
echo    - Enter Password
echo 5. Select events:
echo    - Check "KycIdentification.Approved"
echo    - Check "KycIdentification.Rejected"
echo 6. Click "Save" or "Create"
echo 7. Test the webhook (optional)
echo.
echo ========================================
echo VERIFY CONFIGURATION
echo ========================================
echo.
echo After configuring in Ondato dashboard, test it:
echo.
echo Run: node test-webhook-simple.js
echo.
echo Or run: ./test-webhook.bat
echo.
pause
