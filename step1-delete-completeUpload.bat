@echo off
echo Deleting completeUpload function...
gcloud functions delete completeUpload --region=us-central1 --quiet
echo Done!
pause
