# 🚀 Quick Start: Authentication Testing

## Immediate Testing (No Configuration Required)

You can test the authentication flows **right now** using these methods:

### ✅ Email/Password Authentication
**Status**: ✅ Fully Functional

1. Open the app
2. Tap "Sign Up" or "Login"
3. Select "Email" method
4. Enter any email and password (min 6 characters)
5. Use OTP code: `123456`

**Example**:
- Email: `test@striver.com`
- Password: `password123`
- OTP: `123456`

---

### ✅ Phone Authentication
**Status**: ⚠️ Requires Firebase Configuration

**For Testing Without Setup**:
1. Select "Mobile" method
2. Enter phone number
3. Use OTP code: `123456` (mock verification)

**For Real SMS**:
- Configure Firebase Phone Auth (see AUTHENTICATION_SETUP.md)
- Add test phone numbers in Firebase Console

---

### ⚠️ Social Logins (Require Setup)

The following require configuration before they work:

#### Google Sign-In
**Setup Required**: 
- Add Web Client ID to `src/api/authService.ts`
- Add SHA-1 fingerprint to Firebase Console

**How to Get Web Client ID**:
```bash
# Option 1: From Firebase Console
# Go to Project Settings → General → Your apps → Web app

# Option 2: Generate from google-services.json
# Look for oauth_client with client_type: 3
```

#### Facebook Login
**Setup Required**:
- Create Facebook App
- Add App ID to `android/app/src/main/res/values/strings.xml`
- Configure Firebase with Facebook credentials

#### Apple Sign-In
**Setup Required**:
- Apple Developer Account
- iOS device or simulator (not available on Android)
- Configure in Firebase Console

---

## 🎯 Recommended Testing Flow

### Phase 1: Immediate Testing (No Setup)
1. ✅ Test Email/Password signup
2. ✅ Test Email/Password login
3. ✅ Test OTP verification with `123456`
4. ✅ Navigate through onboarding flow

### Phase 2: Configure & Test (15-30 minutes)
1. Set up Google Sign-In (easiest)
2. Test Google authentication
3. Set up Facebook Login
4. Test Facebook authentication

### Phase 3: Production Ready (1-2 hours)
1. Configure Apple Sign-In (iOS only)
2. Set up real Phone Auth with SMS
3. Add production security rules
4. Enable App Check

---

## 🔍 Testing Checklist

- [ ] Email signup creates new user
- [ ] Email login works for existing user
- [ ] OTP code `123456` verifies successfully
- [ ] User profile is created in Firestore
- [ ] Navigation proceeds to DateOfBirth screen
- [ ] Google sign-in button triggers authentication
- [ ] Facebook sign-in button triggers authentication
- [ ] Apple sign-in button triggers authentication (iOS)
- [ ] Phone number format validation works
- [ ] Error messages display correctly

---

## 🐛 Common Issues & Solutions

### "Google Sign-In Error: DEVELOPER_ERROR"
**Solution**: Web Client ID not configured
```typescript
// Update src/api/authService.ts line 14
webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
```

### "Facebook Login Not Working"
**Solution**: App ID not configured
```xml
<!-- Update android/app/src/main/res/values/strings.xml -->
<string name="facebook_app_id">YOUR_ACTUAL_APP_ID</string>
```

### "Phone Auth reCAPTCHA Not Showing"
**Solution**: SHA-1 fingerprint missing
```bash
# Get SHA-1
cd android && ./gradlew signingReport

# Add to Firebase Console → Project Settings → Your apps → Android
```

### "OTP Not Received"
**Solution**: Use test code for development
- OTP Code: `123456` (works for all methods during testing)

---

## 📱 Test User Accounts

For consistent testing, create these test accounts:

```
Email: test.parent@striver.com
Password: striver123
Account Type: Family

Email: test.player@striver.com  
Password: striver123
Account Type: Individual
```

---

## 🎨 UI Testing Points

Verify these UI elements work correctly:

1. **Sign Up / Login Toggle**: Switches between modes
2. **Email / Mobile Toggle**: Switches input fields
3. **Social Login Buttons**: All three buttons visible and styled
4. **Loading States**: Spinner shows during authentication
5. **Error Messages**: Display correctly for invalid inputs
6. **Navigation**: Smooth transitions between screens

---

## 📊 Firebase Console Monitoring

After testing, check Firebase Console:

1. **Authentication → Users**: See newly created users
2. **Authentication → Sign-in methods**: Verify enabled providers
3. **Firestore → users collection**: Check user profiles created
4. **Analytics**: View authentication events

---

## 🚀 Next Steps After Testing

1. **Configure Production Providers**: Set up all social logins
2. **Add Error Tracking**: Integrate Sentry or similar
3. **Implement Rate Limiting**: Prevent abuse
4. **Add Email Verification**: Verify user emails
5. **Set Up Security Rules**: Protect Firestore data
6. **Enable App Check**: Add additional security layer

---

## 📞 Need Help?

Refer to the detailed setup guide: `AUTHENTICATION_SETUP.md`

For Firebase-specific issues: [Firebase Documentation](https://firebase.google.com/docs/auth)
