#!/bin/bash

# Emoji definitions
EMOJI_START="🚀"
EMOJI_DEV="🟢"
EMOJI_ELECTRON="⚡"
EMOJI_DONE="✅"
EMOJI_ERROR="❌"

# Start Vite/React dev server
echo "$EMOJI_START Starting Vite/React dev server..."
npm run dev > dev.log 2>&1 &
DEV_PID=$!
echo $DEV_PID > dev.pid
echo "$EMOJI_DEV Vite/React dev server started (PID: $DEV_PID). Logs: dev.log"

# Wait a few seconds for dev server to start (customize as needed)
sleep 5

# Start Electron app
echo "$EMOJI_START Starting Electron app..."
NODE_ENV=development npm run electron > electron.log 2>&1 &
ELECTRON_PID=$!
echo "$EMOJI_ELECTRON Electron app started (PID: $ELECTRON_PID). Logs: electron.log"

# Wait for both processes to finish
wait $DEV_PID
if [[ $? -eq 0 ]]; then
	echo "$EMOJI_DONE Vite/React dev server exited successfully."
else
	echo "$EMOJI_ERROR Vite/React dev server exited with error. See dev.log."
fi

wait $ELECTRON_PID
if [[ $? -eq 0 ]]; then
	echo "$EMOJI_DONE Electron app exited successfully."
else
	echo "$EMOJI_ERROR Electron app exited with error. See electron.log."
fi
