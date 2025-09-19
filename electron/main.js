const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Import services
const { db, query, get, run, transaction } = require('./db');
const ipcHandlers = require('./ipcHandlers');
const NotificationService = require('./notifier');
const SchedulerService = require('./scheduler');
const reports = require('./reports');

// Initialize services
let mainWindow;
let notifier;
let scheduler;

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: true, // Show window immediately
    center: true, // Center the window
    resizable: true,
    minimizable: true,
    maximizable: true,
    title: 'Library Management System'
  });

  console.log('Window created, showing...');

  // Create application menu
  createMenu(mainWindow);

  // Register IPC handlers
  registerIpcHandlers();

  // Initialize all services
  try {
    console.log('Database initialized successfully');
    
    console.log('Initializing notifier...');
    notifier = new NotificationService();
    
    console.log('Starting scheduler...');
    scheduler = new SchedulerService();
    scheduler.start();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
  }

  // Load the app
  if (isDev) {
    // Try multiple ports for dev server
    const ports = [5173, 5174, 5175, 3000];
    let loaded = false;
    
    for (const port of ports) {
      try {
        console.log(`Loading from development server: http://localhost:${port}/`);
        await mainWindow.loadURL(`http://localhost:${port}/`);
        console.log(`Successfully loaded from development server on port ${port}`);
        loaded = true;
        break;
      } catch (error) {
        console.log(`Failed to load from port ${port}, trying next...`);
      }
    }
    
    if (!loaded) {
      console.error('Failed to load from any development server port');
      // Try to load a fallback page
      mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading from file:', path.join(__dirname, '../dist/index.html'));
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Add keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
    }
    if (input.control && input.key.toLowerCase() === 'r') {
      mainWindow.webContents.reload();
    }
  });

  // Ensure window is visible and focused
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show, making visible...');
    mainWindow.show();
    mainWindow.focus();
  });

  // Force show window after a delay
  setTimeout(() => {
    console.log('Forcing window to show...');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true);
      setTimeout(() => mainWindow.setAlwaysOnTop(false), 1000);
    }
  }, 2000);

  return mainWindow;
};

function createMenu(mainWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Member',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-member');
          }
        },
        { type: 'separator' },
        {
          label: 'Backup Database',
          click: async () => {
            try {
              const result = await reports.backupDatabase();
              if (result.success) {
                shell.showItemInFolder(result.filePath);
              }
            } catch (error) {
              console.error('Backup failed:', error);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate', 'dashboard');
          }
        },
        {
          label: 'Members',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate', 'members');
          }
        },
        {
          label: 'Attendance',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate', 'attendance');
          }
        },
        {
          label: 'Payments',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate', 'payments');
          }
        },
        {
          label: 'Reports',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate', 'reports');
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Send Test Notification',
          click: async () => {
            try {
              await notifier.sendEmail(
                'test@example.com',
                'Test Notification',
                'This is a test email from the Library Management System.'
              );
              console.log('Test email sent');
            } catch (error) {
              console.error('Failed to send test email:', error);
            }
          }
        },
        {
          label: 'Generate Sample Report',
          click: async () => {
            try {
              const result = await reports.generateAttendanceReport();
              if (result.success) {
                shell.showItemInFolder(result.filePath);
              }
            } catch (error) {
              console.error('Report generation failed:', error);
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registerIpcHandlers() {
  // Register all IPC handlers from the main handlers file
  ipcHandlers(ipcMain);

  // Additional service handlers
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });

  ipcMain.handle('notification:send-email', async (event, to, subject, text) => {
    try {
      await notifier.sendEmail(to, subject, text);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reports:backup-database', async () => {
    try {
      const result = await reports.backupDatabase();
      shell.showItemInFolder(result.filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

// App event handlers
app.whenReady().then(async () => {
  await createWindow();
  
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup services
  if (scheduler) {
    scheduler.stop();
  }

  // Kill Vite/React dev server if PID file exists
  const fs = require('fs');
  const path = require('path');
  const pidFile = path.join(__dirname, '../dev.pid');
  if (fs.existsSync(pidFile)) {
    const devPid = parseInt(fs.readFileSync(pidFile, 'utf8'));
    if (!isNaN(devPid)) {
      try {
        process.kill(devPid);
        console.log(`Killed dev server (PID: ${devPid})`);
      } catch (err) {
        console.error(`Failed to kill dev server:`, err);
      }
    }
    fs.unlinkSync(pidFile);
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup services
  if (scheduler) {
    scheduler.stop();
  }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});
