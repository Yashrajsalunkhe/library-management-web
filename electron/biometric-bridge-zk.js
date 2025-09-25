const BiometricZKLibService = require('./biometric-zklib');
const EventEmitter = require('events');
require('dotenv').config();

class BiometricBridgeZK extends EventEmitter {
    constructor() {
        super();
        
        this.biometricService = new BiometricZKLibService();
        this.eventCallbacks = [];
        this.connectionStatus = { connected: false, lastCheck: null };
        this.connectionCheckInterval = null;
        
        // Setup biometric service event handlers
        this.setupEventHandlers();
        
        console.log('BiometricBridgeZK initialized with node-zklib');
    }

    setupEventHandlers() {
        this.biometricService.on('connected', (data) => {
            console.log('Biometric device connected:', data);
            this.connectionStatus.connected = true;
            this.connectionStatus.lastCheck = new Date();
            
            this.handleBiometricEvent({
                EventType: 'device_connected',
                DeviceIP: data.deviceIP,
                DeviceInfo: data.deviceInfo,
                Timestamp: new Date().toISOString()
            });
        });

        this.biometricService.on('disconnected', () => {
            console.log('Biometric device disconnected');
            this.connectionStatus.connected = false;
            this.connectionStatus.lastCheck = new Date();
            
            this.handleBiometricEvent({
                EventType: 'device_disconnected',
                Timestamp: new Date().toISOString()
            });
        });

        this.biometricService.on('attendance', (data) => {
            console.log('New attendance record:', data);
            
            // Transform to match expected format
            const eventData = {
                EventType: 'attendance',
                UserID: data.userId,
                UserIDNum: data.userIdNum,
                RecordTime: data.recordTime,
                Timestamp: data.timestamp,
                Type: data.type,
                DeviceUserId: data.deviceUserId,
                Success: true
            };
            
            this.handleBiometricEvent(eventData);
        });

        this.biometricService.on('connectionError', (data) => {
            console.error('Biometric connection error:', data);
            this.connectionStatus.connected = false;
            this.connectionStatus.lastCheck = new Date();
            
            this.handleBiometricEvent({
                EventType: 'connection_error',
                Error: data.error,
                DeviceIP: data.deviceIP,
                Timestamp: new Date().toISOString()
            });
        });

        this.biometricService.on('scanError', (data) => {
            console.error('Biometric scan error:', data);
            
            this.handleBiometricEvent({
                EventType: 'scan_error',
                Error: data.error,
                Timestamp: new Date().toISOString()
            });
        });

        this.biometricService.on('scanStarted', (data) => {
            console.log('Biometric scanning started:', data);
            
            this.handleBiometricEvent({
                EventType: 'scan_started',
                Interval: data.interval,
                Timestamp: new Date().toISOString()
            });
        });

        this.biometricService.on('scanStopped', () => {
            console.log('Biometric scanning stopped');
            
            this.handleBiometricEvent({
                EventType: 'scan_stopped',
                Timestamp: new Date().toISOString()
            });
        });

        this.biometricService.on('logsCleared', () => {
            console.log('Biometric logs cleared');
            
            this.handleBiometricEvent({
                EventType: 'logs_cleared',
                Timestamp: new Date().toISOString()
            });
        });
    }

    // Handle biometric events from the service
    handleBiometricEvent(data) {
        console.log('Processing biometric event:', data);
        
        // Notify all registered callbacks
        this.eventCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in biometric event callback:', error);
            }
        });
        
        // Emit event for external listeners
        this.emit('biometricEvent', data);
    }

    // Register callback for biometric events
    onBiometricEvent(callback) {
        this.eventCallbacks.push(callback);
    }

    // Remove callback
    offBiometricEvent(callback) {
        const index = this.eventCallbacks.indexOf(callback);
        if (index > -1) {
            this.eventCallbacks.splice(index, 1);
        }
    }

    // Initialize the biometric system
    async initialize() {
        try {
            console.log('Initializing biometric system...');
            const success = await this.biometricService.initialize();
            
            if (success) {
                console.log('Biometric system initialized successfully');
                
                // Automatically start scanning after successful initialization
                try {
                    await this.biometricService.startScanning();
                    console.log('Biometric attendance scanning started automatically');
                } catch (scanError) {
                    console.warn('Failed to auto-start scanning:', scanError.message);
                    // Don't fail initialization if scanning fails
                }
                
                return { success: true, message: 'Biometric system initialized and scanning started' };
            } else {
                return { 
                    success: false, 
                    message: 'Failed to initialize biometric system',
                    error: 'Connection failed'
                };
            }
        } catch (error) {
            console.error('Error initializing biometric system:', error);
            return { 
                success: false, 
                message: 'Error initializing biometric system',
                error: error.message
            };
        }
    }

    // Start scanning for attendance
    async startScanning() {
        try {
            console.log('Starting biometric scanning...');
            await this.biometricService.startScanning();
            
            return { success: true, message: 'Biometric scanning started' };
        } catch (error) {
            console.error('Error starting biometric scanning:', error);
            return { 
                success: false, 
                message: 'Failed to start biometric scanning',
                error: error.message
            };
        }
    }

    // Stop scanning for attendance
    async stopScanning() {
        try {
            console.log('Stopping biometric scanning...');
            await this.biometricService.stopScanning();
            
            return { success: true, message: 'Biometric scanning stopped' };
        } catch (error) {
            console.error('Error stopping biometric scanning:', error);
            return { 
                success: false, 
                message: 'Failed to stop biometric scanning',
                error: error.message
            };
        }
    }

    // Get device information
    async getDeviceInfo() {
        try {
            const info = await this.biometricService.getDeviceInfo();
            
            return { 
                success: true, 
                data: info,
                message: 'Device information retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting device info:', error);
            return { 
                success: false, 
                message: 'Failed to get device information',
                error: error.message
            };
        }
    }

    // Get all users from device
    async getUsers() {
        try {
            const users = await this.biometricService.getUsers();
            
            return { 
                success: true, 
                data: users,
                count: users.length,
                message: `Retrieved ${users.length} users from device`
            };
        } catch (error) {
            console.error('Error getting users:', error);
            return { 
                success: false, 
                message: 'Failed to get users from device',
                error: error.message
            };
        }
    }

    // Get all attendance records from device
    async getAllAttendance() {
        try {
            const attendance = await this.biometricService.getAllAttendance();
            
            return { 
                success: true, 
                data: attendance,
                count: attendance.length,
                message: `Retrieved ${attendance.length} attendance records from device`
            };
        } catch (error) {
            console.error('Error getting attendance records:', error);
            return { 
                success: false, 
                message: 'Failed to get attendance records from device',
                error: error.message
            };
        }
    }

    // Clear attendance logs from device
    async clearAttendanceLogs() {
        try {
            await this.biometricService.clearAttendanceLogs();
            
            return { 
                success: true, 
                message: 'Attendance logs cleared successfully'
            };
        } catch (error) {
            console.error('Error clearing attendance logs:', error);
            return { 
                success: false, 
                message: 'Failed to clear attendance logs',
                error: error.message
            };
        }
    }

    // Enroll fingerprint for a user
    async enrollFingerprint(memberId) {
        try {
            console.log('Enrolling fingerprint for member:', memberId);
            const result = await this.biometricService.enrollFingerprint(memberId);
            
            return { 
                success: true, 
                data: result,
                message: result.message || 'Fingerprint enrollment initiated'
            };
        } catch (error) {
            console.error('Error enrolling fingerprint:', error);
            return { 
                success: false, 
                message: 'Failed to enroll fingerprint',
                error: error.message
            };
        }
    }

    // Delete fingerprint for a user
    async deleteFingerprint(memberId) {
        try {
            console.log('Deleting fingerprint for member:', memberId);
            const result = await this.biometricService.deleteFingerprint(memberId);
            
            return { 
                success: true, 
                data: result,
                message: result.message || 'Fingerprint deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting fingerprint:', error);
            return { 
                success: false, 
                message: 'Failed to delete fingerprint',
                error: error.message
            };
        }
    }

    // Set user on device
    async setUser(userId, name, cardNumber = 0, password = '', role = 0) {
        try {
            console.log('Setting user on device:', { userId, name });
            const result = await this.biometricService.setUser(userId, name, cardNumber, password, role);
            
            return { 
                success: true, 
                data: result,
                message: `User ${userId} set successfully on device`
            };
        } catch (error) {
            console.error('Error setting user:', error);
            return { 
                success: false, 
                message: 'Failed to set user on device',
                error: error.message
            };
        }
    }

    // Delete user from device
    async deleteUser(userId) {
        try {
            console.log('Deleting user from device:', userId);
            const result = await this.biometricService.deleteUser(userId);
            
            return { 
                success: true, 
                data: result,
                message: `User ${userId} deleted successfully from device`
            };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { 
                success: false, 
                message: 'Failed to delete user from device',
                error: error.message
            };
        }
    }

    // Test connection to biometric device
    async testConnection() {
        console.log('Testing biometric connection...');
        
        try {
            const status = this.biometricService.getStatus();
            
            if (!status.connected) {
                // Try to connect
                const initResult = await this.initialize();
                if (!initResult.success) {
                    return {
                        success: false,
                        message: 'Cannot connect to biometric device.',
                        details: initResult.error,
                        status: status
                    };
                }
            }

            // Get device info to verify connection
            const deviceInfoResult = await this.getDeviceInfo();
            if (!deviceInfoResult.success) {
                return {
                    success: false,
                    message: 'Connected to device but unable to retrieve device information.',
                    details: deviceInfoResult.error,
                    status: status
                };
            }

            return {
                success: true,
                message: 'Biometric system is ready and device connected successfully.',
                status: this.biometricService.getStatus(),
                deviceInfo: deviceInfoResult.data
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error checking device status.',
                error: error.message,
                status: this.biometricService.getStatus()
            };
        }
    }

    // Get current status
    getStatus() {
        return this.biometricService.getStatus();
    }

    // Get current connection status
    getConnectionStatus() {
        return this.connectionStatus;
    }

    // Start periodic connection monitoring
    startConnectionMonitoring(interval = 30000) {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }

        this.connectionCheckInterval = setInterval(async () => {
            const status = this.biometricService.getStatus();
            this.connectionStatus.connected = status.connected;
            this.connectionStatus.lastCheck = new Date();
            
            // Notify all callbacks about connection status change
            this.eventCallbacks.forEach(callback => {
                try {
                    callback({
                        EventType: 'connection_status',
                        Connected: status.connected,
                        LastCheck: this.connectionStatus.lastCheck,
                        Status: status,
                        Error: status.connected ? null : 'Device disconnected'
                    });
                } catch (error) {
                    console.error('Error in connection status callback:', error);
                }
            });
        }, interval);

        console.log(`Started biometric connection monitoring (interval: ${interval}ms)`);
    }

    // Stop connection monitoring
    stopConnectionMonitoring() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
            console.log('Stopped biometric connection monitoring');
        }
    }

    // Cleanup and disconnect
    async disconnect() {
        console.log('Disconnecting biometric bridge...');
        
        this.stopConnectionMonitoring();
        
        try {
            await this.biometricService.disconnect();
            console.log('Biometric bridge disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting biometric bridge:', error);
        }
    }
}

module.exports = BiometricBridgeZK;