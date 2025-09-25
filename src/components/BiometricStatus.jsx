import React, { useState, useEffect } from 'react';

const BiometricStatus = ({ className = '' }) => {
  const [status, setStatus] = useState({
    connected: false,
    scanning: false,
    device: null,
    loading: true,
    error: null
  });

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Check initial biometric status
    checkBiometricStatus();

    // Set up real-time event listeners
    const biometricEventCleanup = window.api?.biometric?.onEvent((eventData) => {
      console.log('Biometric event received:', eventData);
      handleBiometricEvent(eventData);
    });

    const attendanceCleanup = window.api?.biometric?.onAttendanceRecorded((attendanceData) => {
      console.log('Attendance recorded:', attendanceData);
      handleAttendanceRecorded(attendanceData);
    });

    return () => {
      biometricEventCleanup?.();
      attendanceCleanup?.();
    };
  }, []);

  const checkBiometricStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const result = await window.api?.biometric?.testConnection();
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          connected: true,
          device: result.deviceInfo?.data,
          error: null,
          loading: false
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          connected: false,
          device: null,
          error: result.message,
          loading: false
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        device: null,
        error: error.message,
        loading: false
      }));
    }
  };

  const handleBiometricEvent = (eventData) => {
    const notification = {
      id: Date.now(),
      type: eventData.EventType,
      success: eventData.Success,
      message: eventData.Message,
      memberId: eventData.MemberId,
      timestamp: new Date(eventData.Timestamp)
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5 notifications

    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  };

  const handleAttendanceRecorded = (attendanceData) => {
    const notification = {
      id: Date.now(),
      type: 'attendance',
      success: true,
      message: `${attendanceData.action.charAt(0).toUpperCase() + attendanceData.action.slice(1)} recorded for ${attendanceData.memberName}`,
      memberId: attendanceData.memberId,
      action: attendanceData.action,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]);

    // Auto-remove notification after 15 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 15000);
  };

  const startScanning = async () => {
    try {
      setStatus(prev => ({ ...prev, scanning: true }));
      const result = await window.api?.biometric?.startScanning();
      
      if (!result.success) {
        setStatus(prev => ({ ...prev, scanning: false }));
        console.error('Failed to start scanning:', result.error);
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, scanning: false }));
      console.error('Error starting scan:', error);
    }
  };

  const stopScanning = async () => {
    try {
      const result = await window.api?.biometric?.stopScanning();
      setStatus(prev => ({ ...prev, scanning: false }));
      
      if (!result.success) {
        console.error('Failed to stop scanning:', result.error);
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, scanning: false }));
      console.error('Error stopping scan:', error);
    }
  };

  const getStatusIcon = () => {
    if (status.loading) return <span className="animate-spin">⚡</span>;
    if (!status.connected) return <span style={{color: '#ef4444'}}>❌</span>;
    if (status.scanning) return <span className="animate-pulse" style={{color: '#22c55e'}}>🔍</span>;
    return <span style={{color: '#22c55e'}}>✅</span>;
  };

  const getStatusText = () => {
    if (status.loading) return 'Checking connection...';
    if (!status.connected) return 'Disconnected';
    if (status.scanning) return 'Scanning active';
    return 'Connected';
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === 'attendance') {
      return <span style={{color: '#3b82f6'}}>👥</span>;
    }
    
    if (notification.success) {
      return <span style={{color: '#22c55e'}}>✅</span>;
    }
    
    return <span style={{color: '#f59e0b'}}>⚠️</span>;
  };

  if (status.loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <span className="animate-spin text-blue-500 mr-2">⚡</span>
          <span className="text-gray-600">Checking biometric status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Status Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon()}
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Biometric Device</h3>
              <p className="text-sm text-gray-500">{getStatusText()}</p>
            </div>
          </div>
          
          {status.connected && (
            <div className="flex space-x-2">
              {!status.scanning ? (
                <button
                  onClick={startScanning}
                  className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100"
                >
                  Start Scan
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-full hover:bg-red-100"
                >
                  Stop Scan
                </button>
              )}
              <button
                onClick={checkBiometricStatus}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
              >
                Refresh
              </button>
            </div>
          )}
        </div>

        {status.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {status.error}
          </div>
        )}

        {status.device && (
          <div className="mt-2 text-xs text-gray-500">
            Device: {status.device.deviceName || 'Unknown Device'}
          </div>
        )}
      </div>

      {/* Live Notifications */}
      {notifications.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start p-2 bg-gray-50 rounded-lg animate-fade-in"
              >
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {notification.timestamp.toLocaleTimeString()}
                    {notification.memberId && ` • Member ID: ${notification.memberId}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && status.connected && (
        <div className="p-4 text-center text-sm text-gray-500">
          No recent biometric activity
        </div>
      )}
    </div>
  );
};

export default BiometricStatus;