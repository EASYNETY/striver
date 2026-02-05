# ✅ Ondato Webhook Successfully Deployed!

## Deployment Status: COMPLETE

Your Ondato webhook has been successfully deployed to Firebase Functions.

## Webhook Details

**Function URL:**
```
https://ondatowebhook-hphu25tfqq-uc.a.run.app
```

**Alternative URL (Cloud Functions format):**
```
https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook
```

**Basic Auth Credentials:**
- Username: `striver_webhook`
- Password: `striver_secure_webhook_2024`

## Next Steps

### 1. Configure Webhook in Ondato Dashboard

1. Log in to your Ondato dashboard at https://admin.ondato.com
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook** or **Configure Webhook**
4. Enter the webhook URL:
   ```
   https://ondatowebhook-hphu25tfqq-uc.a.run.app
   ```
5. Set authentication method to **Basic Auth**
6. Enter credentials:
   - Username: `striver_webhook`
   - Password: `striver_secure_webhook_2024`
7. Select events to subscribe to:
   - ✅ `KycIdentification.Approved`
   - ✅ `KycIdentification.Rejected`
   - ✅ `KycIdentification.Updated` (optional)
8. Save the webhook configuration

### 2. Test the Webhook

You can test the webhook using the test script:

```bash
node test-ondato-webhook.js
```

Or manually with curl:

```bash
curl -X POST https://ondatowebhook-hphu25tfqq-uc.a.run.app \
  -u striver_webhook:striver_secure_webhook_2024 \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "KycIdentification.Approved",
    "Payload": {
      "Id": "test-id-123",
      "ExternalReferenceId": "test-session-123",
      "Status": "Approved",
      "VerificationData": {
        "DateOfBirth": "01/01/1990",
        "Age": 34
      }
    }
  }'
```

### 3. Monitor Webhook Activity

View webhook logs in Firebase Console:
```
https://console.firebase.google.com/project/striver-app-48562/functions/logs
```

Or use Firebase CLI:
```bash
firebase functions:log --only ondatoWebhook
```

## How It Works

1. **User completes verification** in Ondato (via WebView in your app)
2. **Ondato sends webhook** to your Firebase Function
3. **Webhook handler**:
   - Verifies Basic Auth credentials
   - Updates `verification_attempts` collection
   - Updates user profile with verification status
   - Creates notification for user
   - Calculates profile completion percentage
4. **User sees updated status** in the app automatically (via Firestore listener)

## What's Updated Automatically

When verification is approved, the webhook automatically updates:

### In `verification_attempts` collection:
- `status`: `'completed'`
- `metadata.ondatoStatus`: `'Approved'`
- `metadata.verificationData`: Full verification data from Ondato
- `metadata.webhookReceivedAt`: Timestamp

### In `users` collection:
- `ageVerificationStatus`: `'verified'`
- `age_verification_status`: `'verified'`
- `ageVerificationDate`: Timestamp
- `profileStatus.ageVerification`: `'verified'`
- `profileStatus.verificationCompletedAt`: Timestamp
- `profileStatus.verificationMethod`: `'ondato'`
- `profileCompletion`: Updated percentage
- `onboardingComplete`: `true` (if profile is 100% complete)

### In `notifications` collection:
- Creates a new notification for the user with approval/rejection message

## Testing the Full Flow

1. **Start verification** in your app (OndatoVerification screen)
2. **Complete verification** in the WebView
3. **Ondato sends webhook** to your function
4. **Check Firestore** to see automatic updates
5. **User sees success** screen automatically

## Troubleshooting

### Webhook not receiving calls
- Check Ondato dashboard webhook configuration
- Verify the URL is correct
- Check Basic Auth credentials
- View Firebase Function logs for errors

### Authentication errors
- Verify username and password match exactly
- Check that Basic Auth is enabled in Ondato dashboard

### Status not updating
- Check Firebase Function logs for errors
- Verify Firestore rules allow updates
- Check that `sessionId` matches between app and webhook

## Files Involved

- `functions/src/ondato-webhook.ts` - Webhook handler
- `functions/src/index.ts` - Exports webhook function
- `src/screens/auth/OndatoVerification.tsx` - WebView implementation
- `src/hooks/useOndatoVerification.ts` - Firestore listener for status updates

## Summary

✅ Webhook deployed successfully
✅ All functions updated
✅ WebView implementation ready
✅ Automatic status updates configured

**You're all set!** Just configure the webhook URL in Ondato dashboard and test the flow.
