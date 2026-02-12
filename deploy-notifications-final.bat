v  @echo off
echo ========================================
echo DEPLOY NOTIFICATIONS - FINAL VERSION
echo ========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version > node_version.txt
set /p NODE_VERSION=<node_version.txt
del node_version.txt

echo Current Node.js version: %NODE_VERSION%
echo Required version: v20.x.x
echo.

REM Check if version starts with v20
echo %NODE_VERSION% | findstr /B "v20" >nul
if errorlevel 1 (
    echo ERROR: Node.js version mismatch!
    echo.
    echo You are using %NODE_VERSION% but Firebase Functions require Node.js 20.
    echo.
    echo Please install Node.js 20 LTS:
    echo   Option 1: Download from https://nodejs.org/
    echo   Option 2: Use nvm-windows:
    echo     - nvm install 20
    echo     - nvm use 20
    echo.
    echo After switching to Node 20, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js version is compatible!
echo.
pause

cd functions

echo Step 1: Cleaning old build files...
if exist lib rmdir /s /q lib
echo ✓ Cleaned lib directory
echo.

echo Step 2: Building functions...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    cd ..
    pause
    exit /b 1
)
echo ✓ Build successful
echo.

echo Step 3: Deploying notification functions...
cd ..
firebase deploy --only functions:onPostLiked,functions:onPostCommented,functions:onNewFollower,functions:onVideoResponse,functions:onChallengeInvite

if errorlevel 1 (
    echo.
    echo ERROR: Deployment failed
    echo.
    echo Common issues:
    echo 1. Not logged in to Firebase - run: firebase login
    echo 2. Wrong project selected - run: firebase use striver-app-48562
    echo 3. Network issues - check your internet connection
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Next steps:
echo 1. Open Firebase Console: https://console.firebase.google.com/project/striver-app-48562/functions
echo 2. Verify all 5 notification functions are listed as "Active"
echo 3. Test notifications by:
echo    - Liking a post
echo    - Commenting on a post
echo    - Following a user
echo    - Creating a response video
echo.
echo Check function logs for any errors:
echo    firebase functions:log
echo.
pause
