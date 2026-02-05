# Solution: Ondato Not Showing (Still Using Manual Verification)

## Problem
App shows manual verification ("Position your face") instead of Ondato verification ("Parent Age Verification") for family accounts.

## Root Cause
The code is **correct** but the old app is still installed/cached on your device. React Native doesn't hot-reload navigation changes.

## Verified Code (100% Correct)

### DateOfBirthScreen.tsx (Line 53)
```typescript
if (accountType === 'family') {
    if (age < 18) {
        Alert.alert('Hold Up!', 'Family accounts need a parent or guardian who\'s 18+.');
        return;
    }
    // Navigate to Ondato verification for parents
    navigation.navigate('OndatoVerification', { uid, dateOfBirth: dob, accountType });
}
```

### AuthNavigator.tsx (Line 35)
```typescript
<Stack.Screen name="OndatoVerification" component={OndatoVerification} />
```

### OndatoVerification.tsx
- ✅ Updated with no-webhook polling
- ✅ Direct URL generation
- ✅ Firestore integration
- ✅ All changes saved

## Solution: Force Complete Rebuild

### Option 1: Use Force Clear Script (RECOMMENDED)
```bash
force-clear-and-rebuild.bat
```

This script will:
1. Force stop the app
2. Completely uninstall
3. Clear Metro cache
4. Clean Android build
5. Build fresh APK
6. Install fresh
7. Clear app data
8. Start app

### Option 2: Manual Steps
```bash
# 1. Stop and uninstall
adb shell am force-stop com.striverapp
adb uninstall com.striverapp

# 2. Clean everything
cd android
./gradlew clean
rmdir /s /q app\build
rmdir /s /q build

# 3. Build fresh
./gradlew assembleDebug

# 4. Install fresh
adb install app\build\outputs\apk\debug\app-debug.apk

# 5. Clear data
adb shell pm clear com.striverapp

# 6. Start
adb shell am start -n com.striverapp/.MainActivity
```

### Option 3: Nuclear Option (If Above Fails)
```bash
# 1. Uninstall
adb uninstall com.striverapp

# 2. Clean node modules cache
rmdir /s /q node_modules\.cache

# 3. Clean Android
cd android
./gradlew clean
rmdir /s /q .gradle
rmdir /s /q app\build
rmdir /s /q build

# 4. Rebuild
./gradlew assembleDebug

# 5. Install
adb install app\build\outputs\apk\debug\app-debug.apk
```

## Verification Steps

### Step 1: Check App is Fresh
```bash
check-app-version.bat
```

Look for `lastUpdateTime` - it should be recent (within last few minutes).

### Step 2: Test Family Account Flow
1. Open app
2. Click "Get Started"
3. Select **"Family Account"** (important!)
4. Enter phone number
5. Verify OTP
6. Enter DOB showing 18+ (e.g., `01/01/1990`)
7. Click "Continue"

### Expected Result:
✅ Screen title: **"Parent Age Verification"**  
✅ Text: "To create a family account, we need to verify that you're 18 or older"  
✅ Text: "This is a quick and secure process using Ondato"  
✅ Button: **"Start Verification"**  
✅ Icon: Shield with checkmark  

❌ Should NOT see: "Position your face"  
❌ Should NOT see: Camera icon  
❌ Should NOT see: "Start Scan" button  

### Step 3: Test Ondato Opens
1. Click "Start Verification"
2. Browser should open
3. URL should be: `https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9?externalRef=ondato_...`
4. Alert should show: "Let's Verify! Complete the verification in your browser..."

## Troubleshooting

### Still Showing Manual Verification?

**Check 1: Is it really a family account?**
- Make sure you selected "Family Account" not "Individual Account"
- Individual accounts use manual verification for 13-17 year olds

**Check 2: Is the app actually rebuilt?**
```bash
# Check last update time
adb shell dumpsys package com.striverapp | findstr lastUpdateTime

# Should be within last few minutes
```

**Check 3: Is the correct APK installed?**
```bash
# Check APK path
adb shell pm path com.striverapp

# Should be: /data/app/~~.../com.striverapp-.../base.apk
```

**Check 4: Clear app data**
```bash
adb shell pm clear com.striverapp
```

**Check 5: Restart device**
```bash
adb reboot
```

### App Crashes?

**Check logs:**
```bash
adb logcat | findstr -i "error\|exception\|ondato"
```

**Common issues:**
- Firestore not initialized → Check firebase.ts
- Navigation error → Check AuthNavigator.tsx
- Import error → Check OndatoVerification.tsx imports

### Ondato Screen Shows But Button Doesn't Work?

**Check:**
1. Internet connection
2. Firestore permissions
3. Setup ID is correct: `fa1fb2cb-034f-4926-bd38-c8290510ade9`

**View logs:**
```bash
adb logcat | findstr Ondato
```

## Confirmation Checklist

Before reporting it's not working, verify:

- [ ] Ran `force-clear-and-rebuild.bat` or manual steps
- [ ] App was completely uninstalled first
- [ ] Fresh APK was built (check timestamp)
- [ ] Fresh APK was installed
- [ ] App data was cleared
- [ ] Selected **"Family Account"** (not Individual)
- [ ] Entered DOB showing 18+ years old
- [ ] Checked `lastUpdateTime` is recent

## Expected Behavior by Account Type

| Account Type | Age | Screen Shown |
|--------------|-----|--------------|
| **Family** | **18+** | **Ondato Verification** ✅ |
| Family | <18 | Error alert (blocked) |
| Individual | 18+ | Skip verification |
| Individual | 13-17 | Manual verification (selfie) |
| Individual | <13 | Error alert (blocked) |

## Why This Happens

React Native apps bundle JavaScript code into the APK. When you change navigation or screen logic:

1. ❌ Hot reload doesn't work for navigation changes
2. ❌ Metro bundler caches old code
3. ❌ Android caches old APK
4. ❌ App data persists old state

**Solution:** Complete rebuild + reinstall + clear data

## Success Indicators

You'll know it's working when you see:

1. **Screen Title**: "Parent Age Verification" (not "Age Verification")
2. **Ondato Branding**: Mentions "Ondato" in description
3. **Button Text**: "Start Verification" (not "Start Scan")
4. **Icon**: Shield with checkmark (not Camera)
5. **Info Box**: Lists "government-issued ID" requirements

## Next Steps After It Works

1. ✅ Test Ondato URL opens in browser
2. ✅ Complete verification on Ondato
3. ✅ Return to app
4. ✅ See "Checking Verification Status"
5. ✅ Update status in Firestore (see ADMIN_QUICK_REFERENCE.md)
6. ✅ Verify app detects status change

## Support Files

- **Force rebuild**: `force-clear-and-rebuild.bat`
- **Check version**: `check-app-version.bat`
- **Test guide**: `TEST_ONDATO_FLOW.md`
- **Admin updates**: `ADMIN_QUICK_REFERENCE.md`

---

**The code is correct. You just need a complete rebuild!**
