# Fix CMake Error - React Native Reanimated

## Error Summary

The build is failing with a CMake error when trying to compile react-native-reanimated's C++ code for x86_64 architecture.

**Error**: `Process 'command 'C:\Users\HP\AppData\Local\Android\Sdk\cmake\3.22.1\bin\cmake.exe'' finished with non-zero exit value 1`

## Root Causes

1. **Path with spaces**: Your project path contains "Jack Shaw" which can cause CMake issues
2. **CMake cache corruption**: Old build artifacts interfering
3. **x86_64 architecture**: Building for emulator (x86_64) is failing, but ARM (real devices) might work
4. **Reanimated C++ build**: Was disabled but is now required for gesture handling

## Quick Fixes (Try in Order)

### Fix 1: Build for ARM Only (Fastest - 5-10 minutes)
This skips the problematic x86_64 build and only builds for real Android devices.

```bash
./build-android-arm-only.bat
```

**Pros**: 
- Much faster build
- Avoids the CMake error
- Works for real devices

**Cons**: 
- Won't work on emulators
- Need a physical Android device

### Fix 2: Clean and Rebuild (10-20 minutes)
```bash
./build-android-fixed.bat
```

This will:
- Stop Gradle daemon
- Clean all build artifacts
- Clean CMake cache
- Rebuild from scratch with increased memory

### Fix 3: Quick CMake Cache Clean (5-10 minutes)
```bash
./fix-cmake-quick.bat
```

Just cleans the CMake cache and rebuilds.

### Fix 4: Full Reinstall (15-25 minutes)
```bash
./fix-android-cmake-error.bat
```

This will:
- Clean everything
- Reinstall react-native-reanimated
- Rebuild from scratch

## Manual Fix Steps

If the scripts don't work, try these manual steps:

### Step 1: Clean CMake Cache
```bash
# Delete CMake cache for reanimated
rmdir /s /q "node_modules\react-native-reanimated\android\.cxx"
rmdir /s /q "node_modules\react-native-reanimated\android\build"

# Clean Android build
cd android
rmdir /s /q app\.cxx
rmdir /s /q app\build
gradlew clean
cd ..
```

### Step 2: Build for ARM Only
```bash
cd android
gradlew assembleDebug -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
cd ..
```

### Step 3: If Still Failing, Move Project
The space in "Jack Shaw" can cause issues. Move your project:

```bash
# From: E:\Users\HP\Downloads\Jack Shaw\Striver
# To:   E:\Users\HP\Downloads\Striver

# Then rebuild
cd android
gradlew clean
gradlew assembleDebug
```

## Changes Made to Fix

I've already made these changes to your project:

1. **android/gradle.properties**:
   - Enabled Reanimated C++ build (was disabled, but needed for gestures)
   - Increased Gradle memory from 4GB to 6GB
   - This allows the C++ compilation to complete

2. **Created build scripts**:
   - `build-android-arm-only.bat` - Fast build for real devices
   - `build-android-fixed.bat` - Full clean rebuild
   - `fix-cmake-quick.bat` - Quick CMake cache clean

## Why This Error Happened

1. **Gesture Implementation**: We added swipe gestures which require react-native-reanimated's C++ code
2. **C++ Build Disabled**: The gradle.properties had `REANIMATED_CPP_BUILD=false` to speed up builds
3. **Now Required**: With gestures, we need the C++ code, so I enabled it
4. **CMake Issue**: The x86_64 architecture build is failing, possibly due to:
   - Path with spaces
   - CMake cache corruption
   - NDK version mismatch

## Recommended Solution

**For fastest results, use ARM-only build:**

```bash
./build-android-arm-only.bat
```

This will:
- Skip the problematic x86_64 build
- Build only for ARM (real devices)
- Complete in 5-10 minutes instead of 35+ minutes
- Avoid the CMake error entirely

Then install on your phone:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## If You Need Emulator Support

If you must test on an emulator, you'll need to fix the x86_64 build:

1. **Check NDK version**:
   - Open Android Studio
   - Tools > SDK Manager > SDK Tools
   - Verify NDK (Side by side) 25.1.8937393 is installed

2. **Check CMake version**:
   - In SDK Manager, verify CMake 3.22.1 is installed

3. **Move project** (if possible):
   - Move from "Jack Shaw" folder to a path without spaces

4. **Try full rebuild**:
   ```bash
   ./build-android-fixed.bat
   ```

## Testing After Build

Once the build succeeds:

1. **Install on device**:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Start Metro** (in separate terminal):
   ```bash
   ./restart-metro.bat
   ```

3. **Test swipe gestures**:
   - Swipe left → Next video
   - Swipe right → Open camera
   - Swipe up → View responses

## Next Steps After Successful Build

1. ✅ Build Android app
2. ⏳ Deploy Firebase Functions (need Node.js 20)
3. ⏳ Test push notifications
4. ⏳ Test swipe gestures

## Need Help?

If none of these solutions work:

1. **Check the full error log**:
   ```bash
   cd android
   gradlew assembleDebug --stacktrace --info > build_log.txt
   cd ..
   ```

2. **Share the build_log.txt** for more specific help

3. **Try building in Android Studio**:
   - Open the `android` folder in Android Studio
   - Let it sync and index
   - Build > Make Project
   - This often provides better error messages

## Summary

**Fastest solution**: Use `./build-android-arm-only.bat` to build for real devices only and skip the problematic x86_64 architecture.
