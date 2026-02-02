@echo off
echo ===================================================
echo   AI Workflow Canvas - Local Setup Script
echo ===================================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

echo.
echo [2/3] Starting development server (Frontend + Backend)...
echo.
echo The application will open in your browser shortly.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop the server.
echo.

npm run dev:all
pause
