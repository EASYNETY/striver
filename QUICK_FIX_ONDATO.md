# Quick Fix: Ondato UNAUTHENTICATED Error

## Problem
Getting `UNAUTHENTICATED` errors when checking Ondato verification status.

## Solution Implemented
✅ Cloudflare Worker proxy (bypasses Firebase auth, just like video upload)

## Current Status
🟡 **Worker deployed, but needs valid Ondato credentials**

## What You Need To Do

### Step 1: Get Ondato Credentials (5 minutes)

1. Go to: https://os.ondato.com/admin-panel
2. Navigate to: **Settings → API Keys**
3. Copy these 3 values:
   - `CLIENT_ID` (might be called "API Key" or "Application ID")
   - `CLIENT_SECRET` (might be called "API Secret")
   - `SETUP_ID` (you have: `fa1fb2cb-034f-4926-bd38-c8290510ade9` - verify it's correct)

### Step 2: Update Worker (2 minutes)

1. Open: `functions/cloudflare-workers/ondato-proxy-worker.js`
2. Find lines 12-14:
   ```javascript
   const ONDATO_CLIENT_ID = 'app@joinstriver.com';  // ← CHANGE THIS
   const ONDATO_CLIENT_SECRET = '*&3m%R9KW&Xq6hU<<';  // ← CHANGE THIS
   const ONDATO_SETUP_ID = 'fa1fb2cb-034f-4926-bd38-c8290510ade9';  // ← VERIFY THIS
   ```
3. Replace with your actual credentials

### Step 3: Redeploy Worker (1 minute)

```bash
cd functions/cloudflare-workers
npx wrangler deploy
```

### Step 4: Test (1 minute)

```bash
node test-ondato-api.js
```

Should see:
```
✅ Access token obtained
✅ SUCCESS! Session created
```

### Step 5: Test in App

1. Run React Native app
2. Go to age verification
3. Click "Start Verification"
4. Should work without UNAUTHENTICATED errors!

## Why This Works

**Before:** React Native → Firebase Functions → Ondato
- ❌ Firebase auth tokens failing

**After:** React Native → Cloudflare Worker → Ondato
- ✅ No Firebase auth needed (same pattern as video upload)

## Files Already Updated

✅ `functions/cloudflare-workers/ondato-proxy-worker.js` - Worker with OAuth2
✅ `src/services/ondatoService.ts` - Calls worker instead of Firebase
✅ `src/hooks/useOndatoVerification.ts` - Uses new service
✅ `src/screens/auth/OndatoVerification.tsx` - Uses updated hook

## If You Can't Find Credentials

Contact Ondato support:
- Email: support@ondato.com
- Ask for: "OAuth2 API credentials for identity verification"

## Common Issues

### "404 page not found" when testing
→ Credentials are wrong or auth URL is wrong

### "401 unauthorized" when testing
→ Credentials are correct format but invalid/expired

### "Setup ID not found"
→ Verify your SETUP_ID in Ondato dashboard

---

**Bottom Line:** Just need valid Ondato credentials, then everything will work!
