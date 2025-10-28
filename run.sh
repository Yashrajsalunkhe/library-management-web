#!/bin/bash

# Library Management System - Start Script
# This script starts the application

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Library Management System - Starting...                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}✗ Dependencies not installed!${NC}"
    echo ""
    echo -e "${YELLOW}Please run the installation script first:${NC}"
    echo -e "${GREEN}  ./install.sh${NC}"
    echo ""
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Please install Node.js (v18 or higher) from: https://nodejs.org${NC}"
    exit 1
fi

echo -e "${BLUE}Starting development server...${NC}"
echo -e "${CYAN}Please wait, this may take a few seconds...${NC}"
echo ""

# Check if port 5173 is in use
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 5173 is already in use${NC}"
    echo -e "${YELLOW}Attempting to kill existing process...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start the application
echo -e "${GREEN}Starting Library Management System...${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Application will open in a new window${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Default Login:${NC}"
echo -e "  Username: ${GREEN}admin${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${CYAN}Press ${RED}Ctrl+C${CYAN} to stop the application${NC}"
echo ""

# Start the application
npm start
