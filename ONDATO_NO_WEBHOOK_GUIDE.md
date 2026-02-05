# Ondato Without Webhook - Implementation Guide

## What Changed

The Ondato verification now works **without webhook dependency** using a polling mechanism.

## How It Works

### 1. Direct URL Approach
- No API credentials needed
- Uses direct Ondato URL: `https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9`
- Generates unique external reference for each verification
- Stores verification attempt in Firestore

### 2. Polling Mechanism
- When user returns to app, starts checking Firestore every 5 seconds
- Uses Firestore real-time listener for instant updates
- Maximum polling time: 2 minutes (24 attempts)
- Shows progress timer to user

### 3. Status Updates
- Admin manually updates Firestore after checking Ondato dashboard
- OR webhook updates Firestore automatically (when configured)
- App detects status change and shows result

## User Flow

```
1. User clicks "Start Verification"
   ↓
2. App creates verification attempt in Firestore
   - externalReferenceId: "ondato_user123_1234567890"
   - status: "pending"
   ↓
3. App opens Ondato URL in browser
   https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9?externalRef=ondato_user123_1234567890
   ↓
4. User completes verification on Ondato
   ↓
5. User returns to app (manually or via deep link)
   ↓
6. App starts polling Firestore
   - Shows "Checking verification status..."
   - Shows timer: "15s / 120s"
   ↓
7. Admin checks Ondato dashboard
   - Sees verification result
   - Updates Firestore manually:
     ```javascript
     db.collection('verification_attempts')
       .doc(attemptId)
       .update({ status: 'completed' })
     ```
   ↓
8. App detects status change
   ↓
9. Shows success/failure screen
```

## Testing Steps

### Step 1: Configure Ondato Portal
1. Go to https://dashboard.ondato.com
2. Find your setup: `fa1fb2cb-034f-4926-bd38-c8290510ade9`
3. Configure redirect URLs (if available):
   - Success: `striver://verification-success`
   - Error: `striver://verification-failed`
   - Cancelled: `striver://verification-cancelled`

### Step 2: Test Verification Flow
1. Open Striver app
2. Create parent account
3. Click "Start Verification"
4. Complete verification on Ondato
5. Return to app
6. App shows "Checking verification status..."

### Step 3: Manual Status Update (Admin)
1. Open Ondato dashboard
2. Check verification result
3. Open Firebase Console
4. Go to Firestore → `verification_attempts`
5. Find the attempt with matching `externalReferenceId`
6. Update `status` field:
   - `completed` for success
   - `failed` for failure
7. App will detect change within 5 seconds

### Step 4: Verify Result
- Success: User sees green checkmark, navigates to next screen
- Failure: User sees error, can retry
- Timeout: User sees warning, can check again or continue

## Firestore Structure

### verification_attempts Collection
```javascript
{
  userId: "user123",
  externalReferenceId: "ondato_user123_1234567890",
  method: "ondato",
  status: "pending", // or "completed", "failed"
  verificationUrl: "https://idv.ondato.com/setups/...",
  dateOfBirth: "01/01/1990",
  accountType: "family",
  createdAt: Timestamp,
  lastCheckedAt: Timestamp,
  completedAt: Timestamp | null
}
```

### users Collection Update
```javascript
{
  ageVerificationStatus: "verified", // or "rejected"
  ageVerificationMethod: "ondato",
  ageVerificationDate: Timestamp
}
```

## Admin Manual Update Script

For quick testing, you can use this script in Firebase Console:

```javascript
// Find verification attempt
const snapshot = await db.collection('verification_attempts')
  .where('externalReferenceId', '==', 'ondato_user123_1234567890')
  .limit(1)
  .get();

if (!snapshot.empty) {
  const doc = snapshot.docs[0];
  
  // Update to completed
  await doc.ref.update({
    status: 'completed',
    completedAt: new Date()
  });
  
  // Update user profile
  const userId = doc.data().userId;
  await db.collection('users').doc(userId).update({
    ageVerificationStatus: 'verified',
    ageVerificationMethod: 'ondato',
    ageVerificationDate: new Date()
  });
  
  console.log('Verification updated successfully!');
}
```

## Advantages

✅ **No API credentials needed** - Works immediately  
✅ **No webhook configuration needed** - Simpler setup  
✅ **Real-time updates** - Uses Firestore listeners  
✅ **Graceful timeout** - User can continue if verification takes too long  
✅ **Manual fallback** - Admin can update status manually  

## Limitations

⚠️ **Manual admin work** - Admin must check Ondato dashboard and update Firestore  
⚠️ **Slight delay** - Up to 5 seconds between status change and app detection  
⚠️ **2-minute timeout** - If verification takes longer, user must check back later  

## Future Enhancement: Webhook

When webhook is configured, the flow becomes fully automated:

```
User completes verification
  ↓
Ondato sends webhook to Firebase Function
  ↓
Firebase Function updates Firestore
  ↓
App detects change instantly (via Firestore listener)
  ↓
User sees result immediately
```

No admin manual work needed!

## Troubleshooting

### Issue: App stuck on "Checking verification status"
**Solution**: 
1. Check Firestore for verification attempt
2. Manually update status to `completed` or `failed`
3. App will detect change within 5 seconds

### Issue: Ondato URL doesn't open
**Solution**:
1. Check internet connection
2. Verify Setup ID is correct: `fa1fb2cb-034f-4926-bd38-c8290510ade9`
3. Try opening URL manually in browser

### Issue: Verification times out after 2 minutes
**Solution**:
1. User can click "Check Again" to restart polling
2. Or user can continue and check back later
3. Admin can manually update Firestore when ready

### Issue: Deep links not working
**Solution**:
1. Configure redirect URLs in Ondato portal
2. Test deep links: `adb shell am start -a android.intent.action.VIEW -d "striver://verification-success"`
3. Fallback: User manually returns to app, polling will work

## Next Steps

1. ✅ Ondato verification works without webhook
2. ⏳ Add admin panel to manually update verification status
3. ⏳ Configure webhook for fully automated flow
4. ⏳ Add toggle to switch between Ondato and manual verification

## Support

If you need help:
- Check Firebase Console logs
- Check Firestore `verification_attempts` collection
- Check Ondato dashboard for verification results
- Contact Ondato support for webhook configuration
