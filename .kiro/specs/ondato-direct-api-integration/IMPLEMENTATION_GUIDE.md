# Ondato Direct API Integration - Implementation Guide

## Quick Start

This guide will help you implement the Cloudflare Worker proxy solution to fix the UNAUTHENTICATED error in Ondato verification.

## Prerequisites

1. Cloudflare account with Workers enabled
2. Ondato API credentials (username, password, setup ID)
3. Node.js and npm installed
4. Wrangler CLI installed: `npm install -g wrangler`

## Implementation Steps

### Step 1: Create Cloudflare Worker (30 minutes)

1. **Create worker directory:**
   ```bash
   mkdir -p functions/cloudflare-workers
   cd functions/cloudflare-workers
   ```

2. **Initialize worker:**
   ```bash
   wrangler init ondato-proxy
   ```

3. **Copy the worker code from design.md** into `ondato-proxy-worker.js`

4. **Update credentials** in the worker file:
   - Replace `your_ondato_username` with actual username
   - Replace `your_ondato_password` with actual password
   - Verify `ONDATO_SETUP_ID` is correct: `fa1fb2cb-034f-4926-bd38-c8290510ade9`

5. **Deploy worker:**
   ```bash
   wrangler publish
   ```

6. **Test worker endpoints:**
   ```bash
   # Test create session
   curl -X POST https://ondato-proxy.striver-app.workers.dev/create-session \
     -H "Content-Type: application/json" \
     -d '{"externalReferenceId":"test_123","language":"en"}'

   # Test check status (use identificationId from create session response)
   curl https://ondato-proxy.striver-app.workers.dev/check-status/YOUR_ID_HERE
   ```

### Step 2: Create Ondato Service (15 minutes)

1. **Create service file:**
   ```bash
   # From project root
   touch src/services/ondatoService.ts
   ```

2. **Copy the service code from design.md** into `ondatoService.ts`

3. **Update worker URL** if different from `https://ondato-proxy.striver-app.workers.dev`

4. **Test imports:**
   ```typescript
   // Add to a test file or component
   import { ondatoService } from '../services/ondatoService';
   ```

### Step 3: Update Verification Hook (20 minutes)

1. **Open `src/hooks/useOndatoVerification.ts`**

2. **Add ondatoService import:**
   ```typescript
   import { ondatoService } from '../services/ondatoService';
   import { db, firebaseAuth } from '../api/firebase';
   import { addDoc, collection, serverTimestamp, updateDoc, doc, query, where, getDocs } from '@react-native-firebase/firestore';
   ```

3. **Update `startVerification` function:**
   - Remove Firebase Functions call
   - Add ondatoService.createSession() call
   - Add Firestore save for verification_attempts
   - Add Firestore update for user profile

4. **Update `checkStatus` function:**
   - Remove Firebase Functions call
   - Add ondatoService.checkStatus() call
   - Add Firestore update for verification_attempts
   - Add Firestore update for user profile if completed

5. **Remove unused imports:**
   - Remove `getFunctions, httpsCallable` from Firebase imports

### Step 4: Update Verification Screen (15 minutes)

1. **Open `src/screens/auth/OndatoVerification.tsx`**

2. **Update `checkStatus` function:**
   - Replace Firebase Functions call with hook's checkStatus
   - Remove `httpsCallable` usage
   - Keep Firestore listener logic

3. **Update `startVerification` function:**
   - Ensure it uses the hook's startVerification
   - Remove direct Firebase Functions calls

4. **Remove unused imports:**
   - Remove `httpsCallable` import
   - Remove `cloudFunctions` import if not used elsewhere

### Step 5: Test the Implementation (30 minutes)

1. **Test session creation:**
   - Start the app
   - Navigate to age verification
   - Click "Start Verification"
   - Verify Ondato page opens
   - Check console logs for success

2. **Test status checking:**
   - Complete verification in Ondato
   - Return to app
   - Click "Refresh Status Now"
   - Verify status updates correctly

3. **Test deep links:**
   - Complete verification in Ondato
   - Verify deep link redirects back to app
   - Verify success screen shows

4. **Test app state changes:**
   - Start verification
   - Switch to another app
   - Return to Striver app
   - Verify status check triggers automatically

5. **Test error handling:**
   - Turn off WiFi
   - Try to start verification
   - Verify error message shows
   - Turn on WiFi and retry

### Step 6: Update Firestore (10 minutes)

1. **Check verification_attempts collection:**
   - Ensure `identificationId` field exists
   - Ensure `ondatoStatus` field exists
   - Ensure `metadata.ondatoIdentificationId` exists

2. **Check users collection:**
   - Ensure `ageVerificationStatus` field exists
   - Ensure `profileStatus.ageVerification` exists

3. **Update Firestore rules if needed:**
   ```javascript
   // Allow users to read/write their own verification attempts
   match /verification_attempts/{attemptId} {
     allow read, write: if request.auth != null && 
       resource.data.userId == request.auth.uid;
   }
   ```

## Troubleshooting

### Worker not responding
- Check worker is deployed: `wrangler tail`
- Verify worker URL is correct
- Check CORS headers are present

### Session creation fails
- Verify Ondato credentials are correct
- Check worker logs: `wrangler tail`
- Test Ondato API directly with curl

### Status check fails
- Verify identificationId is saved in Firestore
- Check worker logs for errors
- Verify Ondato API is reachable

### Deep links not working
- Verify URL scheme is registered in app
- Check iOS Info.plist and Android AndroidManifest.xml
- Test deep link with: `npx uri-scheme open striver://verification-success --ios`

## Verification Checklist

- [ ] Cloudflare Worker deployed and responding
- [ ] Worker endpoints tested with curl
- [ ] ondatoService.ts created and imported
- [ ] useOndatoVerification.ts updated
- [ ] OndatoVerification.tsx updated
- [ ] Firebase Functions calls removed
- [ ] Session creation works without auth errors
- [ ] Status checking works without auth errors
- [ ] Deep links work correctly
- [ ] App state changes trigger status checks
- [ ] Firestore data saves correctly
- [ ] User profile updates on completion
- [ ] Error messages are clear
- [ ] Console logs are helpful for debugging

## Next Steps

After implementation:

1. **Test thoroughly** with real Ondato verification
2. **Monitor logs** for any errors
3. **Update documentation** with new flow
4. **Remove deprecated code** (optional)
5. **Deploy to production** when confident

## Support

If you encounter issues:

1. Check worker logs: `wrangler tail`
2. Check React Native logs: `npx react-native log-android` or `npx react-native log-ios`
3. Check Firestore console for data
4. Review the design.md for implementation details
5. Review the requirements.md for acceptance criteria

## Success Metrics

You'll know it's working when:

- ✅ No UNAUTHENTICATED errors in logs
- ✅ Verification sessions create successfully
- ✅ Status checks return correct data
- ✅ Users can complete verification end-to-end
- ✅ Firestore data is accurate
- ✅ User profiles update correctly
