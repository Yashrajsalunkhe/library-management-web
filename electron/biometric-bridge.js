const http = require('http');
const axios = require('axios');
require('dotenv').config();

class BiometricBridge {
  constructor() {
    this.helperUrl = process.env.BIOMETRIC_HELPER_URL || 'http://localhost:5005';
    this.helperToken = process.env.BIOMETRIC_HELPER_TOKEN || 'default-token';
    this.server = null;
    this.eventCallbacks = [];
    this.connectionStatus = { connected: false, lastCheck: null };
    this.connectionCheckInterval = null;
  }

  // Start HTTP server to receive events from biometric helper
  startEventServer(port = 5006) {
    if (this.server) {
      console.log('Biometric event server already running');
      return;
    }

    this.server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/biometric-event') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            
            // Verify token if provided
            const token = req.headers['authorization']?.replace('Bearer ', '');
            if (this.helperToken && token !== this.helperToken) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unauthorized' }));
              return;
            }

            // Process biometric event
            this.handleBiometricEvent(data);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            console.error('Error parsing biometric event:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(port, 'localhost', () => {
      console.log(`Biometric event server listening on http://localhost:${port}`);
    });
  }

  // Stop event server
  stopEventServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('Biometric event server stopped');
    }
  }

  // Handle biometric events from the helper
  handleBiometricEvent(data) {
    console.log('Received biometric event:', data);
    
    // Notify all registered callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in biometric event callback:', error);
      }
    });
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

  // Check if biometric helper is running
  async checkHelperStatus() {
    try {
      const response = await axios.get(`${this.helperUrl}/api/biometric/status`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.helperToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Biometric helper service is not running. Please start the helper application.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Cannot resolve biometric helper address. Check network configuration.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection to biometric helper timed out. Device may be disconnected.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code
      };
    }
  }

  // Start fingerprint scanning
  async startScanning() {
    try {
      const response = await axios.post(`${this.helperUrl}/api/biometric/start-scan`, {}, {
        headers: {
          'Authorization': `Bearer ${this.helperToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Stop biometric scanning
  async stopScanning() {
    try {
      const response = await axios.post(`${this.helperUrl}/api/biometric/stop-scan`, {}, {
        headers: {
          'Authorization': `Bearer ${this.helperToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enroll new fingerprint
  async enrollFingerprint(memberId) {
    try {
      const response = await axios.post(`${this.helperUrl}/api/biometric/enroll`, {
        memberId: memberId
      }, {
        headers: {
          'Authorization': `Bearer ${this.helperToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete fingerprint template
  async deleteFingerprint(memberId) {
    try {
      const response = await axios.delete(`${this.helperUrl}/api/biometric/fingerprint/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${this.helperToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get device information
  async getDeviceInfo() {
    try {
      const response = await axios.get(`${this.helperUrl}/api/biometric/device-info`, {
        headers: {
          'Authorization': `Bearer ${this.helperToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Test connection to helper
  async testConnection() {
    console.log('Testing biometric connection...');
    
    const status = await this.checkHelperStatus();
    if (!status.success) {
      return {
        success: false,
        message: 'Cannot connect to biometric helper service.',
        details: status.error,
        code: status.code
      };
    }

    try {
      const deviceInfo = await this.getDeviceInfo();
      if (!deviceInfo.success) {
        return {
          success: false,
          message: 'Connected to helper but biometric device is not ready.',
          details: deviceInfo.error
        };
      }

      return {
        success: true,
        message: 'Biometric system is ready and device connected successfully.',
        helperStatus: status.data,
        deviceInfo: deviceInfo.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error checking device status.',
        error: error.message
      };
    }
  }

  // Start periodic connection monitoring
  startConnectionMonitoring(interval = 30000) {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(async () => {
      const status = await this.checkHelperStatus();
      this.connectionStatus.connected = status.success;
      this.connectionStatus.lastCheck = new Date();
      
      // Notify all callbacks about connection status change
      this.eventCallbacks.forEach(callback => {
        try {
          callback({
            EventType: 'connection_status',
            Connected: status.success,
            LastCheck: this.connectionStatus.lastCheck,
            Error: status.success ? null : status.error
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

  // Get current connection status
  getConnectionStatus() {
    return this.connectionStatus;
  }
}

module.exports = BiometricBridge;
