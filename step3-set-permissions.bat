@echo off
echo Setting public access permissions...
gcloud functions add-iam-policy-binding getUploadUrl --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker
gcloud functions add-iam-policy-binding completeUpload --region=us-central1 --member=allUsers --role=roles/cloudfunctions.invoker
echo Done!
pause
