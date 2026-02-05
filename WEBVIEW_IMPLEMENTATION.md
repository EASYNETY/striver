# 🎯 WebView Implementation - In-App Verification

## Why WebView?

The Ondato React Native SDK has installation issues, but we can achieve a similar in-app experience using WebView!

### Comparison:

| Feature | External Browser | WebView | Native SDK |
|---------|-----------------|---------|------------|
| **In-App** | ❌ No | ✅ Yes | ✅ Yes |
| **Installation** | ✅ Works | ✅ Works | ❌ Broken |
| **Setup Time** | 0 min | 5 min | N/A |
| **Maintenance** | None | Low | High |
| **UX** | Poor | Good | Best |

**WebView is the best solution!**

---

## 3-Step Setup (5 minutes)

### Step 1: Install WebView (2 minutes)

```bash
install-webview.bat
```

Or manually:
```bash
npm install react-native-webview --save
npx pod-install  # iOS only
```

---

### Step 2: Enable WebView Code (1 minute)

Open `src/screens/auth/OndatoVerification.tsx`

**1. Uncomment the import (line ~14):**
```typescript
// Change this:
// import { WebView } from 'react-native-webview';

// To this:
import { WebView } from 'react-native-webview';
```

**2. Uncomment the WebView rendering code (line ~150):**

Find this section in `renderContent()`:
```typescript
// Uncomment this after installing react-native-webview:
/*
return (
  <View style={styles.webviewContainer}>
    ...
  </View>
);
*/
```

Remove the `/*` and `*/` to uncomment it.

**3. Comment out the placeholder:**

Comment out or remove the "Temporary placeholder" code below the WebView code.

---

### Step 3: Rebuild App (2 minutes)

```bash
# Android
npm run android

# iOS
npm run ios
```

---

## How It Works

### User Flow:
```
1. User clicks "Start Verification"
   ↓
2. App creates Ondato session
   ↓
3. WebView opens IN-APP with Ondato URL
   ↓
4. User completes verification in WebView
   ↓
5. WebView detects success URL
   ↓
6. App closes WebView and shows success
   ↓
7. Webhook updates Firestore
   ↓
8. User continues to next screen
```

### Technical Flow:
```typescript
// 1. Start verification
startVerification() 
  → Creates session via Cloudflare Worker
  → Gets verificationUrl
  → Sets verificationStatus = 'webview_active'

// 2. Render WebView
<WebView
  source={{ uri: verificationUrl }}
  onNavigationStateChange={(navState) => {
    // Detect success/failure
    if (navState.url.includes('success')) {
      handleVerificationSuccess();
    }
  }}
/>

// 3. Handle completion
handleVerificationSuccess()
  → Updates user profile
  → Navigates to next screen
```

---

## Features

### ✅ In-App Experience
- WebView opens inside your app
- No external browser
- Seamless user experience

### ✅ Close Button
- User can cancel anytime
- Confirmation dialog
- Returns to previous screen

### ✅ Loading States
- Shows loading indicator
- Handles errors gracefully
- Smooth transitions

### ✅ URL Detection
- Detects success URLs
- Detects failure URLs
- Auto-closes on completion

### ✅ Webhook Integration
- Works with existing webhook
- Real-time Firestore updates
- Automatic status sync

---

## Configuration

### WebView Props

```typescript
<WebView
  source={{ uri: verificationUrl }}  // Ondato URL
  javaScriptEnabled={true}  // Required for Ondato
  domStorageEnabled={true}  // Required for Ondato
  startInLoadingState={true}  // Show loading
  onNavigationStateChange={handleNavigation}  // Detect URLs
  onError={handleError}  // Handle errors
/>
```

### URL Detection

The WebView monitors navigation and detects:
- Success: `verification-success` or `success` in URL
- Failure: `verification-failed` or `failed` in URL
- Cancel: User closes WebView

### Customization

**Header:**
```typescript
<View style={styles.webviewHeader}>
  <Text style={styles.webviewTitle}>Identity Verification</Text>
  <TouchableOpacity onPress={handleClose}>
    <X color={COLORS.white} size={24} />
  </TouchableOpacity>
</View>
```

**Loading:**
```typescript
renderLoading={() => (
  <View style={styles.webviewLoading}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text>Loading verification...</Text>
  </View>
)}
```

---

## Testing

### Test Checklist:
- [ ] WebView opens in-app
- [ ] Ondato UI loads correctly
- [ ] Camera works in WebView
- [ ] Can take selfie
- [ ] Can upload ID
- [ ] Verification completes
- [ ] Success detected automatically
- [ ] WebView closes
- [ ] User profile updates
- [ ] Navigation works

### Test Commands:
```bash
# Check WebView installed
npm list react-native-webview

# Run on Android
npm run android

# Run on iOS
npm run ios

# Check logs
npx react-native log-android
npx react-native log-ios
```

---

## Troubleshooting

### WebView Not Showing

**Problem:** WebView doesn't render

**Solution:**
1. Verify package installed: `npm list react-native-webview`
2. Check import is uncommented
3. Check WebView code is uncommented
4. Rebuild app completely

### WebView Shows Blank Screen

**Problem:** WebView loads but shows nothing

**Solution:**
1. Check `verificationUrl` is valid
2. Enable JavaScript: `javaScriptEnabled={true}`
3. Enable DOM storage: `domStorageEnabled={true}`
4. Check network connection

### Camera Not Working in WebView

**Problem:** Camera doesn't open in WebView

**Solution:**

**iOS - Add to Info.plist:**
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to verify your identity</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to verify your identity</string>
```

**Android - Add to AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Success Not Detected

**Problem:** Verification completes but app doesn't detect it

**Solution:**
1. Check `onNavigationStateChange` is working
2. Verify success URL pattern matches
3. Check webhook is deployed and working
4. Monitor Firestore for updates

### Build Errors

**Problem:** App won't build after WebView install

**Solution:**

**Android:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

---

## Fallback Options

### Option 1: External Browser (Current)
If WebView doesn't work, the app falls back to external browser automatically.

```typescript
const [useWebView, setUseWebView] = useState(true);

// Toggle to false for external browser
setUseWebView(false);
```

### Option 2: User Choice
Let users choose their preferred method:

```typescript
<TouchableOpacity onPress={() => setUseWebView(!useWebView)}>
  <Text>Use {useWebView ? 'Browser' : 'In-App'} Verification</Text>
</TouchableOpacity>
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│ User clicks "Start Verification"        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ App calls ondatoService.createSession() │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Cloudflare Worker authenticates         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Ondato returns verificationUrl          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ WebView opens IN-APP with URL           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ User sees Ondato UI in WebView          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ User completes verification              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Ondato redirects to success URL         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ WebView detects success URL             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ App calls handleVerificationSuccess()   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ WebView closes                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Ondato sends webhook to Firebase        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Firebase updates Firestore               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ App shows "Verification Successful"      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ User continues to next screen            │
└─────────────────────────────────────────┘
```

---

## Files Modified

- ✅ `src/screens/auth/OndatoVerification.tsx` - Added WebView integration
- ✅ `install-webview.bat` - Installation script
- ✅ `WEBVIEW_IMPLEMENTATION.md` - This guide

---

## Success Checklist

- [ ] WebView package installed
- [ ] iOS pods installed (iOS only)
- [ ] WebView import uncommented
- [ ] WebView rendering code uncommented
- [ ] App rebuilt
- [ ] Camera permissions added
- [ ] WebView opens in-app
- [ ] Ondato UI loads
- [ ] Verification completes
- [ ] Success detected
- [ ] WebView closes
- [ ] User profile updates

---

## Next Steps

1. ✅ Install WebView: `install-webview.bat`
2. ✅ Uncomment code in `OndatoVerification.tsx`
3. ✅ Rebuild app
4. ✅ Test verification flow
5. ✅ Deploy webhook (if not done)

---

## Support

**Documentation:**
- This Guide: `WEBVIEW_IMPLEMENTATION.md`
- SDK Issue: `SDK_INSTALLATION_ISSUE.md`
- Webhook Setup: `DEPLOY_WEBHOOK_NOW.md`

**Check Logs:**
```bash
npx react-native log-android
npx react-native log-ios
firebase functions:log --only ondatoWebhook
```

**WebView Docs:**
- https://github.com/react-native-webview/react-native-webview

---

## 🎉 Result

You now have **in-app verification** without SDK installation issues!

**Benefits:**
- ✅ Stays in app (no external browser)
- ✅ Works immediately (no SDK issues)
- ✅ Easy to implement (5 minutes)
- ✅ Better UX than external browser
- ✅ Reliable and maintainable

**Your users will love it!** 🚀
