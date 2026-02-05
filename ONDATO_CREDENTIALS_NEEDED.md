# Ondato Integration - Credentials Required

## Current Status

✅ **Cloudflare Worker Deployed Successfully**
- Worker URL: `https://ondato-proxy.striverapp.workers.dev`
- Health check: PASSING
- CORS headers: CONFIGURED
- OAuth2 authentication: IMPLEMENTED

❌ **Ondato API Credentials Invalid**
- Current credentials return 404 errors
- Need correct OAuth2 client credentials from Ondato

## What's Working

1. **Cloudflare Worker** - Fully deployed and operational
2. **React Native Integration** - Code updated to use worker
3. **OAuth2 Flow** - Implemented in worker (token caching, refresh logic)
4. **Error Handling** - Comprehensive error logging
5. **CORS** - Configured for React Native requests

## What's Needed

### Get Correct Ondato Credentials

You need to obtain the following from your Ondato account:

1. **Log in to Ondato Admin Panel**
   - URL: https://os.ondato.com/admin-panel
   - Or your specific Ondato dashboard URL

2. **Navigate to API Settings**
   - Go to: Settings → API Keys (or similar section)
   - Look for OAuth2 / API credentials section

3. **Copy These Values:**
   ```
   CLIENT_ID: _______________
   CLIENT_SECRET: _______________
   SETUP_ID: fa1fb2cb-034f-4926-bd38-c8290510ade9 (verify this is correct)
   ```

4. **Verify API Endpoints:**
   - Auth URL: Should be something like `https://auth.ondato.com/oauth2/token`
   - API URL: Should be `https://api.ondato.com`
   - If different, note the correct URLs

### Current (Invalid) Credentials

The credentials currently in the code are:
```
CLIENT_ID: app@joinstriver.com
CLIENT_SECRET: *&3m%R9KW&Xq6hU<<
```

These return 404 errors, indicating they're either:
- Not valid OAuth2 credentials
- For a different authentication method
- For a test/sandbox environment that no longer exists

## How to Update Credentials

Once you have the correct credentials:

### Option 1: Update Worker Code (Quick)

1. Open `functions/cloudflare-workers/ondato-proxy-worker.js`
2. Update these lines (around line 12-14):
   ```javascript
   const ONDATO_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID';
   const ONDATO_CLIENT_SECRET = 'YOUR_ACTUAL_CLIENT_SECRET';
   const ONDATO_SETUP_ID = 'YOUR_ACTUAL_SETUP_ID';
   ```
3. Redeploy:
   ```bash
   cd functions/cloudflare-workers
   npx wrangler deploy
   ```

### Option 2: Use Cloudflare Secrets (Recommended)

1. Set secrets:
   ```bash
   cd functions/cloudflare-workers
   npx wrangler secret put ONDATO_CLIENT_ID
   npx wrangler secret put ONDATO_CLIENT_SECRET
   npx wrangler secret put ONDATO_SETUP_ID
   ```

2. Update worker code to use `env.ONDATO_CLIENT_ID` instead of constants

3. Redeploy

## Testing After Update

1. **Test Ondato API directly:**
   ```bash
   cd functions/cloudflare-workers
   node test-ondato-api.js
   ```
   
   Expected output:
   ```
   ✅ Access token obtained
   ✅ SUCCESS! Session created
   ```

2. **Test Worker:**
   ```bash
   node test-worker.js https://ondato-proxy.striverapp.workers.dev
   ```
   
   Expected output:
   ```
   ✅ Health check PASSED
   ✅ Create session PASSED
   ✅ Check status PASSED
   ✅ CORS headers PASSED
   ```

3. **Test in React Native App:**
   - Run the app
   - Navigate to age verification screen
   - Click "Start Verification"
   - Should open Ondato verification in browser
   - Complete verification
   - App should detect completion

## Error Messages Explained

### Current Error
```
Authentication failed: 404 page not found
```

**Meaning:** The OAuth2 token endpoint (`https://auth.ondato.com/oauth2/token`) is returning 404. This means:
- The auth URL is wrong, OR
- The credentials are for a different authentication method, OR
- Your Ondato account uses a different auth endpoint

### What to Ask Ondato Support

If you can't find the credentials in the dashboard:

1. "What are my OAuth2 client credentials for API access?"
2. "What is the correct OAuth2 token endpoint URL?"
3. "What is my Setup ID for identity verification?"
4. "Do you have API documentation for the v1/identity-verifications endpoint?"

## Implementation Summary

### What's Already Done

1. ✅ Cloudflare Worker created with OAuth2 support
2. ✅ Worker deployed to production
3. ✅ React Native app updated to use worker
4. ✅ Firebase Functions bypassed (no more UNAUTHENTICATED errors)
5. ✅ Error handling and logging implemented
6. ✅ Test scripts created
7. ✅ Documentation created

### What Remains

1. ❌ Get correct Ondato OAuth2 credentials
2. ❌ Update worker with correct credentials
3. ❌ Redeploy worker
4. ❌ Test end-to-end flow
5. ❌ Verify no UNAUTHENTICATED errors

## Files Modified

### Cloudflare Worker
- `functions/cloudflare-workers/ondato-proxy-worker.js` - OAuth2 implementation
- `functions/cloudflare-workers/test-ondato-api.js` - OAuth2 test script
- `functions/cloudflare-workers/test-worker.js` - Worker test script

### React Native App
- `src/services/ondatoService.ts` - Service to call worker
- `src/hooks/useOndatoVerification.ts` - Hook using service
- `src/screens/auth/OndatoVerification.tsx` - Screen using hook

## Next Steps

1. **Get Ondato credentials** from admin panel or support
2. **Update worker** with correct credentials
3. **Redeploy worker** using `npx wrangler deploy`
4. **Run tests** to verify everything works
5. **Test in app** to confirm no UNAUTHENTICATED errors

## Support

If you need help:
1. Check Ondato documentation: https://ondato.atlassian.net/wiki/spaces/PUB
2. Contact Ondato support: support@ondato.com
3. Provide them with your account email and ask for OAuth2 API credentials

---

**Status:** Implementation complete, waiting for valid Ondato credentials
**Last Updated:** February 4, 2026
