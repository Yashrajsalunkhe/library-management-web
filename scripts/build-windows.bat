@echo off
REM Library Management System - Windows Build Script
REM This script builds the application specifically for Windows

echo 🚀 Starting Library Management System Windows build process...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ℹ️  Node.js version:
node --version
echo ℹ️  npm version:
npm --version

echo.
echo 🧹 Cleaning previous builds...
call npm run clean 2>nul

echo.
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Rebuilding native modules...
call npm run rebuild

echo.
echo ⚛️  Building React application...
call npm run build
if errorlevel 1 (
    echo ❌ React build failed
    pause
    exit /b 1
)

REM Check if dist folder was created
if not exist "dist" (
    echo ❌ React build failed - dist folder not found
    pause
    exit /b 1
)

echo ✅ React application built successfully

echo.
echo 🖥️  Building Windows Electron application...
call npm run dist:win
if errorlevel 1 (
    echo ❌ Windows build failed
    pause
    exit /b 1
)

echo.
echo 📋 Checking build outputs...

if exist "dist-electron" (
    echo ✅ Build completed successfully!
    echo ℹ️  Build artifacts location: %CD%\dist-electron
    
    echo.
    echo 📦 Generated files:
    for %%f in (dist-electron\*.exe) do (
        echo   📦 %%~nxf
    )
    
    echo.
    echo 🎉 Windows build process completed successfully!
    echo ℹ️  You can find the installer in the dist-electron directory
    
    REM Open the dist-electron folder
    explorer dist-electron
    
) else (
    echo ❌ Build failed - no output directory found
    pause
    exit /b 1
)

echo.
echo Press any key to exit...
pause >nul