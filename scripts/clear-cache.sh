#!/bin/bash

# Clear Vite cache and node_modules for fresh start
echo "Clearing development caches..."

# Remove Vite cache
rm -rf node_modules/.vite
echo "✓ Cleared Vite cache"

# Remove dist folder
rm -rf dist
echo "✓ Cleared dist folder"

# Clear npm cache (optional)
npm cache clean --force
echo "✓ Cleared npm cache"

echo "Cache clearing complete! Run 'npm start' for a fresh start."