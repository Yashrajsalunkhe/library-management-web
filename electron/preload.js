const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Authentication
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    requestPasswordChangeOTP: (data) => ipcRenderer.invoke('auth:request-password-change-otp', data),
    changePassword: (data) => ipcRenderer.invoke('auth:change-password', data)
  },

  // Members
  member: {
    add: (member) => ipcRenderer.invoke('member:add', member),
    list: (filters) => ipcRenderer.invoke('member:list', filters),
    get: (id) => ipcRenderer.invoke('member:get', id),
    update: (member) => ipcRenderer.invoke('member:update', member),
    delete: (id) => ipcRenderer.invoke('member:delete', id),
    permanentDelete: (id) => ipcRenderer.invoke('member:permanentDelete', id),
    renew: (renewal) => ipcRenderer.invoke('member:renew', renewal),
    getNextSeatNumber: () => ipcRenderer.invoke('member:getNextSeatNumber'),
    validateSeatNumber: (data) => ipcRenderer.invoke('member:validateSeatNumber', data),
    getSeatStats: () => ipcRenderer.invoke('member:getSeatStats')
  },

  // Membership Plans
  plan: {
    list: () => ipcRenderer.invoke('plan:list'),
    add: (plan) => ipcRenderer.invoke('plan:add', plan),
    update: (planId, plan) => ipcRenderer.invoke('plan:update', planId, plan),
    delete: (planId) => ipcRenderer.invoke('plan:delete', planId)
  },

  // Payments
  payment: {
    add: (payment) => ipcRenderer.invoke('payment:add', payment),
    list: (filters) => ipcRenderer.invoke('payment:list', filters)
  },

  // Expenditures
  expenditure: {
    add: (expenditure) => ipcRenderer.invoke('expenditure:add', expenditure),
    list: (filters) => ipcRenderer.invoke('expenditure:list', filters),
    get: (id) => ipcRenderer.invoke('expenditure:get', id),
    update: (expenditure) => ipcRenderer.invoke('expenditure:update', expenditure),
    delete: (id) => ipcRenderer.invoke('expenditure:delete', id),
    stats: (filters) => ipcRenderer.invoke('expenditure:stats', filters)
  },

  // Attendance
  attendance: {
    checkin: (data) => ipcRenderer.invoke('attendance:checkin', data),
    checkout: (data) => ipcRenderer.invoke('attendance:checkout', data),
    list: (filters) => ipcRenderer.invoke('attendance:list', filters),
    today: () => ipcRenderer.invoke('attendance:today'),
    add: (attendance) => ipcRenderer.invoke('attendance:add', attendance)
  },

  // Dashboard
  dashboard: {
    stats: () => ipcRenderer.invoke('dashboard:stats')
  },

  // Reports
  report: {
    attendance: (filters) => ipcRenderer.invoke('report:attendance', filters),
    payments: (filters) => ipcRenderer.invoke('report:payments', filters),
    expenditures: (filters) => ipcRenderer.invoke('report:expenditures', filters),
    export: (options) => ipcRenderer.invoke('report:export', options),
    exportWithDialog: (options) => ipcRenderer.invoke('report:export-with-dialog', options),
    exportAttendance: (options) => ipcRenderer.invoke('report:export-attendance', options),
    exportPayments: (options) => ipcRenderer.invoke('report:export-payments', options),
    exportMembers: (options) => ipcRenderer.invoke('report:export-members', options),
    generateReceipt: (options) => ipcRenderer.invoke('report:generate-receipt', options),
    downloadReceipt: (options) => ipcRenderer.invoke('report:download-receipt', options)
  },

  // Notifications
  notification: {
    sendExpiryReminders: () => ipcRenderer.invoke('notification:send-expiry-reminders'),
    sendWelcome: (memberData) => ipcRenderer.invoke('notification:send-welcome', memberData)
  },

  // Biometric
  biometric: {
    status: () => ipcRenderer.invoke('biometric:status'),
    startScan: () => ipcRenderer.invoke('biometric:start-scan'),
    stopScan: () => ipcRenderer.invoke('biometric:stop-scan'),
    enroll: (data) => ipcRenderer.invoke('biometric:enroll', data),
    delete: (data) => ipcRenderer.invoke('biometric:delete', data),
    onEvent: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('biometric-event', wrappedCallback);
      
      // Return cleanup function
      return () => ipcRenderer.removeListener('biometric-event', wrappedCallback);
    }
  },

  // Scheduler
  scheduler: {
    status: () => ipcRenderer.invoke('scheduler:status'),
    backup: () => ipcRenderer.invoke('scheduler:backup')
  },

  // Settings
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:getSettings'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:saveSettings', settings)
  },

  // Environment Variables
  env: {
    getVariables: () => ipcRenderer.invoke('env:getVariables'),
    updateVariables: (envVars) => ipcRenderer.invoke('env:updateVariables', envVars)
  },

  // Backup
  backup: {
    createBackup: () => ipcRenderer.invoke('backup:createBackup'),
    restoreBackup: () => ipcRenderer.invoke('backup:restoreBackup'),
    listBackups: () => ipcRenderer.invoke('backup:listBackups'),
    restoreSpecificBackup: (backupPath) => ipcRenderer.invoke('backup:restoreSpecificBackup', backupPath),
    deleteBackup: (backupPath) => ipcRenderer.invoke('backup:deleteBackup', backupPath)
  },

  // Data
  data: {
    exportData: () => ipcRenderer.invoke('data:exportData')
  },

  // Biometric
  biometric: {
    getStatus: () => ipcRenderer.invoke('biometric:get-status'),
    startScanning: () => ipcRenderer.invoke('biometric:start-scanning'),
    stopScanning: () => ipcRenderer.invoke('biometric:stop-scanning'),
    enrollFingerprint: (memberId) => ipcRenderer.invoke('biometric:enroll-fingerprint', memberId),
    deleteFingerprint: (memberId) => ipcRenderer.invoke('biometric:delete-fingerprint', memberId),
    getDeviceInfo: () => ipcRenderer.invoke('biometric:get-device-info'),
    testConnection: () => ipcRenderer.invoke('biometric:test-connection'),
    getConnectionStatus: () => ipcRenderer.invoke('biometric:get-connection-status'),
    
    // Event listeners for real-time updates
    onEvent: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('biometric-event', wrappedCallback);
      return () => ipcRenderer.removeListener('biometric-event', wrappedCallback);
    },
    
    onAttendanceRecorded: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('attendance-recorded', wrappedCallback);
      return () => ipcRenderer.removeListener('attendance-recorded', wrappedCallback);
    },

    onConnectionStatus: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('biometric-connection-status', wrappedCallback);
      return () => ipcRenderer.removeListener('biometric-connection-status', wrappedCallback);
    },

    onAccessDenied: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('biometric-access-denied', wrappedCallback);
      return () => ipcRenderer.removeListener('biometric-access-denied', wrappedCallback);
    },

    onError: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('biometric-error', wrappedCallback);
      return () => ipcRenderer.removeListener('biometric-error', wrappedCallback);
    },

    onInfo: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('biometric-info', wrappedCallback);
      return () => ipcRenderer.removeListener('biometric-info', wrappedCallback);
    }
  },

  // App
  app: {
    restart: () => ipcRenderer.invoke('app:restart')
  },

  // File operations
  file: {
    openPath: (path) => ipcRenderer.invoke('file:open-path', path),
    showInFolder: (path) => ipcRenderer.invoke('file:show-in-folder', path)
  },

  // Menu events
  menu: {
    onAction: (callback) => {
      const wrappedCallback = (event, action) => callback(action);
      ipcRenderer.on('menu-action', wrappedCallback);
      
      // Return cleanup function
      return () => ipcRenderer.removeListener('menu-action', wrappedCallback);
    }
  },

  // System info
  system: {
    platform: process.platform,
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux'
  }
});

// Legacy API for backward compatibility (if needed)
contextBridge.exposeInMainWorld('electronAPI', {
  addBook: (book) => ipcRenderer.invoke('add-book', book),
  getBooks: () => ipcRenderer.invoke('get-books')
});
