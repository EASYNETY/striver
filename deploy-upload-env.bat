@echo off
echo ========================================
echo Uploading Environment Variables to Firebase
echo ========================================
echo.

cd functions

echo Uploading .env file to Firebase Functions...
call firebase functions:secrets:set ONDATO_USERNAME --data-file .env
call firebase functions:secrets:set ONDATO_PASSWORD --data-file .env

echo.
echo ========================================
echo Environment Variables Uploaded!
echo ========================================
echo.
echo Next: Redeploy functions to use new env vars
echo Run: firebase deploy --only functions
echo.

cd ..
pause
