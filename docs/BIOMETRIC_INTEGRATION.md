# Biometric Integration Guide

This guide explains how to set up and use the real-time biometric integration in Libro.

## Overview

The biometric integration consists of three main components:
1. **BiometricBridge** (Node.js) - Handles communication between Electron and the biometric helper
2. **BiometricHelper** (C# .NET) - Interfaces directly with biometric hardware
3. **React UI Components** - Provides real-time status and management interface

## Features

### Real-Time Attendance
- Automatic attendance recording when members scan their fingerprints
- Live notifications on the dashboard showing check-in/check-out events
- Support for duplicate scan detection (check-in vs check-out logic)

### Member Management
- Fingerprint enrollment for new members
- Biometric data deletion for departing members
- Visual feedback during enrollment process

### Device Monitoring
- Real-time device connection status
- Scanning state indicators
- Error handling and recovery

## Setup Instructions

### 1. Prerequisites
- Windows machine with .NET 6.0 or later
- Compatible biometric device (fingerprint scanner)
- Device drivers properly installed

### 2. Configure Biometric Helper
1. Navigate to `biometric-helper/` directory
2. Build the C# application:
   ```bash
   dotnet build
   dotnet run
   ```
3. The helper will start on `http://localhost:5005`

### 3. Environment Configuration
Update your `.env` file with appropriate values:
```properties
BIOMETRIC_HELPER_URL=http://localhost:5005
BIOMETRIC_HELPER_TOKEN=your-secure-token
```

### 4. Start the Application
1. Start the biometric helper first
2. Launch the Electron application
3. Check dashboard for biometric device status

## Using the Biometric Features

### Dashboard Monitoring
- The dashboard shows a **Biometric Status** widget
- Green indicator: Device connected and ready
- Blue pulsing: Currently scanning
- Red indicator: Device disconnected or error

### Member Enrollment
1. Go to **Members** page
2. Find the member you want to enroll
3. Click the biometric button (🔓) next to their name
4. Follow the enrollment wizard:
   - Click "Start Enrollment"
   - Place finger on scanner when prompted
   - Wait for confirmation

### Automatic Attendance
- Members can scan their fingerprints at any time
- First scan of the day = check-in
- Second scan of the day = check-out
- All scans are logged with timestamp and source

### Live Notifications
- Real-time attendance events appear on dashboard
- Notifications auto-disappear after 10-15 seconds
- Different colors for check-in (green) vs check-out (orange)

## API Endpoints

The biometric helper exposes these endpoints:

### Device Management
- `GET /status` - Get helper service status
- `GET /device-info` - Get connected device information
- `POST /start-scan` - Start continuous scanning
- `POST /stop-scan` - Stop scanning

### Member Management
- `POST /enroll` - Enroll new fingerprint
  ```json
  { "memberId": 123 }
  ```
- `DELETE /fingerprint/{memberId}` - Delete member's biometric data

### Event Webhook
- `POST /biometric-event` - Receives real-time events from helper
- Events are automatically forwarded to the main application

## Event Types

### Verification Events
```json
{
  "EventType": "verification",
  "MemberId": 123,
  "Success": true,
  "Message": "Member verified successfully",
  "Timestamp": "2025-09-24T14:30:00Z",
  "DeviceId": "FP001"
}
```

### Enrollment Events
```json
{
  "EventType": "enrollment",
  "MemberId": 123,
  "Success": true,
  "Message": "Fingerprint enrolled successfully",
  "Timestamp": "2025-09-24T14:30:00Z",
  "FingerprintTemplate": "base64-encoded-template"
}
```

## Troubleshooting

### Device Not Connecting
1. Check device drivers are installed
2. Verify device is not used by another application
3. Restart biometric helper service
4. Check Windows Device Manager for conflicts

### No Scanning Events
1. Ensure biometric helper is running (`http://localhost:5005`)
2. Check event server is started (port 5006)
3. Verify member fingerprints are enrolled
4. Test with biometric helper API directly

### Enrollment Failures
1. Clean the fingerprint scanner surface
2. Ensure finger is dry and clean
3. Try multiple fingers for better recognition
4. Check device compatibility with SDK

### Connection Issues
1. Verify `.env` file configuration
2. Check firewall settings (ports 5005, 5006)
3. Restart both applications
4. Check logs for detailed error messages

## Security Considerations

### Token Authentication
- Use strong, unique tokens for biometric helper communication
- Rotate tokens periodically
- Keep tokens secure in environment variables

### Network Security
- Biometric helper runs on localhost only
- No external network access required
- All communication over HTTP (local only)

### Data Protection
- Fingerprint templates are stored locally only
- No cloud storage of biometric data
- Templates are encrypted in database

## Development Notes

### Adding New Device Support
1. Update `IBiometricDevice` interface in `Program.cs`
2. Implement device-specific driver class
3. Update device detection logic
4. Test with new hardware

### Custom Event Handling
1. Add new event types in `BiometricEvent` model
2. Update event handler in `main.js`
3. Create UI components for new events
4. Add appropriate database logging

### Performance Optimization
- Event processing is asynchronous
- UI updates are debounced to prevent spam
- Database queries are optimized for attendance lookups

## Support

For issues or questions:
1. Check the logs in `dev.log` and `electron.log`
2. Test biometric helper independently
3. Verify device compatibility
4. Contact system administrator

---

**Note**: This biometric integration requires Windows and compatible fingerprint hardware. For other platforms, consider alternative biometric solutions or manual attendance entry.