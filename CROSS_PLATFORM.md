# Cross-Platform Setup Guide

This Library Management System now works seamlessly on both **Windows** and **Linux/macOS**!

## 🚀 Universal Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Start
```bash
# Clone and install (works on all platforms)
git clone https://github.com/Yashrajsalunkhe/library-management.git
cd library-management
npm install

# Start the application (works on all platforms)
npm start
```

That's it! The `npm start` command now automatically:
- ✅ Detects your operating system
- ✅ Starts the Vite development server
- ✅ Waits for the server to be ready
- ✅ Launches Electron with proper environment variables
- ✅ Handles port conflicts automatically

## 🔧 Platform-Specific Commands

If you prefer platform-specific commands:

### Windows
```cmd
# Batch file
npm run start:windows

# PowerShell
npm run start:powershell

# Manual
npm run dev
# Wait for server, then in new terminal:
set NODE_ENV=development && npx electron .
```

### Linux/macOS
```bash
# Shell script
npm run start:linux

# Manual
npm run dev
# Wait for server, then in new terminal:
NODE_ENV=development npx electron .
```

## 📋 Available Scripts

| Command | Description | Platform |
|---------|-------------|----------|
| `npm start` | **Universal start** (recommended) | All |
| `npm run start:windows` | Windows batch script | Windows |
| `npm run start:powershell` | PowerShell script | Windows |
| `npm run start:linux` | Shell script | Linux/macOS |
| `npm run dev` | Start only Vite dev server | All |
| `npm run electron` | Start only Electron | All |
| `npm run build` | Build for production | All |
| `npm run clean` | Clean build artifacts | All |

## 🔍 What's Under the Hood

### Cross-Platform Tools Used:
- **cross-env**: Handles environment variables consistently across platforms
- **concurrently**: Runs multiple processes simultaneously
- **Custom Node.js script**: Intelligent server detection and Electron startup

### Automatic Features:
- **Port Detection**: Automatically finds available Vite dev server port (5173, 5174, 5175, 3000)
- **Platform Detection**: Uses correct commands for Windows vs Unix systems
- **Process Management**: Graceful startup and shutdown of both processes
- **Error Handling**: Fallback mechanisms if dev server isn't ready

## 🏗️ Project Structure

```
library-management/
├── 📁 scripts/
│   ├── 📄 start.sh           # Linux/macOS shell script
│   ├── 📄 start.bat          # Windows batch script
│   ├── 📄 start.ps1          # Windows PowerShell script
│   └── 📄 wait-and-start.js  # Cross-platform Node.js script
├── 📁 config/
│   └── 📄 vite.config.mjs    # Vite configuration (ES modules)
├── 📁 electron/              # Electron backend
├── 📁 src/                   # React frontend
└── 📄 package.json           # Cross-platform scripts
```

## 🐛 Troubleshooting

### All Platforms
- **Port conflicts**: The system automatically tries multiple ports
- **Dependencies**: Run `npm install` if you see module errors
- **Clean install**: `npm run clean && npm install`

### Windows Specific
- **PowerShell execution policy**: The scripts use `-ExecutionPolicy Bypass`
- **Path issues**: Use `npm run start:windows` for batch file alternative

### Linux/macOS Specific
- **Permission denied**: The script automatically sets executable permissions
- **Shell compatibility**: Uses `/bin/bash` instead of platform-specific shells

## 📊 Development Workflow

1. **Start development**: `npm start`
2. **Frontend changes**: Auto-reload via Vite HMR
3. **Backend changes**: Restart with `Ctrl+C` then `npm start`
4. **Database**: SQLite file created automatically in `electron/library.db`
5. **DevTools**: Opens automatically in development mode

## 🎯 Production Build

```bash
# Build React frontend
npm run build

# Package Electron app
npm run electron:build

# Or build everything
npm run dist
```

The production build creates platform-specific distributables in the `dist-electron` folder.

---

**Need help?** Check the platform-specific guides:
- Windows: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
- Main README: [README.md](README.md)
