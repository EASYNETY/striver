# Test Ondato Verification Flow

## ⚠️ IMPORTANT: Rebuild Required

The Ondato changes are in the code, but you need to **rebuild and reinstall the app** for them to take effect.

## Quick Rebuild

### Option 1: Use Batch Script (Windows)
```bash
rebuild-and-test-ondato.bat
```

### Option 2: Manual Commands
```bash
# Clean and build
cd android
./gradlew clean
./gradlew assembleDebug

# Uninstall old app
adb uninstall com.striverapp

# Install new app
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Restart app
adb shell am force-stop com.striverapp
adb shell am start -n com.striverapp/.MainActivity
```

## Test Flow

### Test 1: Family Account (Should Use Ondato)

1. **Open app** and click "Get Started"
2. **Choose account type**: Select "Family Account"
3. **Sign up**: Enter phone number
4. **Verify OTP**: Enter code from SMS
5. **Enter DOB**: Enter date showing you're 18+ (e.g., 01/01/1990)
6. **Click Continue**

**Expected Result:**
- ✅ Should see "Parent Age Verification" screen with Ondato branding
- ✅ Should see "Start Verification" button
- ✅ Should see info about government-issued ID
- ❌ Should NOT see "Position your face" (that's manual verification)

7. **Click "Start Verification"**

**Expected Result:**
- ✅ Browser opens with Ondato URL
- ✅ URL contains: `https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9`
- ✅ Alert shows: "Let's Verify! Complete the verification in your browser..."

8. **Complete verification on Ondato** (or just return to app)

**Expected Result:**
- ✅ App shows "Checking Verification Status"
- ✅ Timer shows elapsed time (e.g., "15s / 120s")
- ✅ Option to "Continue Without Waiting"

9. **Update status in Firestore** (see ADMIN_QUICK_REFERENCE.md)

**Expected Result:**
- ✅ App detects status change within 5 seconds
- ✅ Shows success screen
- ✅ Navigates to InterestsSelection

### Test 2: Individual Account 13-17 (Should Use Manual)

1. **Open app** and click "Get Started"
2. **Choose account type**: Select "Individual Account"
3. **Sign up**: Enter email/password
4. **Verify email**: Click link in email
5. **Enter DOB**: Enter date showing you're 13-17 (e.g., 01/01/2010)
6. **Click Continue**

**Expected Result:**
- ✅ Should see "Position your face" screen (manual verification)
- ✅ Should see camera icon
- ❌ Should NOT see Ondato screen

### Test 3: Individual Account 18+ (Should Skip Verification)

1. **Open app** and click "Get Started"
2. **Choose account type**: Select "Individual Account"
3. **Sign up**: Enter phone number
4. **Verify OTP**: Enter code
5. **Enter DOB**: Enter date showing you're 18+ (e.g., 01/01/1990)
6. **Click Continue**

**Expected Result:**
- ✅ Should go directly to InterestsSelection
- ✅ Should NOT see any verification screen

## Troubleshooting

### Still Seeing Manual Verification for Family Accounts

**Problem**: App shows "Position your face" instead of Ondato for family accounts

**Solution**:
1. Completely uninstall the app:
   ```bash
   adb uninstall com.striverapp
   ```
2. Rebuild from scratch:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```
3. Install fresh:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```
4. Clear app data if needed:
   ```bash
   adb shell pm clear com.striverapp
   ```

### Ondato URL Doesn't Open

**Problem**: Browser doesn't open when clicking "Start Verification"

**Solution**:
1. Check internet connection
2. Check app logs:
   ```bash
   adb logcat | grep -i ondato
   ```
3. Verify Setup ID in code: `fa1fb2cb-034f-4926-bd38-c8290510ade9`

### App Crashes on Verification Screen

**Problem**: App crashes when navigating to verification

**Solution**:
1. Check logs:
   ```bash
   adb logcat | grep -i error
   ```
2. Verify Firestore permissions
3. Check if Firebase is initialized

## Verification Checklist

Before testing, verify:

- [ ] Code changes saved in `src/screens/auth/OndatoVerification.tsx`
- [ ] Setup ID updated to `fa1fb2cb-034f-4926-bd38-c8290510ade9`
- [ ] App rebuilt with `./gradlew assembleDebug`
- [ ] Old app uninstalled
- [ ] New app installed
- [ ] App restarted
- [ ] Firestore security rules added
- [ ] Internet connection working

## Expected Behavior Summary

| Account Type | Age | Verification Method |
|--------------|-----|---------------------|
| Family | 18+ | Ondato (automated) |
| Family | <18 | Blocked (show error) |
| Individual | 18+ | None (skip) |
| Individual | 13-17 | Manual (selfie) |
| Individual | <13 | Blocked (suggest family account) |

## Success Criteria

✅ Family accounts (18+) use Ondato verification  
✅ Ondato URL opens in browser  
✅ App polls for status updates  
✅ Admin can update status in Firestore  
✅ App detects status change within 5 seconds  
✅ Individual accounts use appropriate verification  

## Next Steps After Testing

1. Test end-to-end flow
2. Verify Firestore updates correctly
3. Test admin manual status update
4. Configure Ondato portal settings (optional)
5. Add webhook for full automation (optional)

## Support

- **Build Issues**: Check `android/build_android.bat`
- **Ondato Issues**: See `ONDATO_NO_WEBHOOK_GUIDE.md`
- **Admin Updates**: See `ADMIN_QUICK_REFERENCE.md`
- **Manual Update Script**: `test-ondato-manual-update.js`
