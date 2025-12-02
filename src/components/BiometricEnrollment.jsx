import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const BiometricEnrollment = ({ member, onClose, onSuccess }) => {
  const [status, setStatus] = useState('idle'); // idle, enrolling, success, error
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [biometricStatus, setBiometricStatus] = useState({ connected: false, scanning: false });

  useEffect(() => {
    // Check biometric device status
    checkBiometricStatus();

    // Set up event listeners for enrollment feedback
    const biometricEventCleanup = api.biometric?.onEvent((eventData) => {
      if (eventData.EventType === 'enrollment' && eventData.MemberId === member.id) {
        handleEnrollmentEvent(eventData);
      }
    });

    return () => {
      biometricEventCleanup?.();
    };
  }, [member.id]);

  const checkBiometricStatus = async () => {
    try {
      const result = await api.biometric?.getStatus();
      setBiometricStatus({
        connected: result.success,
        scanning: false
      });
    } catch (error) {
      setBiometricStatus({ connected: false, scanning: false });
    }
  };

  const handleEnrollmentEvent = (eventData) => {
    if (eventData.Success) {
      setStatus('success');
      setMessage('Fingerprint enrolled successfully!');
      setProgress(100);

      setTimeout(() => {
        onSuccess?.(eventData);
        onClose?.();
      }, 2000);
    } else {
      setStatus('error');
      setMessage(eventData.Message || 'Enrollment failed');
      setProgress(0);
    }
  };

  const startEnrollment = async () => {
    try {
      setStatus('enrolling');
      setMessage('Place finger on the scanner...');
      setProgress(25);

      const result = await api.biometric?.enrollFingerprint(member.id);

      if (result.success) {
        setMessage('Enrollment started. Follow device instructions...');
        setProgress(50);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to start enrollment');
        setProgress(0);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error starting enrollment: ' + error.message);
      setProgress(0);
    }
  };

  const deleteFingerprint = async () => {
    try {
      setStatus('enrolling');
      setMessage('Deleting fingerprint...');
      setProgress(50);

      const result = await api.biometric?.deleteFingerprint(member.id);

      if (result.success) {
        setStatus('success');
        setMessage('Fingerprint deleted successfully!');
        setProgress(100);

        setTimeout(() => {
          onSuccess?.({ deleted: true });
          onClose?.();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to delete fingerprint');
        setProgress(0);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error deleting fingerprint: ' + error.message);
      setProgress(0);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'enrolling':
        return <span className="text-4xl animate-pulse">👆</span>;
      case 'success':
        return <span className="text-4xl" style={{ color: '#22c55e' }}>✅</span>;
      case 'error':
        return <span className="text-4xl" style={{ color: '#ef4444' }}>❌</span>;
      default:
        return <span className="text-4xl" style={{ color: '#9ca3af' }}>👆</span>;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'enrolling': return 'blue';
      case 'success': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const color = getStatusColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-xl mr-3">👤</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Biometric Enrollment
              </h2>
              <p className="text-sm text-gray-600">
                {member.name} (ID: {member.id})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Device Status Warning */}
          {!biometricStatus.connected && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <span className="text-yellow-600 mr-2 flex-shrink-0">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Biometric device not connected</p>
                <p>Please ensure the biometric device is connected and the helper application is running.</p>
              </div>
            </div>
          )}

          {/* Status Display */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>

            {message && (
              <p className={`text-sm mb-3 text-${color}-600`}>
                {message}
              </p>
            )}

            {/* Progress Bar */}
            {status === 'enrolling' && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {status === 'idle' && biometricStatus.connected && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Enrollment Instructions
              </h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Click "Start Enrollment" below</li>
                <li>2. Place finger on the biometric scanner</li>
                <li>3. Follow the device prompts</li>
                <li>4. Keep finger steady until enrollment completes</li>
              </ol>
            </div>
          )}

          {/* Enrollment Steps */}
          {status === 'enrolling' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Enrollment in Progress
              </h3>
              <p className="text-sm text-blue-800">
                Please follow the instructions on the biometric device.
                You may need to scan your finger multiple times.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 flex justify-between">
          <button
            onClick={onClose}
            disabled={status === 'enrolling'}
            className={`px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 ${status === 'enrolling' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {status === 'enrolling' ? 'Enrolling...' : 'Close'}
          </button>

          <div className="flex space-x-3">
            {/* Delete Fingerprint Button */}
            <button
              onClick={deleteFingerprint}
              disabled={!biometricStatus.connected || status === 'enrolling'}
              className={`px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
            >
              <span className="mr-1">🗑️</span>
              Delete
            </button>

            {/* Enroll Button */}
            <button
              onClick={startEnrollment}
              disabled={!biometricStatus.connected || status === 'enrolling'}
              className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${biometricStatus.connected && status !== 'enrolling'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
                } flex items-center`}
            >
              <span className="mr-1">👆</span>
              {status === 'enrolling' ? 'Enrolling...' : 'Start Enrollment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricEnrollment;