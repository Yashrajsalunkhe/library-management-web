#!/bin/bash

# 🚀 Complete Library Management System Startup Script
# This script starts both the main application and biometric helper service

echo "🏛️  Starting Library Management System..."
echo "=================================================="

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

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "electron" ]; then
    print_error "Please run this script from the library-management project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm found: $(npm --version)"

# Check .NET (for biometric helper)
if ! command -v dotnet &> /dev/null; then
    print_warning ".NET is not installed. Biometric features will not work."
    print_warning "Install .NET 6.0 or later to enable biometric functionality."
    DOTNET_AVAILABLE=false
else
    print_success ".NET found: $(dotnet --version)"
    DOTNET_AVAILABLE=true
fi

# Load environment variables
print_status "Loading environment configuration..."
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_success "Environment variables loaded from .env"
    
    # Show biometric configuration
    if [ ! -z "$ESSL_DEVICE_IP" ]; then
        print_status "Biometric device configured: IP=${ESSL_DEVICE_IP}, Port=${ESSL_DEVICE_PORT:-4370}"
    fi
else
    print_warning ".env file not found. Using default configuration."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Node.js dependencies already installed"
fi

# Function to start biometric helper
start_biometric_helper() {
    if [ "$DOTNET_AVAILABLE" = true ]; then
        print_status "Starting biometric helper service..."
        cd biometric-helper
        
        # Build the project
        if dotnet build > /dev/null 2>&1; then
            print_success "Biometric helper built successfully"
        else
            print_error "Failed to build biometric helper"
            cd ..
            return 1
        fi
        
        # Test device connection if IP is configured
        if [ ! -z "$ESSL_DEVICE_IP" ]; then
            print_status "Testing device connection to $ESSL_DEVICE_IP..."
            if ping -c 1 -W 1 "$ESSL_DEVICE_IP" > /dev/null 2>&1; then
                print_success "Device is reachable"
            else
                print_warning "Device not reachable at $ESSL_DEVICE_IP"
                print_warning "Please check device connection and IP configuration"
            fi
        fi
        
        # Start the service in background
        print_status "Starting biometric helper service on port 5005..."
        nohup dotnet run > ../biometric-helper.log 2>&1 &
        BIOMETRIC_PID=$!
        echo $BIOMETRIC_PID > ../biometric-helper.pid
        
        # Wait a moment for service to start
        sleep 3
        
        # Check if service is running
        if ps -p $BIOMETRIC_PID > /dev/null; then
            print_success "Biometric helper service started (PID: $BIOMETRIC_PID)"
        else
            print_error "Failed to start biometric helper service"
            print_error "Check biometric-helper.log for details"
        fi
        
        cd ..
    else
        print_warning "Skipping biometric helper (no .NET found)"
    fi
}

# Function to stop services
stop_services() {
    echo
    print_status "Stopping services..."
    
    # Stop biometric helper
    if [ -f "biometric-helper.pid" ]; then
        BIOMETRIC_PID=$(cat biometric-helper.pid)
        if ps -p $BIOMETRIC_PID > /dev/null; then
            kill $BIOMETRIC_PID
            print_success "Biometric helper service stopped"
        fi
        rm -f biometric-helper.pid
    fi
    
    # Stop main application (npm will handle this automatically)
    print_success "Main application will stop automatically"
    exit 0
}

# Set up signal handlers
trap stop_services SIGINT SIGTERM

# Start biometric helper first
start_biometric_helper

# Start main application
print_status "Starting main application..."
echo
echo "=================================================="
echo "🌐 Main Application will start on: http://localhost:5173"
if [ "$DOTNET_AVAILABLE" = true ]; then
    echo "🔐 Biometric Service running on: http://localhost:5005"
fi
echo "📊 Dashboard will be available in a few seconds"
echo "=================================================="
echo
print_status "Starting Electron application with Vite dev server..."
echo

# Start the main application
npm start

# This will run until the user stops it with Ctrl+C
# The trap function will handle cleanup