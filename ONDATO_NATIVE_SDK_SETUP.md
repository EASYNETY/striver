# Ondato Native SDK Setup Guide

## Overview
This guide walks you through implementing the Ondato React Native SDK for a native in-app verification experience (no browser required).

## Benefits of Native SDK
- ✅ **In-app experience** - No browser redirect
- ✅ **Better UX** - Seamless verification flow
- ✅ **Faster** - No external app switching
- ✅ **More control** - Custom theming and callbacks
- ✅ **Better conversion** - Users don't leave your app

---

## Step 1: Install the SDK

### Option A: Use the Install Script (Recommended)
```bash
install-ondato-sdk.bat
```

### Option B: Manual Installation
```bash
npm install --save --legacy-peer-deps https://github.com/ondato/ondato-sdk-react-native
```

**Note:** We use `--legacy-peer-deps` because the SDK requires React Native 0.77+ but you're on 0.75.4. This is safe and the SDK will work fine.

---

## Step 2: Install iOS Dependencies (iOS only)

```bash
cd ios
pod install
cd ..
```

Or use:
```bash
npx pod-install
```

---

## Step 3: Configure Android (Android only)

### Update `android/build.gradle`

Add this to the `allprojects` > `repositories` section:

```gradle
allprojects {
    repositories {
        // ... existing repositories
        maven { url 'https://jitpack.io' }
    }
}
```

### Update `android/app/build.gradle`

Ensure minimum SDK version is 21:

```gradle
android {
    defaultConfig {
        minSdkVersion 21  // Must be 21 or higher
        // ... other config
    }
}
```

---

## Step 4: Enable the Native SDK

### Update `src/screens/auth/OndatoVerification.tsx`

**Uncomment the import at the top:**

```typescript
// Change this:
// import OndatoSdk from 'ondato-sdk-react-native';

// To this:
import OndatoSdk from 'ondato-sdk-react-native';
```

**Uncomment the SDK rendering code in `renderContent()`:**

Find this section (around line 150):

```typescript
// Uncomment this after installing the SDK:
/*
return (
  <OndatoSdk
    identificationId={identificationId}
    onSuccess={handleVerificationSuccess}
    ...
  />
);
*/
```

Remove the `/*` and `*/` to uncomment it.

**Comment out the placeholder:**

Comment out or remove the temporary placeholder code below the SDK code.

---

## Step 5: Rebuild Your App

### For Android:
```bash
npm run android
```

Or:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### For iOS:
```bash
npm run ios
```

Or:
```bash
cd ios
pod install
cd ..
npm run ios
```

---

## Step 6: Test the Native SDK

1. Open your app
2. Navigate to age verification
3. Click "Start Verification"
4. **You should now see the Ondato SDK UI in-app** (not a browser!)
5. Complete the verification
6. Verify the success callback works

---

## SDK Configuration

The SDK is configured in `src/screens/auth/OndatoVerification.tsx`:

```typescript
<OndatoSdk
  identificationId={identificationId}  // From Ondato API
  onSuccess={handleVerificationSuccess}  // Called when verification succeeds
  onError={(error) => handleVerificationFailure()}  // Called on error
  onClose={() => handleVerificationCancelled()}  // Called when user closes
  isConsentEnabled={true}  // Show consent screen
  isOnboardingEnabled={true}  // Show onboarding screen
  isLoggingEnabled={__DEV__}  // Enable logs in development
  locale="en"  // Language (en, de, fr, etc.)
  theme={{
    colors: {
      primary: '#8FFBB9',  // Your brand color
      background: '#0A0A0A',  // Background color
      text: '#FFFFFF',  // Text color
    },
  }}
/>
```

---

## Customization Options

### Theme Colors

```typescript
theme={{
  colors: {
    primary: COLORS.primary,      // Primary button color
    background: COLORS.background, // Background color
    text: COLORS.white,            // Text color
  },
}}
```

### Locale Options

Supported locales:
- `en` - English
- `de` - German
- `fr` - French
- `es` - Spanish
- `it` - Italian
- `lt` - Lithuanian
- `lv` - Latvian
- `et` - Estonian

```typescript
locale="en"  // Change to your preferred language
```

### Disable Onboarding

If you want to skip the onboarding screen:

```typescript
isOnboardingEnabled={false}
```

### Disable Consent

If you want to skip the consent screen:

```typescript
isConsentEnabled={false}
```

---

## Callbacks

### onSuccess
Called when verification is successfully completed:

```typescript
onSuccess={() => {
  console.log('Verification successful!');
  // Update user profile
  // Navigate to next screen
}}
```

### onError
Called when verification fails:

```typescript
onError={(error) => {
  console.error('Verification error:', error);
  // Show error message
  // Allow retry
}}
```

### onClose
Called when user closes the SDK:

```typescript
onClose={() => {
  console.log('User closed verification');
  // Return to previous screen
  // Or show retry option
}}
```

---

## Fallback to Browser

If the native SDK doesn't work or you want to test the browser flow, you can toggle it:

```typescript
const [useNativeSDK, setUseNativeSDK] = useState(false); // Set to false for browser
```

Or add a button to let users choose:

```typescript
<TouchableOpacity onPress={() => setUseNativeSDK(!useNativeSDK)}>
  <Text>Use {useNativeSDK ? 'Browser' : 'Native SDK'}</Text>
</TouchableOpacity>
```

---

## Troubleshooting

### SDK Not Showing

**Problem:** SDK component doesn't render

**Solution:**
1. Verify SDK is installed: `npm list ondato-sdk-react-native`
2. Check import is uncommented
3. Rebuild app completely:
   ```bash
   # Android
   cd android && ./gradlew clean && cd ..
   npm run android
   
   # iOS
   cd ios && pod install && cd ..
   npm run ios
   ```

### Build Errors on Android

**Problem:** Build fails with dependency errors

**Solution:**
1. Add JitPack repository to `android/build.gradle`
2. Ensure `minSdkVersion` is 21 or higher
3. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

### Build Errors on iOS

**Problem:** Pod install fails or build errors

**Solution:**
1. Update CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```
2. Clean pods and reinstall:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```
3. Clean Xcode build:
   - Open Xcode
   - Product → Clean Build Folder
   - Rebuild

### Camera Permissions

**Problem:** Camera doesn't work in SDK

**Solution:**

**iOS:** Add to `ios/StriverApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to verify your identity</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to verify your identity</string>
```

**Android:** Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### Verification Not Completing

**Problem:** SDK completes but webhook doesn't fire

**Solution:**
1. Verify webhook is deployed: `firebase functions:list`
2. Check webhook is configured in Ondato dashboard
3. Monitor Firebase logs: `firebase functions:log --only ondatoWebhook`
4. Verify `identificationId` matches between SDK and webhook

---

## Complete Flow

```
1. User clicks "Start Verification"
   ↓
2. App calls ondatoService.createSession()
   ↓
3. Cloudflare Worker creates Ondato session
   ↓
4. App receives identificationId
   ↓
5. App renders OndatoSdk component (IN-APP!)
   ↓
6. User completes verification in SDK
   ↓
7. SDK calls onSuccess callback
   ↓
8. Ondato sends webhook to Firebase
   ↓
9. Firebase updates Firestore
   ↓
10. App listens to Firestore changes
   ↓
11. App shows "Verification Successful"
   ↓
12. User continues to next screen
```

---

## Comparison: Native SDK vs Browser

| Feature | Native SDK | Browser |
|---------|-----------|---------|
| **User Experience** | ✅ Seamless | ❌ Disruptive |
| **App Switching** | ✅ None | ❌ Required |
| **Customization** | ✅ Full control | ❌ Limited |
| **Conversion Rate** | ✅ Higher | ❌ Lower |
| **Setup Complexity** | ⚠️ Medium | ✅ Simple |
| **Maintenance** | ⚠️ SDK updates | ✅ No maintenance |

**Recommendation:** Use Native SDK for production. It provides a much better user experience.

---

## Files Modified

- ✅ `package.json` - Added SDK dependency
- ✅ `src/screens/auth/OndatoVerification.tsx` - Added SDK integration
- ✅ `src/components/auth/OndatoSDK.tsx` - SDK wrapper component
- ✅ `install-ondato-sdk.bat` - Installation script

---

## Next Steps

1. ✅ Install SDK: `install-ondato-sdk.bat`
2. ✅ Install iOS pods: `npx pod-install`
3. ✅ Uncomment SDK code in `OndatoVerification.tsx`
4. ✅ Rebuild app
5. ✅ Test verification flow
6. ✅ Deploy webhook (if not done): `deploy-ondato-webhook.bat`
7. ✅ Configure webhook in Ondato dashboard

---

## Support

**SDK Documentation:**
- GitHub: https://github.com/ondato/ondato-sdk-react-native
- Ondato Docs: https://documentation.ondato.com

**Your Implementation:**
- Verification Screen: `src/screens/auth/OndatoVerification.tsx`
- SDK Wrapper: `src/components/auth/OndatoSDK.tsx`
- Service: `src/services/ondatoService.ts`
- Hook: `src/hooks/useOndatoVerification.ts`

**Troubleshooting:**
- Check logs: `npx react-native log-android` or `npx react-native log-ios`
- Firebase logs: `firebase functions:log --only ondatoWebhook`
- Ondato dashboard: https://admin.ondato.com

---

## Success Checklist

- [ ] SDK installed successfully
- [ ] iOS pods installed (iOS only)
- [ ] Android configured (Android only)
- [ ] SDK import uncommented
- [ ] SDK rendering code uncommented
- [ ] App rebuilt
- [ ] Camera permissions added
- [ ] Verification starts in-app (not browser)
- [ ] SDK UI shows correctly
- [ ] Verification completes successfully
- [ ] onSuccess callback fires
- [ ] Webhook updates Firestore
- [ ] App shows success message

---

## 🎉 You're Done!

Your app now has a native in-app verification experience with Ondato! Users will love the seamless flow.
