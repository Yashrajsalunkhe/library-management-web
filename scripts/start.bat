@echo off
echo 🚀 Starting Library Management System...

REM Set development environment
set NODE_ENV=development

REM Start Vite dev server in background
echo 🟢 Starting Vite/React dev server...
start "Vite Dev Server" cmd /c "npm run dev"

REM Wait for dev server to start
echo ⏳ Waiting for dev server to initialize...
timeout /t 8 /nobreak > nul

REM Start Electron app
echo ⚡ Starting Electron app...
electron .

echo ✅ Application closed.
pause
