@echo off
echo ========================================
echo Deleting Old Functions
echo ========================================
echo.

gcloud functions delete getUploadUrl --region=us-central1 --quiet
gcloud functions delete completeUpload --region=us-central1 --quiet

echo.
echo ========================================
echo Redeploying Functions
echo ========================================
echo.

cd functions
call npm run build
cd ..

firebase deploy --only functions:getUploadUrl,functions:completeUpload --config firebase-new.json

echo.
echo ========================================
echo Setting Public Access
echo ========================================
echo.

gcloud functions add-iam-policy-binding getUploadUrl --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker

gcloud functions add-iam-policy-binding completeUpload --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker

echo.
echo ========================================
echo Done!
echo ========================================
echo.
pause
