@echo off
setlocal enabledelayedexpansion
echo ========================================
echo DEPLOYMENT READINESS CHECK
echo ========================================
echo.

set "ERRORS=0"
set "WARNINGS=0"

echo [1/6] Checking Firebase CLI...
echo ========================================
call firebase --version >nul 2>&1
if errorlevel 1 (
    echo [X] FAIL: Firebase CLI not installed
    echo     Install: npm install -g firebase-tools
    set /a ERRORS+=1
) else (
    echo [✓] PASS: Firebase CLI installed
)

echo.
echo [2/6] Checking Firebase Login...
echo ========================================
call firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo [X] FAIL: Not logged in to Firebase
    echo     Run: firebase login
    set /a ERRORS+=1
) else (
    echo [✓] PASS: Logged in to Firebase
)

echo.
echo [3/6] Checking Admin Panel Files...
echo ========================================
if not exist "admin-panel\package.json" (
    echo [X] FAIL: admin-panel/package.json not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: admin-panel/package.json exists
)

if not exist "admin-panel\src\App.tsx" (
    echo [X] FAIL: admin-panel/src/App.tsx not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: admin-panel/src/App.tsx exists
)

if not exist "admin-panel\src\MentorsManagement.tsx" (
    echo [X] FAIL: admin-panel/src/MentorsManagement.tsx not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: admin-panel/src/MentorsManagement.tsx exists
)

echo.
echo [4/6] Checking Mobile App Files...
echo ========================================
if not exist "src\screens\main\MentorsScreen.tsx" (
    echo [X] FAIL: src/screens/main/MentorsScreen.tsx not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: MentorsScreen.tsx exists
)

if not exist "src\screens\main\AlertsScreen.tsx" (
    echo [X] FAIL: src/screens/main/AlertsScreen.tsx not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: AlertsScreen.tsx exists
)

if not exist "src\api\firebase.ts" (
    echo [X] FAIL: src/api/firebase.ts not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: firebase.ts exists
)

echo.
echo [5/6] Checking Firebase Configuration...
echo ========================================
if not exist ".firebaserc" (
    echo [X] FAIL: .firebaserc not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: .firebaserc exists
    findstr /C:"striver-app-48562" .firebaserc >nul
    if errorlevel 1 (
        echo [!] WARN: Project ID not found in .firebaserc
        set /a WARNINGS+=1
    ) else (
        echo [✓] PASS: Project ID configured
    )
)

if not exist "firebase.json" (
    echo [X] FAIL: firebase.json not found
    set /a ERRORS+=1
) else (
    echo [✓] PASS: firebase.json exists
    findstr /C:"admin-panel/dist" firebase.json >nul
    if errorlevel 1 (
        echo [!] WARN: Admin panel hosting not configured
        set /a WARNINGS+=1
    ) else (
        echo [✓] PASS: Admin hosting configured
    )
)

echo.
echo [6/6] Checking Node Modules...
echo ========================================
if not exist "admin-panel\node_modules" (
    echo [!] WARN: Admin panel dependencies not installed
    echo     Run: cd admin-panel ^&^& npm install
    set /a WARNINGS+=1
) else (
    echo [✓] PASS: Admin panel dependencies installed
)

if not exist "node_modules" (
    echo [!] WARN: Mobile app dependencies not installed
    echo     Run: npm install
    set /a WARNINGS+=1
) else (
    echo [✓] PASS: Mobile app dependencies installed
)

echo.
echo ========================================
echo READINESS SUMMARY
echo ========================================
echo.
echo Errors: %ERRORS%
echo Warnings: %WARNINGS%
echo.

if %ERRORS% GTR 0 (
    echo [X] NOT READY FOR DEPLOYMENT
    echo.
    echo Please fix the errors above before deploying.
    echo.
) else if %WARNINGS% GTR 0 (
    echo [!] READY WITH WARNINGS
    echo.
    echo You can deploy, but consider fixing warnings first.
    echo.
    echo To deploy:
    echo   ./deploy-admin-panel.bat
    echo.
) else (
    echo [✓] READY FOR DEPLOYMENT!
    echo.
    echo Everything looks good. You can deploy now:
    echo   ./deploy-admin-panel.bat
    echo.
    echo Or deploy everything:
    echo   ./deploy-mentor-system-complete.bat
    echo.
)

pause
