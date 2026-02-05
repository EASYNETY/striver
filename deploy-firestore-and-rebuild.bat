@echo off
echo Deploying Firestore rules...
firebase deploy --only firestore:rules --config firebase-new.json

echo.
echo Rebuilding app...
cd android
call gradlew clean
cd ..

echo.
echo Done! Now reload Metro (press R twice)
pause
