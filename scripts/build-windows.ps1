# Library Management System - PowerShell Build Script
# This script builds the application for Windows using PowerShell

param(
    [switch]$Portable,
    [switch]$Setup,
    [switch]$Both
)

# Set colors
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline
    Write-Host $Message -ForegroundColor $Colors[$Type]
}

Write-Status "🚀 Starting Library Management System build process..." "Info"

# Check prerequisites
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Status "Node.js version: $nodeVersion" "Info"
    Write-Status "npm version: $npmVersion" "Info"
} catch {
    Write-Status "❌ Node.js or npm is not installed. Please install Node.js first." "Error"
    exit 1
}

# Default to both if no specific option is chosen
if (-not $Portable -and -not $Setup) {
    $Both = $true
}

Write-Status "🧹 Cleaning previous builds..." "Info"
try {
    npm run clean
} catch {
    Write-Status "⚠️  Clean command failed, continuing..." "Warning"
}

Write-Status "📦 Installing dependencies..." "Info"
try {
    npm install
} catch {
    Write-Status "❌ Failed to install dependencies" "Error"
    exit 1
}

Write-Status "🔧 Rebuilding native modules..." "Info"
try {
    npm run rebuild
} catch {
    Write-Status "⚠️  Rebuild failed, continuing..." "Warning"
}

Write-Status "⚛️  Building React application..." "Info"
try {
    npm run build
} catch {
    Write-Status "❌ React build failed" "Error"
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Status "❌ React build failed - dist folder not found" "Error"
    exit 1
}

Write-Status "✅ React application built successfully" "Success"

# Build specific versions based on parameters
if ($Setup -or $Both) {
    Write-Status "🖥️  Building Windows installer (NSIS)..." "Info"
    try {
        npm run dist:win
        Write-Status "✅ Windows installer built successfully" "Success"
    } catch {
        Write-Status "❌ Windows installer build failed" "Error"
    }
}

if ($Portable -or $Both) {
    Write-Status "💼 Building portable version..." "Info"
    try {
        npx electron-builder --win --config.win.target=portable --publish=never
        Write-Status "✅ Portable version built successfully" "Success"
    } catch {
        Write-Status "❌ Portable build failed" "Error"
    }
}

Write-Status "📋 Checking build outputs..." "Info"

if (Test-Path "dist-electron") {
    Write-Status "✅ Build completed successfully!" "Success"
    Write-Status "📍 Build artifacts location: $(Get-Location)\dist-electron" "Info"
    
    Write-Host ""
    Write-Status "📦 Generated files:" "Info"
    
    Get-ChildItem "dist-electron" -Filter "*.exe" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  📦 $($_.Name) ($size MB)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Status "🎉 Build process completed successfully!" "Success"
    Write-Status "📂 Opening dist-electron directory..." "Info"
    
    # Open the dist-electron folder
    Invoke-Item "dist-electron"
    
} else {
    Write-Status "❌ Build failed - no output directory found" "Error"
    exit 1
}

Write-Host ""
Write-Status "✨ Build script completed!" "Success"