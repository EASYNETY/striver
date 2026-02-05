# Ondato Integration with Firebase - Complete Setup Guide

## 🚀 Overview

This guide covers the complete integration of Ondato's identity verification service for parent age verification using **Firebase Cloud Functions** and **Firestore**.

## 📋 Prerequisites

- Firebase project set up
- React Native app with Firebase configured
- Ondato account (https://os.ondato.com)
- Node.js 18+ installed

## 🔧 Step 1: Ondato Dashboard Configuration

### A. Get API Credentials

1. Log in to [Ondato Admin Panel](https://os.ondato.com/admin-panel)
2. Navigate to **Settings** → **API Keys**
3. Copy and save:
   - `ONDATO_USERNAME`
   - `ONDATO_PASSWORD`

### B. Create IDV Configuration

1. Go to [IDV Configuration](https://os.ondato.com/admin-panel/idv-configuration)
2. Click **"Create New Setup"**
3. Configure:
   - **Name**: "Striver Parent Age Verification"
   - **Type**: Identity Verification
   - **Required Documents**: Government ID
   - **Liveness Check**: ✅ Enabled
   - **Age Verification**: ✅ Enabled (Minimum age: 18)
   - **Face Match**: ✅ Enabled
4. Save and copy the **Setup ID**

### C. Configure Webhooks

1. In Ondato Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://us-central1-[your-project-id].cloudfunctions.net/ondatoWebhook`
3. Enable events:
   - ✅ `KycIdentification.Approved`
   - ✅ `KycIdentification.Rejected`
   - ✅ `IdentityVerification.StatusChanged`
4. Authentication: **Basic Auth**
   - Username: Same as `ONDATO_USERNAME`
   - Password: Same as `ONDATO_PASSWORD`

## 🔥 Step 2: Firebase Configuration

### A. Update Environment Variables

Edit `functions/.env`:

```env
# Ondato Age Verification
ONDATO_USERNAME=your_ondato_username
ONDATO_PASSWORD=your_ondato_password
ONDATO_SETUP_ID=your_ondato_setup_id
ONDATO_API_URL=https://api.ondato.com
```

### B. Set Firebase Config (for production)

```bash
firebase functions:config:set \
  ondato.username="your_ondato_username" \
  ondato.password="your_ondato_password" \
  ondato.setup_id="your_ondato_setup_id" \
  ondato.api_url="https://api.ondato.com"
```

### C. Deploy Firebase Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

This will deploy:
- `startOndatoVerification` - Creates verification sessions
- `checkVerificationStatus` - Checks verification status
- `ondatoWebhook` - Handles Ondato callbacks

## 📊 Step 3: Firestore Database Setup

### A. Create Collections

Run this in Firebase Console → Firestore Database:

1. **verification_attempts** collection:
   - Auto-ID documents
   - Fields:
     - `userId` (string)
     - `sessionId` (string)
     - `method` (string) - "ondato"
     - `status` (string) - "pending", "completed", "failed", "expired"
     - `verificationUrl` (string)
     - `metadata` (map)
     - `createdAt` (timestamp)
     - `expiresAt` (timestamp)

2. **Update users collection** to include:
   - `ageVerificationStatus` (string) - "unverified", "verified", "rejected"
   - `ageVerificationDate` (timestamp)
   - `profileStatus` (map)
   - `profileCompletion` (number)

### B. Create Firestore Indexes

Go to Firebase Console → Firestore → Indexes and create:

```
Collection: verification_attempts
Fields:
  - userId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

### C. Set Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Verification attempts - users can only read their own
    match /verification_attempts/{attemptId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Notifications - users can read their own
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can create
    }
  }
}
```

## 📱 Step 4: React Native App Configuration

### A. Install Dependencies

```bash
npm install expo-web-browser @react-native-firebase/functions
# or
yarn add expo-web-browser @react-native-firebase/functions
```

### B. Configure Deep Links

**iOS (ios/StriverApp/Info.plist):**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>striver</string>
    </array>
  </dict>
</array>
```

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="striver" />
</intent-filter>
```

### C. Files Already Created

✅ `src/screens/auth/OndatoVerification.tsx` - Verification screen
✅ `src/hooks/useOndatoVerification.ts` - Verification hook
✅ `functions/src/index.ts` - Cloud Functions (updated)
✅ `functions/src/ondato-webhook.ts` - Webhook handler

## 🧪 Step 5: Testing

### A. Test in Sandbox Environment

Update `functions/.env`:
```env
ONDATO_API_URL=https://api-sandbox.ondato.com
```

Redeploy functions:
```bash
firebase deploy --only functions
```

### B. Test Flow

1. **Start Verification**:
   - Select "Family Account"
   - Enter DOB (18+)
   - Tap "Start Verification"

2. **Complete Verification**:
   - Upload test ID document
   - Complete liveness check
   - Wait for redirect

3. **Verify Results**:
   - Check Firestore `verification_attempts` collection
   - Check user's `ageVerificationStatus` field
   - Check `notifications` collection

### C. Test Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Valid ID, Age 18+ | Status: completed, ageVerificationStatus: verified |
| Valid ID, Age < 18 | Status: failed, ageVerificationStatus: rejected |
| Session timeout (30 min) | Status: expired |
| Cancel verification | No status change, can retry |

## 🔐 Step 6: Security Configuration

### A. Firebase Functions CORS

Already configured in `ondato-webhook.ts`:
```typescript
export const ondatoWebhook = onRequest({ cors: true }, async (req, res) => {
  // Webhook handler
});
```

### B. Webhook Authentication

The webhook validates Basic Auth:
```typescript
function verifyBasicAuth(authHeader: string): boolean {
  // Validates ONDATO_USERNAME and ONDATO_PASSWORD
}
```

### C. Environment Variables

Never commit `.env` file! Add to `.gitignore`:
```
functions/.env
functions/lib/
```

## 📊 Step 7: Monitoring

### A. Firebase Console

Monitor in Firebase Console → Functions:
- Function execution logs
- Error rates
- Execution times

### B. Ondato Dashboard

Monitor in Ondato Admin Panel:
- Verification attempts
- Success/failure rates
- Webhook delivery status

### C. Firestore Queries

Check verification status:
```javascript
db.collection('verification_attempts')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(1)
  .get()
```

## 🚀 Step 8: Production Deployment

### A. Switch to Production

Update `functions/.env`:
```env
ONDATO_API_URL=https://api.ondato.com
```

### B. Update Firebase Config

```bash
firebase functions:config:set ondato.api_url="https://api.ondato.com"
```

### C. Deploy

```bash
firebase deploy --only functions
```

### D. Update Ondato Webhook URL

In Ondato Dashboard, update webhook URL to production:
```
https://us-central1-[your-project-id].cloudfunctions.net/ondatoWebhook
```

## 🔄 Complete Flow Diagram

```
User (Parent)
    ↓
Select "Family Account" + Enter DOB (18+)
    ↓
OndatoVerification Screen
    ↓
Tap "Start Verification"
    ↓
Firebase Function: startOndatoVerification
    ├─ Validates age (18+)
    ├─ Creates session in Firestore
    ├─ Calls Ondato API
    └─ Returns verification URL
    ↓
Opens Ondato in Browser (expo-web-browser)
    ├─ Upload ID document
    ├─ Complete liveness check
    └─ Ondato processes verification
    ↓
Ondato sends webhook to Firebase
    ↓
Firebase Function: ondatoWebhook
    ├─ Validates Basic Auth
    ├─ Updates verification_attempts
    ├─ Updates user profile
    ├─ Creates notification
    └─ Calculates profile completion
    ↓
Deep link redirects to app
    ↓
striver://verification-success or striver://verification-failed
    ↓
App shows success/failure screen
    ↓
Navigate to next onboarding step
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Function not found | Run `firebase deploy --only functions` |
| Webhook 401 error | Check ONDATO_USERNAME/PASSWORD in Firebase config |
| Deep link not working | Verify URL scheme in Info.plist/AndroidManifest.xml |
| Session expired | Sessions expire after 30 minutes, start new verification |
| Age requirement error | User must be 18+, check DOB calculation |

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `functions/src/index.ts` | Main Cloud Functions (startOndatoVerification, checkVerificationStatus) |
| `functions/src/ondato-webhook.ts` | Webhook handler for Ondato callbacks |
| `functions/.env` | Environment variables (local development) |
| `src/screens/auth/OndatoVerification.tsx` | React Native verification screen |
| `src/hooks/useOndatoVerification.ts` | Verification logic hook |
| `src/navigation/AuthNavigator.tsx` | Navigation configuration |

## ✅ Final Checklist

- [ ] Ondato account created and configured
- [ ] API credentials obtained
- [ ] IDV setup created with age 18+ requirement
- [ ] Webhook configured in Ondato dashboard
- [ ] Firebase Functions deployed
- [ ] Environment variables set
- [ ] Firestore collections created
- [ ] Security rules updated
- [ ] Deep links configured (iOS & Android)
- [ ] Tested in sandbox environment
- [ ] Deployed to production
- [ ] Monitoring set up

## 🆘 Support

- **Ondato Documentation**: https://ondato.atlassian.net/wiki/spaces/PUB/pages/2268626955
- **Ondato Support**: support@ondato.com
- **Firebase Documentation**: https://firebase.google.com/docs/functions
- **Admin Panel**: https://os.ondato.com/admin-panel

## 🎉 Success!

Once all steps are complete, your parent age verification flow will be fully functional using Firebase and Ondato!
