#!/bin/bash

# Build script for Library Management System
# This script builds both the React frontend and packages the Electron app

set -e  # Exit on error

echo "🚀 Starting build process..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Build React frontend
echo "⚛️  Building React frontend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build completed successfully!"

# Package Electron app
echo "📦 Packaging Electron app..."
npm run electron:build

echo "🎉 Build process completed successfully!"
echo "📁 Built files are in the 'dist-electron' directory"
