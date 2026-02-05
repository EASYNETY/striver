# Ondato Webhook - Quick Reference

## 🚀 Quick Deploy

```bash
# Deploy webhook
deploy-ondato-webhook.bat

# Or manually
cd functions
npm run build
cd ..
firebase deploy --only functions:ondatoWebhook
```

## 🔗 Webhook URL Format

```
https://us-central1-{YOUR-PROJECT-ID}.cloudfunctions.net/ondatoWebhook
```

## 🔐 Authentication

**Type:** Basic Auth

**Credentials:**
- Username: `striver_webhook`
- Password: `striver_secure_webhook_2024`

**Base64 Encoded:**
```
c3RyaXZlcl93ZWJob29rOnN0cml2ZXJfc2VjdXJlX3dlYmhvb2tfMjAyNA==
```

## 📋 Ondato Dashboard Configuration

1. Login: https://admin.ondato.com
2. Go to: Settings → Webhooks
3. Configure:
   - **URL:** Your webhook URL (see format above)
   - **Auth Type:** Basic Auth
   - **Username:** `striver_webhook`
   - **Password:** `striver_secure_webhook_2024`
   - **Events:**
     - ✅ IdentityVerification.StatusChanged
     - ✅ KycIdentification.Approved
     - ✅ KycIdentification.Rejected

## 🧪 Test Webhook

```bash
# Get your project ID first
firebase projects:list

# Test webhook
node test-ondato-webhook.js YOUR-PROJECT-ID
```

## 📊 Check Logs

```bash
# View webhook logs
firebase functions:log --only ondatoWebhook --limit 50

# Follow logs in real-time
firebase functions:log --only ondatoWebhook --follow
```

## ✅ What the Webhook Does

When Ondato sends a webhook:

1. **Verifies Authentication** - Checks Basic Auth credentials
2. **Finds Verification Attempt** - Looks up session in Firestore
3. **Updates Status** - Updates `verification_attempts` collection
4. **Updates User Profile** - Sets `ageVerificationStatus` to `verified` or `rejected`
5. **Creates Notification** - Notifies user of verification result
6. **Updates Profile Completion** - Calculates completion percentage
7. **Converts Anonymous Users** - Upgrades account if profile is complete

## 📁 Files Modified

- ✅ `functions/src/ondato-webhook.ts` - Webhook handler
- ✅ `functions/src/index.ts` - Exports webhook
- ✅ `functions/.env` - Webhook credentials
- ✅ `src/hooks/useOndatoVerification.ts` - Client-side verification
- ✅ `src/screens/auth/OndatoVerification.tsx` - Verification UI

## 🔍 Firestore Collections Updated

### `verification_attempts`
```javascript
{
  status: 'completed' | 'failed',
  metadata: {
    ondatoStatus: 'Approved' | 'Rejected',
    verificationData: { ... },
    rejectionReasons: [...],
    webhookReceivedAt: Timestamp
  }
}
```

### `users`
```javascript
{
  ageVerificationStatus: 'verified' | 'rejected',
  ageVerificationDate: Timestamp,
  profileStatus: {
    ageVerification: 'verified' | 'rejected',
    verificationCompletedAt: Timestamp,
    verificationMethod: 'ondato'
  }
}
```

### `notifications`
```javascript
{
  userId: string,
  type: 'verification_update',
  title: 'Verification Approved' | 'Verification Failed',
  message: string,
  read: false,
  createdAt: Timestamp
}
```

## 🐛 Troubleshooting

### 401 Unauthorized
- Check credentials in `functions/.env`
- Redeploy: `firebase deploy --only functions:ondatoWebhook`
- Verify Ondato dashboard has matching credentials

### 404 Not Found
- Session ID mismatch
- Check `verification_attempts` collection in Firestore
- Verify `externalReferenceId` matches

### User Not Updated
- Check Firebase Functions logs
- Verify Firestore security rules
- Check user document exists

### Webhook Not Receiving Calls
- Verify URL in Ondato dashboard
- Check webhook is enabled
- Test with "Test Webhook" button in Ondato
- Verify events are subscribed

## 📚 Documentation

- **Full Setup Guide:** `ONDATO_WEBHOOK_SETUP.md`
- **Integration Guide:** `ONDATO_INTEGRATION_GUIDE.md`
- **Quick Start:** `ONDATO_QUICK_START.md`

## 🔄 Verification Flow

```
User → App → Cloudflare Worker → Ondato API
                                      ↓
                                  Verification
                                      ↓
                                  Webhook
                                      ↓
                              Firebase Function
                                      ↓
                                  Firestore
                                      ↓
                              User Profile Updated
                                      ↓
                              App Receives Update
```

## 📞 Support

- Firebase Functions Logs: `firebase functions:log`
- Ondato Dashboard: https://admin.ondato.com
- Ondato Support: Check dashboard for support contact
