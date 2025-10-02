#!/bin/bash

# 🛑 Stop Library Management System Script
# This script stops all running services

echo "🛑 Stopping Library Management System..."
echo "========================================"

# Color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Stop biometric helper service
print_status "Stopping biometric helper service..."
if [ -f "biometric-helper.pid" ]; then
    BIOMETRIC_PID=$(cat biometric-helper.pid)
    if ps -p $BIOMETRIC_PID > /dev/null 2>&1; then
        kill $BIOMETRIC_PID
        sleep 2
        if ps -p $BIOMETRIC_PID > /dev/null 2>&1; then
            kill -9 $BIOMETRIC_PID
            print_warning "Force killed biometric helper service"
        else
            print_success "Biometric helper service stopped gracefully"
        fi
    else
        print_warning "Biometric helper PID file exists but process not running"
    fi
    rm -f biometric-helper.pid
else
    # Try to find and kill by process name
    BIOMETRIC_PIDS=$(pgrep -f "dotnet.*ESSL")
    if [ ! -z "$BIOMETRIC_PIDS" ]; then
        echo $BIOMETRIC_PIDS | xargs kill
        print_success "Stopped biometric helper processes"
    else
        print_status "No biometric helper process found"
    fi
fi

# Stop main application (Electron)
print_status "Stopping main application..."
ELECTRON_PIDS=$(pgrep -f "electron.*library-management")
if [ ! -z "$ELECTRON_PIDS" ]; then
    echo $ELECTRON_PIDS | xargs kill
    sleep 2
    # Check if any are still running and force kill
    REMAINING_ELECTRON=$(pgrep -f "electron.*library-management")
    if [ ! -z "$REMAINING_ELECTRON" ]; then
        echo $REMAINING_ELECTRON | xargs kill -9
        print_warning "Force killed main application"
    else
        print_success "Main application stopped gracefully"
    fi
else
    print_status "No main application process found"
fi

# Stop Vite dev server
print_status "Stopping Vite dev server..."
VITE_PIDS=$(pgrep -f "vite")
if [ ! -z "$VITE_PIDS" ]; then
    echo $VITE_PIDS | xargs kill
    print_success "Vite dev server stopped"
else
    print_status "No Vite process found"
fi

# Stop any remaining Node.js processes from this project
print_status "Stopping any remaining Node.js processes..."
NODE_PIDS=$(pgrep -f "node.*library-management")
if [ ! -z "$NODE_PIDS" ]; then
    echo $NODE_PIDS | xargs kill
    print_success "Node.js processes stopped"
else
    print_status "No Node.js processes found"
fi

# Clean up PID files
print_status "Cleaning up PID files..."
rm -f dev.pid
rm -f biometric-helper.pid
print_success "PID files cleaned up"

# Show summary
echo
echo "========================================"
print_success "All services stopped successfully!"
echo
print_status "Summary of stopped services:"
echo "  • Biometric Helper Service"
echo "  • Main Electron Application"
echo "  • Vite Development Server"
echo "  • Background Node.js processes"
echo
print_status "To start again, run: ./start-all.sh"
echo "========================================"