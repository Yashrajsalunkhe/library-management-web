#!/bin/bash

echo "🚀 COMPLETE PROJECT STARTUP GUIDE"
echo "================================="
echo ""

echo "📋 PRE-STARTUP CHECKLIST"
echo "------------------------"
echo ""

# Check if all required files exist
echo "🔍 Checking project files..."

if [ -f "package.json" ]; then
    echo "✅ Main project files found"
else
    echo "❌ package.json not found - are you in the right directory?"
    exit 1
fi

if [ -f "biometric-helper/ESSLK30HttpProgram.cs" ]; then
    echo "✅ Biometric helper found"
else
    echo "❌ Biometric helper not found"
fi

if [ -f ".env" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  .env file not found - will create basic one"
fi

echo ""

# Check Node.js and npm
echo "🔧 Checking dependencies..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not installed - please install Node.js first"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

# Check .NET
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    echo "✅ .NET: $DOTNET_VERSION"
else
    echo "⚠️  .NET not found - biometric features won't work"
    echo "   Install with: sudo apt install dotnet-sdk-6.0"
fi

echo ""
echo "📦 INSTALLING DEPENDENCIES"
echo "-------------------------"
echo ""

echo "Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Node.js dependencies installed"
else
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

if command -v dotnet &> /dev/null && [ -d "biometric-helper" ]; then
    echo ""
    echo "Building biometric helper..."
    cd biometric-helper
    dotnet build
    if [ $? -eq 0 ]; then
        echo "✅ Biometric helper built successfully"
    else
        echo "⚠️  Biometric helper build failed - continuing without it"
    fi
    cd ..
fi

echo ""
echo "🔧 ENVIRONMENT CONFIGURATION"
echo "----------------------------"
echo ""

# Check if .env has required fields
if ! grep -q "BIOMETRIC_HELPER_URL" .env 2>/dev/null; then
    echo "📝 Adding biometric configuration to .env..."
    echo "" >> .env
    echo "# Biometric Integration" >> .env
    echo "BIOMETRIC_HELPER_URL=http://localhost:5005" >> .env
    echo "BIOMETRIC_HELPER_TOKEN=your-secure-token" >> .env
    echo "ESSL_DEVICE_IP=172.16.50.20" >> .env
fi

echo "✅ Environment configured"

echo ""
echo "🚀 STARTING PROJECT"
echo "==================="
echo ""

echo "🎯 OPTION 1: AUTOMATIC STARTUP (RECOMMENDED)"
echo "--------------------------------------------"
echo ""
echo "This will start everything automatically:"
echo ""
echo "   npm start"
echo ""
echo "This command will:"
echo "   • Start Vite dev server (port 5173)"
echo "   • Start Electron application"
echo "   • Initialize biometric bridge"
echo "   • Open your library management system"
echo ""

echo "🎯 OPTION 2: MANUAL STARTUP (FOR TESTING)"
echo "-----------------------------------------"
echo ""
echo "If you want to start services separately:"
echo ""
echo "Terminal 1 - Main Application:"
echo "   npm run dev"
echo ""
echo "Terminal 2 - Electron (after dev server starts):"
echo "   npm run electron"
echo ""
echo "Terminal 3 - Biometric Helper (optional):"
echo "   cd biometric-helper"
echo "   dotnet run ESSLK30HttpProgram.cs"
echo ""

echo "🎯 OPTION 3: BIOMETRIC SETUP FIRST"
echo "----------------------------------"
echo ""
echo "If you need to setup your eSSL K30 device first:"
echo ""
echo "1. Setup device connection:"
echo "   ./setup-essl-k30.sh"
echo ""
echo "2. Start biometric helper:"
echo "   cd biometric-helper"
echo "   dotnet run ESSLK30HttpProgram.cs"
echo ""
echo "3. Start main application:"
echo "   npm start"
echo ""

echo "📊 WHAT TO EXPECT WHEN STARTING"
echo "==============================="
echo ""

echo "✅ Successful startup will show:"
echo "   • Vite dev server ready on http://localhost:5173"
echo "   • Electron window opens"
echo "   • Database initialized successfully"
echo "   • Biometric bridge listening on port 5006"
echo "   • All services initialized successfully"
echo ""

echo "🎮 USING THE APPLICATION"
echo "======================="
echo ""

echo "Dashboard Features:"
echo "   • 📊 Overview of members, attendance, payments"
echo "   • 🔴 Biometric status widget (shows device connection)"
echo "   • 🔔 Real-time notifications"
echo ""

echo "Members Section:"
echo "   • ➕ Add new members"
echo "   • 👆 Enroll fingerprints"
echo "   • 📊 View member details"
echo "   • 💳 Manage memberships"
echo ""

echo "Attendance Section:"
echo "   • 📅 View daily attendance"
echo "   • ⏰ Check-in/check-out times"
echo "   • 📈 Export attendance reports"
echo "   • 🔍 Search and filter"
echo ""

echo "🔧 TROUBLESHOOTING"
echo "=================="
echo ""

echo "Common Issues:"
echo ""

echo "❌ Port 5173 in use:"
echo "   Solution: App will try ports 5174, 5175 automatically"
echo ""

echo "❌ Database errors:"
echo "   Solution: Database will be created automatically"
echo ""

echo "❌ Biometric device not found:"
echo "   Solution: Run ./setup-essl-k30.sh to find device"
echo ""

echo "❌ Permission errors:"
echo "   Solution: Make sure you have read/write access to project folder"
echo ""

echo "❌ Module not found errors:"
echo "   Solution: Run 'npm install' again"
echo ""

echo "🆘 GET HELP"
echo "==========="
echo ""

echo "If you encounter issues:"
echo ""
echo "1. Check the console output for specific error messages"
echo "2. Look at the electron.log file"
echo "3. Verify all dependencies are installed"
echo "4. Make sure ports 5005, 5006, 5173 are available"
echo ""

echo "📚 DOCUMENTATION FILES"
echo "======================"
echo ""

echo "Available guides:"
echo "   📖 HOW_BIOMETRIC_WORKS.md - Complete biometric guide"
echo "   🔧 ESSL_K30_INTEGRATION_GUIDE.md - Hardware setup"
echo "   🔗 MEMBER_ID_LINKING_ANALYSIS.md - ID linking verification"
echo "   🎯 demo-biometric-attendance.sh - Attendance demo"
echo ""

echo "🎉 READY TO START!"
echo "=================="
echo ""

echo "Choose your startup option:"
echo ""
echo "For quick start:"
echo "   npm start"
echo ""
echo "For biometric setup:"
echo "   ./setup-essl-k30.sh"
echo ""

echo "Your library management system is ready! 🎯"