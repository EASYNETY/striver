# Ondato Webhook Configuration Helper
# This script opens Ondato dashboard and copies configuration details to clipboard

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ondato Webhook Configuration Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration details
$webhookUrl = "https://ondatowebhook-hphu25tfqq-uc.a.run.app"
$username = "striver_webhook"
$password = "striver_secure_webhook_2024"

# Create formatted text for clipboard
$clipboardText = @"
ONDATO WEBHOOK CONFIGURATION
========================================

Webhook URL:
$webhookUrl

Authentication Type:
Basic Auth

Username:
$username

Password:
$password

Events to Subscribe:
- KycIdentification.Approved
- KycIdentification.Rejected

========================================
"@

# Copy to clipboard
$clipboardText | Set-Clipboard

Write-Host "✅ Configuration details copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "Opening Ondato Dashboard..." -ForegroundColor Yellow
Start-Process "https://admin.ondato.com"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Log in to Ondato dashboard (opened in browser)" -ForegroundColor White
Write-Host "2. Navigate to: Settings > Webhooks" -ForegroundColor White
Write-Host "3. Click 'Add Webhook' or 'Configure Webhook'" -ForegroundColor White
Write-Host "4. Paste the details from clipboard (Ctrl+V)" -ForegroundColor White
Write-Host "5. Configure:" -ForegroundColor White
Write-Host "   - Webhook URL: $webhookUrl" -ForegroundColor Gray
Write-Host "   - Auth Type: Basic Auth" -ForegroundColor Gray
Write-Host "   - Username: $username" -ForegroundColor Gray
Write-Host "   - Password: $password" -ForegroundColor Gray
Write-Host "6. Select events:" -ForegroundColor White
Write-Host "   ✓ KycIdentification.Approved" -ForegroundColor Gray
Write-Host "   ✓ KycIdentification.Rejected" -ForegroundColor Gray
Write-Host "7. Click 'Save' or 'Create'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION DETAILS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Webhook URL:" -ForegroundColor Yellow
Write-Host $webhookUrl -ForegroundColor White
Write-Host ""
Write-Host "Username:" -ForegroundColor Yellow
Write-Host $username -ForegroundColor White
Write-Host ""
Write-Host "Password:" -ForegroundColor Yellow
Write-Host $password -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AFTER CONFIGURATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test the webhook with:" -ForegroundColor Yellow
Write-Host "  node test-webhook-simple.js" -ForegroundColor White
Write-Host ""
Write-Host "Or run:" -ForegroundColor Yellow
Write-Host "  .\test-webhook.bat" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
