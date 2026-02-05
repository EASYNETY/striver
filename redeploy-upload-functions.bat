@echo off
echo ========================================
echo Redeploying Upload Functions with Public Access
echo ========================================
echo.

cd functions
echo Building functions...
call npm run build

cd ..
echo.
echo Deploying functions...
firebase deploy --only functions:getUploadUrl,functions:completeUpload --config firebase-new.json

echo.
echo ========================================
echo Done! Functions deployed with public access.
echo ========================================
echo.
echo Reload your app (press R twice in Metro) and test upload.
echo.
pause
