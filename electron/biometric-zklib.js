const ZKLib = require('node-zklib');
const EventEmitter = require('events');
require('dotenv').config();

class BiometricZKLibService extends EventEmitter {
    constructor() {
        super();
        
        // Configuration from environment or defaults
        this.deviceIP = process.env.BIOMETRIC_DEVICE_IP || '172.16.85.85';
        this.port = parseInt(process.env.BIOMETRIC_DEVICE_PORT || '4370');
        this.timeout = parseInt(process.env.BIOMETRIC_TIMEOUT || '5000');
        this.internalTimeout = parseInt(process.env.BIOMETRIC_INTERNAL_TIMEOUT || '10000');
        this.pollInterval = parseInt(process.env.BIOMETRIC_POLL_INTERVAL || '5000');
        
        this.zk = null;
        this.isConnected = false;
        this.isScanning = false;
        this.pollIntervalId = null;
        this.lastAttendanceCount = 0;
        this.connectionRetryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
        
        console.log(`BiometricZKLibService configured: IP=${this.deviceIP}, Port=${this.port}`);
    }

    async initialize() {
        try {
            this.zk = new ZKLib(this.deviceIP, this.port, this.timeout, this.internalTimeout);
            
            console.log(`Attempting to connect to biometric device at ${this.deviceIP}:${this.port}...`);
            
            await this.zk.createSocket();
            console.log('Socket created successfully');
            
            // Test the connection by getting device info
            const deviceInfo = await this.zk.getInfo();
            console.log('Device info:', deviceInfo);
            
            this.isConnected = true;
            this.connectionRetryCount = 0;
            
            console.log('Successfully connected to biometric device!');
            this.emit('connected', { deviceIP: this.deviceIP, deviceInfo });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize biometric device:', error.message);
            this.isConnected = false;
            this.emit('connectionError', { error: error.message, deviceIP: this.deviceIP });
            
            // Schedule retry if not exceeded max retries
            if (this.connectionRetryCount < this.maxRetries) {
                this.connectionRetryCount++;
                console.log(`Retrying connection in ${this.retryDelay/1000} seconds... (${this.connectionRetryCount}/${this.maxRetries})`);
                setTimeout(() => this.initialize(), this.retryDelay);
            }
            
            return false;
        }
    }

    async startScanning() {
        if (!this.isConnected) {
            console.log('Device not connected. Attempting to connect...');
            const connected = await this.initialize();
            if (!connected) {
                throw new Error('Cannot start scanning: Device not connected');
            }
        }

        if (this.isScanning) {
            console.log('Already scanning for attendance...');
            return;
        }

        try {
            console.log('Starting attendance scanning...');
            
            // Disable device to prevent interference during scanning
            await this.zk.disableDevice();
            
            // Get initial attendance count from device info (more reliable)
            const deviceInfo = await this.zk.getInfo();
            this.lastAttendanceCount = deviceInfo.logCounts;
            console.log(`Initial attendance records: ${this.lastAttendanceCount}`);
            
            // If there are records, try to get them for validation
            if (this.lastAttendanceCount > 0) {
                try {
                    const initialAttendances = await this.zk.getAttendances();
                    if (initialAttendances && initialAttendances.data) {
                        this.lastAttendanceCount = initialAttendances.data.length;
                        console.log(`Validated attendance count: ${this.lastAttendanceCount}`);
                    }
                } catch (error) {
                    console.warn('Could not read initial attendance records, using device count:', error.message);
                }
            }
            
            // Enable device after getting initial data
            await this.zk.enableDevice();
            
            this.isScanning = true;
            
            // Start polling for new attendance records
            this.pollIntervalId = setInterval(async () => {
                try {
                    await this.pollAttendance();
                } catch (error) {
                    console.error('Error during attendance polling:', error);
                    this.emit('scanError', { error: error.message });
                    
                    // If connection error, try to reconnect
                    if (error.message.includes('socket') || error.message.includes('timeout')) {
                        this.isConnected = false;
                        this.stopScanning();
                        setTimeout(() => this.initialize(), 2000);
                    }
                }
            }, this.pollInterval);
            
            console.log(`Started scanning with ${this.pollInterval/1000}s interval`);
            this.emit('scanStarted', { interval: this.pollInterval });
            
        } catch (error) {
            console.error('Failed to start scanning:', error);
            this.isScanning = false;
            throw error;
        }
    }

    async pollAttendance() {
        if (!this.isConnected || !this.zk) {
            return;
        }

        try {
            // Temporarily disable device for data retrieval
            await this.zk.disableDevice();
            
            // Check if there are any attendance records first
            const deviceInfo = await this.zk.getInfo();
            const currentLogCount = deviceInfo.logCounts;
            
            if (currentLogCount === 0) {
                // No records on device
                this.lastAttendanceCount = 0;
                await this.zk.enableDevice();
                return;
            }
            
            if (currentLogCount > this.lastAttendanceCount) {
                console.log(`Found new attendance records: ${currentLogCount} (was ${this.lastAttendanceCount})`);
                
                try {
                    const attendances = await this.zk.getAttendances();
                    
                    if (attendances && attendances.data && attendances.data.length > this.lastAttendanceCount) {
                        const newRecords = attendances.data.slice(this.lastAttendanceCount);
                        
                        console.log(`Processing ${newRecords.length} new attendance record(s)`);
                        
                        for (const record of newRecords) {
                            const attendanceData = {
                                userId: record.deviceUserId,
                                userIdNum: record.deviceUserId,
                                recordTime: record.recordTime,
                                timestamp: record.recordTime,
                                deviceUserId: record.deviceUserId,
                                type: this.getAttendanceType(record.recordTime),
                                raw: record
                            };
                            
                            console.log(`New attendance - UserID: ${attendanceData.userId}, Time: ${attendanceData.recordTime}, Type: ${attendanceData.type}`);
                            console.log('Raw biometric data:', record);
                            
                            // Emit event for each new attendance record
                            this.emit('attendance', attendanceData);
                        }
                        
                        this.lastAttendanceCount = attendances.data.length;
                    } else {
                        // Update count based on device info
                        this.lastAttendanceCount = currentLogCount;
                    }
                } catch (attendanceError) {
                    console.warn('Error reading attendance data, updating count from device info:', attendanceError.message);
                    this.lastAttendanceCount = currentLogCount;
                }
            }
            
            // Re-enable device
            await this.zk.enableDevice();
            
        } catch (error) {
            console.warn('Polling error (may be normal if no records):', error.message);
            
            // Re-enable device even if error occurred
            try {
                if (this.zk) {
                    await this.zk.enableDevice();
                }
            } catch (enableError) {
                console.error('Failed to re-enable device after error:', enableError);
            }
        }
    }

    getAttendanceType(recordTime) {
        const hour = new Date(recordTime).getHours();
        
        // Simple logic: morning (before 12) = check-in, afternoon/evening = check-out
        // You can customize this logic based on your requirements
        if (hour < 12) {
            return 'check-in';
        } else {
            return 'check-out';
        }
    }

    async stopScanning() {
        if (!this.isScanning) {
            return;
        }

        console.log('Stopping attendance scanning...');
        
        this.isScanning = false;
        
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = null;
        }
        
        try {
            if (this.zk) {
                await this.zk.enableDevice(); // Ensure device is enabled when we stop
            }
        } catch (error) {
            console.error('Error enabling device during stop:', error);
        }
        
        console.log('Attendance scanning stopped');
        this.emit('scanStopped');
    }

    async getUsers() {
        if (!this.isConnected || !this.zk) {
            throw new Error('Device not connected');
        }

        try {
            await this.zk.disableDevice();
            
            // Check if there are any users first
            const deviceInfo = await this.zk.getInfo();
            console.log(`Device has ${deviceInfo.userCounts} users`);
            
            if (deviceInfo.userCounts === 0) {
                console.log('No users on device');
                await this.zk.enableDevice();
                return [];
            }
            
            const users = await this.zk.getUsers();
            await this.zk.enableDevice();
            
            console.log(`Retrieved ${users.data.length} users from device`);
            return users.data;
        } catch (error) {
            console.warn('Error getting users, device may be empty:', error.message);
            try {
                if (this.zk) {
                    await this.zk.enableDevice();
                }
            } catch (enableError) {
                console.error('Failed to re-enable device after error:', enableError);
            }
            // Return empty array instead of throwing error for empty device
            return [];
        }
    }

    async getAllAttendance() {
        if (!this.isConnected || !this.zk) {
            throw new Error('Device not connected');
        }

        try {
            await this.zk.disableDevice();
            
            // Check if there are any attendance records first
            const deviceInfo = await this.zk.getInfo();
            console.log(`Device has ${deviceInfo.logCounts} attendance records`);
            
            if (deviceInfo.logCounts === 0) {
                console.log('No attendance records on device');
                await this.zk.enableDevice();
                return [];
            }
            
            const attendances = await this.zk.getAttendances();
            await this.zk.enableDevice();
            
            console.log(`Retrieved ${attendances.data.length} attendance records from device`);
            return attendances.data;
        } catch (error) {
            console.warn('Error getting attendance records, device may have no records:', error.message);
            try {
                if (this.zk) {
                    await this.zk.enableDevice();
                }
            } catch (enableError) {
                console.error('Failed to re-enable device after error:', enableError);
            }
            // Return empty array instead of throwing error
            return [];
        }
    }

    async clearAttendanceLogs() {
        if (!this.isConnected || !this.zk) {
            throw new Error('Device not connected');
        }

        try {
            await this.zk.disableDevice();
            await this.zk.clearAttendanceLog();
            await this.zk.enableDevice();
            
            this.lastAttendanceCount = 0;
            console.log('Attendance logs cleared from device');
            this.emit('logsCleared');
            
            return true;
        } catch (error) {
            try {
                if (this.zk) {
                    await this.zk.enableDevice();
                }
            } catch (enableError) {
                console.error('Failed to re-enable device after error:', enableError);
            }
            throw error;
        }
    }

    async getDeviceInfo() {
        if (!this.isConnected || !this.zk) {
            throw new Error('Device not connected');
        }

        try {
            const info = await this.zk.getInfo();
            return info;
        } catch (error) {
            throw error;
        }
    }

    async setUser(userId, name = '', cardNumber = 0, password = '', role = 0) {
        // Note: node-zklib doesn't support direct user creation
        // Users must be enrolled through the device interface
        throw new Error('Direct user creation not supported by node-zklib. Please use the device interface to enroll users.');
    }

    async deleteUser(userId) {
        // Note: node-zklib doesn't support direct user deletion
        // Users must be deleted through the device interface
        throw new Error('Direct user deletion not supported by node-zklib. Please use the device interface to delete users.');
    }

    // Fingerprint enrollment - provides instructions for manual enrollment
    async enrollFingerprint(userId, fingerprintId = 0) {
        if (!this.isConnected || !this.zk) {
            throw new Error('Device not connected');
        }

        try {
            console.log(`Fingerprint enrollment instructions for user ${userId}:`);
            
            return {
                success: true,
                message: `Please enroll user ${userId} directly on the biometric device using the device menu. The node-zklib library does not support direct fingerprint enrollment.`,
                instructions: [
                    '1. Go to the biometric device',
                    '2. Access the device menu (usually by pressing MENU button)',
                    '3. Navigate to User Management or Enrollment',
                    '4. Select "Add User" or "Enroll User"',
                    `5. Enter User ID: ${userId}`,
                    '6. Follow the on-screen prompts to place finger multiple times',
                    '7. Confirm enrollment when prompted',
                    '8. The user will now be recognized for attendance'
                ],
                userId: userId,
                fingerprintId: fingerprintId
            };
            
        } catch (error) {
            console.error(`Error providing enrollment instructions for user ${userId}:`, error);
            throw error;
        }
    }

    // Delete fingerprint - provides instructions for manual deletion
    async deleteFingerprint(userId) {
        if (!this.isConnected || !this.zk) {
            throw new Error('Device not connected');
        }

        try {
            console.log(`Fingerprint deletion instructions for user ${userId}:`);
            
            return {
                success: true,
                message: `Please delete user ${userId} directly on the biometric device using the device menu.`,
                instructions: [
                    '1. Go to the biometric device',
                    '2. Access the device menu (usually by pressing MENU button)',
                    '3. Navigate to User Management',
                    '4. Select "Delete User" or "Remove User"',
                    `5. Find and select User ID: ${userId}`,
                    '6. Confirm deletion when prompted',
                    '7. The user will be removed from the device'
                ],
                userId: userId
            };
            
        } catch (error) {
            console.error(`Error providing deletion instructions for user ${userId}:`, error);
            throw error;
        }
    }

    async disconnect() {
        console.log('Disconnecting from biometric device...');
        
        await this.stopScanning();
        
        if (this.zk) {
            try {
                await this.zk.disconnect();
                console.log('Disconnected from biometric device');
            } catch (error) {
                console.error('Error during disconnect:', error);
            }
        }
        
        this.isConnected = false;
        this.zk = null;
        this.emit('disconnected');
    }

    getStatus() {
        return {
            connected: this.isConnected,
            scanning: this.isScanning,
            deviceIP: this.deviceIP,
            port: this.port,
            lastAttendanceCount: this.lastAttendanceCount,
            connectionRetryCount: this.connectionRetryCount
        };
    }
}

module.exports = BiometricZKLibService;