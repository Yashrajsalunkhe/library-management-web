#!/bin/bash

echo "🚀 Testing Library Management System startup..."
echo ""

# Kill any existing processes
echo "1. Stopping any existing processes..."
pkill -f "vite"
pkill -f "electron"
sleep 2

# Clear cache
echo "2. Clearing development cache..."
rm -rf node_modules/.vite 2>/dev/null
rm -rf dist 2>/dev/null

# Test Vite only (React)
echo "3. Testing React app only..."
echo "   Starting Vite dev server..."
timeout 10 npm run start:fast &
VITE_PID=$!

sleep 5

# Check if Vite is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ React app is accessible at http://localhost:5173"
else
    echo "   ❌ React app is NOT accessible"
fi

# Stop Vite
kill $VITE_PID 2>/dev/null
sleep 2

echo ""
echo "4. Testing full Electron app..."
echo "   Starting full application..."

# Test full app
timeout 15 npm start &
APP_PID=$!

sleep 8

echo "   ⏱️  Waiting for application to start..."
sleep 3

# Stop the app
kill $APP_PID 2>/dev/null
pkill -f "electron" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo ""
echo "🎯 Test complete!"
echo ""
echo "To start the application:"
echo "  • For React only: npm run start:fast"
echo "  • For full app:   npm start"
echo ""
echo "If you see white screen issues:"
echo "  1. Check browser console (F12) for errors"
echo "  2. Try clearing cache: ./scripts/clear-cache.sh"
echo "  3. Restart with: npm start"