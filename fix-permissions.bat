@echo off
echo Setting project to striver-app-48562...
gcloud config set project striver-app-48562

echo.
echo Setting permissions for getUploadUrl...
gcloud functions add-iam-policy-binding getUploadUrl --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker

echo.
echo Setting permissions for completeUpload...
gcloud functions add-iam-policy-binding completeUpload --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker

echo.
echo Done!
pause
