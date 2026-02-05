@echo off
echo ========================================
echo Step 1: Login to gcloud
echo ========================================
echo.
gcloud auth login

echo.
echo ========================================
echo Step 2: Set project
echo ========================================
echo.
gcloud config set project striver-app-48562

echo.
echo ========================================
echo Step 3: Setting Function Permissions
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
