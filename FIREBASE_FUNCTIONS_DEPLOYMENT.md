# ONDATO FIREBASE FUNCTIONS - DEPLOYMENT IN PROGRESS

## Problem Found

The Firebase Functions `handleOndatoVerification` and `syncOndatoStatus` were **imported but not exported** as callable functions in `functions/src/index.ts`.

## What I Fixed

### 1. **Exported the Functions Properly**

**Before:**
```typescript
import { handleOndatoVerification, syncOndatoStatus } from './ondato';
// Functions were imported but NEVER exported as callable
```

**After:**
```typescript
import { handleOndatoVerification as handleOndatoVerificationInternal, syncOndatoStatus as syncOndatoStatusInternal } from './ondato';

// Export Ondato functions as callable
export const handleOndatoVerification = onCall({ cors: true }, async (request) => {
    console.log(`[handleOndatoVerification] Auth Present: ${!!request.auth}, UID: ${request.auth?.uid || 'NONE'}`);
    return await handleOndatoVerificationInternal(request.auth, request.data, getDb());
});

export const syncOndatoStatus = onCall({ cors: true }, async (request) => {
    console.log(`[syncOndatoStatus] Auth Present: ${!!request.auth}, UID: ${request.auth?.uid || 'NONE'}`);
    return await syncOndatoStatusInternal(request.auth, request.data, getDb());
});
```

### 2. **Fixed Circular References**

Updated `verifyAge`, `startOndatoVerification`, and `checkVerificationStatus` to use the internal function references.

### 3. **Fixed Import in ondatoService.ts**

Changed from `firebaseFunctions` to `cloudFunctions` to match your Firebase config exports.

---

## Deployment Status

**Currently running:**
```bash
cd functions && npm run build && firebase deploy --only functions:handleOndatoVerification,functions:syncOndatoStatus
```

This will:
1. ✅ Compile TypeScript to JavaScript
2. ⏳ Deploy only the two Ondato functions (faster than full deployment)
3. ⏳ Make them available for your app to call

---

## After Deployment Completes

### Test the Verification Flow

1. **Refresh the app** (Metro bundler will auto-reload)
2. **Click "Start Verification"**
3. **Expected logs**:
   ```
   LOG  [OndatoService] Starting Firebase Functions session creation
   LOG  [OndatoService] Session ID: <user_id>_<timestamp>
   LOG  [OndatoService] Got fresh ID token
   LOG  [OndatoService] Firebase Function response: {hasSessionId: true, hasVerificationUrl: true}
   LOG  [useOndatoVerification] Session created successfully
   ```

4. **WebView should open** with Ondato verification interface

---

## Why This Happened

Firebase Functions need to be **explicitly exported** using `onCall()` or `onRequest()` to be callable from client apps. The functions existed in your codebase but were only being used internally by other functions like `verifyAge` and `startOndatoVerification`.

Your React Native app was trying to call:
- `handleOndatoVerification` ❌ (not exported)
- `syncOndatoStatus` ❌ (not exported)

Which resulted in the `NOT_FOUND` error.

---

## Deployment Time Estimate

- **TypeScript compilation**: ~1-2 minutes
- **Firebase deployment**: ~2-3 minutes
- **Total**: ~3-5 minutes

---

## If Deployment Fails

Check the error message. Common issues:

1. **TypeScript errors**: Fix in `functions/src/index.ts` or `functions/src/ondato.ts`
2. **Firebase CLI not logged in**: Run `firebase login`
3. **Wrong project**: Run `firebase use <project-id>`

---

## Alternative: Deploy All Functions

If the selective deployment fails, deploy everything:

```bash
cd functions
npm run build
firebase deploy --only functions
```

This takes longer (~5-10 minutes) but ensures everything is deployed.

---

**Status**: Waiting for deployment to complete... ⏳
