@echo off
echo ========================================
echo STRIVER MENTOR SYSTEM - QUICK START
echo ========================================
echo.
echo This will help you test the mentor system
echo.
echo STEP 1: Start Admin Panel
echo ========================================
echo.
echo Opening admin panel in new window...
start cmd /k "cd admin-panel && npm run dev"
echo.
echo Wait for admin panel to start at http://localhost:5173
echo.
pause
echo.
echo STEP 2: Mark a User as Mentor
echo ========================================
echo.
echo 1. Open http://localhost:5173 in your browser
echo 2. Login with your admin credentials
echo 3. Click "Mentors" in the sidebar
echo 4. Toggle the mentor switch for a test user
echo.
pause
echo.
echo STEP 3: Test on Mobile App
echo ========================================
echo.
echo Now start your mobile app and:
echo 1. Go to Fan Club screen
echo 2. Tap "Connect to Mentors"
echo 3. You should see the mentor you just added!
echo.
echo Press any key to exit...
pause >nul
