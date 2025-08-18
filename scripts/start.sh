#!/bin/zsh

# Emoji definitions
EMOJI_START="🚀"
EMOJI_DEV="🟢"
EMOJI_ELECTRON="⚡"
EMOJI_DONE="✅"
EMOJI_ERROR="❌"

# Start Vite/React dev server
print "$EMOJI_START Starting Vite/React dev server..."
npm run dev > dev.log 2>&1 &
DEV_PID=$!
echo $DEV_PID > dev.pid
print "$EMOJI_DEV Vite/React dev server started (PID: $DEV_PID). Logs: dev.log"

# Wait a few seconds for dev server to start (customize as needed)
sleep 3

# Start Electron app
print "$EMOJI_START Starting Electron app..."
npm run electron > electron.log 2>&1 &
ELECTRON_PID=$!
print "$EMOJI_ELECTRON Electron app started (PID: $ELECTRON_PID). Logs: electron.log"

# Wait for both processes to finish
wait $DEV_PID
if [[ $? -eq 0 ]]; then
	print "$EMOJI_DONE Vite/React dev server exited successfully."
else
	print "$EMOJI_ERROR Vite/React dev server exited with error. See dev.log."
fi

wait $ELECTRON_PID
if [[ $? -eq 0 ]]; then
	print "$EMOJI_DONE Electron app exited successfully."
else
	print "$EMOJI_ERROR Electron app exited with error. See electron.log."
fi
