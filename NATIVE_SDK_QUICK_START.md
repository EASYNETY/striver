# 🚀 Ondato Native SDK - Quick Start

## What Changed?

You now have **native in-app verification** instead of opening a browser!

### Before (Browser):
```
App → Opens Browser → User verifies → Returns to App
```

### After (Native SDK):
```
App → Shows SDK UI → User verifies → Stays in App
```

---

## 3-Step Setup

### 1. Install SDK (2 minutes)
```bash
install-ondato-sdk.bat
```

Then for iOS:
```bash
npx pod-install
```

### 2. Enable SDK (1 minute)

Open `src/screens/auth/OndatoVerification.tsx`

**Uncomment line 14:**
```typescript
// Change this:
// import OndatoSdk from 'ondato-sdk-react-native';

// To this:
import OndatoSdk from 'ondato-sdk-react-native';
```

**Uncomment lines 150-170** (the SDK rendering code):
```typescript
// Remove /* and */ around this:
return (
  <OndatoSdk
    identificationId={identificationId}
    onSuccess={handleVerificationSuccess}
    onError={(error) => handleVerificationFailure()}
    onClose={() => handleVerificationCancelled()}
    isConsentEnabled={true}
    isOnboardingEnabled={true}
    isLoggingEnabled={__DEV__}
    locale="en"
    theme={{
      colors: {
        primary: COLORS.primary,
        background: COLORS.background,
        text: COLORS.white,
      },
    }}
  />
);
```

### 3. Rebuild App (2 minutes)
```bash
# Android
npm run android

# iOS
npm run ios
```

---

## That's It!

Your app now has native in-app verification! 🎉

### Test It:
1. Open app
2. Go to age verification
3. Click "Start Verification"
4. **SDK opens IN-APP** (no browser!)
5. Complete verification
6. Success!

---

## Troubleshooting

### SDK Not Showing?
1. Check import is uncommented
2. Check SDK code is uncommented
3. Rebuild app completely

### Build Errors?
**Android:**
- Add JitPack to `android/build.gradle`
- Set `minSdkVersion 21` in `android/app/build.gradle`

**iOS:**
- Run `pod install` in ios folder
- Clean build in Xcode

### Camera Not Working?
**iOS:** Add to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to verify your identity</string>
```

**Android:** Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

---

## Full Documentation

See `ONDATO_NATIVE_SDK_SETUP.md` for complete setup guide.

---

## Benefits

✅ **Better UX** - No app switching
✅ **Higher conversion** - Users stay in app
✅ **Faster** - No browser loading
✅ **More control** - Custom theming
✅ **Professional** - Native experience

---

## Need Help?

- Full Guide: `ONDATO_NATIVE_SDK_SETUP.md`
- Webhook Setup: `DEPLOY_WEBHOOK_NOW.md`
- Complete Summary: `ONDATO_COMPLETE_SUMMARY.md`
