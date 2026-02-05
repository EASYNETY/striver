# ✅ Native SDK Implementation Checklist

## Pre-Implementation (Already Done! ✅)

- [x] SDK dependency added to package.json
- [x] Native SDK integration code written
- [x] Custom theming configured
- [x] Callbacks implemented
- [x] Firestore listeners configured
- [x] Fallback to browser available
- [x] Installation script created
- [x] Documentation written

---

## Your Action Items (Do These Now!)

### Step 1: Install SDK
- [ ] Run `install-ondato-sdk.bat`
- [ ] Wait for installation to complete
- [ ] For iOS: Run `npx pod-install`

**Commands:**
```bash
install-ondato-sdk.bat
npx pod-install
```

---

### Step 2: Enable SDK Code

- [ ] Open `src/screens/auth/OndatoVerification.tsx`
- [ ] Find line 14
- [ ] Uncomment the import:
  ```typescript
  import OndatoSdk from 'ondato-sdk-react-native';
  ```
- [ ] Find line ~150 (in `renderContent()` function)
- [ ] Uncomment the SDK rendering code (remove `/*` and `*/`)
- [ ] Save the file

**What to uncomment:**
```typescript
// Remove /* and */ around this entire block:
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

---

### Step 3: Configure Platform-Specific Settings

#### Android Configuration
- [ ] Open `android/build.gradle`
- [ ] Add JitPack repository:
  ```gradle
  allprojects {
      repositories {
          maven { url 'https://jitpack.io' }
      }
  }
  ```
- [ ] Open `android/app/build.gradle`
- [ ] Verify `minSdkVersion` is 21 or higher:
  ```gradle
  android {
      defaultConfig {
          minSdkVersion 21
      }
  }
  ```
- [ ] Add camera permission to `android/app/src/main/AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  ```

#### iOS Configuration
- [ ] Open `ios/StriverApp/Info.plist`
- [ ] Add camera permission:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>We need camera access to verify your identity</string>
  <key>NSPhotoLibraryUsageDescription</key>
  <string>We need photo library access to verify your identity</string>
  ```

---

### Step 4: Rebuild App

#### Android
- [ ] Clean build:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  ```
- [ ] Run app:
  ```bash
  npm run android
  ```

#### iOS
- [ ] Install pods:
  ```bash
  cd ios
  pod install
  cd ..
  ```
- [ ] Run app:
  ```bash
  npm run ios
  ```

---

### Step 5: Test Native SDK

- [ ] Open app on device/emulator
- [ ] Navigate to age verification screen
- [ ] Click "Start Verification"
- [ ] **Verify SDK opens IN-APP** (not browser!)
- [ ] Check camera permissions work
- [ ] Take a selfie
- [ ] Upload ID document
- [ ] Complete verification
- [ ] Verify success callback fires
- [ ] Check user profile updates
- [ ] Verify navigation works

---

## Verification Tests

### Basic Functionality
- [ ] SDK UI renders in-app
- [ ] No browser opens
- [ ] Camera opens successfully
- [ ] Can take selfie
- [ ] Can upload ID
- [ ] Verification completes
- [ ] Success screen shows

### Callbacks
- [ ] `onSuccess` fires when verification succeeds
- [ ] `onError` fires when verification fails
- [ ] `onClose` fires when user cancels

### Data Flow
- [ ] Firestore `verification_attempts` updates
- [ ] Firestore `users` collection updates
- [ ] `ageVerificationStatus` becomes 'verified'
- [ ] Notification created
- [ ] App receives real-time update

### UI/UX
- [ ] SDK uses your brand colors
- [ ] Text is readable
- [ ] Buttons work correctly
- [ ] Navigation is smooth
- [ ] Loading states show correctly

---

## Troubleshooting Checklist

### If SDK Doesn't Show
- [ ] Verify SDK is installed: `npm list ondato-sdk-react-native`
- [ ] Check import is uncommented
- [ ] Check SDK code is uncommented
- [ ] Rebuild app completely
- [ ] Check console for errors

### If Build Fails
- [ ] Check JitPack repository added (Android)
- [ ] Check minSdkVersion is 21+ (Android)
- [ ] Run `pod install` (iOS)
- [ ] Clean build and retry
- [ ] Check error logs

### If Camera Doesn't Work
- [ ] Check camera permissions in Info.plist (iOS)
- [ ] Check camera permissions in AndroidManifest.xml (Android)
- [ ] Grant permissions in device settings
- [ ] Restart app

### If Verification Doesn't Complete
- [ ] Check Firebase Functions logs
- [ ] Verify webhook is deployed
- [ ] Check Ondato dashboard
- [ ] Verify identificationId is correct

---

## Post-Implementation

### Deploy Webhook (If Not Done)
- [ ] Run `deploy-ondato-webhook.bat`
- [ ] Copy webhook URL
- [ ] Configure in Ondato dashboard
- [ ] Test webhook with `test-ondato-webhook.js`

### Configure Ondato Dashboard
- [ ] Login to https://admin.ondato.com
- [ ] Go to Settings → Webhooks
- [ ] Add webhook URL
- [ ] Set Basic Auth credentials
- [ ] Subscribe to events
- [ ] Save configuration

### Monitor & Verify
- [ ] Check Firebase Functions logs
- [ ] Monitor Firestore updates
- [ ] Test multiple verifications
- [ ] Verify webhook fires correctly
- [ ] Check user profiles update

---

## Success Criteria

All of these should be true:

1. ✅ SDK installed successfully
2. ✅ Code uncommented correctly
3. ✅ App builds without errors
4. ✅ SDK renders in-app (not browser)
5. ✅ Camera works
6. ✅ Verification completes
7. ✅ Callbacks fire correctly
8. ✅ Firestore updates
9. ✅ User profile shows verified
10. ✅ Navigation works

---

## Time Tracking

- [ ] SDK Installation: _____ minutes (expected: 2)
- [ ] Code Changes: _____ minutes (expected: 1)
- [ ] Platform Config: _____ minutes (expected: 2)
- [ ] Rebuild: _____ minutes (expected: 2)
- [ ] Testing: _____ minutes (expected: 5)

**Total Expected:** ~12 minutes

---

## Documentation Reference

- **Quick Start:** `NATIVE_SDK_QUICK_START.md`
- **Full Setup:** `ONDATO_NATIVE_SDK_SETUP.md`
- **Complete Summary:** `ONDATO_NATIVE_SDK_COMPLETE.md`
- **Webhook Setup:** `DEPLOY_WEBHOOK_NOW.md`

---

## Quick Commands

```bash
# Install SDK
install-ondato-sdk.bat

# Install iOS pods
npx pod-install

# Clean Android
cd android && ./gradlew clean && cd ..

# Run Android
npm run android

# Run iOS
npm run ios

# Check logs
npx react-native log-android
npx react-native log-ios

# Deploy webhook
deploy-ondato-webhook.bat

# Test webhook
node test-ondato-webhook.js striver-app-48562
```

---

## 🎉 Completion

When all checkboxes are checked, you have:

✅ **Native in-app verification**
✅ **No browser redirect**
✅ **Custom branding**
✅ **Seamless UX**
✅ **Higher conversion**
✅ **Full control**

**Your users will love it!** 🚀
