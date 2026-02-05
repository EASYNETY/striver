@echo off
cd /d "%~dp0"
firebase functions:list --config firebase-new.json
pause
