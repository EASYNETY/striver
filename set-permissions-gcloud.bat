@echo off
echo ========================================
echo Setting Function Permissions via gcloud
echo ========================================
echo.

echo Setting permissions for getUploadUrl...
gcloud functions add-iam-policy-binding getUploadUrl --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker --project=striver-app-48562

echo.
echo Setting permissions for completeUpload...
gcloud functions add-iam-policy-binding completeUpload --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker --project=striver-app-48562

echo.
echo ========================================
echo Done! Functions are now publicly accessible.
echo ========================================
echo.
echo Reload your app (press R twice in Metro) and test upload.
echo.
pause
