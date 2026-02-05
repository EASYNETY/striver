@echo off
echo ========================================
echo Checking Installed App Version
echo ========================================
echo.

echo Checking if app is installed...
adb shell pm list packages | findstr striverapp
echo.

echo Getting app info...
adb shell dumpsys package com.striverapp | findstr versionName
adb shell dumpsys package com.striverapp | findstr versionCode
adb shell dumpsys package com.striverapp | findstr firstInstallTime
adb shell dumpsys package com.striverapp | findstr lastUpdateTime
echo.

echo Checking APK path...
adb shell pm path com.striverapp
echo.

echo ========================================
echo If lastUpdateTime is old, rebuild needed!
echo ========================================
pause
