# Authentication Setup Guide

This guide will help you configure all authentication methods for the Striver app.

## 🔐 Authentication Methods Implemented

- ✅ Email/Password (Firebase Auth)
- ✅ Phone/SMS (Firebase Auth)
- ✅ Google Sign-In
- ✅ Facebook Login
- ✅ Apple Sign-In

---

## 📱 Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project set up
2. **React Native Environment**: Android/iOS development environment configured
3. **Package Installation**: All required packages are already installed

---

## 🔧 Configuration Steps

### 1. Google Sign-In Setup

#### A. Get Web Client ID from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider
5. Copy the **Web Client ID** from the configuration

#### B. Update the Code

Open `src/api/authService.ts` and replace the placeholder:

```typescript
GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
});
```

#### C. Android Configuration

1. Get your SHA-1 fingerprint:
   ```bash
   cd android
   ./gradlew signingReport
   ```

2. Add the SHA-1 to Firebase Console:
   - Go to **Project Settings** → **Your apps** → **Android app**
   - Add the SHA-1 fingerprint
   - Download the updated `google-services.json`
   - Replace `android/app/google-services.json`

#### D. iOS Configuration (if applicable)

1. Add the reversed client ID to `ios/StriverApp/Info.plist`:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
           </array>
       </dict>
   </array>
   ```

---

### 2. Facebook Login Setup

#### A. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or use existing one
3. Add **Facebook Login** product
4. Note your **App ID** and **App Secret**

#### B. Configure Firebase

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Facebook** provider
3. Enter your Facebook **App ID** and **App Secret**
4. Copy the OAuth redirect URI from Firebase

#### C. Configure Facebook App

1. In Facebook App Dashboard → **Facebook Login** → **Settings**
2. Add the OAuth redirect URI from Firebase to **Valid OAuth Redirect URIs**
3. Add your package name to **Android** settings
4. Add key hashes for Android

#### D. Android Configuration

Add to `android/app/src/main/res/values/strings.xml`:

```xml
<string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
<string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
```

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data 
    android:name="com.facebook.sdk.ApplicationId" 
    android:value="@string/facebook_app_id"/>

<activity 
    android:name="com.facebook.FacebookActivity"
    android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
    android:label="@string/app_name" />
```

---

### 3. Apple Sign-In Setup

#### A. Configure Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select your App ID
4. Enable **Sign In with Apple** capability
5. Create a Service ID for web authentication

#### B. Configure Firebase

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Apple** provider
3. Enter your **Service ID** and **Team ID**
4. Upload your **Private Key** (.p8 file)

#### C. iOS Configuration

Add capability to `ios/StriverApp.xcodeproj`:
- Open in Xcode
- Select target → **Signing & Capabilities**
- Add **Sign in with Apple** capability

---

### 4. Phone Authentication Setup

#### A. Enable Phone Auth in Firebase

1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Phone** provider
3. Add test phone numbers if needed (for development)

#### B. Android Configuration

Phone auth requires reCAPTCHA verification. Ensure:
- Your app's SHA-1 is added to Firebase
- `google-services.json` is up to date

#### C. iOS Configuration (if applicable)

1. Enable push notifications in Xcode
2. Upload APNs certificate to Firebase Console
3. Add URL scheme in `Info.plist`

---

## 🧪 Testing

### Test Credentials

For development/testing, you can use:

**Email/Password**: Any valid email + password (min 6 characters)

**Phone**: Use Firebase test phone numbers:
- Go to Firebase Console → Authentication → Sign-in method → Phone
- Add test phone numbers with verification codes

**OTP Mock**: Use code `123456` for testing without real verification

### Testing Social Logins

1. **Google**: Use any Google account
2. **Facebook**: Use Facebook test users or your own account
3. **Apple**: Requires real iOS device or simulator with Apple ID

---

## 🔍 Troubleshooting

### Google Sign-In Issues

- **Error: DEVELOPER_ERROR**
  - Check SHA-1 fingerprint is added to Firebase
  - Verify `webClientId` matches Firebase configuration
  - Ensure `google-services.json` is updated

### Facebook Login Issues

- **Error: Invalid key hash**
  - Generate and add correct key hash to Facebook app settings
  - Command: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64`

### Apple Sign-In Issues

- **Not available on Android**: Apple Sign-In only works on iOS 13+ and web
- Ensure Service ID and Team ID are correct in Firebase

### Phone Auth Issues

- **reCAPTCHA not showing**: Check internet connection and SHA-1 configuration
- **SMS not received**: Verify phone number format includes country code (+1...)

---

## 📝 Next Steps

After configuration:

1. **Rebuild the app**:
   ```bash
   cd android && ./gradlew clean
   cd .. && npx react-native run-android
   ```

2. **Test each authentication method**

3. **Monitor Firebase Console** → **Authentication** → **Users** to see successful sign-ins

---

## 🔒 Security Notes

- Never commit API keys or secrets to version control
- Use environment variables for sensitive configuration
- Enable App Check in production for additional security
- Implement rate limiting for authentication endpoints
- Review Firebase security rules before production deployment

---

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Facebook SDK for React Native](https://github.com/thebergamo/react-native-fbsdk-next)
- [Apple Authentication](https://github.com/invertase/react-native-apple-authentication)
