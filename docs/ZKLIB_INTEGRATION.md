# JavaScript ZKLib Biometric Integration Guide

This guide explains the new JavaScript-based biometric integration using the `node-zklib` library, which replaces the previous .NET HTTP-based approach.

## Overview

The new implementation:
- Uses **node-zklib** for direct TCP communication with ZKTeco devices
- Eliminates the need for a separate .NET biometric helper service
- Provides real-time attendance scanning
- Runs entirely within the Node.js/Electron environment

## Prerequisites

1. **Node.js** (v14 or higher)
2. **npm** (usually comes with Node.js)
3. **ZKTeco biometric device** (tested with eSSL K30, but should work with most ZKTeco devices)
4. **Network connectivity** between your computer and the biometric device

## Setup Instructions

### 1. Device Configuration

Configure your biometric device with the following network settings:
- **IP Address**: Set a static IP (e.g., `172.16.253.65`)
- **Port**: Default is `4370` (usually doesn't need changing)
- **Network**: Ensure both device and computer are on the same network

### 2. Environment Configuration

Create or update your `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env

# Edit with your settings
nano .env
```

Configure the biometric settings:
```bash
# Biometric Device Configuration (node-zklib)
BIOMETRIC_DEVICE_IP=172.16.253.65
BIOMETRIC_DEVICE_PORT=4370
BIOMETRIC_TIMEOUT=5000
BIOMETRIC_INTERNAL_TIMEOUT=10000
BIOMETRIC_POLL_INTERVAL=5000
```

### 3. Install Dependencies

```bash
npm install
```

The `node-zklib` package should be automatically installed. If not, install it manually:
```bash
npm install node-zklib
```

### 4. Test the Connection

Test your biometric device connection:

```bash
# Using npm script
npm run test:biometric

# Or run directly
node test-zklib-biometric.js
```

This will:
- Connect to the device
- Display device information
- Show users on the device
- Show attendance records
- Test real-time scanning for 10 seconds

## Starting the Application

Use the new ZKLib-enabled startup script:

```bash
# Make executable (first time only)
chmod +x start-zklib.sh

# Start the application
./start-zklib.sh

# Or using npm
npm run start:zklib
```

The script will:
1. Check Node.js prerequisites
2. Test biometric device connectivity
3. Verify ZKLib integration
4. Start the Electron application

## How It Works

### Architecture

```
┌─────────────────┐    TCP/IP    ┌──────────────────────┐
│   Electron      │◄────────────►│   ZKTeco Device      │
│   Main Process  │   Port 4370  │   (e.g., eSSL K30)   │
└─────────────────┘              └──────────────────────┘
         ▲
         │ IPC
         ▼
┌─────────────────┐
│   React UI      │
│   (Renderer)    │
└─────────────────┘
```

### Key Components

1. **BiometricZKLibService** (`electron/biometric-zklib.js`)
   - Direct device communication using node-zklib
   - Real-time attendance polling
   - Event-based architecture

2. **BiometricBridgeZK** (`electron/biometric-bridge-zk.js`)
   - Bridge between ZKLib service and Electron app
   - Event handling and transformation
   - Status monitoring

3. **IPC Handlers** (`electron/ipcHandlers.js`)
   - Communication between main and renderer processes
   - Biometric operations: start/stop scanning, get users, etc.

### Event Flow

1. **Device Connection**: ZKLib connects to device via TCP
2. **Attendance Polling**: Service polls device every 5 seconds (configurable)
3. **New Record Detection**: Compares current records with last known count
4. **Event Emission**: New attendance events are emitted
5. **Auto-Recording**: Events trigger automatic attendance recording in database
6. **UI Updates**: Real-time updates sent to React frontend

## Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `BIOMETRIC_DEVICE_IP` | `172.16.253.65` | Device IP address |
| `BIOMETRIC_DEVICE_PORT` | `4370` | Device TCP port |
| `BIOMETRIC_TIMEOUT` | `5000` | Connection timeout (ms) |
| `BIOMETRIC_INTERNAL_TIMEOUT` | `10000` | Internal operations timeout (ms) |
| `BIOMETRIC_POLL_INTERVAL` | `5000` | Polling interval for new records (ms) |

## API Methods

The biometric bridge provides these methods via IPC:

### Device Operations
- `biometric:get-status` - Get device connection status
- `biometric:test-connection` - Test device connectivity
- `biometric:get-device-info` - Get device information

### User Management
- `biometric:get-users` - Get all users from device
- `biometric:enroll-fingerprint` - Enroll user fingerprint (if supported)
- `biometric:delete-fingerprint` - Delete user fingerprint (if supported)

### Attendance Operations
- `biometric:start-scanning` - Start real-time attendance scanning
- `biometric:stop-scanning` - Stop attendance scanning
- `biometric:get-all-attendance` - Get all attendance records from device
- `biometric:clear-logs` - Clear attendance logs from device

## Event Types

The system emits these events:

| Event Type | Description | Data |
|------------|-------------|------|
| `attendance` | New attendance record | `{ userId, recordTime, type }` |
| `device_connected` | Device connected successfully | `{ deviceIP, deviceInfo }` |
| `device_disconnected` | Device disconnected | `{ timestamp }` |
| `connection_error` | Connection failed | `{ error, deviceIP }` |
| `scan_started` | Scanning started | `{ interval }` |
| `scan_stopped` | Scanning stopped | `{ timestamp }` |

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 172.16.253.65:4370
   ```
   - Check device IP address
   - Verify network connectivity (`ping 172.16.253.65`)
   - Ensure device is powered on
   - Check if device port is correct

2. **Timeout Errors**
   ```
   Error: Socket timeout
   ```
   - Increase `BIOMETRIC_TIMEOUT` value
   - Check network stability
   - Verify device isn't busy with other operations

3. **Permission Denied**
   ```
   Error: Operation not permitted
   ```
   - Device might be in use by another application
   - Try restarting the device
   - Check if device is in admin mode

### Debugging

1. **Enable Detailed Logging**:
   ```javascript
   // In electron/biometric-zklib.js, add more console.log statements
   ```

2. **Test Device Manually**:
   ```bash
   # Test network connectivity
   ping 172.16.253.65
   
   # Test port accessibility
   telnet 172.16.253.65 4370
   ```

3. **Check Device Status**:
   - Ensure device menu shows "Ready" status
   - Check device network settings
   - Verify device firmware is up to date

## Migration from .NET Version

If you were previously using the .NET HTTP-based integration:

1. **Stop Old Services**:
   ```bash
   # Stop any running biometric helper
   pkill -f "dotnet.*BiometricHelper"
   ```

2. **Update Environment**:
   ```bash
   # Replace old environment variables
   # OLD: BIOMETRIC_HELPER_URL, BIOMETRIC_HELPER_TOKEN
   # NEW: BIOMETRIC_DEVICE_IP, BIOMETRIC_DEVICE_PORT
   ```

3. **Remove .NET Dependencies**:
   - You can optionally remove the `biometric-helper/` directory
   - The new system doesn't require .NET

4. **Test New Integration**:
   ```bash
   npm run test:biometric
   ```

## Performance Notes

- The ZKLib integration is more efficient than HTTP polling
- Direct TCP communication reduces latency
- Real-time events provide immediate attendance updates
- Memory usage is lower without the separate .NET process

## Support

For issues with the ZKLib integration:

1. Check the test output: `npm run test:biometric`
2. Review application logs in the terminal
3. Verify device connectivity and settings
4. Check that `node-zklib` is properly installed

The JavaScript ZKLib approach provides a more streamlined, efficient biometric integration compared to the previous .NET HTTP method.