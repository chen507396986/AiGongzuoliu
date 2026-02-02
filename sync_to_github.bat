@echo off
echo =======================================================
echo          GitHub Synchronization Script
echo =======================================================
echo.
echo This script will help you sync your changes to GitHub.
echo.

:: Check if git user is configured
git config user.name >nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Git user identity is not configured.
    echo Please enter your details below.
    set /p GIT_NAME="Enter your GitHub Name: "
    set /p GIT_EMAIL="Enter your GitHub Email: "
    git config user.name "%GIT_NAME%"
    git config user.email "%GIT_EMAIL%"
    echo [+] Identity configured.
) else (
    echo [+] Git user identity found.
)

echo.
echo [1/3] Adding files...
git add .

echo.
echo [2/3] Committing changes...
set /p COMMIT_MSG="Enter commit message (default: Update): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update
git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Pushing to GitHub...
echo Note: A browser window or login prompt may appear.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Changes successfully synced to GitHub!
) else (
    echo.
    echo [ERROR] Failed to push to GitHub. Please check your internet or credentials.
)

echo.
pause
