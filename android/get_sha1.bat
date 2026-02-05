@echo off
echo ========================================
echo Getting SHA Fingerprints for Firebase
echo ========================================
echo.

gradlew signingReport

echo.
echo ========================================
echo Look for "SHA1:" and "SHA-256:" in the output above
echo.
echo IMPORTANT: Add BOTH SHA-1 and SHA-256 to Firebase Console
echo.
echo Steps:
echo 1. Go to Firebase Console ^> Project Settings
echo 2. Select your Android app
echo 3. Click "Add fingerprint"
echo 4. Add both SHA-1 and SHA-256 fingerprints
echo 5. Download updated google-services.json
echo 6. Replace android/app/google-services.json
echo ========================================
pause
