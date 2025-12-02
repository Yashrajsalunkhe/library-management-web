import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const Settings = () => {
  const { success, error } = useNotification();
  const { requestPasswordChangeOTP, changePassword, changeUsername, user } = useAuth();
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
    },
    // Environment Variables
    environment: {
      EMAIL_HOST: '',
      EMAIL_PORT: '',
      EMAIL_USER: '',
      EMAIL_PASS: '',
      EMAIL_FROM: '',
      GUPSHUP_API_KEY: '',
      GUPSHUP_APP_NAME: '',
      GUPSHUP_BASE_URL: '',
      BIOMETRIC_DEVICE_IP: '',
      BIOMETRIC_DEVICE_PORT: '',
      BIOMETRIC_TIMEOUT: '',
      BIOMETRIC_INTERNAL_TIMEOUT: '',
      BIOMETRIC_POLL_INTERVAL: '',
      DB_BACKUP_INTERVAL: '',
      NOTIFICATION_DAYS_BEFORE_EXPIRY: '',
      AUTO_BACKUP_PATH: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [newPlan, setNewPlan] = useState({ 
    name: '', 
    duration: '1', 
    durationUnit: 'months', 
    amount: '' 
  });
  const [backupList, setBackupList] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [envLoading, setEnvLoading] = useState(false);
  const [envSaving, setEnvSaving] = useState(false);

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

  // Username change state
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameForm, setUsernameForm] = useState({
    currentPassword: '',
    newUsername: ''
  });
  const [usernameLoading, setUsernameLoading] = useState(false);

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
    loadEnvironmentVariables();
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

  // Load backups when backup tab is active
  useEffect(() => {
    if (activeTab === 'backup') {
      loadBackups();
    }
  }, [activeTab]);

  // Load environment variables when environment tab is active
  useEffect(() => {
    if (activeTab === 'environment') {
      loadEnvironmentVariables();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (api?.settings?.getSettings) {
        const response = await api.settings.getSettings();
        if (response && response.success && response.settings) {
          console.log('Loaded settings:', response.settings); // Debug log

          // Transform flat settings structure from DB to nested structure for UI
          const transformedSettings = { ...settings }; // Start with defaults
          
          Object.entries(response.settings).forEach(([key, value]) => {
            // Handle nested keys like 'general.totalSeats'
            if (key === 'total_seats') {
              transformedSettings.general = transformedSettings.general || {};
              transformedSettings.general.totalSeats = value ? value.toString() : '50';
            } else if (key === 'library_name') {
              transformedSettings.general = transformedSettings.general || {};
              transformedSettings.general.libraryName = value || 'Library Management System';
            }
            // Add more transformations as needed for other settings
          });

          setSettings(transformedSettings);
        } else {
          console.log('No settings found, using defaults'); // Debug log
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
      const result = await api.plan.list();
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

  const loadEnvironmentVariables = async () => {
    setEnvLoading(true);
    try {
      if (api?.env?.getVariables) {
        const result = await api.env.getVariables();
        if (result.success) {
          setSettings(prev => ({
            ...prev,
            environment: {
              ...prev.environment,
              ...result.data
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load environment variables:', err);
      error('Failed to load environment variables');
    } finally {
      setEnvLoading(false);
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

  const saveGeneralSettings = async () => {
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

      // Validate totalSeats
      const rawTotalSeats = settings.general.totalSeats;
      const totalSeatsNum = parseInt(rawTotalSeats, 10);
      if (isNaN(totalSeatsNum) || totalSeatsNum <= 0) {
        error('Total seats must be a valid number greater than 0');
        setLoading(false);
        return;
      }

      // Save total_seats as a standalone setting in database
      const settingsToSave = {
        total_seats: totalSeatsNum,
        library_name: settings.general.libraryName || 'Library Management System',
        library_address: settings.general.address || '',
        library_phone: settings.general.phone || '',
        library_email: settings.general.email || ''
      };

      if (api?.settings?.updateSettings) {
        const result = await api.settings.updateSettings(settingsToSave);
        if (result.success) {
          success('General settings saved successfully!');
        } else {
          error('Failed to save general settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving general settings:', error);
      error('Failed to save general settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMembershipSettings = async () => {
    setLoading(true);
    try {
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

      if (api?.settings?.saveSettings) {
        const result = await api.settings.saveSettings({ membership: settings.membership });
        if (result.success) {
          success('Membership settings saved successfully!');
        } else {
          error('Failed to save membership settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving membership settings:', error);
      error('Failed to save membership settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAttendanceSettings = async () => {
    setLoading(true);
    try {
      if (api?.settings?.saveSettings) {
        const result = await api.settings.saveSettings({ attendance: settings.attendance });
        if (result.success) {
          success('Attendance settings saved successfully!');
        } else {
          error('Failed to save attendance settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving attendance settings:', error);
      error('Failed to save attendance settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    setLoading(true);
    try {
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

      if (api?.settings?.saveSettings) {
        const result = await api.settings.saveSettings({ payment: settings.payment });
        if (result.success) {
          success('Payment settings saved successfully!');
        } else {
          error('Failed to save payment settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      error('Failed to save payment settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      if (api?.settings?.saveSettings) {
        const result = await api.settings.saveSettings({ notifications: settings.notifications });
        if (result.success) {
          success('Notification settings saved successfully!');
        } else {
          error('Failed to save notification settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      error('Failed to save notification settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    setLoading(true);
    try {
      if (api?.settings?.saveSettings) {
        const result = await api.settings.saveSettings({ security: settings.security });
        if (result.success) {
          success('Security settings saved successfully!');
        } else {
          error('Failed to save security settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
      error('Failed to save security settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveBackupSettings = async () => {
    setLoading(true);
    try {
      if (api?.settings?.saveSettings) {
        const result = await api.settings.saveSettings({ backup: settings.backup });
        if (result.success) {
          success('Backup settings saved successfully!');
        } else {
          error('Failed to save backup settings: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving backup settings:', error);
      error('Failed to save backup settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveEnvironmentVariables = async () => {
    setEnvSaving(true);
    try {
      if (api?.env?.updateVariables) {
        const result = await api.env.updateVariables(settings.environment);
        if (result.success) {
          success('Environment variables saved successfully! Please restart the application for changes to take effect.');
        } else {
          error('Failed to save environment variables: ' + result.message);
        }
      }
    } catch (err) {
      console.error('Error saving environment variables:', err);
      error('Failed to save environment variables: ' + err.message);
    } finally {
      setEnvSaving(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    // For totalSeats, we just use the raw string value without conversion
    // This avoids any numeric conversion issues that might be causing the value changes
    console.log('handleSettingChange:', category, key, value, 'Type:', typeof value);

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
    setBackupLoading(true);
    try {
      if (api?.backup?.createBackup) {
        const result = await api.backup.createBackup();
        if (result.success) {
          success(`Backup created successfully at ${result.timestamp}`);
          // Refresh the backup list if we're on the backup tab
          if (activeTab === 'backup') {
            await loadBackups();
          }
        } else {
          error(result.message || 'Failed to create backup');
        }
      } else {
        error('Backup functionality not available');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      error('Failed to create backup: ' + (error.message || 'Unknown error'));
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackup = async () => {
    if (confirm('Are you sure you want to restore from backup? This will replace all current data and may require an application restart.')) {
      setLoading(true);
      try {
        if (api?.backup?.restoreBackup) {
          const result = await api.backup.restoreBackup();
          if (result.success) {
            success(result.message || 'Backup restored successfully');
            if (result.requiresRestart) {
              if (confirm('The application needs to restart to complete the restore. Restart now?')) {
                if (true) {
                  window.location.reload();
                } else {
                  alert('Please manually restart the application to complete the restore process.');
                }
              }
            }
          } else {
            error(result.message || 'Failed to restore backup');
          }
        } else {
          error('Backup restore functionality not available');
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
        error('Failed to restore backup: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      if (api?.data?.exportData) {
        await api.data.exportData();
        success('Data exported successfully');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      if (api?.backup?.listBackups) {
        const result = await api.backup.listBackups();
        if (result.success) {
          setBackupList(result.backups || []);
        } else {
          console.error('Failed to load backups:', result.message);
        }
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const refreshBackups = async () => {
    await loadBackups();
    success('Backup list refreshed');
  };

  const restoreSpecificBackup = async (backup) => {
    if (confirm(`Are you sure you want to restore from "${backup.name}"? This will replace all current data and may require an application restart.`)) {
      setLoading(true);
      try {
        if (api?.backup?.restoreSpecificBackup) {
          const result = await api.backup.restoreSpecificBackup(backup.path);
          if (result.success) {
            success(result.message || 'Backup restored successfully');
            if (result.requiresRestart) {
              if (confirm('The application needs to restart to complete the restore. Restart now?')) {
                if (true) {
                  window.location.reload();
                } else {
                  alert('Please manually restart the application to complete the restore process.');
                }
              }
            }
          } else {
            error(result.message || 'Failed to restore backup');
          }
        } else {
          error('Specific backup restore functionality not available');
        }
      } catch (error) {
        console.error('Error restoring specific backup:', error);
        error('Failed to restore backup: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteBackup = async (backup) => {
    if (confirm(`Are you sure you want to delete the backup "${backup.name}"? This action cannot be undone.`)) {
      setLoading(true);
      try {
        if (api?.backup?.deleteBackup) {
          const result = await api.backup.deleteBackup(backup.path);
          if (result.success) {
            success('Backup deleted successfully');
            await loadBackups(); // Refresh the list
          } else {
            error(result.message || 'Failed to delete backup');
          }
        } else {
          error('Backup deletion functionality not available');
        }
      } catch (error) {
        console.error('Error deleting backup:', error);
        error('Failed to delete backup: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'membership', label: 'Member Registration', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'payment', label: 'Payment', icon: '💰' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'environment', label: 'Environment Config', icon: '🔧' },
    { id: 'backup', label: 'Backup & Data', icon: '💾' }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          📚 Study Room Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label required">Study Room Name</label>
            <input
              type="text"
              value={settings?.general?.libraryName ?? ''}
              onChange={(e) => handleSettingChange('general', 'libraryName', e.target.value)}
              className="input"
              placeholder="Enter your study room business name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Total Seats</label>
            <input
              type="text"
              value={settings?.general?.totalSeats ?? ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (/^\d*$/.test(inputValue)) {
                  handleSettingChange('general', 'totalSeats', inputValue);
                }
              }}
              onBlur={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '' || parseInt(inputValue, 10) <= 0) {
                  handleSettingChange('general', 'totalSeats', '50');
                }
              }}
              className="input"
              pattern="\d*"
              placeholder="Total number of seats available (default: 50)"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Applied system-wide for seat allocation</p>
          </div>
          <div className="form-group md:col-span-2">
            <label className="form-label">Address</label>
            <textarea
              value={settings.general.address ?? ''}
              onChange={(e) => handleSettingChange('general', 'address', e.target.value)}
              className="input"
              rows="3"
              placeholder="Complete business address"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              value={settings.general.phone ?? ''}
              onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
              className="input"
              placeholder="Contact phone number"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={settings.general.email ?? ''}
              onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
              className="input"
              placeholder="Business email address"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="url"
              value={settings.general.website ?? ''}
              onChange={(e) => handleSettingChange('general', 'website', e.target.value)}
              className="input"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          ⏰ Operating Hours
        </h3>
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              checked={settings?.general?.operatingHours?.enableNightShift || false}
              onChange={(e) => handleSettingChange('general', 'operatingHours', {
                ...settings.general.operatingHours,
                enableNightShift: e.target.checked
              })}
            />
            <span className="text-slate-700 font-medium">Enable Night Shift</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-700 mb-3">Day Shift</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Opening Time</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime)?.time ?? ''}
                    onChange={(e) => handleTimeChange('dayShift', 'openTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime).period)}
                    className="input"
                  />
                  <select
                    value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime)?.period ?? ''}
                    onChange={(e) => handleTimeChange('dayShift', 'openTime', convertTo12Hour(settings?.general?.operatingHours?.dayShift?.openTime).time, e.target.value)}
                    className="select w-20"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Closing Time</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime)?.time ?? ''}
                    onChange={(e) => handleTimeChange('dayShift', 'closeTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime).period)}
                    className="input"
                  />
                  <select
                    value={convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime)?.period ?? ''}
                    onChange={(e) => handleTimeChange('dayShift', 'closeTime', convertTo12Hour(settings?.general?.operatingHours?.dayShift?.closeTime).time, e.target.value)}
                    className="select w-20"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {settings?.general?.operatingHours?.enableNightShift && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-white">
              <h4 className="font-medium text-indigo-300 mb-3">Night Shift</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-slate-300">Opening Time</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime)?.time ?? ''}
                      onChange={(e) => handleTimeChange('nightShift', 'openTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime).period)}
                      className="input bg-slate-800 border-slate-600 text-white"
                    />
                    <select
                      value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime)?.period ?? ''}
                      onChange={(e) => handleTimeChange('nightShift', 'openTime', convertTo12Hour(settings?.general?.operatingHours?.nightShift?.openTime).time, e.target.value)}
                      className="select w-20 bg-slate-800 border-slate-600 text-white"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label text-slate-300">Closing Time</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime)?.time ?? ''}
                      onChange={(e) => handleTimeChange('nightShift', 'closeTime', e.target.value, convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime).period)}
                      className="input bg-slate-800 border-slate-600 text-white"
                    />
                    <select
                      value={convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime)?.period ?? ''}
                      onChange={(e) => handleTimeChange('nightShift', 'closeTime', convertTo12Hour(settings?.general?.operatingHours?.nightShift?.closeTime).time, e.target.value)}
                      className="select w-20 bg-slate-800 border-slate-600 text-white"
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
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🎨 Business Logo
        </h3>
        <div className="flex items-start gap-6">
          {settings.general.logo || logoPreview ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                <img
                  src={logoPreview || settings.general.logo}
                  alt="Business Logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <label className="button button-sm button-secondary cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  Change
                </label>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="button button-sm button-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="w-full md:w-96 h-32 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <span className="text-4xl mb-2">📸</span>
              <p className="text-slate-600 font-medium">Click to upload business logo</p>
              <p className="text-xs text-slate-400">Supports: JPEG, PNG, GIF, WebP (Max: 5MB)</p>
            </label>
          )}
        </div>
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          📅 Holiday Schedule
        </h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="form-group flex-1">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                className="input"
              />
            </div>
            <div className="form-group flex-[2]">
              <label className="form-label">Holiday Name</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="e.g., Independence Day"
              />
            </div>
            <button
              type="button"
              onClick={addHoliday}
              className="button button-primary mb-[2px]"
            >
              Add Holiday
            </button>
          </div>
        </div>

        <div className="table-container">
          {(settings?.general?.holidays || []).length > 0 ? (
            <table className="table">
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
            <div className="text-center py-8 text-slate-500">
              <p>No holidays added yet</p>
            </div>
          )}
        </div>
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🌐 Locale & Formatting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Date Format</label>
            <select
              value={settings?.general?.locale?.dateFormat || 'dd/MM/yyyy'}
              onChange={(e) => handleSettingChange('general', 'locale', {
                ...settings?.general?.locale,
                dateFormat: e.target.value
              })}
              className="select"
            >
              <option value="dd/MM/yyyy">DD/MM/YYYY</option>
              <option value="MM/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy-MM-dd">YYYY-MM-DD</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Time Format</label>
            <select
              value={settings?.general?.locale?.timeFormat || '24hour'}
              onChange={(e) => handleSettingChange('general', 'locale', {
                ...settings?.general?.locale,
                timeFormat: e.target.value
              })}
              className="select"
            >
              <option value="12hour">12-hour (AM/PM)</option>
              <option value="24hour">24-hour</option>
            </select>
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🔧 System Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select
              value={settings.general.theme}
              onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
              className="select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select
              value={settings.general.language}
              onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
              className="select"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer mt-8">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.general.autoBackup}
                onChange={(e) => handleSettingChange('general', 'autoBackup', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Enable Auto Backup</span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Backup Interval (hours)</label>
            <input
              type="number"
              value={settings.general.backupInterval}
              onChange={(e) => handleSettingChange('general', 'backupInterval', e.target.value)}
              className="input"
              min="1"
              max="168"
              disabled={!settings.general.autoBackup}
            />
          </div>
        </div>
      </section>

      {/* Action Buttons for General Settings */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={resetToDefaults}
          className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={saveGeneralSettings}
          className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">💾</span>
          <span>{loading ? 'Saving...' : 'Save General Settings'}</span>
        </button>
      </div>
    </div>
  );

  const renderMembershipSettings = () => {
    return (
      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            👤 Member Registration Settings
          </h3>
          <p className="text-slate-500 mb-6">
            Configure member registration requirements including required documents and default settings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label required">Deposit Amount (₹)</label>
              <input
                type="number"
                value={settings.membership.depositAmount}
                onChange={(e) => handleSettingChange('membership', 'depositAmount', e.target.value)}
                className="input"
                min="0"
                step="50"
                placeholder="Security deposit amount"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Security deposit required from each member</p>
            </div>
          </div>
        </section>

        <div className="h-px bg-slate-200 my-6"></div>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              📄 Document Selection for Member Registration
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                className="button button-sm button-secondary"
                onClick={() => {
                  const updatedTypes = settings.membership.idDocumentTypes.map(doc => ({ ...doc, enabled: true }));
                  handleSettingChange('membership', 'idDocumentTypes', updatedTypes);
                }}
              >
                Enable All
              </button>
              <button
                type="button"
                className="button button-sm button-secondary"
                onClick={() => {
                  const updatedTypes = settings.membership.idDocumentTypes.map(doc => ({ ...doc, enabled: false }));
                  handleSettingChange('membership', 'idDocumentTypes', updatedTypes);
                }}
              >
                Disable All
              </button>
            </div>
          </div>
          <p className="text-slate-500 mb-6">
            Select which document types should appear in the "Add New Member" form.
            Only enabled documents will be available for selection during member registration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(settings?.membership?.idDocumentTypes || []).length === 0 ? (
              <div className="col-span-full text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500 mb-4">No document types found. Initializing default types...</p>
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
                <div
                  key={docType.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${docType.enabled
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={docType.enabled}
                      onChange={(e) => {
                        const updatedTypes = [...settings.membership.idDocumentTypes];
                        updatedTypes[index].enabled = e.target.checked;
                        handleSettingChange('membership', 'idDocumentTypes', updatedTypes);
                      }}
                    />
                    <div>
                      <span className={`block font-medium ${docType.enabled ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {docType.label}
                      </span>
                      <span className="text-xs text-slate-500 block mt-1">
                        {docType.enabled
                          ? 'Visible in registration'
                          : 'Hidden from registration'
                        }
                      </span>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h5 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              🔍 Preview: Selected Documents
              <span className="badge badge-primary ml-2">
                {(settings?.membership?.idDocumentTypes || []).filter(doc => doc.enabled).length} enabled
              </span>
            </h5>
            <div className="flex flex-wrap gap-2">
              {(settings?.membership?.idDocumentTypes || [])
                .filter(doc => doc.enabled)
                .map(doc => (
                  <span key={doc.id} className="badge badge-info">
                    {doc.label}
                  </span>
                ))
              }
              {(settings?.membership?.idDocumentTypes || []).filter(doc => doc.enabled).length === 0 && (
                <span className="text-amber-600 text-sm flex items-center gap-2">
                  ⚠️ No documents selected. Members won't be able to provide ID documents.
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Action Buttons for Membership Settings */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={resetToDefaults}
            className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            <span className="btn-icon">🔄</span>
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={saveMembershipSettings}
            className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            <span className="btn-icon">💾</span>
            <span>{loading ? 'Saving...' : 'Save Membership Settings'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderAttendanceSettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          📅 Attendance Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.attendance.autoMarkAbsent}
                onChange={(e) => handleSettingChange('attendance', 'autoMarkAbsent', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Auto Mark Absent</span>
            </label>
            <div className="pl-6">
              <label className="form-label text-sm">Mark Absent After (hours)</label>
              <input
                type="number"
                value={settings.attendance.absentAfterHours}
                onChange={(e) => handleSettingChange('attendance', 'absentAfterHours', e.target.value)}
                className="input"
                min="1"
                max="24"
                disabled={!settings.attendance.autoMarkAbsent}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Auto Check-out After (hours)</label>
            <input
              type="number"
              value={settings.attendance.autoCheckOutHours}
              onChange={(e) => handleSettingChange('attendance', 'autoCheckOutHours', e.target.value)}
              className="input"
              min="1"
              max="24"
            />
            <p className="text-xs text-slate-500 mt-1">Members will be automatically checked out after this many hours</p>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.attendance.allowManualEdit}
                onChange={(e) => handleSettingChange('attendance', 'allowManualEdit', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Allow Manual Attendance Edit</span>
            </label>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.attendance.notifyOnAbsence}
                onChange={(e) => handleSettingChange('attendance', 'notifyOnAbsence', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Notify on Absence</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Max Consecutive Absences</label>
            <input
              type="number"
              value={settings.attendance.maxConsecutiveAbsences}
              onChange={(e) => handleSettingChange('attendance', 'maxConsecutiveAbsences', e.target.value)}
              className="input"
              min="1"
              max="30"
            />
          </div>
        </div>
      </section>

      {/* Action Buttons for Attendance Settings */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={resetToDefaults}
          className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={saveAttendanceSettings}
          className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">💾</span>
          <span>{loading ? 'Saving...' : 'Save Attendance Settings'}</span>
        </button>
      </div>
    </div>
  );

  const addNewPlan = async () => {
    const newPlan = {
      name: 'New Plan',
      duration_days: 30,
      price: 1000,
      description: 'Custom membership plan'
    };

    try {
      const result = await api.plan.add(newPlan);
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

  const addPlan = async () => {
    // Validate form
    if (!newPlan.name || !newPlan.duration || !newPlan.amount) {
      error('Please fill in all plan details');
      return;
    }

    // Convert duration to months based on unit
    let durationMonths = parseInt(newPlan.duration);
    if (newPlan.durationUnit === 'days') {
      durationMonths = 0; // For daily plans
    } else if (newPlan.durationUnit === 'years') {
      durationMonths = durationMonths * 12;
    }

    const planData = {
      name: newPlan.name,
      duration_months: durationMonths,
      price: parseFloat(newPlan.amount),
      description: `${newPlan.duration} ${newPlan.durationUnit} plan`,
      seat_access: true,
      book_limit: 0
    };

    try {
      const result = await api.plan.add(planData);
      if (result.success) {
        await loadCustomPlans();
        success('Plan added successfully');
        // Reset form
        setNewPlan({ name: '', duration: '1', durationUnit: 'months', amount: '' });
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

      console.log(`Updating plan field: ${field} to value: ${value} (type: ${typeof value})`);

      // Update the local state immediately for responsive UI
      const updatedPlan = { ...planToUpdate, [field]: value };

      // Map Settings page fields to database fields and ensure no null values
      const dbPlan = {
        name: field === 'name' ? value : (updatedPlan.name || planToUpdate.name || 'New Plan'),
        duration_days: field === 'days' ? value : (updatedPlan.days || updatedPlan.duration_days || 30),
        price: field === 'amount' ? value : (updatedPlan.amount || updatedPlan.price || 1000),
        description: updatedPlan.description || planToUpdate.description || 'Custom membership plan'
      };

      // Ensure required fields are not null or empty
      if (dbPlan.name === undefined || dbPlan.name === null || dbPlan.name.trim() === '') {
        dbPlan.name = 'New Plan';
      }
      if (!dbPlan.duration_days || dbPlan.duration_days === '' || isNaN(parseInt(dbPlan.duration_days)) || parseInt(dbPlan.duration_days) < 1) {
        dbPlan.duration_days = 30;
      }
      if (!dbPlan.price || dbPlan.price === '' || isNaN(parseInt(dbPlan.price)) || parseInt(dbPlan.price) < 0) {
        dbPlan.price = 1000;
      }

      const result = await api.plan.update(planId, dbPlan);

      if (result.success) {
        // Update local state with the corrected values
        // Use the direct values from the user input whenever possible
        const updatedPlans = currentPlans.map(plan =>
          plan.id === planId ? {
            ...plan,
            [field]: value, // Direct user input value for the changed field
            // Sync database field names for consistency
            name: field === 'name' ? value : dbPlan.name,
            duration_days: field === 'days' ? value : dbPlan.duration_days,
            price: field === 'amount' ? value : dbPlan.price,
            description: dbPlan.description,
            // Keep UI field names in sync - prefer direct user input values
            days: field === 'days' ? value : dbPlan.duration_days,
            amount: field === 'amount' ? value : dbPlan.price
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
      const result = await api.plan.delete(planId);
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



  const renderPaymentSettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          💳 Payment Plans
        </h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="form-group flex-1">
              <label className="form-label">Plan Name</label>
              <input
                type="text"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="e.g., Monthly Plan"
              />
            </div>
            <div className="form-group w-32">
              <label className="form-label">Duration</label>
              <input
                type="number"
                value={newPlan.duration}
                onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value }))}
                className="input"
                min="1"
              />
            </div>
            <div className="form-group w-32">
              <label className="form-label">Unit</label>
              <select
                value={newPlan.durationUnit}
                onChange={(e) => setNewPlan(prev => ({ ...prev, durationUnit: e.target.value }))}
                className="select"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            <div className="form-group w-32">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                value={newPlan.amount}
                onChange={(e) => setNewPlan(prev => ({ ...prev, amount: e.target.value }))}
                className="input"
                min="0"
              />
            </div>
            <button
              type="button"
              onClick={addPlan}
              className="button button-primary mb-[2px]"
            >
              Add Plan
            </button>
          </div>
        </div>

        <div className="table-container">
          {(settings?.payment?.customPlans || []).length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(settings?.payment?.customPlans || []).map(plan => (
                  <tr key={plan.id}>
                    <td>{plan.name}</td>
                    <td>{plan.duration_days || plan.days} Days</td>
                    <td>₹{plan.price || plan.amount}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removePlan(plan.id)}
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
            <div className="text-center py-8 text-slate-500">
              <p>No payment plans added yet</p>
            </div>
          )}
        </div>
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          ⚙️ Payment Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select
              value={settings.payment.currency}
              onChange={(e) => handleSettingChange('payment', 'currency', e.target.value)}
              className="select"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-200 my-6"></div>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          💳 Payment Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.payment.autoGenerateReceipts}
                onChange={(e) => handleSettingChange('payment', 'autoGenerateReceipts', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Auto Generate Receipts</span>
            </label>
          </div>
          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.payment.acceptCash}
                onChange={(e) => handleSettingChange('payment', 'acceptCash', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Accept Cash Payments</span>
            </label>
          </div>
          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.payment.acceptOnline}
                onChange={(e) => handleSettingChange('payment', 'acceptOnline', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Accept Online Payments</span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Online Payment Gateway</label>
            <select
              value={settings.payment.onlinePaymentGateway}
              onChange={(e) => handleSettingChange('payment', 'onlinePaymentGateway', e.target.value)}
              className="select"
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
      </section>

      {/* Action Buttons for Payment Settings */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={resetToDefaults}
          className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={savePaymentSettings}
          className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">💾</span>
          <span>{loading ? 'Saving...' : 'Save Payment Settings'}</span>
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🔔 Notification Preferences
        </h3>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Notification Channels</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.notifications.enableEmailNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'enableEmailNotifications', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Enable Email Notifications</span>
              </label>
            </div>
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.notifications.enableSMSNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'enableSMSNotifications', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Enable SMS Notifications</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Membership Alerts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.notifications.membershipExpiryReminder}
                  onChange={(e) => handleSettingChange('notifications', 'membershipExpiryReminder', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Membership Expiry Reminders</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Reminder Days Before Expiry</label>
              <input
                type="number"
                value={settings.notifications.reminderDaysBefore}
                onChange={(e) => handleSettingChange('notifications', 'reminderDaysBefore', e.target.value)}
                className="input"
                min="1"
                max="30"
                disabled={!settings.notifications.membershipExpiryReminder}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-4">Other Notifications</h4>
          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={settings.notifications.birthdayWishes}
                onChange={(e) => handleSettingChange('notifications', 'birthdayWishes', e.target.checked)}
              />
              <span className="text-slate-700 font-medium">Send Birthday Wishes</span>
            </label>
          </div>
        </div>
      </section>

      {/* Action Buttons for Notification Settings */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={resetToDefaults}
          className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={saveNotificationSettings}
          className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">💾</span>
          <span>{loading ? 'Saving...' : 'Save Notification Settings'}</span>
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🔐 Security Configuration
        </h3>

        {/* Account Management Section */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Account Management</h4>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-600">
              <p><strong>Current Username:</strong> {user?.username || 'N/A'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUsernameModal(true)}
                className="button button-secondary"
              >
                👤 Change Username
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="button button-primary"
              >
                🔒 Change Password
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Manage your account credentials with secure verification
          </p>
        </div>

        {/* Session & Access Control */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Session & Access Control</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                className="input"
                min="5"
                max="480"
              />
              <p className="text-xs text-slate-500 mt-1">Automatically logout after inactivity</p>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.security.logUserActions}
                  onChange={(e) => handleSettingChange('security', 'logUserActions', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Log User Actions</span>
              </label>
              <p className="text-xs text-slate-500 mt-1 pl-6">Keep track of all user activities for audit purposes</p>
            </div>
          </div>
        </div>

        {/* Authentication Options */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-4">Advanced Authentication</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.security.enforceStrongPasswords}
                  onChange={(e) => handleSettingChange('security', 'enforceStrongPasswords', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Enforce Strong Passwords</span>
              </label>
            </div>
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.security.enable2FA}
                  onChange={(e) => handleSettingChange('security', 'enable2FA', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Enable Two-Factor Authentication</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons for Security Settings */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={resetToDefaults}
          className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={saveSecuritySettings}
          className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">💾</span>
          <span>{loading ? 'Saving...' : 'Save Security Settings'}</span>
        </button>
      </div>
    </div>
  );

  const renderEnvironmentSettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🎨 Environment & Appearance
        </h3>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Theme Preferences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Theme Mode</label>
              <select
                value={settings.environment.theme}
                onChange={(e) => handleSettingChange('environment', 'theme', e.target.value)}
                className="select"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Font Size Scaling</label>
              <select
                value={settings.environment.fontSize}
                onChange={(e) => handleSettingChange('environment', 'fontSize', e.target.value)}
                className="select"
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-4">System Behavior</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.environment.animationsEnabled}
                  onChange={(e) => handleSettingChange('environment', 'animationsEnabled', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Enable UI Animations</span>
              </label>
            </div>
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.environment.compactMode}
                  onChange={(e) => handleSettingChange('environment', 'compactMode', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Compact Mode</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🔧 External Services
        </h3>
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">📧 Email Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Email Host</label>
              <input
                type="text"
                value={settings.environment?.EMAIL_HOST || ''}
                onChange={(e) => handleSettingChange('environment', 'EMAIL_HOST', e.target.value)}
                className="input"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Port</label>
              <input
                type="number"
                value={settings.environment?.EMAIL_PORT || ''}
                onChange={(e) => handleSettingChange('environment', 'EMAIL_PORT', e.target.value)}
                className="input"
                placeholder="587"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email User</label>
              <input
                type="email"
                value={settings.environment?.EMAIL_USER || ''}
                onChange={(e) => handleSettingChange('environment', 'EMAIL_USER', e.target.value)}
                className="input"
                placeholder="your-email@gmail.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Password/App Password</label>
              <input
                type="password"
                value={settings.environment?.EMAIL_PASS || ''}
                onChange={(e) => handleSettingChange('environment', 'EMAIL_PASS', e.target.value)}
                className="input"
                placeholder="your-app-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">From Email Address</label>
              <input
                type="email"
                value={settings.environment?.EMAIL_FROM || ''}
                onChange={(e) => handleSettingChange('environment', 'EMAIL_FROM', e.target.value)}
                className="input"
                placeholder="noreply@yourdomain.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">📱 WhatsApp Configuration (Gupshup)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Gupshup API Key</label>
              <input
                type="password"
                value={settings.environment?.GUPSHUP_API_KEY || ''}
                onChange={(e) => handleSettingChange('environment', 'GUPSHUP_API_KEY', e.target.value)}
                className="input"
                placeholder="your-gupshup-api-key"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gupshup App Name</label>
              <input
                type="text"
                value={settings.environment?.GUPSHUP_APP_NAME || ''}
                onChange={(e) => handleSettingChange('environment', 'GUPSHUP_APP_NAME', e.target.value)}
                className="input"
                placeholder="your-app-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gupshup Base URL</label>
              <input
                type="url"
                value={settings.environment?.GUPSHUP_BASE_URL || ''}
                onChange={(e) => handleSettingChange('environment', 'GUPSHUP_BASE_URL', e.target.value)}
                className="input"
                placeholder="https://api.gupshup.io/sm/api/v1"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">👆 Biometric Device Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Device IP Address</label>
              <input
                type="text"
                value={settings.environment?.BIOMETRIC_DEVICE_IP || ''}
                onChange={(e) => handleSettingChange('environment', 'BIOMETRIC_DEVICE_IP', e.target.value)}
                className="input"
                placeholder="172.16.85.85"
                pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Device Port</label>
              <input
                type="number"
                value={settings.environment?.BIOMETRIC_DEVICE_PORT || ''}
                onChange={(e) => handleSettingChange('environment', 'BIOMETRIC_DEVICE_PORT', e.target.value)}
                className="input"
                placeholder="4370"
                min="1"
                max="65535"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Connection Timeout (ms)</label>
              <input
                type="number"
                value={settings.environment?.BIOMETRIC_TIMEOUT || ''}
                onChange={(e) => handleSettingChange('environment', 'BIOMETRIC_TIMEOUT', e.target.value)}
                className="input"
                placeholder="5000"
                min="1000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Timeout (ms)</label>
              <input
                type="number"
                value={settings.environment?.BIOMETRIC_INTERNAL_TIMEOUT || ''}
                onChange={(e) => handleSettingChange('environment', 'BIOMETRIC_INTERNAL_TIMEOUT', e.target.value)}
                className="input"
                placeholder="10000"
                min="1000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Poll Interval (ms)</label>
              <input
                type="number"
                value={settings.environment?.BIOMETRIC_POLL_INTERVAL || ''}
                onChange={(e) => handleSettingChange('environment', 'BIOMETRIC_POLL_INTERVAL', e.target.value)}
                className="input"
                placeholder="5000"
                min="1000"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={saveEnvironmentVariables}
            className="button button-primary"
            disabled={envSaving}
          >
            {envSaving ? '💾 Saving...' : '💾 Save Environment Variables'}
          </button>
          <button
            onClick={loadEnvironmentVariables}
            className="button button-secondary"
            disabled={envLoading}
          >
            🔄 Reload Variables
          </button>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <p><strong>⚠️ Important:</strong> After saving environment variables, you must restart the application for changes to take effect in all services.</p>
        </div>
      </section>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          💾 Data Backup & Restore
        </h3>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Manual Backup</h4>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={createBackup}
              disabled={backupLoading}
              className="button button-primary w-full md:w-auto"
            >
              {backupLoading ? 'Creating Backup...' : 'Create New Backup'}
            </button>
            <p className="text-sm text-slate-500">
              Create a complete backup of your database and settings.
              The backup file will be downloaded to your device.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Automated Backups</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={settings.backup.autoBackup}
                  onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                />
                <span className="text-slate-700 font-medium">Enable Auto Backup</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Backup Frequency</label>
              <select
                value={settings.backup.backupFrequency}
                onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                className="select"
                disabled={!settings.backup.autoBackup}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Retention Period (days)</label>
              <input
                type="number"
                value={settings.backup.retentionDays}
                onChange={(e) => handleSettingChange('backup', 'retentionDays', e.target.value)}
                className="input"
                min="7"
                max="365"
                disabled={!settings.backup.autoBackup}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Backup</label>
              <div className="text-sm text-slate-600 py-2">
                {settings.backup.lastBackupDate
                  ? new Date(settings.backup.lastBackupDate).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-700 mb-4">Restore Data</h4>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <label className="button button-secondary w-full md:w-auto cursor-pointer text-center">
              Select Backup File
              <input
                type="file"
                accept=".json"
                onChange={restoreBackup}
                className="hidden"
              />
            </label>
            <p className="text-sm text-red-500">
              ⚠️ Warning: Restoring a backup will overwrite all current data.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-4">Available Backups</h4>
          {loadingBackups ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : backupList.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No backups found. Create your first backup using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Backup File</th>
                    <th className="text-left py-2">Created</th>
                    <th className="text-left py-2">Size</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backupList.map((backup, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="py-3 font-medium text-slate-700">{backup.name}</td>
                      <td className="py-3 text-slate-600">{new Date(backup.created).toLocaleString()}</td>
                      <td className="py-3 text-slate-600">{backup.sizeFormatted}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => restoreSpecificBackup(backup)}
                            className="button button-sm button-secondary"
                            disabled={loading}
                            title="Restore this backup"
                          >
                            📥 Restore
                          </button>
                          <button
                            onClick={() => deleteBackup(backup)}
                            className="button button-sm button-danger"
                            disabled={loading}
                            title="Delete this backup"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Action Buttons for Backup Settings */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={resetToDefaults}
          className="button button-secondary px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={saveBackupSettings}
          className="btn-save px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          <span className="btn-icon">💾</span>
          <span>{loading ? 'Saving...' : 'Save Backup Settings'}</span>
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
      case 'environment':
        return renderEnvironmentSettings();
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
    if (!/[!@#$%^&*()_+\-=\[\]{ };':"\\|,.<>\/?]/.test(password)) errors.push('Password must contain at least one special character');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && resetPasswordModal()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800">🔒 Change Password</h3>
            <button
              onClick={resetPasswordModal}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {passwordChangeStep === 1 ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                    className="input"
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                    className="input"
                    placeholder="Enter new password"
                  />
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <small className="text-slate-500 font-medium block mb-2">Password must contain:</small>
                    <ul className="space-y-1 text-xs text-slate-500">
                      <li className={passwordForm.newPassword.length >= 8 ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}>
                        {passwordForm.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}>
                        {/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '○'} One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}>
                        {/[a-z]/.test(passwordForm.newPassword) ? '✓' : '○'} One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}>
                        {/[0-9]/.test(passwordForm.newPassword) ? '✓' : '○'} One number
                      </li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? '✓' : '○'} One special character
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                    className="input"
                    placeholder="Confirm new password"
                  />
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <small className="text-red-500 mt-1 block">Passwords do not match</small>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-indigo-800 text-sm">An OTP has been sent to your registered email address. Please enter it below to complete the password change.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input
                    type="text"
                    value={passwordForm.otp}
                    onChange={(e) => handlePasswordFormChange('otp', e.target.value)}
                    className="input text-center tracking-widest text-xl font-mono"
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>

                {otpExpiryTime && (
                  <div className="text-center">
                    <small className="text-slate-500">OTP expires in: {Math.max(0, Math.ceil((otpExpiryTime - Date.now()) / 60000))} minutes</small>
                  </div>
                )}

                <button
                  onClick={handlePasswordChangeRequest}
                  className="w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  disabled={passwordLoading}
                >
                  Resend OTP
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
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

  // Username change helper functions
  const handleUsernameFormChange = (field, value) => {
    setUsernameForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetUsernameModal = () => {
    setShowUsernameModal(false);
    setUsernameForm({
      currentPassword: '',
      newUsername: ''
    });
    setUsernameLoading(false);
  };

  const handleUsernameChange = async () => {
    try {
      // Validate form
      if (!usernameForm.currentPassword || !usernameForm.newUsername) {
        error('All fields are required');
        return;
      }

      if (usernameForm.newUsername.trim().length < 3) {
        error('Username must be at least 3 characters long');
        return;
      }

      if (usernameForm.newUsername === user?.username) {
        error('New username is the same as current username');
        return;
      }

      setUsernameLoading(true);

      const result = await changeUsername({
        currentPassword: usernameForm.currentPassword,
        newUsername: usernameForm.newUsername.trim(),
        userId: user?.id
      });

      if (result.success) {
        success('Username changed successfully! Please login again with your new username.');
        resetUsernameModal();
      } else {
        error(result.message || 'Failed to change username');
      }
    } catch (err) {
      error('Failed to change username');
      console.error(err);
    } finally {
      setUsernameLoading(false);
    }
  };

  const renderUsernameChangeModal = () => {
    if (!showUsernameModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && resetUsernameModal()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800">👤 Change Username</h3>
            <button
              onClick={resetUsernameModal}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-700"><strong>Current Username:</strong> {user?.username}</p>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  value={usernameForm.currentPassword}
                  onChange={(e) => handleUsernameFormChange('currentPassword', e.target.value)}
                  className="input"
                  placeholder="Enter your current password to verify"
                />
                <p className="text-xs text-slate-500 mt-1">Password verification required for security</p>
              </div>

              <div className="form-group">
                <label className="form-label">New Username</label>
                <input
                  type="text"
                  value={usernameForm.newUsername}
                  onChange={(e) => handleUsernameFormChange('newUsername', e.target.value)}
                  className="input"
                  placeholder="Enter new username"
                  minLength="3"
                />
                <p className="text-xs text-slate-500 mt-1">Username must be at least 3 characters long</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm flex items-start gap-2">
                <span>⚠️</span>
                <strong>Important:</strong> You will need to login again with your new username after changing it.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              onClick={resetUsernameModal}
              className="button button-secondary"
              disabled={usernameLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUsernameChange}
              className="button button-primary"
              disabled={usernameLoading}
            >
              {usernameLoading ? 'Changing Username...' : 'Change Username'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="settings-container">
      {loading ? (
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : !settings || !settings.general ? (
        <div className="settings-error">
          <div className="error-icon">⚠️</div>
          <p className="error-message">Error loading settings. Please refresh the page.</p>
        </div>
      ) : (
        <div className="settings-layout">
          {/* Modern Tab Navigation */}
          <div className="settings-tabs-container">
            <div className="settings-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {activeTab === tab.id && <div className="tab-indicator"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area with Card Design */}
          <div className="settings-content">
            <div className="settings-card">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {renderPasswordChangeModal()}

      {/* Username Change Modal */}
      {renderUsernameChangeModal()}
    </div>
  );
};

export default Settings;
