#!/bin/bash

# 🚀 Complete Library Management System Startup Script (ZKLib Version)
# This script starts the application with JavaScript-based biometric integration

echo "🏛️  Starting Library Management System with ZKLib Integration..."
echo "=================================================================="

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

# Load environment variables
print_status "Loading environment configuration..."
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_success "Environment variables loaded from .env"
    
    # Show biometric configuration
    if [ ! -z "$BIOMETRIC_DEVICE_IP" ]; then
        print_status "Biometric device configured: IP=${BIOMETRIC_DEVICE_IP}, Port=${BIOMETRIC_DEVICE_PORT:-4370}"
    fi
else
    print_warning ".env file not found. Using default configuration."
    print_warning "Copy .env.example to .env and configure your settings."
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

# Function to check biometric device connectivity
check_biometric_device() {
    print_status "Checking biometric device configuration..."
    
    # Check if biometric device IP is configured in environment
    if [ -f ".env" ]; then
        DEVICE_IP=$(grep "BIOMETRIC_DEVICE_IP" .env | cut -d '=' -f2)
    fi
    
    # Use default IP if not configured
    if [ -z "$DEVICE_IP" ]; then
        DEVICE_IP="172.16.85.85"
        print_warning "Using default biometric device IP: $DEVICE_IP"
        print_warning "Configure BIOMETRIC_DEVICE_IP in .env file for custom IP"
    else
        print_success "Biometric device configured: $DEVICE_IP"
    fi
    
    # Test device connection
    print_status "Testing biometric device connection to $DEVICE_IP..."
    if ping -c 1 -W 1 "$DEVICE_IP" > /dev/null 2>&1; then
        print_success "Biometric device is reachable"
    else
        print_warning "Biometric device not reachable at $DEVICE_IP"
        print_warning "Please check device connection and IP configuration"
        print_warning "The application will still start, but biometric features may not work"
    fi
}

# Function to test biometric integration
test_biometric_integration() {
    print_status "Testing biometric integration..."
    
    # Check if node-zklib is installed
    if node -e "require('node-zklib')" 2>/dev/null; then
        print_success "node-zklib dependency found"
        
        # Optional: Run quick connectivity test
        print_status "You can test biometric connectivity with: npm run test:biometric"
        echo "  or manually run: node test-zklib-biometric.js"
    else
        print_error "node-zklib dependency not found!"
        print_error "Run: npm install node-zklib"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    echo
    print_status "Stopping services..."
    print_success "Application will stop automatically"
    exit 0
}

# Set up signal handlers
trap stop_services SIGINT SIGTERM

# Check biometric device connectivity
check_biometric_device

# Test biometric integration
test_biometric_integration

# Show startup information
print_status "Starting main application..."
echo
echo "=================================================================="
echo "🌐 Main Application will start on: http://localhost:5173"
echo "🔐 Biometric Service: JavaScript ZKLib (Direct TCP Connection)"
if [ ! -z "$DEVICE_IP" ]; then
    echo "📱 Biometric Device: ${DEVICE_IP}:${BIOMETRIC_DEVICE_PORT:-4370}"
fi
echo "📊 Dashboard will be available in a few seconds"
echo "=================================================================="
echo
print_status "Starting Electron application with Vite dev server..."

# Add helpful notes
echo
echo "💡 Helpful commands:"
echo "   Test biometric: npm run test:biometric"
echo "   Stop application: Ctrl+C"
echo

# Start the main application
npm start

# This will run until the user stops it with Ctrl+C
# The trap function will handle cleanup