const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { format } = require('date-fns');
const isDev = process.env.NODE_ENV === 'development';

// Import services
const { db, query, get, run, transaction } = require('./db');
const ipcHandlers = require('./ipcHandlers');
const NotificationService = require('./notifier');
const SchedulerService = require('./scheduler');
const BiometricBridgeZK = require('./biometric-bridge-zk');
const reports = require('./reports');

// Helper function to check if current time is within operating hours
const isTimeWithinOperatingHours = (currentTime, operatingHours) => {
  if (!operatingHours || !currentTime) return true;

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentMinutes = timeToMinutes(currentTime);
  
  // Check day shift
  const dayOpenMinutes = timeToMinutes(operatingHours.dayShift.openTime);
  const dayCloseMinutes = timeToMinutes(operatingHours.dayShift.closeTime);
  
  if (dayOpenMinutes <= dayCloseMinutes) {
    // Normal day shift (e.g., 8:00 to 18:00)
    if (currentMinutes >= dayOpenMinutes && currentMinutes <= dayCloseMinutes) {
      return true;
    }
  } else {
    // Overnight day shift (e.g., 22:00 to 06:00)
    if (currentMinutes >= dayOpenMinutes || currentMinutes <= dayCloseMinutes) {
      return true;
    }
  }

  // Check night shift if enabled
  if (operatingHours.enableNightShift) {
    const nightOpenMinutes = timeToMinutes(operatingHours.nightShift.openTime);
    const nightCloseMinutes = timeToMinutes(operatingHours.nightShift.closeTime);
    
    if (nightOpenMinutes <= nightCloseMinutes) {
      // Normal night shift
      if (currentMinutes >= nightOpenMinutes && currentMinutes <= nightCloseMinutes) {
        return true;
      }
    } else {
      // Overnight night shift
      if (currentMinutes >= nightOpenMinutes || currentMinutes <= nightCloseMinutes) {
        return true;
      }
    }
  }

  return false;
};

// Initialize services
let mainWindow;
let notifier;
let scheduler;
let biometricBridge;

// Export getter for biometric bridge to be used by IPC handlers
const getBiometricBridge = () => biometricBridge;
module.exports = { getBiometricBridge };

// Auto-record attendance from biometric verification
const autoRecordAttendance = async (memberId, biometricEvent) => {
  try {
    console.log(`autoRecordAttendance called with memberId: ${memberId}, type: ${typeof memberId}`);
    console.log('biometricEvent:', biometricEvent);
    
    // Check if member exists and is active
    const member = await get(`
      SELECT m.id, m.name, m.status, m.end_date, mp.name as plan_name
      FROM members m
      LEFT JOIN membership_plans mp ON m.plan_id = mp.id
      WHERE m.id = ? 
    `, [memberId]);

    if (!member) {
      console.warn(`Member ${memberId} not found, skipping attendance`);
      // Send notification to UI about unknown member
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('biometric-error', {
          type: 'member_not_found',
          message: `Member ID ${memberId} not found in system`,
          memberId
        });
      }
      return;
    }

    // Check member status and expiry
    const currentDate = new Date();
    const endDate = new Date(member.end_date);
    const isExpired = endDate < currentDate;

    if (member.status !== 'active' || isExpired) {
      const reason = member.status !== 'active' ? 
        `Member status is ${member.status}` : 
        `Membership expired on ${format(endDate, 'yyyy-MM-dd')}`;
        
      console.warn(`Access denied for member ${member.name} (ID: ${memberId}): ${reason}`);
      
      // Send access denied notification to UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('biometric-access-denied', {
          memberId,
          memberName: member.name,
          reason,
          status: member.status,
          endDate: member.end_date,
          planName: member.plan_name
        });
      }
      return;
    }

    // Check operating hours for biometric access
    const currentTime = format(currentDate, 'HH:mm');
    const operatingHoursSettings = query('SELECT value FROM settings WHERE key = ?', ['general.operatingHours']);
    let operatingHours = null;

    if (operatingHoursSettings.length > 0) {
      try {
        operatingHours = JSON.parse(operatingHoursSettings[0].value);
      } catch (error) {
        console.log('Could not parse operating hours settings');
      }
    }

    // Validate operating hours for biometric access (always check, unlike manual entry)
    if (operatingHours) {
      const isWithinHours = isTimeWithinOperatingHours(currentTime, operatingHours);
      if (!isWithinHours) {
        console.warn(`Access denied for member ${member.name} (ID: ${memberId}): Outside operating hours`);
        
        // Send access denied notification to UI
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('biometric-access-denied', {
            memberId,
            memberName: member.name,
            reason: 'Access denied outside operating hours',
            status: member.status,
            endDate: member.end_date,
            planName: member.plan_name,
            currentTime: currentTime
          });
        }
        return;
      }
    }

    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
    const currentTimeStr = format(currentDate, 'HH:mm:ss');

    // Check if attendance already recorded today
    const existingAttendance = await get(`
      SELECT id, check_in, check_out 
      FROM attendance 
      WHERE member_id = ? AND date(check_in) = ?
    `, [memberId, currentDateStr]);

    let attendanceId;
    let action;

    if (!existingAttendance) {
      // First scan of the day - record check-in
      const result = await run(`
        INSERT INTO attendance (member_id, check_in, source)
        VALUES (?, CURRENT_TIMESTAMP, 'biometric')
      `, [memberId]);
      
      attendanceId = result.lastID;
      action = 'check-in';
      
      console.log(`Auto-recorded check-in for member ${member.name} (ID: ${memberId})`);
    } else if (existingAttendance.check_out === null) {
      // Already checked in today, record check-out
      await run(`
        UPDATE attendance 
        SET check_out = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [existingAttendance.id]);
      
      attendanceId = existingAttendance.id;
      action = 'check-out';
      
      console.log(`Auto-recorded check-out for member ${member.name} (ID: ${memberId})`);
    } else {
      // Already completed attendance for today
      console.log(`Attendance already completed for member ${member.name} (ID: ${memberId}) today`);
      
      // Send notification about completed attendance
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('biometric-info', {
          type: 'attendance_complete',
          message: `${member.name} has already completed attendance for today`,
          memberId,
          memberName: member.name
        });
      }
      return;
    }

    // Send success notification to UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('attendance-recorded', {
        memberId,
        memberName: member.name,
        action,
        time: currentTimeStr,
        date: currentDateStr,
        attendanceId,
        source: 'biometric',
        memberStatus: member.status,
        planName: member.plan_name
      });
    }

  } catch (error) {
    console.error('Error in auto-record attendance:', error);
    
    // Send error notification to UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('biometric-error', {
        type: 'attendance_error',
        message: 'Failed to record attendance: ' + error.message,
        memberId
      });
    }
  }
};

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

    console.log('Initializing biometric bridge...');
    biometricBridge = new BiometricBridgeZK();
    
    // Initialize the biometric system
    try {
      await biometricBridge.initialize();
      console.log('Biometric system initialized successfully');
    } catch (error) {
      console.warn('Biometric initialization failed:', error.message);
    }
    
    // Set up biometric event handler for real-time attendance
    biometricBridge.onBiometricEvent(async (eventData) => {
      console.log('Processing biometric event:', eventData);
      
      // Send event to renderer process for real-time UI updates
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('biometric-event', eventData);
      }
      
      // Handle connection status events
      if (eventData.EventType === 'connection_status') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('biometric-connection-status', {
            connected: eventData.Connected,
            lastCheck: eventData.LastCheck,
            error: eventData.Error
          });
        }
        return;
      }
      
      // Auto-record attendance if this is a successful attendance scan
      if (eventData.EventType === 'attendance' && eventData.UserID) {
        try {
          await autoRecordAttendance(eventData.UserID, eventData);
        } catch (error) {
          console.error('Error auto-recording attendance:', error);
        }
      }
      
      // Handle verification events for backward compatibility
      if (eventData.EventType === 'verification' && eventData.Success && eventData.MemberId) {
        try {
          await autoRecordAttendance(eventData.MemberId, eventData);
        } catch (error) {
          console.error('Error auto-recording attendance:', error);
        }
      }
    });

    // Start connection monitoring every 30 seconds
    biometricBridge.startConnectionMonitoring(30000);
    
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
  
  if (biometricBridge) {
    biometricBridge.stopEventServer();
    biometricBridge.stopConnectionMonitoring();
    console.log('Biometric bridge cleaned up');
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
