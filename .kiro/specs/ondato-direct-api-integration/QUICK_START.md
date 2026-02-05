# Ondato Direct API Integration - Quick Start

## Problem

You're experiencing `UNAUTHENTICATED` errors when checking Ondato verification status:

```
ERROR  Error checking verification status: [Error: UNAUTHENTICATED]
```

This happens because Firebase authentication tokens can expire or fail when calling Firebase Functions from React Native.

## Solution

Use a Cloudflare Worker as a proxy (same pattern as your successful video upload flow):

```
React Native App → Cloudflare Worker → Ondato API
```

This bypasses Firebase authentication entirely.

## Implementation (30 minutes)

### Step 1: Get Your Ondato Credentials (5 min)

You need:
- Ondato Username
- Ondato Password  
- Ondato Setup ID: `fa1fb2cb-034f-4926-bd38-c8290510ade9`

Check your Ondato dashboard or contact Ondato support if you don't have these.

### Step 2: Deploy Cloudflare Worker (10 min)

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   cd functions/cloudflare-workers
   wrangler login
   ```

3. **Update credentials in `ondato-proxy-worker.js`:**
   ```javascript
   const ONDATO_USERNAME = 'your_actual_username';
   const ONDATO_PASSWORD = 'your_actual_password';
   ```

4. **Update account ID in `wrangler.toml`:**
   - Find your account ID in Cloudflare dashboard URL
   - Replace the placeholder in `wrangler.toml`

5. **Deploy:**
   ```bash
   wrangler publish
   ```
   
   Or on Windows:
   ```bash
   deploy-ondato-worker.bat
   ```

6. **Note your worker URL:**
   ```
   https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev
   ```

### Step 3: Test Worker (5 min)

```bash
# Test health check
curl https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev/health

# Or use the test script
node test-worker.js https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev
```

You should see:
```json
{
  "status": "ok",
  "message": "Ondato proxy worker is running"
}
```

### Step 4: Update React Native App (10 min)

1. **Update worker URL in `src/services/ondatoService.ts`:**
   ```typescript
   const CLOUDFLARE_WORKER_URL = 'https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev';
   ```

2. **The service is already created** - no other changes needed!

3. **Update the hook** (see tasks.md Task 3 for details)

4. **Update the screen** (see tasks.md Task 4 for details)

### Step 5: Test in App (5 min)

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Navigate to age verification**

3. **Click "Start Verification"**
   - Should open Ondato without errors
   - Check console logs for success messages

4. **Complete verification in Ondato**

5. **Return to app and click "Refresh Status Now"**
   - Should update status without UNAUTHENTICATED error
   - Check console logs for status updates

## Files Created

✅ `functions/cloudflare-workers/ondato-proxy-worker.js` - Worker code
✅ `functions/cloudflare-workers/wrangler.toml` - Worker config
✅ `functions/cloudflare-workers/README.md` - Worker documentation
✅ `functions/cloudflare-workers/deploy-ondato-worker.bat` - Deployment script
✅ `functions/cloudflare-workers/test-worker.js` - Test script
✅ `src/services/ondatoService.ts` - React Native service
✅ `.kiro/specs/ondato-direct-api-integration/requirements.md` - Requirements
✅ `.kiro/specs/ondato-direct-api-integration/design.md` - Design
✅ `.kiro/specs/ondato-direct-api-integration/tasks.md` - Implementation tasks
✅ `.kiro/specs/ondato-direct-api-integration/IMPLEMENTATION_GUIDE.md` - Detailed guide

## What's Next?

1. **Deploy the worker** (Step 2 above)
2. **Test the worker** (Step 3 above)
3. **Update the app** (Step 4 above)
4. **Follow tasks.md** for detailed implementation steps

## Expected Results

After implementation:

✅ No more UNAUTHENTICATED errors
✅ Session creation works reliably
✅ Status checking works reliably
✅ Deep links still work
✅ App state changes trigger status checks
✅ Firestore data saves correctly

## Troubleshooting

### Worker deployment fails
- Check you're logged in: `wrangler whoami`
- Verify account ID in `wrangler.toml`
- Check for syntax errors in worker code

### Worker returns errors
- Verify Ondato credentials are correct
- Check worker logs: `wrangler tail`
- Test Ondato API directly with curl

### App still shows UNAUTHENTICATED
- Verify worker URL is correct in `ondatoService.ts`
- Check worker is deployed and responding
- Ensure you updated the hook to use ondatoService

### Status check fails
- Verify identificationId is saved in Firestore
- Check worker logs for errors
- Test worker endpoint with curl

## Support

Need help? Check:
1. `IMPLEMENTATION_GUIDE.md` - Detailed implementation steps
2. `functions/cloudflare-workers/README.md` - Worker documentation
3. `tasks.md` - Step-by-step tasks
4. Worker logs: `wrangler tail`
5. React Native logs: `npx react-native log-android` or `npx react-native log-ios`

## Success Checklist

- [ ] Ondato credentials obtained
- [ ] Wrangler CLI installed
- [ ] Cloudflare account logged in
- [ ] Worker credentials updated
- [ ] Worker account ID updated
- [ ] Worker deployed successfully
- [ ] Worker health check passes
- [ ] Worker URL updated in app
- [ ] App tested with verification flow
- [ ] No UNAUTHENTICATED errors
- [ ] Status checks work correctly
- [ ] Deep links work correctly
- [ ] Firestore data saves correctly

Once all items are checked, you're done! 🎉
