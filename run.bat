@echo off
REM Library Management System - Start Script for Windows
REM This script starts the application

cls
echo ============================================================
echo    Library Management System - Starting...
echo ============================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [ERROR] Dependencies not installed!
    echo.
    echo Please run the installation script first:
    echo   install.bat
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js v18 or higher from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Starting development server...
echo Please wait, this may take a few seconds...
echo.

echo Starting Library Management System...
echo.
echo ============================================================
echo Application will open in a new window
echo ============================================================
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo Press Ctrl+C to stop the application
echo.

REM Start the application
call npm start
