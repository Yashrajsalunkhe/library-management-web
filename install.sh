#!/bin/bash

# Library Management System - Installation Script
# This script installs all dependencies and sets up the application

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Library Management System - Installation                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking system requirements...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Please install Node.js (v18 or higher) from: https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version is too old (v$NODE_VERSION)${NC}"
    echo -e "${YELLOW}Please upgrade to Node.js v18 or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
echo -e "${CYAN}This may take a few minutes...${NC}"
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Dependencies installed successfully!${NC}"
else
    echo ""
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    echo -e "${YELLOW}Please check your internet connection and try again${NC}"
    exit 1
fi

# Rebuild native modules
echo ""
echo -e "${BLUE}Building native modules for Electron...${NC}"
npm run rebuild

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Native modules built successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Native module rebuild had issues${NC}"
    echo -e "${YELLOW}The application may still work, but if you encounter errors, please run:${NC}"
    echo -e "${YELLOW}npm run rebuild${NC}"
fi

# Create necessary directories
echo ""
echo -e "${BLUE}Creating necessary directories...${NC}"

mkdir -p exports/receipts
mkdir -p backups

echo -e "${GREEN}✓ Directories created${NC}"

# Check database
if [ ! -f "electron/library.db" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Database file not found${NC}"
    echo -e "${YELLOW}It will be created automatically when you first run the application${NC}"
else
    echo ""
    echo -e "${GREEN}✓ Database file found${NC}"
fi

# Installation complete
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              INSTALLATION COMPLETED!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ All dependencies installed${NC}"
echo -e "${GREEN}✓ Application is ready to use${NC}"
echo ""
echo -e "${CYAN}To start the application, run:${NC}"
echo -e "${GREEN}  ./run.sh${NC}"
echo ""
echo -e "${CYAN}Or on Windows:${NC}"
echo -e "${GREEN}  run.bat${NC}"
echo ""
echo -e "${YELLOW}Default Login Credentials:${NC}"
echo -e "  Username: ${GREEN}admin${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${RED}⚠ Important: Change the default password after first login!${NC}"
echo ""
