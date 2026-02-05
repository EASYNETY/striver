# 🚀 Deploy Ondato Webhook - 3 Simple Steps

## ⚡ Quick Start (5 minutes)

### Step 1: Deploy (2 minutes)
```bash
deploy-ondato-webhook.bat
```

**What this does:**
- Builds TypeScript functions
- Deploys webhook to Firebase
- Shows you the webhook URL

**Expected output:**
```
✔  Deploy complete!
Functions:
  ondatoWebhook(us-central1): https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
```

---

### Step 2: Configure Ondato (2 minutes)

1. **Open Ondato Dashboard**
   - Go to: https://admin.ondato.com
   - Login with your credentials

2. **Find Webhooks Settings**
   - Click: **Settings** → **Webhooks**
   - Or: **API Settings** → **Webhooks**

3. **Add Webhook**
   - Click: **Add Webhook** or **Configure Webhook**

4. **Copy & Paste These Values:**

   ```
   Webhook URL:
   https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook

   Authentication Type:
   Basic Auth

   Username:
   striver_webhook

   Password:
   striver_secure_webhook_2024
   ```

5. **Select Events:**
   - ✅ IdentityVerification.StatusChanged
   - ✅ KycIdentification.Approved
   - ✅ KycIdentification.Rejected

6. **Save**

---

### Step 3: Test (1 minute)

```bash
node test-ondato-webhook.js striver-app-48562
```

**Expected output:**
```
✅ Response Status: 200
✅ Approved Verification - SUCCESS
✅ Rejected Verification - SUCCESS
✅ All webhook tests completed!
```

---

## ✅ Done!

Your webhook is now:
- ✅ Deployed to Firebase
- ✅ Configured in Ondato
- ✅ Tested and working

### What happens now?

When a user completes verification:
1. Ondato sends webhook to your Firebase Function
2. Firebase updates Firestore automatically
3. User profile shows "verified" status
4. User receives notification
5. App shows "Verification Successful"

---

## 🧪 Test with Real Verification

1. Open Striver app
2. Go to age verification
3. Complete verification
4. Watch it work! 🎉

---

## 📊 Monitor Webhook

### View logs in real-time:
```bash
firebase functions:log --only ondatoWebhook --follow
```

### Check recent logs:
```bash
check-webhook-status.bat
```

---

## 🐛 Troubleshooting

### Webhook returns 401 Unauthorized
**Fix:** Check credentials match in both places:
- `functions/.env` (Firebase side)
- Ondato Dashboard (Ondato side)

Then redeploy:
```bash
deploy-ondato-webhook.bat
```

### Webhook returns 404 Not Found
**Fix:** Session ID mismatch. Check:
1. Firestore `verification_attempts` collection
2. Verify `externalReferenceId` matches webhook payload

### User profile not updating
**Fix:** Check Firebase logs:
```bash
firebase functions:log --only ondatoWebhook
```

Look for errors and fix accordingly.

---

## 📚 Need More Help?

**Full Documentation:**
- `ONDATO_WEBHOOK_SETUP.md` - Complete setup guide
- `ONDATO_WEBHOOK_QUICK_REFERENCE.md` - Quick reference
- `ONDATO_COMPLETE_SUMMARY.md` - Everything explained

**Quick Commands:**
- Deploy: `deploy-ondato-webhook.bat`
- Test: `node test-ondato-webhook.js striver-app-48562`
- Status: `check-webhook-status.bat`
- Logs: `firebase functions:log --only ondatoWebhook`

---

## 🎯 Copy-Paste Values

### Webhook URL
```
https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
```

### Username
```
striver_webhook
```

### Password
```
striver_secure_webhook_2024
```

### Base64 Auth (for testing)
```
c3RyaXZlcl93ZWJob29rOnN0cml2ZXJfc2VjdXJlX3dlYmhvb2tfMjAyNA==
```

---

## 🎉 That's It!

Three simple steps:
1. ✅ Deploy webhook
2. ✅ Configure in Ondato
3. ✅ Test

Your Ondato integration is complete! 🚀
