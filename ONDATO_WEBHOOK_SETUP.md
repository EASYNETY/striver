# Ondato Webhook Setup Guide

## Overview
This guide walks you through deploying the Firebase Functions webhook handler and configuring it in the Ondato dashboard.

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged into Firebase (`firebase login`)
- Firebase project configured

## Step 1: Deploy Firebase Functions

### Option A: Deploy All Functions
```bash
firebase deploy --only functions
```

### Option B: Deploy Only Webhook Function
```bash
firebase deploy --only functions:ondatoWebhook
```

### Expected Output
```
✔  Deploy complete!

Functions:
  ondatoWebhook(us-central1): https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/ondatoWebhook
```

**IMPORTANT:** Copy the webhook URL from the output. You'll need it for Ondato configuration.

## Step 2: Get Your Firebase Project ID

Run this command to see your project ID:
```bash
firebase projects:list
```

Your webhook URL will be:
```
https://us-central1-{YOUR-PROJECT-ID}.cloudfunctions.net/ondatoWebhook
```

## Step 3: Configure Webhook in Ondato Dashboard

### Login to Ondato Dashboard
1. Go to: https://admin.ondato.com
2. Login with your Ondato credentials

### Configure Webhook Settings
1. Navigate to **Settings** → **Webhooks** (or **API Settings**)
2. Click **Add Webhook** or **Configure Webhook**
3. Enter the following details:

**Webhook Configuration:**
- **URL:** `https://us-central1-{YOUR-PROJECT-ID}.cloudfunctions.net/ondatoWebhook`
- **Authentication Type:** Basic Auth
- **Username:** `striver_webhook`
- **Password:** `striver_secure_webhook_2024`
- **Events to Subscribe:**
  - ✅ `IdentityVerification.StatusChanged`
  - ✅ `KycIdentification.Approved`
  - ✅ `KycIdentification.Rejected`
  - ✅ `KycIdentification.Completed` (if available)

4. Click **Save** or **Test Webhook**

## Step 4: Test the Webhook

### Method 1: Test from Ondato Dashboard
Most Ondato dashboards have a "Test Webhook" button that sends a sample payload.

### Method 2: Test with Real Verification
1. Open your Striver app
2. Start a new age verification
3. Complete the verification process
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only ondatoWebhook
   ```

### Method 3: Manual Test with cURL
```bash
curl -X POST https://us-central1-{YOUR-PROJECT-ID}.cloudfunctions.net/ondatoWebhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic c3RyaXZlcl93ZWJob29rOnN0cml2ZXJfc2VjdXJlX3dlYmhvb2tfMjAyNA==" \
  -d '{
    "EventType": "KycIdentification.Approved",
    "Payload": {
      "Id": "test-id-123",
      "ExternalReferenceId": "test_session_123",
      "Status": "Approved",
      "VerificationData": {
        "DateOfBirth": "1990-01-01",
        "Age": 34,
        "FirstName": "Test",
        "LastName": "User"
      }
    }
  }'
```

## Step 5: Verify Webhook is Working

### Check Firebase Functions Logs
```bash
firebase functions:log --only ondatoWebhook --limit 50
```

Look for:
- ✅ `Ondato webhook received:` - Webhook received successfully
- ✅ `Webhook processed successfully` - Webhook processed without errors
- ❌ `Unauthorized` - Check Basic Auth credentials
- ❌ `Verification attempt not found` - Session ID mismatch

### Check Firestore
1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to **Firestore Database**
3. Check these collections:
   - `verification_attempts` - Should show updated status
   - `users` - Should show `ageVerificationStatus: 'verified'`
   - `notifications` - Should have verification notification

## Webhook Payload Examples

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

## Troubleshooting

### Webhook Returns 401 Unauthorized
**Problem:** Basic Auth credentials don't match

**Solution:**
1. Check `functions/.env` has correct credentials:
   ```
   ONDATO_USERNAME=striver_webhook
   ONDATO_PASSWORD=striver_secure_webhook_2024
   ```
2. Redeploy functions: `firebase deploy --only functions:ondatoWebhook`
3. Update Ondato dashboard with matching credentials

### Webhook Returns 404 Not Found
**Problem:** Session ID not found in Firestore

**Solution:**
1. Verify the `externalReferenceId` in webhook matches the one saved in `verification_attempts`
2. Check Firestore for the session:
   ```javascript
   // In Firebase Console
   db.collection('verification_attempts')
     .where('sessionId', '==', 'YOUR_SESSION_ID')
     .get()
   ```

### User Not Getting Updated
**Problem:** Webhook processes but user profile doesn't update

**Solution:**
1. Check Firebase Functions logs for errors
2. Verify Firestore rules allow function to update users:
   ```
   match /users/{userId} {
     allow write: if request.auth != null || request.resource.data.keys().hasAny(['ageVerificationStatus']);
   }
   ```

### Webhook Not Receiving Calls
**Problem:** Ondato not sending webhooks

**Solution:**
1. Verify webhook URL is correct in Ondato dashboard
2. Check webhook is enabled in Ondato
3. Verify events are subscribed correctly
4. Test with Ondato's "Test Webhook" button

## Security Notes

### Basic Auth Credentials
The webhook uses Basic Auth with these credentials:
- **Username:** `striver_webhook`
- **Password:** `striver_secure_webhook_2024`

**IMPORTANT:** These credentials are stored in:
- `functions/.env` (for Firebase Functions)
- Ondato Dashboard (for webhook authentication)

### Changing Credentials
If you need to change the webhook credentials:

1. Update `functions/.env`:
   ```
   ONDATO_USERNAME=new_username
   ONDATO_PASSWORD=new_password
   ```

2. Redeploy functions:
   ```bash
   firebase deploy --only functions:ondatoWebhook
   ```

3. Update Ondato dashboard with new credentials

## Next Steps

After webhook is configured:
1. ✅ Test with a real verification flow
2. ✅ Monitor Firebase Functions logs
3. ✅ Check user profiles are updating correctly
4. ✅ Verify notifications are being created

## Support

If you encounter issues:
1. Check Firebase Functions logs: `firebase functions:log`
2. Check Ondato dashboard for webhook delivery status
3. Review Firestore security rules
4. Contact Ondato support for webhook configuration help
