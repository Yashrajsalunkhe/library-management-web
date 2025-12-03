import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';

const SettingsWizard = ({ onComplete, onCancel }) => {
  const { success, error } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      libraryName: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      totalSeats: '50',
      operatingHours: {
        dayShift: {
          openTime: '08:00',
          closeTime: '18:00'
        },
        nightShift: {
          openTime: '18:00',
          closeTime: '06:00'
        },
        enableNightShift: false
      }
    },
    membership: {
      depositAmount: '200',
      selectedIdDocumentType: 'aadhar'
    },
    payment: {
      currency: 'INR',
      discountAmount: '0',
      discountType: 'fixed',
      paymentReminderDays: '7',
      autoGenerateReceipts: true,
      acceptCash: true,
      acceptOnline: false
    },
    attendance: {
      autoMarkAbsent: true,
      absentAfterHours: '2',
      allowManualEdit: true,
      maxConsecutiveAbsences: '7',
      autoCheckOutHours: '12'
    },
    notifications: {
      enableEmailNotifications: false,
      enableSMSNotifications: false,
      membershipExpiryReminder: true,
      reminderDaysBefore: '7',
      birthdayWishes: true
    },
    security: {
      sessionTimeout: '60',
      requirePasswordChange: false,
      passwordChangeInterval: '90',
      enableBiometric: false,
      twoFactorAuth: false,
      logUserActions: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      keepBackupsFor: '30'
    }
  });

  const steps = [
    {
      id: 1,
      title: 'Study Room Information',
      description: 'Basic information about your study room',
      icon: '📚',
      fields: ['libraryName', 'address', 'phone', 'email', 'totalSeats']
    },
    {
      id: 2,
      title: 'Operating Hours',
      description: 'Set your study room operating hours',
      icon: '🕒',
      fields: ['operatingHours']
    },
    {
      id: 3,
      title: 'Member Registration',
      description: 'Configure member registration settings',
      icon: '👥',
      fields: ['depositAmount', 'selectedIdDocumentType']
    },
    {
      id: 4,
      title: 'Payment Settings',
      description: 'Configure payment and pricing options',
      icon: '💰',
      fields: ['currency', 'discountAmount', 'paymentReminderDays', 'acceptCash', 'acceptOnline']
    },
    {
      id: 5,
      title: 'Attendance Settings',
      description: 'Configure attendance tracking rules',
      icon: '📅',
      fields: ['autoMarkAbsent', 'absentAfterHours', 'maxConsecutiveAbsences']
    },
    {
      id: 6,
      title: 'Notifications',
      description: 'Configure notification preferences',
      icon: '🔔',
      fields: ['enableEmailNotifications', 'enableSMSNotifications', 'membershipExpiryReminder', 'reminderDaysBefore']
    },
    {
      id: 7,
      title: 'Security & Backup',
      description: 'Configure security and backup settings',
      icon: '🔒',
      fields: ['sessionTimeout', 'enableBiometric', 'autoBackup', 'backupFrequency']
    }
  ];

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section, nestedField, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedField]: {
          ...prev[section][nestedField],
          [field]: value
        }
      }
    }));
  };

  const validateCurrentStep = () => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    
    switch (currentStep) {
      case 1: // Study Room Information
        if (!settings.general.libraryName.trim()) {
          error('Please enter the study room name');
          return false;
        }
        if (!settings.general.totalSeats || parseInt(settings.general.totalSeats) <= 0) {
          error('Please enter a valid number of seats');
          return false;
        }
        break;
      case 2: // Operating Hours
        // Operating hours are optional, validation can be added if needed
        break;
      case 3: // Member Registration
        if (!settings.membership.depositAmount || parseFloat(settings.membership.depositAmount) < 0) {
          error('Please enter a valid deposit amount');
          return false;
        }
        break;
      case 4: // Payment Settings
        if (!settings.payment.paymentReminderDays || parseInt(settings.payment.paymentReminderDays) <= 0) {
          error('Please enter valid payment reminder days');
          return false;
        }
        break;
      case 5: // Attendance Settings
        if (settings.attendance.autoMarkAbsent && (!settings.attendance.absentAfterHours || parseInt(settings.attendance.absentAfterHours) <= 0)) {
          error('Please enter valid hours for marking absent');
          return false;
        }
        break;
      case 6: // Notifications
        // Notification settings are all optional
        break;
      case 7: // Security & Backup
        if (!settings.security.sessionTimeout || parseInt(settings.security.sessionTimeout) <= 0) {
          error('Please enter a valid session timeout');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save all settings
      await api.saveSettings(settings);
      success('Settings configured successfully!');
      onComplete && onComplete(settings);
    } catch (err) {
      console.error('Error saving settings:', err);
      error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Study Room Information
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label required">Study Room Name</label>
              <input
                type="text"
                value={settings.general.libraryName}
                onChange={(e) => handleInputChange('general', 'libraryName', e.target.value)}
                className="input"
                placeholder="Enter your study room business name"
                required
              />
              <p className="form-help">This will appear on receipts and official documents</p>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                value={settings.general.address}
                onChange={(e) => handleInputChange('general', 'address', e.target.value)}
                className="input resize-none"
                rows="3"
                placeholder="Enter complete address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={settings.general.phone}
                  onChange={(e) => handleInputChange('general', 'phone', e.target.value)}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={settings.general.email}
                  onChange={(e) => handleInputChange('general', 'email', e.target.value)}
                  className="input"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label required">Total Seats</label>
                <input
                  type="number"
                  min="1"
                  value={settings.general.totalSeats}
                  onChange={(e) => handleInputChange('general', 'totalSeats', e.target.value)}
                  className="input"
                  placeholder="Enter total number of seats"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="url"
                  value={settings.general.website}
                  onChange={(e) => handleInputChange('general', 'website', e.target.value)}
                  className="input"
                  placeholder="https://your-website.com"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Operating Hours
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Day Shift Hours</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Opening Time</label>
                  <input
                    type="time"
                    value={settings.general.operatingHours.dayShift.openTime}
                    onChange={(e) => handleNestedChange('general', 'operatingHours', 'dayShift', {
                      ...settings.general.operatingHours.dayShift,
                      openTime: e.target.value
                    })}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Time</label>
                  <input
                    type="time"
                    value={settings.general.operatingHours.dayShift.closeTime}
                    onChange={(e) => handleNestedChange('general', 'operatingHours', 'dayShift', {
                      ...settings.general.operatingHours.dayShift,
                      closeTime: e.target.value
                    })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.general.operatingHours.enableNightShift}
                  onChange={(e) => handleNestedChange('general', 'operatingHours', 'enableNightShift', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="form-label mb-0">Enable Night Shift</span>
              </label>
              <p className="form-help">Enable this if you offer 24-hour service or night shifts</p>
            </div>

            {settings.general.operatingHours.enableNightShift && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Night Shift Hours</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Opening Time</label>
                    <input
                      type="time"
                      value={settings.general.operatingHours.nightShift.openTime}
                      onChange={(e) => handleNestedChange('general', 'operatingHours', 'nightShift', {
                        ...settings.general.operatingHours.nightShift,
                        openTime: e.target.value
                      })}
                      className="input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Closing Time</label>
                    <input
                      type="time"
                      value={settings.general.operatingHours.nightShift.closeTime}
                      onChange={(e) => handleNestedChange('general', 'operatingHours', 'nightShift', {
                        ...settings.general.operatingHours.nightShift,
                        closeTime: e.target.value
                      })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Member Registration
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label required">Security Deposit Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.membership.depositAmount}
                  onChange={(e) => handleInputChange('membership', 'depositAmount', e.target.value)}
                  className="input pl-8"
                  placeholder="200"
                  required
                />
              </div>
              <p className="form-help">Amount to be collected as security deposit from new members</p>
            </div>

            <div className="form-group">
              <label className="form-label required">Primary ID Document Type</label>
              <select
                value={settings.membership.selectedIdDocumentType}
                onChange={(e) => handleInputChange('membership', 'selectedIdDocumentType', e.target.value)}
                className="input"
                required
              >
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="driving_license">Driving License</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
                <option value="other_govt">Other Government Document</option>
              </select>
              <p className="form-help">Primary document type required for member registration</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">💡 Registration Tips</h4>
              <ul className="text-amber-800 text-sm space-y-1">
                <li>• Keep deposit amount reasonable for your target audience</li>
                <li>• Aadhar Card is most commonly accepted in India</li>
                <li>• You can modify these settings later from the Settings page</li>
              </ul>
            </div>
          </div>
        );

      case 4: // Payment Settings
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  value={settings.payment.currency}
                  onChange={(e) => handleInputChange('payment', 'currency', e.target.value)}
                  className="input"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Reminder Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.payment.paymentReminderDays}
                  onChange={(e) => handleInputChange('payment', 'paymentReminderDays', e.target.value)}
                  className="input"
                  placeholder="7"
                />
                <p className="form-help">Days before expiry to send payment reminders</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Discount Amount</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.payment.discountAmount}
                    onChange={(e) => handleInputChange('payment', 'discountAmount', e.target.value)}
                    className="input pr-12"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {settings.payment.discountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
                <select
                  value={settings.payment.discountType}
                  onChange={(e) => handleInputChange('payment', 'discountType', e.target.value)}
                  className="input w-32"
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <p className="form-help">Default discount to offer to members</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Payment Methods</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.payment.acceptCash}
                    onChange={(e) => handleInputChange('payment', 'acceptCash', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Accept Cash Payments</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.payment.acceptOnline}
                    onChange={(e) => handleInputChange('payment', 'acceptOnline', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Accept Online Payments</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 5: // Attendance Settings
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.attendance.autoMarkAbsent}
                  onChange={(e) => handleInputChange('attendance', 'autoMarkAbsent', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="form-label mb-0">Auto Mark Absent</span>
              </label>
              <p className="form-help">Automatically mark members absent if they don't check in</p>
            </div>

            {settings.attendance.autoMarkAbsent && (
              <div className="form-group">
                <label className="form-label">Mark Absent After (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={settings.attendance.absentAfterHours}
                  onChange={(e) => handleInputChange('attendance', 'absentAfterHours', e.target.value)}
                  className="input w-32"
                  placeholder="2"
                />
                <p className="form-help">Hours after opening time to mark members as absent</p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Max Consecutive Absences</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.attendance.maxConsecutiveAbsences}
                onChange={(e) => handleInputChange('attendance', 'maxConsecutiveAbsences', e.target.value)}
                className="input w-32"
                placeholder="7"
              />
              <p className="form-help">Maximum consecutive days a member can be absent</p>
            </div>

            <div className="form-group">
              <label className="form-label">Auto Check-out After (Hours)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.attendance.autoCheckOutHours}
                onChange={(e) => handleInputChange('attendance', 'autoCheckOutHours', e.target.value)}
                className="input w-32"
                placeholder="12"
              />
              <p className="form-help">Automatically check out members after specified hours</p>
            </div>

            <div className="form-group">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.attendance.allowManualEdit}
                  onChange={(e) => handleInputChange('attendance', 'allowManualEdit', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="form-label mb-0">Allow Manual Edit</span>
              </label>
              <p className="form-help">Allow staff to manually edit attendance records</p>
            </div>
          </div>
        );

      case 6: // Notifications
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Notification Channels</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enableEmailNotifications}
                    onChange={(e) => handleInputChange('notifications', 'enableEmailNotifications', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Email Notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enableSMSNotifications}
                    onChange={(e) => handleInputChange('notifications', 'enableSMSNotifications', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>SMS Notifications</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Notification Types</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications.membershipExpiryReminder}
                    onChange={(e) => handleInputChange('notifications', 'membershipExpiryReminder', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Membership Expiry Reminders</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications.birthdayWishes}
                    onChange={(e) => handleInputChange('notifications', 'birthdayWishes', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Birthday Wishes</span>
                </label>
              </div>
            </div>

            {settings.notifications.membershipExpiryReminder && (
              <div className="form-group">
                <label className="form-label">Reminder Days Before Expiry</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.notifications.reminderDaysBefore}
                  onChange={(e) => handleInputChange('notifications', 'reminderDaysBefore', e.target.value)}
                  className="input w-32"
                  placeholder="7"
                />
                <p className="form-help">Days before membership expiry to send reminders</p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📧 Note</h4>
              <p className="text-blue-800 text-sm">
                To use email and SMS notifications, you'll need to configure the email and SMS settings 
                in the Environment Configuration section later.
              </p>
            </div>
          </div>
        );

      case 7: // Security & Backup
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Security Settings</h4>
              
              <div className="form-group">
                <label className="form-label">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', e.target.value)}
                  className="input w-32"
                  placeholder="60"
                />
                <p className="form-help">Minutes of inactivity before automatic logout</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.security.enableBiometric}
                    onChange={(e) => handleInputChange('security', 'enableBiometric', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Enable Biometric Authentication</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.security.logUserActions}
                    onChange={(e) => handleInputChange('security', 'logUserActions', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Log User Actions</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Backup Settings</h4>
              
              <div className="form-group">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.backup.autoBackup}
                    onChange={(e) => handleInputChange('backup', 'autoBackup', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="form-label mb-0">Enable Automatic Backup</span>
                </label>
                <p className="form-help">Automatically backup your data at regular intervals</p>
              </div>

              {settings.backup.autoBackup && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Backup Frequency</label>
                    <select
                      value={settings.backup.backupFrequency}
                      onChange={(e) => handleInputChange('backup', 'backupFrequency', e.target.value)}
                      className="input"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Keep Backups For (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.backup.keepBackupsFor}
                      onChange={(e) => handleInputChange('backup', 'keepBackupsFor', e.target.value)}
                      className="input"
                      placeholder="30"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">✅ Almost Done!</h4>
              <p className="text-green-800 text-sm">
                You're on the last step! After completing this, your study room will be fully configured 
                and ready to use.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{steps[currentStep - 1]?.icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStep - 1]?.title}
              </h2>
              <p className="text-gray-600 text-sm">
                {steps[currentStep - 1]?.description}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
            className="btn-secondary"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index + 1 === currentStep
                    ? 'bg-blue-600'
                    : index + 1 < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              'Saving...'
            ) : currentStep === steps.length ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsWizard;
