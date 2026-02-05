@echo off
cd /d "%~dp0"
echo Building functions...
cd functions
call npm run build
cd ..
echo.
echo Deploying functions...
call firebase deploy --only functions:getUploadUrl,functions:completeUpload --config firebase-new.json
echo.
echo Done!
pause
