import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { success, error } = useNotification();
  const { requestPasswordChangeOTP, changePassword, user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings - Enhanced with Study Room Information
    general: {
      libraryName: 'Library Management System',
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
      },
      logo: null,
      holidays: [],
      locale: {
        dateFormat: 'dd/MM/yyyy',
        timeFormat: '24hour'
      },
      autoBackup: true,
      backupInterval: '24', // hours
      theme: 'light',
      language: 'en'
    },
    // Member Settings - Simplified with ID Number and Deposit Only
    membership: {
      idNumber: '',
      depositAmount: '200',
      idDocumentTypes: [
        { id: 'aadhar', label: 'Aadhar Card', enabled: true },
        { id: 'pan', label: 'PAN Card', enabled: true },
        { id: 'driving_license', label: 'Driving License', enabled: true },
        { id: 'passport', label: 'Passport', enabled: true },
        { id: 'voter_id', label: 'Voter ID', enabled: false },
        { id: 'other_govt', label: 'Other Government Document', enabled: true }
      ],
      selectedIdDocumentType: 'aadhar'
    },
    // Attendance Settings
    attendance: {
      autoMarkAbsent: true,
      absentAfterHours: '2',
      allowManualEdit: true,
      notifyOnAbsence: false,
      maxConsecutiveAbsences: '7',
      autoCheckOutHours: '12'
    },
    // Payment Settings - Enhanced with multiple custom plans
    payment: {
      currency: 'INR',
      customPlans: [],
      discountAmount: '0',
      discountType: 'fixed', // 'fixed' or 'percentage'
      paymentReminderDays: '7',
      autoGenerateReceipts: true,
      acceptCash: true,
      acceptOnline: false,
      onlinePaymentGateway: 'none'
    },
    // Notification Settings - Removed desktop notifications, integrated payment reminder
    notifications: {
      enableEmailNotifications: false,
      enableSMSNotifications: false,
      membershipExpiryReminder: true,
      reminderDaysBefore: '7',
      paymentReminderDays: '7',
      birthdayWishes: true
    },
    // Security Settings
    security: {
      sessionTimeout: '60',
      requirePasswordChange: false,
      passwordChangeInterval: '90',
      enableBiometric: false,
      twoFactorAuth: false,
      logUserActions: true
    },
    // Backup & Data Settings
    backup: {
      autoBackup: true,
      backupLocation: 'local',
      backupFrequency: 'daily',
      keepBackupsFor: '30',
      cloudBackup: false,
      cloudProvider: 'none'
    }
  });

  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState(1); // 1: enter passwords, 2: verify OTP
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpExpiryTime, setOtpExpiryTime] = useState(null);

  // Time format conversion helpers
  const convertTo12Hour = (time24) => {
    if (!time24) return { time: '', period: 'AM' };
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    return { time: `${hour12.toString().padStart(2, '0')}:${minutes}`, period };
  };

  const convertTo24Hour = (time12, period) => {
    if (!time12) return '';
    const [hours, minutes] = time12.split(':');
    let hour24 = parseInt(hours);
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleTimeChange = (shiftType, timeType, time12, period) => {
    const time24 = convertTo24Hour(time12, period);
    const currentOperatingHours = settings?.general?.operatingHours || {};
    const currentShift = currentOperatingHours[shiftType] || {};
    
    handleSettingChange('general', 'operatingHours', {
      ...currentOperatingHours,
      [shiftType]: {
        ...currentShift,
        [timeType]: time24
      }
    });
  };

  useEffect(() => {
    loadSettings();
    loadCustomPlans();
  }, []);

  // Initialize document types if missing
  useEffect(() => {
    if (settings?.membership && (!settings.membership.idDocumentTypes || settings.membership.idDocumentTypes.length === 0)) {
      const defaultTypes = [
        { id: 'aadhar', label: 'Aadhar Card', enabled: true },
        { id: 'pan', label: 'PAN Card', enabled: true },
        { id: 'driving_license', label: 'Driving License', enabled: true },
        { id: 'passport', label: 'Passport', enabled: true },
        { id: 'voter_id', label: 'Voter ID', enabled: false },
        { id: 'other_govt', label: 'Other Government Document', enabled: true }
      ];
      handleSettingChange('membership', 'idDocumentTypes', defaultTypes);
    }
  }, [settings?.membership]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (window.api?.settings?.getSettings) {
        const response = await window.api.settings.getSettings();
        if (response && response.success && response.settings) {
          console.log('Loaded settings:', response.settings); // Debug log
          setSettings(prev => ({ ...prev, ...response.settings }));
        } else {
          console.log('No settings found, using defaults'); // Debug log
          // Ensure default document types are set if no settings exist
          setSettings(prev => ({
            ...prev,
            membership: {
              ...prev.membership,
              idDocumentTypes: prev.membership.idDocumentTypes || [
                { id: 'aadhar', label: 'Aadhar Card', enabled: true },
                { id: 'pan', label: 'PAN Card', enabled: true },
                { id: 'driving_license', label: 'Driving License', enabled: true },
                { id: 'passport', label: 'Passport', enabled: true },
                { id: 'voter_id', label: 'Voter ID', enabled: false },
                { id: 'other_govt', label: 'Other Government Document', enabled: true }
              ]
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomPlans = async () => {
    try {
      const result = await window.api.plan.list();
      if (result.success) {
        // Map database fields to Settings page fields
        const mappedPlans = result.data.map(plan => ({
          id: plan.id,
          name: plan.name,
          amount: plan.price,
          days: plan.duration_days,
          description: plan.description
        }));
        setSettings(prev => ({
          ...prev,
          payment: {
            ...prev?.payment,
            customPlans: mappedPlans
          }
        }));
      }
    } catch (err) {
      console.error('Failed to load custom plans:', err);
    }
  };

  // Holiday management functions
  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) {
      error('Please enter both date and holiday name');
      return;
    }

    const holidays = settings?.general?.holidays || [];
    const existingHoliday = holidays.find(h => h.date === newHoliday.date);
    if (existingHoliday) {
      error('Holiday already exists for this date');
      return;
    }

    const updatedHolidays = [...holidays, { ...newHoliday, id: Date.now() }];
    handleSettingChange('general', 'holidays', updatedHolidays);
    setNewHoliday({ date: '', name: '' });
    success('Holiday added successfully');
  };

  const removeHoliday = (holidayId) => {
    const holidays = settings?.general?.holidays || [];
    const updatedHolidays = holidays.filter(h => h.id !== holidayId);
    handleSettingChange('general', 'holidays', updatedHolidays);
    success('Holiday removed successfully');
  };

  // Logo handling functions
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        error('Logo file size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        handleSettingChange('general', 'logo', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    handleSettingChange('general', 'logo', null);
    success('Logo removed successfully');
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Validate operating hours
      const operatingHours = settings?.general?.operatingHours || {};
      const { dayShift = {}, nightShift = {}, enableNightShift = false } = operatingHours;
      if (dayShift.openTime >= dayShift.closeTime && !enableNightShift) {
        error('Day shift opening time must be before closing time');
        setLoading(false);
        return;
      }

      // Validate total seats
      const totalSeats = parseInt(settings.general.totalSeats);
      if (isNaN(totalSeats) || totalSeats <= 0) {
        error('Total seats must be a valid number greater than 0');
        setLoading(false);
        return;
      }

      // Ensure totalSeats is stored as a string for consistency with other settings
      settings.general.totalSeats = totalSeats.toString();

      // Validate payment plans (only if plans exist)
      const customPlans = settings?.payment?.customPlans || [];
      if (customPlans.length > 0) {
        const invalidPlans = customPlans.filter(plan => 
          !plan.name.trim() || !plan.amount || !plan.days || 
          parseFloat(plan.amount) <= 0 || parseInt(plan.days) <= 0
        );
        
        if (invalidPlans.length > 0) {
          error('All payment plans must have valid name, amount, and days');
          setLoading(false);
          return;
        }
      }

      // Validate document types - at least one should be enabled for better UX
      const enabledDocuments = settings?.membership?.idDocumentTypes?.filter(doc => doc.enabled) || [];
      if (enabledDocuments.length === 0) {
        const shouldContinue = confirm(
          'No document types are enabled for member registration. ' +
          'This means members can be added without providing identity documents. ' +
          'Do you want to continue saving these settings?'
        );
        
        if (!shouldContinue) {
          setLoading(false);
          return;
        }
      }

      if (window.api?.settings?.saveSettings) {
        const result = await window.api.settings.saveSettings(settings);
        if (result.success) {
          success('Settings saved successfully! System configurations have been applied.');
          
          // Apply settings system-wide (trigger any necessary updates)
          if (window.api?.settings?.applySystemWide) {
            await window.api.settings.applySystemWide(settings);
          }
        } else {
          error('Failed to save settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      error('Failed to save settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        general: {
          libraryName: 'Library Management System',
          address: '',
          phone: '',
          email: '',
          website: '',
          autoBackup: true,
          backupInterval: '24',
          theme: 'light',
          language: 'en'
        },
        membership: {
          defaultMembershipDuration: '12',
          membershipFee: '500',
          lateFeePerDay: '10',
          maxBooksPerMember: '3',
          maxRenewalDays: '15',
          requireDeposit: false,
          depositAmount: '200'
        },
        attendance: {
          autoMarkAbsent: true,
          absentAfterHours: '2',
          allowManualEdit: true,
          notifyOnAbsence: false,
          maxConsecutiveAbsences: '7',
          autoCheckOutHours: '12'
        },
        payment: {
          currency: 'INR',
          allowPartialPayments: true,
          paymentReminderDays: '7',
          autoGenerateReceipts: true,
          acceptCash: true,
          acceptOnline: false,
          onlinePaymentGateway: 'none'
        },
        notifications: {
          enableDesktopNotifications: true,
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
          backupLocation: 'local',
          backupFrequency: 'daily',
          keepBackupsFor: '30',
          cloudBackup: false,
          cloudProvider: 'none'
        }
      });
      success('Settings reset to defaults');
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      if (window.api?.backup?.createBackup) {
        await window.api.backup.createBackup();
        success('Backup created successfully');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async () => {
    if (confirm('Are you sure you want to restore from backup? This will replace all current data.')) {
      setLoading(true);
      try {
        if (window.api?.backup?.restoreBackup) {
          await window.api.backup.restoreBackup();
          success('Backup restored successfully');
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
        error('Failed to restore backup');
      } finally {
        setLoading(false);
      }
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      if (window.api?.data?.exportData) {
        await window.api.data.exportData();
        success('Data exported successfully');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'membership', label: 'Member Registration', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'payment', label: 'Payment', icon: '💰' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'backup', label: 'Backup & Data', icon: '💾' }
  ];

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>📚 Study Room Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Study Room Name *</label>
          <input
            type="text"
            value={settings?.general?.libraryName ?? ''}
            onChange={(e) => handleSettingChange('general', 'libraryName', e.target.value)}
            className="form-control"
            placeholder="Enter your study room business name"
            required
          />
        </div>
        <div className="form-group">
          <label>Total Seats *</label>
          <input
            type="number"
            value={settings?.general?.totalSeats ?? ''}
            onChange={(e) => handleSettingChange('general', 'totalSeats', e.target.value)}
            className="form-control"
            min="1"
            max="500"
            placeholder="Total number of seats available (default: 50)"
            required
          />
          <small className="form-help">This value is applied system-wide for seat allocation</small>
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea
            value={settings.general.address ?? ''}
            onChange={(e) => handleSettingChange('general', 'address', e.target.value)}
            className="form-control"
            rows="3"
            placeholder="Complete business address"
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={settings.general.phone ?? ''}
            onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
            className="form-control"
            placeholder="Contact phone number"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={settings.general.email ?? ''}
            onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
            className="form-control"
            placeholder="Business email address"
          />
        </div>
        <div className="form-group">
          <label>Website</label>
          <input
            type="url"
            value={settings.general.website ?? ''}
            onChange={(e) => handleSettingChange('general', 'website', e.target.value)}
            className="form-control"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      <h3>⏰ Operating Hours</h3>
      <div className="form-grid">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings?.general?.operatingHours?.enableNightShift || false}
              onChange={(e) => handleSettingChange('general', 'operatingHours', {
                ...settings.general.operatingHours,
                enableNightShift: e.target.checked
              })}
            />
            Enable Night Shift
          </label>
        </div>
      </div>
      
      <div className="operating-hours-grid">
        <div className="shift-section">
          <h4>Day Shift</h4>
          <div className="time-inputs">
            <div className="form-group">
              <label>Opening Time</label>
              <div className="time-input-group">
                <input
                  type="time"
                  value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime)?.time ?? ''}
                  onChange={(e) => handleTimeChange('dayShift', 'openTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime).period)}
                  className="form-control"
                />
                <select
                  value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime)?.period ?? ''}
                  onChange={(e) => handleTimeChange('dayShift', 'openTime', convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime).time, e.target.value)}
                  className="form-control"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Closing Time</label>
              <div className="time-input-group">
                <input
                  type="time"
                  value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime)?.time ?? ''}
                  onChange={(e) => handleTimeChange('dayShift', 'closeTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime).period)}
                  className="form-control"
                />
                <select
                  value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime)?.period ?? ''}
                  onChange={(e) => handleTimeChange('dayShift', 'closeTime', convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime).time, e.target.value)}
                  className="form-control"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {settings?.general?.operatingHours?.enableNightShift && (
          <div className="shift-section">
            <h4>Night Shift</h4>
            <div className="time-inputs">
              <div className="form-group">
                <label>Opening Time</label>
                <div className="time-input-group">
                  <input
                    type="time"
                    value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime)?.time ?? ''}
                    onChange={(e) => handleTimeChange('nightShift', 'openTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime).period)}
                    className="form-control"
                  />
                  <select
                    value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime)?.period ?? ''}
                    onChange={(e) => handleTimeChange('nightShift', 'openTime', convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime).time, e.target.value)}
                    className="form-control"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Closing Time</label>
                <div className="time-input-group">
                  <input
                    type="time"
                    value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime)?.time ?? ''}
                    onChange={(e) => handleTimeChange('nightShift', 'closeTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime).period)}
                    className="form-control"
                  />
                  <select
                    value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime)?.period ?? ''}
                    onChange={(e) => handleTimeChange('nightShift', 'closeTime', convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime).time, e.target.value)}
                    className="form-control"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <small className="form-help">Operating hours are enforced for attendance check-in and check-out validation</small>

      <h3>🎨 Business Logo</h3>
      <div className="logo-section">
        {settings.general.logo || logoPreview ? (
          <div className="logo-preview">
            <img 
              src={logoPreview || settings.general.logo} 
              alt="Business Logo"
              className="logo-image"
            />
            <div className="logo-actions">
              <label className="button button-secondary">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                Change Logo
              </label>
              <button 
                type="button" 
                onClick={removeLogo}
                className="button button-danger"
              >
                Remove Logo
              </button>
            </div>
          </div>
        ) : (
          <div className="logo-upload">
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-placeholder">
                <span className="upload-icon">📸</span>
                <p>Click to upload business logo</p>
                <small>Supports: JPEG, PNG, GIF, WebP (Max: 5MB)</small>
              </div>
            </label>
          </div>
        )}
      </div>
      <small className="form-help">Logo will be displayed in receipts, invoices, and dashboards</small>

      <h3>📅 Holiday Schedule</h3>
      <div className="holiday-section">
        <div className="add-holiday">
          <div className="holiday-inputs">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
              className="form-control"
              placeholder="Select date"
            />
            <input
              type="text"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
              className="form-control"
              placeholder="Holiday name"
            />
            <button
              type="button"
              onClick={addHoliday}
              className="button button-primary"
            >
              Add Holiday
            </button>
          </div>
        </div>
        
        <div className="holidays-list">
          {(settings?.general?.holidays || []).length > 0 ? (
            <table className="holidays-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(settings?.general?.holidays || []).map(holiday => (
                  <tr key={holiday.id}>
                    <td>{new Date(holiday.date).toLocaleDateString()}</td>
                    <td>{holiday.name}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeHoliday(holiday.id)}
                        className="button button-sm button-danger"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-holidays">No holidays added yet</p>
          )}
        </div>
      </div>
      <small className="form-help">Holidays are considered in booking, attendance, and notification modules</small>

      <h3>🌐 Locale & Formatting</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Date Format</label>
          <select
            value={settings?.general?.locale?.dateFormat || 'dd/MM/yyyy'}
            onChange={(e) => handleSettingChange('general', 'locale', {
              ...settings?.general?.locale,
              dateFormat: e.target.value
            })}
            className="form-control"
          >
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </select>
        </div>
        <div className="form-group">
          <label>Time Format</label>
          <select
            value={settings?.general?.locale?.timeFormat || '24hour'}
            onChange={(e) => handleSettingChange('general', 'locale', {
              ...settings?.general?.locale,
              timeFormat: e.target.value
            })}
            className="form-control"
          >
            <option value="12hour">12-hour (AM/PM)</option>
            <option value="24hour">24-hour</option>
          </select>
        </div>
      </div>

      <h3>🔧 System Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Theme</label>
          <select
            value={settings.general.theme}
            onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
            className="form-control"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div className="form-group">
          <label>Language</label>
          <select
            value={settings.general.language}
            onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
            className="form-control"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
          </select>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.general.autoBackup}
              onChange={(e) => handleSettingChange('general', 'autoBackup', e.target.checked)}
            />
            Enable Auto Backup
          </label>
        </div>
        <div className="form-group">
          <label>Backup Interval (hours)</label>
          <input
            type="number"
            value={settings.general.backupInterval}
            onChange={(e) => handleSettingChange('general', 'backupInterval', e.target.value)}
            className="form-control"
            min="1"
            max="168"
            disabled={!settings.general.autoBackup}
          />
        </div>
      </div>
    </div>
  );

  const renderMembershipSettings = () => {
    return (
    <div className="settings-section">
      <h3>� Member Registration Settings</h3>
      <p className="section-description">
        Configure member registration requirements including required documents and default settings.
      </p>
      <div className="form-grid">
        {/* <div className="form-group">
          <label>ID Number Field Label</label>
          <input
            type="text"
            value={settings.membership.idNumber || 'Government ID / Membership Card Number'}
            onChange={(e) => handleSettingChange('membership', 'idNumber', e.target.value)}
            className="form-control"
            placeholder="Label for ID number field in member forms"
          />
          <small className="form-help">This label will appear in member registration and profile forms</small>
        </div> */}
        
        {/* <div className="form-group">
          <label>Default ID Document Type</label>
          <select
            value={settings?.membership?.selectedIdDocumentType || ''}
            onChange={(e) => handleSettingChange('membership', 'selectedIdDocumentType', e.target.value)}
            className="form-control"
          >
            {(settings?.membership?.idDocumentTypes || []).filter(doc => doc.enabled).map(docType => (
              <option key={docType.id} value={docType.id}>
                {docType.label}
              </option>
            ))}
          </select>
          <small className="form-help">Default document type that will be selected when adding new members</small>
        </div> */}

        <div className="form-group">
          <label>Deposit Amount (₹)</label>
          <input
            type="number"
            value={settings.membership.depositAmount}
            onChange={(e) => handleSettingChange('membership', 'depositAmount', e.target.value)}
            className="form-control"
            min="0"
            step="50"
            placeholder="Security deposit amount"
            required
          />
          <small className="form-help">Security deposit required from each member</small>
        </div>
      </div>

      <div className="id-document-types">
        <div className="document-header">
          <h4>📄 Document Selection for Member Registration</h4>
          <div className="document-actions">
            <button 
              type="button" 
              className="button button-secondary button-sm"
              onClick={() => {
                const updatedTypes = settings.membership.idDocumentTypes.map(doc => ({ ...doc, enabled: true }));
                handleSettingChange('membership', 'idDocumentTypes', updatedTypes);
              }}
            >
              Enable All
            </button>
            <button 
              type="button" 
              className="button button-secondary button-sm"
              onClick={() => {
                const updatedTypes = settings.membership.idDocumentTypes.map(doc => ({ ...doc, enabled: false }));
                handleSettingChange('membership', 'idDocumentTypes', updatedTypes);
              }}
            >
              Disable All
            </button>
          </div>
        </div>
        <p className="section-description">
          Select which document types should appear in the "Add New Member" form. 
          Only enabled documents will be available for selection during member registration.
        </p>
        
        <div className="document-types-grid">
          {(settings?.membership?.idDocumentTypes || []).length === 0 ? (
            <div className="no-document-types">
              <p>No document types found. Initializing default types...</p>
              <button 
                type="button" 
                className="button button-primary"
                onClick={() => {
                  const defaultTypes = [
                    { id: 'aadhar', label: 'Aadhar Card', enabled: true },
                    { id: 'pan', label: 'PAN Card', enabled: true },
                    { id: 'driving_license', label: 'Driving License', enabled: true },
                    { id: 'passport', label: 'Passport', enabled: true },
                    { id: 'voter_id', label: 'Voter ID', enabled: false },
                    { id: 'other_govt', label: 'Other Government Document', enabled: true }
                  ];
                  handleSettingChange('membership', 'idDocumentTypes', defaultTypes);
                }}
              >
                Initialize Document Types
              </button>
            </div>
          ) : (
            (settings.membership.idDocumentTypes).map((docType, index) => (
              <div key={docType.id} className={`document-type-item ${docType.enabled ? 'enabled' : 'disabled'}`}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={docType.enabled}
                    onChange={(e) => {
                      const updatedTypes = [...settings.membership.idDocumentTypes];
                      updatedTypes[index].enabled = e.target.checked;
                      handleSettingChange('membership', 'idDocumentTypes', updatedTypes);
                    }}
                  />
                  <span className="document-label">
                    {docType.label}
                    {docType.enabled && <span className="status-badge">✓ Enabled</span>}
                  </span>
                </label>
                <small className="document-help">
                  {docType.enabled 
                    ? 'Will appear in member registration form' 
                    : 'Hidden from member registration form'
                  }
                </small>
              </div>
            ))
          )}
        </div>
        
        <div className="settings-preview">
          <h5>🔍 Preview: Selected Documents</h5>
          <div className="preview-stats">
            <span className="stat-badge">
              {(settings?.membership?.idDocumentTypes || []).filter(doc => doc.enabled).length} of {(settings?.membership?.idDocumentTypes || []).length} enabled
            </span>
          </div>
          <div className="enabled-documents">
            {(settings?.membership?.idDocumentTypes || [])
              .filter(doc => doc.enabled)
              .map(doc => (
                <span key={doc.id} className="preview-badge">
                  {doc.label}
                </span>
              ))
            }
            {(settings?.membership?.idDocumentTypes || []).filter(doc => doc.enabled).length === 0 && (
              <span className="no-documents">⚠️ No documents selected. Members won't be able to provide ID documents.</span>
            )}
          </div>
          <small className="preview-help">
            These are the document types that will appear in the member registration dropdown.
          </small>
        </div>
      </div>
    </div>
    );
  };

  const renderAttendanceSettings = () => (
    <div className="settings-section">
      <h3>Attendance Configuration</h3>
      <div className="form-grid">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.attendance.autoMarkAbsent}
              onChange={(e) => handleSettingChange('attendance', 'autoMarkAbsent', e.target.checked)}
            />
            Auto Mark Absent After Specified Hours
          </label>
        </div>
        <div className="form-group">
          <label>Mark Absent After (hours)</label>
          <input
            type="number"
            value={settings.attendance.absentAfterHours}
            onChange={(e) => handleSettingChange('attendance', 'absentAfterHours', e.target.value)}
            className="form-control"
            min="1"
            max="24"
            disabled={!settings.attendance.autoMarkAbsent}
          />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.attendance.allowManualEdit}
              onChange={(e) => handleSettingChange('attendance', 'allowManualEdit', e.target.checked)}
            />
            Allow Manual Attendance Edit
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.attendance.notifyOnAbsence}
              onChange={(e) => handleSettingChange('attendance', 'notifyOnAbsence', e.target.checked)}
            />
            Notify on Absence
          </label>
        </div>
        <div className="form-group">
          <label>Max Consecutive Absences</label>
          <input
            type="number"
            value={settings.attendance.maxConsecutiveAbsences}
            onChange={(e) => handleSettingChange('attendance', 'maxConsecutiveAbsences', e.target.value)}
            className="form-control"
            min="1"
            max="30"
          />
        </div>
        <div className="form-group">
          <label>Auto Check-out After (hours)</label>
          <input
            type="number"
            value={settings.attendance.autoCheckOutHours}
            onChange={(e) => handleSettingChange('attendance', 'autoCheckOutHours', e.target.value)}
            className="form-control"
            min="1"
            max="24"
          />
          <small className="form-help">Members will be automatically checked out after this many hours</small>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => {
    const addNewPlan = async () => {
      const newPlan = {
        name: 'New Plan',
        duration_days: 30,
        price: 1000,
        description: 'Custom membership plan'
      };
      
      try {
        const result = await window.api.plan.add(newPlan);
        if (result.success) {
          // Reload plans to get the updated list with the new database ID
          await loadCustomPlans();
          success('New plan added successfully');
        } else {
          error('Failed to add plan: ' + result.message);
        }
      } catch (err) {
        error('Failed to add plan');
        console.error(err);
      }
    };

    const updatePlan = async (planId, field, value) => {
      try {
        const currentPlans = settings?.payment?.customPlans || [];
        const planToUpdate = currentPlans.find(plan => plan.id === planId);
        if (!planToUpdate) return;

        // Update the local state immediately for responsive UI
        const updatedPlan = { ...planToUpdate, [field]: value };
        
        // Map Settings page fields to database fields and ensure no null values
        const dbPlan = {
          name: updatedPlan.name || planToUpdate.name || 'New Plan',
          duration_days: updatedPlan.days || updatedPlan.duration_days || 30,
          price: updatedPlan.amount || updatedPlan.price || 1000,
          description: updatedPlan.description || planToUpdate.description || 'Custom membership plan'
        };
        
        // Ensure required fields are not null or empty
        if (!dbPlan.name || dbPlan.name.trim() === '') {
          dbPlan.name = 'New Plan';
        }
        if (!dbPlan.duration_days || isNaN(dbPlan.duration_days) || dbPlan.duration_days < 1) {
          dbPlan.duration_days = 30;
        }
        if (!dbPlan.price || isNaN(dbPlan.price) || dbPlan.price < 0) {
          dbPlan.price = 1000;
        }
        
        const result = await window.api.plan.update(planId, dbPlan);
        
        if (result.success) {
          // Update local state with the corrected values
          const updatedPlans = currentPlans.map(plan =>
            plan.id === planId ? { 
              ...plan, 
              [field]: value,
              // Also sync the database field names for consistency
              name: dbPlan.name,
              duration_days: dbPlan.duration_days,
              price: dbPlan.price,
              description: dbPlan.description,
              // Keep UI field names in sync
              days: dbPlan.duration_days,
              amount: dbPlan.price
            } : plan
          );
          handleSettingChange('payment', 'customPlans', updatedPlans);
        } else {
          error('Failed to update plan: ' + result.message);
        }
      } catch (err) {
        error('Failed to update plan');
        console.error(err);
      }
    };

    const deletePlan = async (planId) => {
      try {
        const result = await window.api.plan.delete(planId);
        if (result.success) {
          // Remove from local state
          const currentPlans = settings?.payment?.customPlans || [];
          const updatedPlans = currentPlans.filter(plan => plan.id !== planId);
          handleSettingChange('payment', 'customPlans', updatedPlans);
          success('Plan deleted successfully');
        } else {
          error('Failed to delete plan: ' + result.message);
        }
      } catch (err) {
        error('Failed to delete plan');
        console.error(err);
      }
    };

    const loadCustomPlans = async () => {
      try {
        const result = await window.api.plan.list();
        if (result.success) {
          // Map database fields to UI fields for consistent display
          const mappedPlans = result.data.map(plan => ({
            ...plan,
            // Map database fields to UI fields
            days: plan.duration_days,
            amount: plan.price,
            // Keep original database fields for reference
            duration_days: plan.duration_days,
            price: plan.price
          }));
          handleSettingChange('payment', 'customPlans', mappedPlans);
        }
      } catch (err) {
        console.error('Failed to load custom plans:', err);
      }
    };

    return (
      <div className="settings-section">
        <h3>💰 Payment Configuration</h3>
        
        <div className="payment-section">
          <h4>Custom Membership Plans</h4>
          <p className="section-description">Configure multiple membership plans with different durations and pricing</p>
          
          <div className="plans-container">
            {(settings?.payment?.customPlans || []).length === 0 ? (
              <div className="empty-plans-message">
                <p>No custom plans created yet. Click "Add New Plan" to create your first membership plan.</p>
              </div>
            ) : (
              (settings?.payment?.customPlans || []).map((plan, index) => (
                <div key={plan.id} className="plan-item">
                  <div className="plan-header">
                    <h5>Plan {index + 1}</h5>
                    {(settings?.payment?.customPlans || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => deletePlan(plan.id)}
                        className="button button-danger-small"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                
                <div className="plan-fields">
                  <div className="form-group">
                    <label>Plan Name *</label>
                    <input
                      type="text"
                      value={plan.name ?? ''}
                      onChange={(e) => updatePlan(plan.id, 'name', e.target.value)}
                      className="form-control"
                      placeholder="e.g., Monthly Plan, Student Plan"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input
                      type="number"
                      value={plan.amount ?? plan.price ?? ''}
                      onChange={(e) => updatePlan(plan.id, 'amount', e.target.value)}
                      className="form-control"
                      min="1"
                      step="50"
                      placeholder="Plan amount (default: 1000)"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Duration (Days) *</label>
                    <input
                      type="number"
                      value={plan.days ?? plan.duration_days ?? ''}
                      onChange={(e) => updatePlan(plan.id, 'days', e.target.value)}
                      className="form-control"
                      min="1"
                      placeholder="Number of days (default: 30)"
                      required
                    />
                  </div>
                  
                  {/* <div className="form-group full-width">
                    <label>Description</label>
                    <input
                      type="text"
                      value={plan.description ?? ''}
                      onChange={(e) => updatePlan(plan.id, 'description', e.target.value)}
                      className="form-control"
                      placeholder="Brief description of the plan"
                    />
                  </div> */}
                </div>
              </div>
              ))
            )}
            
            <button
              type="button"
              onClick={addNewPlan}
              className="button button-secondary add-plan-btn"
            >
              ➕ Add New Plan
            </button>
          </div>
        </div>

        <div className="payment-section">
          <h4>General Settings</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Currency</label>
              <select
                value={settings.payment.currency}
                onChange={(e) => handleSettingChange('payment', 'currency', e.target.value)}
                className="form-control"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* <div className="payment-section">
          <h4>Discount Section</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Discount Type</label>
              <select
                value={settings.payment.discountType}
                onChange={(e) => handleSettingChange('payment', 'discountType', e.target.value)}
                className="form-control"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Discount {settings.payment.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
              </label>
              <input
                type="number"
                value={settings.payment.discountAmount}
                onChange={(e) => handleSettingChange('payment', 'discountAmount', e.target.value)}
                className="form-control"
                min="0"
                max={settings.payment.discountType === 'percentage' ? '100' : undefined}
                step={settings.payment.discountType === 'percentage' ? '1' : '50'}
                placeholder={settings.payment.discountType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter discount amount'}
              />
            </div>
          </div>
        </div> */}

        <div className="payment-section">
          <h4>Payment Options</h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.payment.autoGenerateReceipts}
                  onChange={(e) => handleSettingChange('payment', 'autoGenerateReceipts', e.target.checked)}
                />
                Auto Generate Receipts
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.payment.acceptCash}
                  onChange={(e) => handleSettingChange('payment', 'acceptCash', e.target.checked)}
                />
                Accept Cash Payments
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.payment.acceptOnline}
                  onChange={(e) => handleSettingChange('payment', 'acceptOnline', e.target.checked)}
                />
                Accept Online Payments
              </label>
            </div>
            <div className="form-group">
              <label>Online Payment Gateway</label>
              <select
                value={settings.payment.onlinePaymentGateway}
                onChange={(e) => handleSettingChange('payment', 'onlinePaymentGateway', e.target.value)}
                className="form-control"
                disabled={!settings.payment.acceptOnline}
              >
                <option value="none">None</option>
                <option value="razorpay">Razorpay</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="googlepay">Google Pay</option>
              </select>
            </div>
          </div>
        </div>

        {/* <div className="info-section">
          <h4>ℹ️ Important Notes</h4>
          <ul>
            <li>Partial Payments feature has been removed for simplified payment processing</li>
            <li>Multiple plans allow different membership durations and pricing</li>
            <li>Payment reminder notifications are configured in the Notifications section</li>
            <li>All payment settings are applied immediately after saving</li>
          </ul>
        </div> */}
      </div>
    );
  };

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>🔔 Notification Preferences</h3>
      
      <div className="notification-section">
        <h4>Notification Of Expiring Memberships</h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.notifications.enableEmailNotifications}
                onChange={(e) => handleSettingChange('notifications', 'enableEmailNotifications', e.target.checked)}
              />
              Enable Email Notifications
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.notifications.enableSMSNotifications}
                onChange={(e) => handleSettingChange('notifications', 'enableSMSNotifications', e.target.checked)}
              />
              Enable SMS Notifications
            </label>
          </div>
        </div>
      </div>

      <div className="notification-section">
        <h4>Membership Notifications</h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.notifications.membershipExpiryReminder}
                onChange={(e) => handleSettingChange('notifications', 'membershipExpiryReminder', e.target.checked)}
              />
              Membership Expiry Reminders
            </label>
          </div>
          <div className="form-group">
            <label>Reminder Days Before Expiry</label>
            <input
              type="number"
              value={settings.notifications.reminderDaysBefore}
              onChange={(e) => handleSettingChange('notifications', 'reminderDaysBefore', e.target.value)}
              className="form-control"
              min="1"
              max="30"
              disabled={!settings.notifications.membershipExpiryReminder}
            />
          </div>
        </div>
      </div>

      {/* <div className="notification-section">
        <h4>Payment Notifications</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Payment Reminder (days before due)</label>
            <input
              type="number"
              value={settings.notifications.paymentReminderDays}
              onChange={(e) => handleSettingChange('notifications', 'paymentReminderDays', e.target.value)}
              className="form-control"
              min="1"
              max="30"
              placeholder="Days before payment due date"
            />
            <small className="form-help">Members will receive payment reminders this many days before their payment is due</small>
          </div>
        </div>
      </div> */}

      <div className="notification-section">
        <h4>Other Notifications</h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.notifications.birthdayWishes}
                onChange={(e) => handleSettingChange('notifications', 'birthdayWishes', e.target.checked)}
              />
              Send Birthday Wishes
            </label>
          </div>
        </div>
      </div>

      {/* <div className="info-section">
        <h4>ℹ️ Changes Made</h4>
        <ul>
          <li>Desktop Notifications have been removed</li>
          <li>Payment Reminder setting moved from Payment section to here</li>
          <li>All notification settings are applied immediately</li>
        </ul>
      </div> */}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Security Configuration</h3>
      
      {/* Password Management Section */}
      <div className="security-subsection">
        <h4>Password Management</h4>
        <div className="action-buttons">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="button button-primary"
          >
            🔒 Change Password
          </button>
        </div>
        <small className="form-help">
          Change your password with email verification for enhanced security
        </small>
      </div>

      {/* Session & Access Control */}
      <div className="security-subsection">
        <h4>Session & Access Control</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
              className="form-control"
              min="5"
              max="480"
            />
            <small className="form-help">Automatically logout after inactivity</small>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.security.logUserActions}
                onChange={(e) => handleSettingChange('security', 'logUserActions', e.target.checked)}
              />
              Log User Actions
            </label>
            <small className="form-help">Keep track of all user activities for audit purposes</small>
          </div>
        </div>
      </div>

      {/* Authentication Options */}
      <div className="security-subsection">
        <h4>Advanced Authentication</h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.security.enableBiometric}
                onChange={(e) => handleSettingChange('security', 'enableBiometric', e.target.checked)}
              />
              Enable Biometric Authentication
            </label>
            <small className="form-help">Use fingerprint scanner for member check-in/out</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="settings-section">
      <h3>Backup Configuration</h3>
      <div className="form-grid">
        
        <div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.backup.autoBackup}
                onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
              />
              Enable Auto Backup
            </label>
          </div>
          <div className="form-group">
            <label>Backup Frequency</label>
            <select
              value={settings.backup.backupFrequency}
              onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
              className="form-control"
              disabled={!settings.backup.autoBackup}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

        </div>
        <div className="form-group">
          <label>Keep Backups For (days)</label>
          <input
            type="number"
            value={settings.backup.keepBackupsFor}
            onChange={(e) => handleSettingChange('backup', 'keepBackupsFor', e.target.value)}
            className="form-control"
            min="1"
            max="365"
          />
        </div>
        {/* <div className="form-group">
          <label>Backup Location</label>
          <select
            value={settings.backup.backupLocation}
            onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
            className="form-control"
          >
            <option value="local">Local Storage</option>
            <option value="external">External Drive</option>
            <option value="network">Network Drive</option>
          </select>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.backup.cloudBackup}
              onChange={(e) => handleSettingChange('backup', 'cloudBackup', e.target.checked)}
            />
            Enable Cloud Backup
          </label>
        </div> */}
        {/* <div className="form-group">
          <label>Cloud Provider</label>
          <select
            value={settings.backup.cloudProvider}
            onChange={(e) => handleSettingChange('backup', 'cloudProvider', e.target.value)}
            className="form-control"
            disabled={!settings.backup.cloudBackup}
          >
            <option value="none">None</option>
            <option value="google">Google Drive</option>
            <option value="dropbox">Dropbox</option>
            <option value="onedrive">OneDrive</option>
            <option value="aws">AWS S3</option>
          </select>
        </div> */}
      </div>

      <h3>Data Management</h3>
      <div className="action-buttons">
        <button 
          onClick={createBackup} 
          className="button button-primary"
          disabled={loading}
        >
          🔄 Create Backup Now
        </button>
        <button 
          onClick={restoreBackup} 
          className="button button-secondary"
          disabled={loading}
        >
          📥 Restore from Backup
        </button>
        <button 
          onClick={exportData} 
          className="button button-info"
          disabled={loading}
        >
          📤 Export Data
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'membership':
        return renderMembershipSettings();
      case 'attendance':
        return renderAttendanceSettings();
      case 'payment':
        return renderPaymentSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return renderGeneralSettings();
    }
  };

  // Password change helper functions
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password must contain at least one special character');
    return errors;
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeStep(1);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      otp: ''
    });
    setOtpSent(false);
    setPasswordLoading(false);
    setOtpExpiryTime(null);
  };

  const handlePasswordChangeRequest = async () => {
    try {
      // Validate current form
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        error('All fields are required');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        error('New passwords do not match');
        return;
      }

      const passwordErrors = validatePassword(passwordForm.newPassword);
      if (passwordErrors.length > 0) {
        error(passwordErrors.join(', '));
        return;
      }

      setPasswordLoading(true);

      // Request OTP from backend
      const result = await requestPasswordChangeOTP({
        currentPassword: passwordForm.currentPassword,
        userId: user?.id
      });

      if (result.success) {
        setOtpSent(true);
        setPasswordChangeStep(2);
        setOtpExpiryTime(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        success('OTP sent to your registered email address');
      } else {
        error(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      error('Failed to process password change request');
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChangeComplete = async () => {
    try {
      if (!passwordForm.otp) {
        error('Please enter the OTP');
        return;
      }

      setPasswordLoading(true);

      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        otp: passwordForm.otp,
        userId: user?.id
      });

      if (result.success) {
        success('Password changed successfully');
        resetPasswordModal();
      } else {
        error(result.message || 'Failed to change password');
      }
    } catch (err) {
      error('Failed to change password');
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderPasswordChangeModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetPasswordModal()}>
        <div className="modal-content password-change-modal">
          <div className="modal-header">
            <h3>🔒 Change Password</h3>
            <button className="modal-close" onClick={resetPasswordModal}>×</button>
          </div>

          <div className="modal-body">
            {passwordChangeStep === 1 ? (
              <>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                    className="form-control"
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                    className="form-control"
                    placeholder="Enter new password"
                  />
                  <div className="password-requirements">
                    <small>Password must contain:</small>
                    <ul>
                      <li className={passwordForm.newPassword.length >= 8 ? 'valid' : ''}>At least 8 characters</li>
                      <li className={/[A-Z]/.test(passwordForm.newPassword) ? 'valid' : ''}>One uppercase letter</li>
                      <li className={/[a-z]/.test(passwordForm.newPassword) ? 'valid' : ''}>One lowercase letter</li>
                      <li className={/[0-9]/.test(passwordForm.newPassword) ? 'valid' : ''}>One number</li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? 'valid' : ''}>One special character</li>
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                    className="form-control"
                    placeholder="Confirm new password"
                  />
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <small className="error-text">Passwords do not match</small>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="otp-verification">
                  <p>An OTP has been sent to your registered email address. Please enter it below to complete the password change.</p>
                  
                  <div className="form-group">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      value={passwordForm.otp}
                      onChange={(e) => handlePasswordFormChange('otp', e.target.value)}
                      className="form-control"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                    />
                  </div>

                  {otpExpiryTime && (
                    <div className="otp-timer">
                      <small>OTP expires in: {Math.max(0, Math.ceil((otpExpiryTime - Date.now()) / 60000))} minutes</small>
                    </div>
                  )}

                  <button 
                    onClick={handlePasswordChangeRequest}
                    className="button button-link"
                    disabled={passwordLoading}
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button 
              onClick={resetPasswordModal}
              className="button button-secondary"
              disabled={passwordLoading}
            >
              Cancel
            </button>
            {passwordChangeStep === 1 ? (
              <button 
                onClick={handlePasswordChangeRequest}
                className="button button-primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <button 
                onClick={handlePasswordChangeComplete}
                className="button button-primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Configure your library management system</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading settings...</p>
        </div>
      ) : !settings || !settings.general ? (
        <div className="error-container">
          <p>Error loading settings. Please refresh the page.</p>
        </div>
      ) : (
        <div className="settings-content">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="settings-panel">
            {renderTabContent()}

            <div className="settings-actions">
              <button 
                onClick={saveSettings} 
                className="button button-primary"
                disabled={loading}
              >
                {loading ? '💾 Saving...' : '💾 Save Settings'}
              </button>
              <button 
                onClick={resetToDefaults} 
                className="button button-secondary"
                disabled={loading}
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {renderPasswordChangeModal()}
    </div>
  );
};

export default Settings;
