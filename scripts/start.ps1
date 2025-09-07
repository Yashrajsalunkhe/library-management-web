# Library Management System Startup Script for Windows PowerShell

Write-Host "🚀 Starting Library Management System..." -ForegroundColor Green

# Set development environment
$env:NODE_ENV = "development"

# Start Vite dev server in background
Write-Host "🟢 Starting Vite/React dev server..." -ForegroundColor Yellow
$devProcess = Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c", "npm run dev" -PassThru

# Wait for dev server to initialize
Write-Host "⏳ Waiting for dev server to initialize..." -ForegroundColor Blue
Start-Sleep -Seconds 8

# Start Electron app
Write-Host "⚡ Starting Electron app..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "electron", "." -Wait

Write-Host "✅ Application closed." -ForegroundColor Green

# Stop the dev server
if ($devProcess -and !$devProcess.HasExited) {
    Write-Host "🛑 Stopping dev server..." -ForegroundColor Red
    Stop-Process -Id $devProcess.Id -Force
}

Read-Host "Press Enter to exit"
