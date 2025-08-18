# Development Guide

## Project Structure

```
library-management/
├── src/                    # React frontend source code
│   ├── components/         # Reusable React components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Main application pages
│   └── styles/            # CSS and styling files
├── electron/              # Electron main process and backend
│   ├── main.js           # Electron main process
│   ├── preload.js        # Preload script for IPC
│   ├── db.js             # Database operations
│   ├── ipcHandlers.js    # IPC message handlers
│   ├── notifier.js       # Notification service
│   ├── scheduler.js      # Task scheduler
│   ├── reports.js        # Report generation
│   └── library.db        # SQLite database
├── biometric-helper/      # C# biometric integration helper
├── scripts/              # Build and utility scripts
│   ├── start.sh         # Development startup script
│   ├── build.sh         # Production build script
│   ├── setup.sh         # Environment setup script
│   └── db.sh            # Database management script
├── config/               # Configuration files
│   └── vite.config.js   # Vite configuration
├── backups/              # Database backups
├── exports/              # Generated reports and exports
├── docs/                 # Documentation
└── dist/                 # Built frontend files
```

## Getting Started

1. **Setup Environment**
   ```bash
   ./scripts/setup.sh
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development**
   ```bash
   npm run start
   ```

## Available Scripts

- `npm run start` - Start both Vite dev server and Electron
- `npm run dev` - Start only Vite dev server
- `npm run electron` - Start only Electron
- `npm run build` - Build for production
- `npm run clean` - Clean build artifacts

## Database Management

Use the database script for common operations:

```bash
# Create backup
./scripts/db.sh backup

# Restore from backup
./scripts/db.sh restore ./backups/library-backup-2025-08-16.db

# Check database status
./scripts/db.sh status

# Run migrations
./scripts/db.sh migrate

# Clean temporary files
./scripts/db.sh clean
```

## Development Workflow

1. **Frontend Development**: Edit files in `src/` directory
2. **Backend Development**: Edit files in `electron/` directory
3. **Database Changes**: Update schema in `electron/db.js` and run migrations
4. **Testing**: Use the development server to test changes
5. **Building**: Use `./scripts/build.sh` for production builds

## Biometric Integration

The biometric helper is a C# application that interfaces with fingerprint devices:

1. **Build the helper**:
   ```bash
   cd biometric-helper
   dotnet build
   ```

2. **Configure in .env**:
   ```
   BIOMETRIC_HELPER_PATH=./biometric-helper/bin/Debug/net6.0/BiometricHelper.exe
   ```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in `config/vite.config.js`
2. **Database locked**: Run `./scripts/db.sh clean`
3. **Dependencies issues**: Delete `node_modules` and run `npm install`
4. **Electron not starting**: Check if dev server is running first

### Logs

- Development logs: Check console in Electron DevTools
- Build logs: Check terminal output during build process
- Database logs: Enable SQLite logging in `electron/db.js`
