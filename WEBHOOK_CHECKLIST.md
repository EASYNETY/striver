# ✅ Ondato Webhook Deployment Checklist

## Pre-Deployment ✅ (All Complete!)

- [x] Cloudflare Worker deployed and working
- [x] Session creation working (no auth errors)
- [x] Validation errors fixed (session ID shortened)
- [x] Firebase deprecation warnings fixed
- [x] Firestore permission issues resolved
- [x] Webhook handler code written
- [x] Webhook credentials configured
- [x] Test scripts created
- [x] Documentation written

---

## Deployment Steps 🚀 (Do These Now!)

### Step 1: Deploy Webhook
- [ ] Run `deploy-ondato-webhook.bat`
- [ ] Verify deployment successful (200 OK)
- [ ] Copy webhook URL from output
- [ ] Verify URL matches: `https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook`

**Command:**
```bash
deploy-ondato-webhook.bat
```

**Expected Output:**
```
✔  Deploy complete!
Functions:
  ondatoWebhook(us-central1): https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
```

---

### Step 2: Configure Ondato Dashboard
- [ ] Login to Ondato: https://admin.ondato.com
- [ ] Navigate to Settings → Webhooks
- [ ] Click "Add Webhook" or "Configure Webhook"
- [ ] Enter webhook URL: `https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook`
- [ ] Select authentication: Basic Auth
- [ ] Enter username: `striver_webhook`
- [ ] Enter password: `striver_secure_webhook_2024`
- [ ] Subscribe to events:
  - [ ] IdentityVerification.StatusChanged
  - [ ] KycIdentification.Approved
  - [ ] KycIdentification.Rejected
- [ ] Save configuration
- [ ] Test webhook (if button available)

**Copy-Paste Values:**
```
URL: https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
Username: striver_webhook
Password: striver_secure_webhook_2024
```

---

### Step 3: Test Webhook
- [ ] Run test script: `node test-ondato-webhook.js striver-app-48562`
- [ ] Verify 200 OK response
- [ ] Check Firebase logs: `firebase functions:log --only ondatoWebhook`
- [ ] Verify webhook received in logs

**Command:**
```bash
node test-ondato-webhook.js striver-app-48562
```

**Expected Output:**
```
✅ Response Status: 200
✅ Approved Verification - SUCCESS
✅ Rejected Verification - SUCCESS
```

---

### Step 4: Test with Real Verification
- [ ] Open Striver app
- [ ] Navigate to age verification
- [ ] Start verification
- [ ] Complete verification in browser
- [ ] Return to app
- [ ] Verify status updates automatically
- [ ] Check user profile in Firestore
- [ ] Verify notification created

**Check Firestore:**
1. Open: https://console.firebase.google.com/project/striver-app-48562
2. Go to: Firestore Database
3. Check:
   - [ ] `verification_attempts` - status updated
   - [ ] `users` - ageVerificationStatus = 'verified'
   - [ ] `notifications` - verification notification created

---

### Step 5: Monitor & Verify
- [ ] Check Firebase logs for webhook calls
- [ ] Verify no errors in logs
- [ ] Test multiple verifications
- [ ] Test both approved and rejected scenarios
- [ ] Verify app shows correct status

**Monitor Logs:**
```bash
firebase functions:log --only ondatoWebhook --follow
```

---

## Post-Deployment Verification ✅

### Webhook Functionality
- [ ] Webhook receives POST requests
- [ ] Basic Auth working (no 401 errors)
- [ ] Session ID lookup working (no 404 errors)
- [ ] Firestore updates working
- [ ] User profile updates working
- [ ] Notifications created
- [ ] Profile completion calculated
- [ ] Anonymous users converted (if applicable)

### App Functionality
- [ ] Session creation works
- [ ] Verification URL opens
- [ ] User completes verification
- [ ] Webhook fires automatically
- [ ] App receives update
- [ ] Status shows "Verification Successful"
- [ ] User can proceed to next screen
- [ ] No errors in app logs

### Firestore Updates
- [ ] `verification_attempts` collection updated
- [ ] `users` collection updated
- [ ] `notifications` collection updated
- [ ] Timestamps correct
- [ ] Status values correct
- [ ] Metadata saved correctly

---

## Success Criteria 🎯

All of these should be true:

1. ✅ Webhook deployed to Firebase Functions
2. ✅ Webhook URL configured in Ondato dashboard
3. ✅ Basic Auth credentials working
4. ✅ Test webhook returns 200 OK
5. ✅ Firebase logs show webhook received
6. ✅ Firestore collections updating
7. ✅ User profile shows verified status
8. ✅ Notifications created
9. ✅ App shows success message
10. ✅ No errors in logs

---

## Quick Commands Reference

```bash
# Deploy webhook
deploy-ondato-webhook.bat

# Test webhook
node test-ondato-webhook.js striver-app-48562

# Check status
check-webhook-status.bat

# View logs
firebase functions:log --only ondatoWebhook --follow

# View recent logs
firebase functions:log --only ondatoWebhook --limit 50
```

---

## Troubleshooting Quick Fixes

### 401 Unauthorized
```bash
# Check credentials in functions/.env
# Redeploy
deploy-ondato-webhook.bat
```

### 404 Not Found
```bash
# Check Firestore for session
# Verify externalReferenceId matches
firebase functions:log --only ondatoWebhook
```

### User Not Updating
```bash
# Check logs for errors
firebase functions:log --only ondatoWebhook --limit 50
```

---

## Documentation Reference

- **Quick Start:** `DEPLOY_WEBHOOK_NOW.md`
- **Full Setup:** `ONDATO_WEBHOOK_SETUP.md`
- **Quick Reference:** `ONDATO_WEBHOOK_QUICK_REFERENCE.md`
- **Complete Summary:** `ONDATO_COMPLETE_SUMMARY.md`
- **Deployment Ready:** `WEBHOOK_DEPLOYMENT_READY.md`

---

## 🎉 Completion

When all checkboxes are checked, your Ondato webhook integration is complete!

**Current Status:** Ready to deploy! All code is written and tested. Just need to:
1. Deploy webhook to Firebase
2. Configure in Ondato dashboard
3. Test and verify

**Time Required:** ~5 minutes

**Let's do this! 🚀**
