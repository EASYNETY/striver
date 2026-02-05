# Fix Network Request Failed Error

## The Problem

```
ERROR [OndatoService] Create session error: [TypeError: Network request failed]
```

## The Solution

Run this one script:

```bash
./fix-network-and-run.bat
```

That's it! The script will:
1. ✅ Clean Android build
2. ✅ Rebuild with network config
3. ✅ Install on your device
4. ✅ Start Metro bundler
5. ✅ Ready to test!

---

## What It Does

The script fixes Android network configuration so your app can make HTTPS requests to the Cloudflare Worker.

**Before:** Network requests blocked ❌
**After:** Network requests work ✅

---

## After Running

1. Wait for Metro bundler to show "Bundled successfully"
2. Open app on your device
3. Click "Start Verification"
4. WebView should open with Ondato UI ✅

---

## Verify It Works

You should see these logs:
```
LOG  [OndatoService] Creating session: ...
LOG  [OndatoService] Response status: 200
LOG  [OndatoService] Session created successfully
```

---

## Still Not Working?

Run diagnostics:
```bash
./diagnose-network.bat
```

Or check the full guide:
```
NETWORK_FIX_GUIDE.md
```

---

## Quick Commands

```bash
# Fix everything (recommended)
./fix-network-and-run.bat

# Just diagnostics
./diagnose-network.bat

# Just Metro bundler
./start-metro.bat

# Manual rebuild
cd android
gradlew clean
gradlew assembleDebug
cd ..
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
npm start
```

---

Ready? Run: `./fix-network-and-run.bat` 🚀
