@echo off
echo ========================================
echo Checking Webhook Status
echo ========================================
echo.

echo Testing webhook with Basic Auth...
echo.

curl -X POST https://ondatowebhook-hphu25tfqq-uc.a.run.app ^
  -u striver_webhook:striver_secure_webhook_2024 ^
  -H "Content-Type: application/json" ^
  -d "{\"EventType\":\"KycIdentification.Approved\",\"Payload\":{\"Id\":\"test-123\",\"ExternalReferenceId\":\"test-session-123\",\"Status\":\"Approved\"}}"

echo.
echo.
echo ========================================
echo Test Complete
echo ========================================
pause
