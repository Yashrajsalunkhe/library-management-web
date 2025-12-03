import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OnboardingSetup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user, markSetupCompleted } = useAuth();

  const [formData, setFormData] = useState({
    // Study Room Info
    studyRoomName: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    capacity: '',
    description: '',
    
    // Operating Hours
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    },
    
    // Member Settings
    maxMembers: '50',
    membershipDuration: '12',
    idNumber: '',
    securityDeposit: '',
    allowGuestAccess: false,
    requireApproval: true,
    autoMarkAbsent: true,
    absentAfterHours: '2',
    
    // Payment & Notifications
    membershipFee: '',
    lateFee: '',
    depositAmount: '',
    currency: 'INR',
    paymentReminderDays: '7',
    autoGenerateReceipts: true,
    acceptCash: true,
    acceptOnline: false,
    emailNotifications: true,
    smsNotifications: false,
    membershipExpiryReminder: true,
    reminderDaysBefore: '7',
    birthdayWishes: true,
    
    // Security & Backup
    biometricEnabled: false,
    sessionTimeout: '60',
    twoFactorAuth: false,
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetentionDays: '365',
    backupLocation: 'local'
  });

  const steps = [
    {
      id: 1,
      title: 'Study Room Info',
      description: 'Basic information about your study room',
      icon: '🏢'
    },
    {
      id: 2,
      title: 'Operating Hours',
      description: 'Set your daily operating schedule',
      icon: '⏰'
    },
    {
      id: 3,
      title: 'Member Settings',
      description: 'Configure membership rules and policies',
      icon: '👥'
    },
    {
      id: 4,
      title: 'Payment & Notifications',
      description: 'Set fees and communication preferences',
      icon: '💳'
    },
    {
      id: 5,
      title: 'Security & Backup',
      description: 'Configure security and data management',
      icon: '🔒'
    }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: subChild ? {
            ...prev[parent][child],
            [subChild]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.studyRoomName && formData.location && formData.capacity;
      case 2:
        return true;
      case 3:
        return formData.maxMembers && formData.membershipDuration;
      case 4:
        return formData.membershipFee;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      addNotification('Please fill in all required fields', 'error');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      addNotification('Please complete all required fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const settingsData = {
        studyRoomName: formData.studyRoomName,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        description: formData.description,
        maxMembers: parseInt(formData.maxMembers),
        membershipDuration: parseInt(formData.membershipDuration),
        membershipFee: parseFloat(formData.membershipFee),
        lateFee: parseFloat(formData.lateFee) || 0,
        depositAmount: parseFloat(formData.depositAmount) || 0,
        allowGuestAccess: formData.allowGuestAccess,
        requireApproval: formData.requireApproval,
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
        biometricEnabled: formData.biometricEnabled,
        autoBackup: formData.autoBackup,
        backupFrequency: formData.backupFrequency,
        dataRetentionDays: parseInt(formData.dataRetentionDays),
        openingHours: formData.openingHours
      };

      await api.saveSettings(settingsData);
      await markSetupCompleted();
      addNotification('Setup completed successfully!', 'success');
    } catch (error) {
      console.error('Setup submission error:', error);
      addNotification('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="minimal-form">
            <div className="form-grid">
              <div className="input-group">
                <label>Study Room Name</label>
                <input
                  type="text"
                  value={formData.studyRoomName}
                  onChange={(e) => handleInputChange('studyRoomName', e.target.value)}
                  placeholder="Enter your study room name"
                  className="minimal-input"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Capacity (Total Seats)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="Maximum seats"
                  className="minimal-input"
                  min="1"
                  required
                />
              </div>
              
              <div className="input-group full-width">
                <label>Complete Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full business address..."
                  className="minimal-textarea"
                  rows="2"
                />
              </div>
              
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Contact phone number"
                  className="minimal-input"
                />
              </div>
              
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Contact email"
                  className="minimal-input"
                />
              </div>
              
              <div className="input-group">
                <label>Website <span className="optional">optional</span></label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="minimal-input"
                />
              </div>
              
              <div className="input-group full-width">
                <label>Description <span className="optional">optional</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your study room, amenities, facilities..."
                  className="minimal-textarea"
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="minimal-form">
            <div className="schedule-grid">
              {Object.entries(formData.openingHours).map(([day, hours]) => (
                <div key={day} className="day-card">
                  <div className="day-header">
                    <span className="day-name">{day}</span>
                    <div className="day-toggle">
                      <input
                        type="checkbox"
                        id={`${day}-toggle`}
                        className="toggle-input"
                        checked={!hours.closed}
                        onChange={(e) => handleInputChange(`openingHours.${day}.closed`, !e.target.checked)}
                      />
                      <label htmlFor={`${day}-toggle`} className="toggle-label">
                        {hours.closed ? 'Closed' : 'Open'}
                      </label>
                    </div>
                  </div>
                  
                  {!hours.closed && (
                    <div className="time-inputs">
                      <div className="time-group">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleInputChange(`openingHours.${day}.open`, e.target.value)}
                          className="time-input"
                        />
                        <span className="time-label">Open</span>
                      </div>
                      <div className="time-separator">—</div>
                      <div className="time-group">
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleInputChange(`openingHours.${day}.close`, e.target.value)}
                          className="time-input"
                        />
                        <span className="time-label">Close</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="minimal-form">
            <div className="section-group">
              <h3>Basic Settings</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Maximum Members</label>
                  <input
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => handleInputChange('maxMembers', e.target.value)}
                    placeholder="100"
                    className="minimal-input"
                    min="1"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Membership Duration (months)</label>
                  <input
                    type="number"
                    value={formData.membershipDuration}
                    onChange={(e) => handleInputChange('membershipDuration', e.target.value)}
                    placeholder="12"
                    className="minimal-input"
                    min="1"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>ID Number Prefix <span className="optional">optional</span></label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    placeholder="LIB"
                    className="minimal-input"
                  />
                </div>
                
                <div className="input-group">
                  <label>Security Deposit <span className="optional">optional</span></label>
                  <div className="currency-input">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.securityDeposit}
                      onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                      placeholder="500.00"
                      className="minimal-input currency"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="section-group">
              <h3>Access & Attendance</h3>
              <div className="options-grid">
                <div className="option-card">
                  <div className="option-content">
                    <h3>Guest Access</h3>
                    <p>Allow non-members to access the library</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="guestAccess"
                      className="toggle-input"
                      checked={formData.allowGuestAccess}
                      onChange={(e) => handleInputChange('allowGuestAccess', e.target.checked)}
                    />
                    <label htmlFor="guestAccess" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Admin Approval</h3>
                    <p>Require approval for new member registrations</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="adminApproval"
                      className="toggle-input"
                      checked={formData.requireApproval}
                      onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                    />
                    <label htmlFor="adminApproval" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Auto Mark Absent</h3>
                    <p>Automatically mark members absent after set hours</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="autoMarkAbsent"
                      className="toggle-input"
                      checked={formData.autoMarkAbsent}
                      onChange={(e) => handleInputChange('autoMarkAbsent', e.target.checked)}
                    />
                    <label htmlFor="autoMarkAbsent" className="toggle-label minimal"></label>
                  </div>
                </div>
              </div>
              
              {formData.autoMarkAbsent && (
                <div className="form-grid" style={{marginTop: '1rem'}}>
                  <div className="input-group">
                    <label>Mark Absent After (hours)</label>
                    <input
                      type="number"
                      value={formData.absentAfterHours}
                      onChange={(e) => handleInputChange('absentAfterHours', e.target.value)}
                      placeholder="2"
                      className="minimal-input"
                      min="1"
                      max="24"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="minimal-form">
            <div className="section-group">
              <h3>Payment Structure</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="minimal-select"
                  >
                    <option value="INR">₹ Indian Rupee (INR)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Monthly Membership Fee</label>
                  <div className="currency-input">
                    <span className="currency-symbol">{formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.membershipFee}
                      onChange={(e) => handleInputChange('membershipFee', e.target.value)}
                      placeholder="500.00"
                      className="minimal-input currency"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Late Payment Fee <span className="optional">optional</span></label>
                  <div className="currency-input">
                    <span className="currency-symbol">{formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.lateFee}
                      onChange={(e) => handleInputChange('lateFee', e.target.value)}
                      placeholder="50.00"
                      className="minimal-input currency"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Registration Deposit <span className="optional">optional</span></label>
                  <div className="currency-input">
                    <span className="currency-symbol">{formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.depositAmount}
                      onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                      placeholder="1000.00"
                      className="minimal-input currency"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Payment Reminder (days before due)</label>
                  <input
                    type="number"
                    value={formData.paymentReminderDays}
                    onChange={(e) => handleInputChange('paymentReminderDays', e.target.value)}
                    placeholder="7"
                    className="minimal-input"
                    min="1"
                    max="30"
                  />
                </div>
              </div>
              
              <div className="options-grid">
                <div className="option-card">
                  <div className="option-content">
                    <h3>Auto Generate Receipts</h3>
                    <p>Automatically create payment receipts</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="autoGenerateReceipts"
                      className="toggle-input"
                      checked={formData.autoGenerateReceipts}
                      onChange={(e) => handleInputChange('autoGenerateReceipts', e.target.checked)}
                    />
                    <label htmlFor="autoGenerateReceipts" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Accept Cash Payments</h3>
                    <p>Allow cash payments at the library</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="acceptCash"
                      className="toggle-input"
                      checked={formData.acceptCash}
                      onChange={(e) => handleInputChange('acceptCash', e.target.checked)}
                    />
                    <label htmlFor="acceptCash" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Accept Online Payments</h3>
                    <p>Enable digital payment methods</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="acceptOnline"
                      className="toggle-input"
                      checked={formData.acceptOnline}
                      onChange={(e) => handleInputChange('acceptOnline', e.target.checked)}
                    />
                    <label htmlFor="acceptOnline" className="toggle-label minimal"></label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="section-group">
              <h3>Communication & Notifications</h3>
              <div className="options-grid">
                <div className="option-card">
                  <div className="option-content">
                    <h3>Email Notifications</h3>
                    <p>Payment reminders, updates & announcements</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      className="toggle-input"
                      checked={formData.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    />
                    <label htmlFor="emailNotifications" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>SMS Notifications</h3>
                    <p>Urgent updates & payment alerts</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      className="toggle-input"
                      checked={formData.smsNotifications}
                      onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                    />
                    <label htmlFor="smsNotifications" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Membership Expiry Reminders</h3>
                    <p>Alert members before membership expires</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="membershipExpiryReminder"
                      className="toggle-input"
                      checked={formData.membershipExpiryReminder}
                      onChange={(e) => handleInputChange('membershipExpiryReminder', e.target.checked)}
                    />
                    <label htmlFor="membershipExpiryReminder" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Birthday Wishes</h3>
                    <p>Send birthday greetings to members</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="birthdayWishes"
                      className="toggle-input"
                      checked={formData.birthdayWishes}
                      onChange={(e) => handleInputChange('birthdayWishes', e.target.checked)}
                    />
                    <label htmlFor="birthdayWishes" className="toggle-label minimal"></label>
                  </div>
                </div>
              </div>
              
              {formData.membershipExpiryReminder && (
                <div className="form-grid" style={{marginTop: '1rem'}}>
                  <div className="input-group">
                    <label>Remind (days before expiry)</label>
                    <input
                      type="number"
                      value={formData.reminderDaysBefore}
                      onChange={(e) => handleInputChange('reminderDaysBefore', e.target.value)}
                      placeholder="7"
                      className="minimal-input"
                      min="1"
                      max="90"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="minimal-form">
            <div className="section-group">
              <h3>Security Features</h3>
              <div className="options-grid">
                <div className="option-card featured">
                  <div className="option-content">
                    <h3>Biometric Authentication</h3>
                    <p>Fingerprint-based access control and attendance tracking</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="biometricEnabled"
                      className="toggle-input"
                      checked={formData.biometricEnabled}
                      onChange={(e) => handleInputChange('biometricEnabled', e.target.checked)}
                    />
                    <label htmlFor="biometricEnabled" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div className="option-card">
                  <div className="option-content">
                    <h3>Two-Factor Authentication</h3>
                    <p>Extra security layer for admin access</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="twoFactorAuth"
                      className="toggle-input"
                      checked={formData.twoFactorAuth}
                      onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                    />
                    <label htmlFor="twoFactorAuth" className="toggle-label minimal"></label>
                  </div>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="input-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={formData.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                    placeholder="60"
                    className="minimal-input"
                    min="15"
                    max="480"
                  />
                </div>
              </div>
            </div>
            
            <div className="section-group">
              <h3>Data Backup & Protection</h3>
              <div className="options-grid">
                <div className="option-card">
                  <div className="option-content">
                    <h3>Automatic Backup</h3>
                    <p>Regular data backup to prevent loss</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="autoBackup"
                      className="toggle-input"
                      checked={formData.autoBackup}
                      onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                    />
                    <label htmlFor="autoBackup" className="toggle-label minimal"></label>
                  </div>
                </div>
              </div>
              
              {formData.autoBackup && (
                <div className="form-grid">
                  <div className="input-group">
                    <label>Backup Frequency</label>
                    <select
                      value={formData.backupFrequency}
                      onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                      className="minimal-select"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label>Backup Location</label>
                    <select
                      value={formData.backupLocation}
                      onChange={(e) => handleInputChange('backupLocation', e.target.value)}
                      className="minimal-select"
                    >
                      <option value="local">Local Storage</option>
                      <option value="cloud">Cloud Storage</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label>Data Retention (days)</label>
                    <input
                      type="number"
                      value={formData.dataRetentionDays}
                      onChange={(e) => handleInputChange('dataRetentionDays', e.target.value)}
                      placeholder="365"
                      className="minimal-input"
                      min="30"
                      max="3650"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="completion-card">
              <div className="completion-content">
                <h2>Setup Complete!</h2>
                <p>Your comprehensive library management system is configured and ready to launch. All essential features have been set up according to your preferences.</p>
                <div className="completion-features">
                  <span>✓ Library Information & Contact Details</span>
                  <span>✓ Operating Hours & Schedule</span>
                  <span>✓ Member Management & Registration</span>
                  <span>✓ Payment Structure & Notifications</span>
                  <span>✓ Security & Data Protection</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="minimal-setup">
      <div className="setup-container">
        {/* Minimal Progress Bar */}
        <div className="minimal-progress">
          <div className="progress-steps">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`progress-dot ${currentStep >= step.id ? 'active' : ''}`}
              >
                <div className="dot-inner"></div>
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="setup-content">
          <div className="content-header">
            <div className="step-number">{currentStep}</div>
            <div className="step-info">
              <h1>{steps[currentStep - 1]?.title}</h1>
              <p>{steps[currentStep - 1]?.description}</p>
            </div>
          </div>

          <div className="content-body">
            {renderStepContent()}
          </div>

          <div className="content-footer">
            <div className="navigation-buttons">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="btn-minimal btn-back"
                  disabled={isLoading}
                >
                  Back
                </button>
              )}
              
              <div className="btn-spacer"></div>
              
              {currentStep < 5 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="btn-minimal btn-primary"
                  disabled={isLoading}
                >
                  Continue
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleSubmit}
                  className="btn-minimal btn-complete"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting up...' : 'Complete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSetup;
