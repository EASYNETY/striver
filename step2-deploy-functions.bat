@echo off
echo Building and deploying functions...
cd functions
call npm run build
cd ..
firebase deploy --only functions:getUploadUrl,functions:completeUpload --config firebase-new.json
pause
