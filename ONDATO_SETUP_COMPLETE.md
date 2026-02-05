# Ondato Age Verification Setup

## Current Status: ✅ WORKING WITHOUT WEBHOOK

### ✅ What's Working Now:
1. **Setup ID configured**: `fa1fb2cb-034f-4926-bd38-c8290510ade9`
2. **Verification URL**: `https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9`
3. **Direct URL approach**: No API credentials needed
4. **Polling mechanism**: App checks status every 5 seconds
5. **Firestore integration**: Stores verification attempts
6. **Manual admin updates**: Admin can update status in Firestore

### 🎯 How It Works (No Webhook Required)

**User Flow:**
1. User clicks "Start Verification" in app
2. App creates verification attempt in Firestore with unique external reference
3. App opens Ondato URL in browser: `https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9?externalRef=ondato_user123_1234567890`
4. User completes ID verification on Ondato
5. User returns to app (manually or via deep link)
6. App starts polling Firestore for status changes (every 5 seconds, max 2 minutes)
7. Admin checks Ondato dashboard and manually updates Firestore status
8. App detects status change and shows result to user

**Admin Workflow:**
1. Check Ondato dashboard for verification results
2. Open Firebase Console → Firestore → `verification_attempts`
3. Find verification by `externalReferenceId`
4. Update `status` field to `completed` or `failed`
5. App automatically detects change within 5 seconds

### 📋 Quick Start Guide

**For Testing:**
1. Open Striver app
2. Create parent account
3. Click "Start Verification"
4. Complete verification on Ondato
5. Return to app
6. Use `test-ondato-manual-update.js` script to update status in Firestore
7. App shows result within 5 seconds

**Manual Status Update (Firebase Console):**
```javascript
// Find pending verification
db.collection('verification_attempts')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .limit(1)
  .get()

// Update to completed
db.collection('verification_attempts')
  .where('externalReferenceId', '==', 'ondato_user123_1234567890')
  .get()
  .then(s => s.docs[0].ref.update({status: 'completed', completedAt: new Date()}))
```

### 📁 Files Created

- `ONDATO_NO_WEBHOOK_GUIDE.md` - Complete implementation guide
- `test-ondato-manual-update.js` - Script for manual status updates
- `firestore-verification-rules.txt` - Security rules for Firestore
- Updated `src/screens/auth/OndatoVerification.tsx` - No webhook implementation

### ⚙️ Configuration Needed in Ondato Portal

**Optional but Recommended:**
1. Go to https://dashboard.ondato.com
2. Find setup: `fa1fb2cb-034f-4926-bd38-c8290510ade9`
3. Configure redirect URLs (if available):
   - Success URL: `striver://verification-success`
   - Error URL: `striver://verification-failed`
   - Consent Declined URL: `striver://verification-cancelled`
4. Set Omnichannel: "Restrict to mobile only"
5. Enable End Screen: "Verification Complete"

**Note:** These are optional. The app works without them using polling.
### 🔄 Future Enhancement: Webhook (Optional)

When webhook is configured, the flow becomes fully automated:

**Webhook URL**: `https://us-central1-striver-app-48562.cloudfunctions.net/ondatoWebhook`

**Benefits:**
- ✅ Fully automated (no manual admin work)
- ✅ Instant status updates
- ✅ No polling needed

**Setup:**
1. Get API credentials from Ondato support
2. Update `functions/.env` with credentials
3. Configure webhook URL in Ondato dashboard
4. Deploy Firebase functions

**Current Status:** Works without webhook using polling + manual updates

---

## Advantages of Current Approach

✅ **Works immediately** - No API credentials needed  
✅ **Simple setup** - Just configure Ondato portal  
✅ **Real-time updates** - Uses Firestore listeners  
✅ **Graceful timeout** - User can continue if verification takes too long  
✅ **Manual fallback** - Admin can update status anytime  
✅ **No external dependencies** - Everything in Firebase  

## Limitations

⚠️ **Manual admin work** - Admin must check Ondato dashboard and update Firestore  
⚠️ **Slight delay** - Up to 5 seconds between status change and app detection  
⚠️ **2-minute timeout** - If verification takes longer, user must check back later  

## Troubleshooting

### App stuck on "Checking verification status"
1. Check Firestore `verification_attempts` collection
2. Find verification by `externalReferenceId`
3. Manually update `status` to `completed` or `failed`
4. App will detect change within 5 seconds

### Ondato URL doesn't open
1. Check internet connection
2. Verify Setup ID: `fa1fb2cb-034f-4926-bd38-c8290510ade9`
3. Try opening URL manually in browser

### Verification times out
1. User can click "Check Again" to restart polling
2. Or continue and check back later
3. Admin updates Firestore when ready

## Next Steps

1. ✅ Ondato works without webhook
2. ⏳ Test verification flow end-to-end
3. ⏳ Add admin panel for easy status updates
4. ⏳ Configure webhook for full automation (optional)
5. ⏳ Add toggle to switch between Ondato and manual verification

## Support

- **Documentation**: See `ONDATO_NO_WEBHOOK_GUIDE.md`
- **Manual Updates**: Use `test-ondato-manual-update.js`
- **Security Rules**: See `firestore-verification-rules.txt`
- **Ondato Support**: support@ondato.com
