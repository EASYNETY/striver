# 🎯 Ondato Webhook - Ready to Deploy

## Your Webhook Configuration

### Webhook URL
```
https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
```

### Basic Auth Credentials
- **Username:** `striver_webhook`
- **Password:** `striver_secure_webhook_2024`

### Base64 Encoded (for testing)
```
Authorization: Basic c3RyaXZlcl93ZWJob29rOnN0cml2ZXJfc2VjdXJlX3dlYmhvb2tfMjAyNA==
```

---

## 🚀 Step 1: Deploy the Webhook

### Option A: Use the Deploy Script (Recommended)
```bash
deploy-ondato-webhook.bat
```

### Option B: Manual Deployment
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:ondatoWebhook
```

**Expected Output:**
```
✔  Deploy complete!

Functions:
  ondatoWebhook(us-central1): https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
```

---

## 🔧 Step 2: Configure in Ondato Dashboard

1. **Login to Ondato:**
   - URL: https://admin.ondato.com
   - Use your Ondato credentials

2. **Navigate to Webhooks:**
   - Go to: **Settings** → **Webhooks** (or **API Settings**)
   - Click: **Add Webhook** or **Configure Webhook**

3. **Enter Configuration:**

   | Field | Value |
   |-------|-------|
   | **Webhook URL** | `https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook` |
   | **Authentication Type** | Basic Auth |
   | **Username** | `striver_webhook` |
   | **Password** | `striver_secure_webhook_2024` |

4. **Subscribe to Events:**
   - ✅ `IdentityVerification.StatusChanged`
   - ✅ `KycIdentification.Approved`
   - ✅ `KycIdentification.Rejected`
   - ✅ `KycIdentification.Completed` (if available)

5. **Save Configuration**

6. **Test Webhook** (if button available)

---

## 🧪 Step 3: Test the Webhook

### Test from Command Line
```bash
node test-ondato-webhook.js striver-app-48562
```

### Test with cURL
```bash
curl -X POST https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic c3RyaXZlcl93ZWJob29rOnN0cml2ZXJfc2VjdXJlX3dlYmhvb2tfMjAyNA==" \
  -d "{\"EventType\":\"KycIdentification.Approved\",\"Payload\":{\"Id\":\"test-123\",\"ExternalReferenceId\":\"test_session\",\"Status\":\"Approved\"}}"
```

### Test with Real Verification
1. Open Striver app
2. Start age verification
3. Complete verification in browser
4. Check logs: `firebase functions:log --only ondatoWebhook`

---

## 📊 Step 4: Verify It's Working

### Check Firebase Functions Logs
```bash
firebase functions:log --only ondatoWebhook --limit 50
```

**Look for:**
- ✅ `Ondato webhook received:` - Webhook received
- ✅ `Webhook processed successfully` - Processing complete
- ❌ `Unauthorized` - Check credentials
- ❌ `Verification attempt not found` - Session ID issue

### Check Firestore Database
1. Open: https://console.firebase.google.com
2. Select: **striver-app-48562**
3. Go to: **Firestore Database**
4. Check collections:
   - `verification_attempts` - Status should update
   - `users` - `ageVerificationStatus` should be `verified`
   - `notifications` - Verification notification created

### Check in App
1. Complete a verification
2. User should see "Verification Successful"
3. User profile should show verified status
4. User should receive notification

---

## ✅ What Happens When Webhook Fires

```
Ondato Verification Complete
         ↓
Ondato sends webhook to Firebase
         ↓
Firebase Function receives webhook
         ↓
Verifies Basic Auth credentials
         ↓
Finds verification attempt in Firestore
         ↓
Updates verification_attempts collection
         ↓
Updates user profile (ageVerificationStatus)
         ↓
Creates notification for user
         ↓
Calculates profile completion
         ↓
Converts anonymous user (if applicable)
         ↓
Returns success response to Ondato
         ↓
App receives Firestore update
         ↓
User sees "Verification Successful"
```

---

## 🔍 Webhook Payload Examples

### Approved Verification
```json
{
  "EventType": "KycIdentification.Approved",
  "Payload": {
    "Id": "abc123",
    "ExternalReferenceId": "0VvzkGC5_1770282776813",
    "Status": "Approved",
    "VerificationData": {
      "DateOfBirth": "1990-05-15",
      "Age": 34,
      "DocumentType": "Passport",
      "FirstName": "John",
      "LastName": "Doe"
    }
  }
}
```

### Rejected Verification
```json
{
  "EventType": "KycIdentification.Rejected",
  "Payload": {
    "Id": "abc123",
    "ExternalReferenceId": "0VvzkGC5_1770282776813",
    "Status": "Rejected",
    "RejectionReasons": [
      "Document not clear",
      "Face not visible"
    ]
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause:** Basic Auth credentials don't match

**Solution:**
1. Check `functions/.env`:
   ```
   ONDATO_USERNAME=striver_webhook
   ONDATO_PASSWORD=striver_secure_webhook_2024
   ```
2. Redeploy: `firebase deploy --only functions:ondatoWebhook`
3. Update Ondato dashboard with matching credentials

### Issue: 404 Not Found
**Cause:** Verification session not found in Firestore

**Solution:**
1. Check `externalReferenceId` matches between webhook and Firestore
2. Verify session was created before webhook fired
3. Check Firestore query in webhook handler

### Issue: User Profile Not Updating
**Cause:** Firestore permissions or webhook processing error

**Solution:**
1. Check Firebase Functions logs for errors
2. Verify Firestore rules allow updates
3. Check user document exists in Firestore

### Issue: Webhook Not Receiving Calls
**Cause:** Ondato not configured or webhook disabled

**Solution:**
1. Verify webhook URL in Ondato dashboard
2. Check webhook is enabled
3. Verify events are subscribed
4. Test with "Test Webhook" button in Ondato

---

## 📚 Additional Documentation

- **Full Setup Guide:** `ONDATO_WEBHOOK_SETUP.md`
- **Quick Reference:** `ONDATO_WEBHOOK_QUICK_REFERENCE.md`
- **Integration Guide:** `ONDATO_INTEGRATION_GUIDE.md`
- **Quick Start:** `ONDATO_QUICK_START.md`

---

## 🎉 Success Checklist

- [ ] Webhook deployed to Firebase Functions
- [ ] Webhook URL configured in Ondato dashboard
- [ ] Basic Auth credentials configured
- [ ] Events subscribed (Approved, Rejected, StatusChanged)
- [ ] Test webhook successful (200 response)
- [ ] Firebase Functions logs show webhook received
- [ ] Firestore collections updating correctly
- [ ] User profile shows verified status
- [ ] Notifications created for users
- [ ] App shows "Verification Successful"

---

## 📞 Need Help?

**Check Logs:**
```bash
firebase functions:log --only ondatoWebhook --follow
```

**Test Webhook:**
```bash
node test-ondato-webhook.js striver-app-48562
```

**Ondato Dashboard:**
https://admin.ondato.com

**Firebase Console:**
https://console.firebase.google.com/project/striver-app-48562
