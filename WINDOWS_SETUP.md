# Windows Setup Guide for Library Management System

## Quick Start

The project has been optimized for Windows. You can now start it using any of these methods:

### Method 1: Using npm start (Recommended)
```cmd
npm start
```

### Method 2: Using PowerShell script
```powershell
npm run start:powershell
```

### Method 3: Manual start (for troubleshooting)
1. Open two terminals
2. In terminal 1: `npm run dev`
3. Wait for "ready in X ms" message
4. In terminal 2: `$env:NODE_ENV = "development"; npx electron .`

## What was fixed for Windows

1. **Vite Configuration**: Changed from ES modules import/export to use .mjs extension
2. **Environment Variables**: Fixed NODE_ENV setting for Windows PowerShell
3. **Script Commands**: Updated package.json scripts to use Windows-compatible commands
4. **Start Scripts**: Created Windows batch (.bat) and PowerShell (.ps1) scripts

## Requirements

- Node.js (v16 or higher)
- npm
- Windows 10/11

## Installation

1. Clone the repository
2. Install dependencies:
```cmd
npm install
```

3. Start the application:
```cmd
npm start
```

## Development

- **Frontend**: React + Vite (runs on http://localhost:5173)
- **Backend**: Electron + SQLite
- **Development**: Both servers start automatically with `npm start`

## Troubleshooting

### If the app doesn't start:
1. Ensure Node.js is installed: `node --version`
2. Clear cache: `npm run clean`
3. Reinstall dependencies: `npm install`
4. Try manual start method above

### If you see "Module not found" errors:
```cmd
npm install
npm run rebuild
```

### If database errors occur:
The SQLite database is created automatically in `electron/library.db`. If there are permission issues, try running as administrator.

### Cache permission errors:
These are warnings and don't affect functionality. The app will still work normally.

## Project Structure

```
├── electron/           # Electron main process
│   ├── main.js        # Main Electron entry point
│   ├── db.js          # Database setup
│   └── library.db     # SQLite database
├── src/               # React frontend
├── config/            # Vite configuration
├── scripts/           # Windows start scripts
└── package.json       # Project configuration
```

## Scripts Available

- `npm start` - Start the application (Windows batch)
- `npm run start:powershell` - Start with PowerShell script  
- `npm run start:linux` - Linux/macOS start script
- `npm run dev` - Start only the frontend dev server
- `npm run electron` - Start only Electron
- `npm run build` - Build for production
- `npm run clean` - Clean cache and build files
