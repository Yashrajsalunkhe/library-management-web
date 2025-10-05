#!/bin/bash

# Library Management System - Complete Build Script
# This script builds the application for all platforms

set -e

echo "🚀 Starting Library Management System build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean || print_warning "Clean command failed, continuing..."

# Install dependencies
print_status "Installing dependencies..."
npm install

# Rebuild native modules for Electron
print_status "Rebuilding native modules..."
npm run rebuild || print_warning "Rebuild failed, continuing..."

# Build React application
print_status "Building React application..."
npm run build

# Check if dist folder was created
if [ ! -d "dist" ]; then
    print_error "React build failed - dist folder not found"
    exit 1
fi

print_success "React application built successfully"

# Build Electron application for different platforms
print_status "Building Electron applications..."

# Windows build
print_status "Building for Windows..."
npm run dist:win || print_error "Windows build failed"

# macOS build (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Building for macOS..."
    npm run dist:mac || print_error "macOS build failed"
else
    print_warning "Skipping macOS build (not running on macOS)"
fi

# Linux build
print_status "Building for Linux..."
npm run dist:linux || print_error "Linux build failed"

# Check if builds were successful
print_status "Checking build outputs..."

if [ -d "dist-electron" ]; then
    print_success "Build completed successfully!"
    print_status "Build artifacts location: $(pwd)/dist-electron"
    
    # List all generated files
    echo ""
    print_status "Generated files:"
    find dist-electron -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "  📦 $(basename "$file") ($size)"
    done
    
    echo ""
    print_success "🎉 Build process completed successfully!"
    print_status "You can find all installers in the dist-electron directory"
    
else
    print_error "Build failed - no output directory found"
    exit 1
fi