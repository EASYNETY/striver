# Network Request Failed - Fix Guide

## Problem
When clicking "Start Verification" button, you see:
```
ERROR [OndatoService] Create session error: [TypeError: Network request failed]
```

## Root Cause
The Android app can't make HTTPS requests to the Cloudflare Worker because:
1. Network security configuration needs to be applied
2. App needs to be rebuilt with the new configuration
3. Metro bundler needs to be running

## Quick Fix (Recommended)

Run this script to fix everything automatically:
```bash
./fix-network-and-run.bat
```

This will:
1. Clean Android build cache
2. Rebuild app with network security config
3. Install on your device
4. Start Metro bundler automatically

## Manual Fix

If the automatic script doesn't work, follow these steps:

### Step 1: Verify Cloudflare Worker is Running
```bash
./diagnose-network.bat
```

Should show: `SUCCESS: Worker is responding`

### Step 2: Clean and Rebuild Android
```bash
cd android
gradlew clean
gradlew assembleDebug
cd ..
```

### Step 3: Install on Device
```bash
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 4: Start Metro Bundler
```bash
npm start
```

Wait for "Bundled successfully" message.

### Step 5: Test
1. Open app on device
2. Navigate to verification screen
3. Click "Start Verification"
4. Check logs - should see successful network requests

## What Was Changed

### 1. Network Security Config
File: `android/app/src/main/res/xml/network_security_config.xml`

Added HTTPS whitelist for:
- `striverapp.workers.dev` (Cloudflare Worker)
- `workers.dev` (Cloudflare domain)
- `ondato.com` (Ondato domains)
- `localhost` (Metro bundler)

### 2. Android Manifest
File: `android/app/src/main/AndroidManifest.xml`

Added:
```xml
android:networkSecurityConfig="@xml/network_security_config"
android:usesCleartextTraffic="false"
```

### 3. Enhanced Logging
File: `src/services/ondatoService.ts`

Added detailed logging to help diagnose network issues:
- Request URL
- Request body
- Response status
- Error details

## Verification

After fixing, you should see these logs when clicking "Start Verification":

```
LOG  [OndatoService] Creating session: KqfUrqB7_1770305282997
LOG  [OndatoService] Worker URL: https://ondato-proxy.striverapp.workers.dev
LOG  [OndatoService] Request body: {"externalReferenceId":"KqfUrqB7_1770305282997","language":"en"}
LOG  [OndatoService] Response status: 200
LOG  [OndatoService] Response data: {"success":true,"sessionId":"...","identificationId":"...","verificationUrl":"..."}
LOG  [OndatoService] Session created successfully: ...
```

## Still Not Working?

### Check 1: Device Connected
```bash
adb devices
```

Should show your device listed.

### Check 2: Metro Bundler Running
```bash
curl http://localhost:8081/status
```

Should return bundler status.

### Check 3: Worker Accessible
```bash
curl https://ondato-proxy.striverapp.workers.dev/health
```

Should return: `{"status":"ok","message":"Ondato proxy worker is running"}`

### Check 4: App Logs
Run with logs visible:
```bash
npx react-native run-android
```

Watch for network errors in the output.

## Common Issues

### Issue: "unable to load script"
**Solution:** Metro bundler not running. Run `npm start` first.

### Issue: "Network request failed" persists
**Solution:** App not rebuilt. Run `./fix-network-and-run.bat` again.

### Issue: "Device not found"
**Solution:** Enable USB debugging on your Android device and reconnect.

### Issue: Build fails
**Solution:** 
```bash
cd android
gradlew clean
cd ..
npm install
./fix-network-and-run.bat
```

## Success Indicators

✅ Cloudflare Worker responds to health check
✅ Android build succeeds
✅ App installs on device
✅ Metro bundler shows "Bundled successfully"
✅ Logs show successful network requests
✅ WebView opens with Ondato verification UI

## Next Steps

Once network requests work:
1. Complete verification in WebView
2. App will auto-detect success/failure
3. Polling will check status every 10 seconds
4. User profile updates automatically
5. Navigate to next screen on success
