# 🔧 Facebook SDK Configuration Guide

## ✅ Solution

The Facebook SDK is initialized from **JavaScript** using `Settings.initializeSDK()` from the `react-native-fbsdk-next` package. This is the recommended approach that avoids native build errors.

### Implementation:

**File**: `App.tsx`

Added Facebook SDK initialization at app startup:

```typescript
import { Settings } from 'react-native-fbsdk-next';

useEffect(() => {
    // Initialize Facebook SDK
    Settings.initializeSDK();
    
    // ... rest of initialization
}, []);
```

**Why this approach?**
- ✅ No native code modifications needed
- ✅ No build/compilation errors
- ✅ Recommended by react-native-fbsdk-next
- ✅ Works seamlessly with auto-linking

**What we removed:**
- ❌ Manual native initialization in `MainApplication.kt` (was causing build errors)

---

## 🚀 Next Steps to Enable Facebook Login

### 1. Add Your Facebook App ID

Edit: `android/app/src/main/res/values/strings.xml`

Replace `YOUR_FACEBOOK_APP_ID` with your actual Facebook App ID:

```xml
<string name="facebook_app_id">1234567890123456</string>
<string name="fb_login_protocol_scheme">fb1234567890123456</string>
<string name="facebook_client_token">YOUR_CLIENT_TOKEN_HERE</string>
```

### 1a. Get Your Facebook Client Token (MANDATORY)

1. Go to [Facebook Developers](https://developers.facebook.com/apps) > Your App
2. Navigate to **Settings > Advanced**
3. Scroll down to **Security**
4. Copy the **Client Token**
5. Paste it into `strings.xml` as shown above

### 2. Get Your Facebook App ID

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Select your app (or create a new one)
3. Copy the **App ID** from the dashboard
4. Paste it in `strings.xml`

### 3. Configure Facebook App

In your Facebook App Dashboard:

1. **Add Platform** → Android
2. **Package Name**: `com.striverapp`
3. **Class Name**: `com.striverapp.MainActivity`
4. **Key Hashes**: Generate and add (see below)

### 4. Generate Key Hash

Run this command to get your development key hash:

```bash
# For Windows (PowerShell)
keytool -exportcert -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore | openssl sha1 -binary | openssl base64

# Default password: android
```

Add the output to Facebook App → Settings → Android → Key Hashes

### 5. Enable Facebook Login in Firebase

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Facebook**
3. Enter your Facebook **App ID** and **App Secret**
4. Copy the OAuth redirect URI
5. Add it to Facebook App → Facebook Login → Settings → Valid OAuth Redirect URIs

### 6. Rebuild the App

```bash
# Clean build
cd android
./gradlew clean

# Rebuild
cd ..
npx react-native run-android
```

---

## ✅ Testing Facebook Login

After configuration:

1. Open the app
2. Go to Sign Up / Login screen
3. Tap the Facebook button
4. You should see the Facebook login dialog
5. After successful login, user profile is created automatically

---

## 🐛 Troubleshooting

### Error: "Invalid Key Hash"
**Solution**: Make sure you added the correct key hash to Facebook App settings

### Error: "App Not Set Up"
**Solution**: 
- Check Facebook App is in "Development" or "Live" mode
- Add your Facebook account as a test user (if in Development mode)

### Error: "Given URL is not allowed"
**Solution**: 
- Add OAuth redirect URI from Firebase to Facebook App settings
- Format: `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`

### Facebook Button Does Nothing
**Solution**:
- Check App ID in `strings.xml` is correct
- Verify Facebook SDK initialized (check logcat for errors)
- Ensure internet permission in AndroidManifest.xml

---

## 📱 Test Without Full Setup

You can still test the UI and flow without configuring Facebook:

- The button will show an error message
- Other auth methods (Email, Phone) work independently
- Configure Facebook when ready for production

---

## 🔒 Security Notes

- **Never commit** your Facebook App Secret to version control
- Use **test users** during development
- Switch to **Live mode** only when ready for production
- Review Facebook's **data usage policies**

---

## 📚 Additional Resources

- [Facebook SDK for React Native](https://github.com/thebergamo/react-native-fbsdk-next)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/android)
- [Firebase Facebook Auth](https://firebase.google.com/docs/auth/android/facebook-login)

---

## ✨ Status

- ✅ Facebook SDK Package Installed (`react-native-fbsdk-next`)
- ✅ SDK Initialized in JavaScript (`App.tsx`)
- ✅ Facebook App ID Configured in `strings.xml`
- ✅ AndroidManifest.xml Configured
- ⚠️ Requires: Firebase Facebook Auth Setup (user configuration)
- ⚠️ Requires: Facebook App Platform Configuration (see below)


