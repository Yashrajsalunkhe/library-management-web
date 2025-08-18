#!/bin/bash

# Setup script for Library Management System
# This script sets up the development environment

set -e  # Exit on error

echo "🔧 Setting up Library Management System development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔐 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
fi

# Make scripts executable
echo "🔨 Making scripts executable..."
chmod +x scripts/*.sh

# Check if Python is available for biometric helper
if command -v python3 &> /dev/null; then
    echo "🐍 Python3 is available for biometric integration"
elif command -v python &> /dev/null; then
    echo "🐍 Python is available for biometric integration"
else
    echo "⚠️  Python not found. Biometric features may not work."
fi

# Check if .NET is available for biometric helper
if command -v dotnet &> /dev/null; then
    echo "🔷 .NET is available for biometric helper"
    cd biometric-helper
    echo "🔨 Building biometric helper..."
    dotnet build
    cd ..
else
    echo "⚠️  .NET not found. Biometric helper needs to be built manually."
fi

echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start development:"
echo "  npm run start    # Start both Vite and Electron"
echo "  npm run dev      # Start only Vite dev server"
echo "  npm run electron # Start only Electron"
echo ""
echo "📚 To build for production:"
echo "  ./scripts/build.sh"
