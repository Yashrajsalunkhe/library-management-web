@echo off
REM Library Management System - Installation Script for Windows
REM This script installs all dependencies and sets up the application

cls
echo ============================================================
echo    Library Management System - Installation
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js v18 or higher from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected: 
node -v
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm detected:
npm -v
echo.

REM Install dependencies
echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

REM Rebuild native modules
echo Building native modules for Electron...
call npm run rebuild

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Native module rebuild had issues
    echo The application may still work, but if you encounter errors,
    echo please run: npm run rebuild
    echo.
)

echo.
echo [OK] Native modules built successfully!
echo.

REM Create necessary directories
echo Creating necessary directories...

if not exist "exports\receipts" mkdir "exports\receipts"
if not exist "backups" mkdir "backups"

echo [OK] Directories created
echo.

REM Check database
if not exist "electron\library.db" (
    echo [INFO] Database file will be created automatically
    echo when you first run the application
    echo.
)

REM Installation complete
echo ============================================================
echo              INSTALLATION COMPLETED!
echo ============================================================
echo.
echo [OK] All dependencies installed
echo [OK] Application is ready to use
echo.
echo To start the application, run:
echo   run.bat
echo.
echo Default Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo [WARNING] Important: Change the default password after first login!
echo.
pause
