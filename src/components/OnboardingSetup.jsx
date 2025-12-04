import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OnboardingSetup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user, markSetupCompleted } = useAuth();
  
  // Payment Plans state
  const [customPlans, setCustomPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    duration: '1',
    amount: ''
  });

  const [formData, setFormData] = useState({
    // Study Room Info (from Settings - General)
    libraryName: '',
    totalSeats: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    
    // Operating Hours (from Settings - General)
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
    
    // Member Settings (from Settings - Membership)
    depositAmount: '200',
    
    // Attendance Settings (from Settings - Attendance)
    autoMarkAbsent: true,
    absentAfterHours: '2',
    autoCheckOutHours: '12',
    
    // Payment Settings (from Settings - Payment)
    currency: 'INR',
    acceptCash: true,
    acceptOnline: false,
    
    // Notification Settings (from Settings - Notifications)
    enableEmailNotifications: false,
    enableSMSNotifications: false,
    membershipExpiryReminder: true,
    reminderDaysBefore: '7',
    birthdayWishes: true,
    
    // Security & Backup (from Settings - Security & Backup)
    sessionTimeout: '60',
    enableBiometric: false,
    twoFactorAuth: false,
    autoBackup: true,
    backupFrequency: 'daily',
    keepBackupsFor: '30'
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
      description: 'Set your operating schedule',
      icon: '⏰'
    },
    {
      id: 3,
      title: 'Membership & Attendance',
      description: 'Configure membership and attendance settings',
      icon: '👥'
    },
    {
      id: 4,
      title: 'Payment & Notifications',
      description: 'Set payment methods and communication preferences',
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
        return formData.libraryName && formData.totalSeats && formData.address;
      case 2:
        return true;
      case 3:
        return formData.depositAmount;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };
  
  const addPlan = () => {
    // Validate form
    if (!newPlan.name || !newPlan.duration || !newPlan.amount) {
      addNotification('Please fill in all plan details', 'error');
      return;
    }

    // Duration is assumed to be in months, convert to days
    const durationDays = parseInt(newPlan.duration) * 30;

    const planData = {
      id: Date.now(), // Temporary ID for UI
      name: newPlan.name,
      duration_days: durationDays,
      price: parseFloat(newPlan.amount),
      description: `${newPlan.duration} month plan`
    };

    setCustomPlans([...customPlans, planData]);
    addNotification('Plan added successfully', 'success');
    
    // Reset form
    setNewPlan({ name: '', duration: '1', amount: '' });
  };

  const removePlan = (planId) => {
    setCustomPlans(customPlans.filter(plan => plan.id !== planId));
    addNotification('Plan removed', 'success');
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
      // Save settings using the correct structure that matches the Settings page
      // Save General Settings
      await api.settings.updateSettings({
        total_seats: parseInt(formData.totalSeats),
        library_name: formData.libraryName,
        library_address: formData.address,
        library_phone: formData.phone || '',
        library_email: formData.email || '',
        library_website: formData.website || '',
        operating_hours: JSON.stringify(formData.operatingHours)
      });

      // Save Membership Settings
      await api.settings.updateSettings({
        deposit_amount: parseFloat(formData.depositAmount)
      });

      // Save Attendance Settings
      await api.settings.updateSettings({
        auto_mark_absent: formData.autoMarkAbsent,
        absent_after_hours: parseInt(formData.absentAfterHours),
        auto_checkout_hours: parseInt(formData.autoCheckOutHours)
      });

      // Save Payment Settings
      await api.settings.updateSettings({
        currency: formData.currency,
        accept_cash: formData.acceptCash,
        accept_online: formData.acceptOnline
      });

      // Save Notification Settings
      await api.settings.updateSettings({
        enable_email_notifications: formData.enableEmailNotifications,
        enable_sms_notifications: formData.enableSMSNotifications,
        membership_expiry_reminder: formData.membershipExpiryReminder,
        reminder_days_before: parseInt(formData.reminderDaysBefore),
        birthday_wishes: formData.birthdayWishes
      });

      // Save Security Settings
      await api.settings.updateSettings({
        session_timeout: parseInt(formData.sessionTimeout),
        enable_biometric: formData.enableBiometric,
        two_factor_auth: formData.twoFactorAuth
      });

      // Save Backup Settings
      await api.settings.updateSettings({
        auto_backup: formData.autoBackup,
        backup_frequency: formData.backupFrequency,
        keep_backups_for: parseInt(formData.keepBackupsFor)
      });
      
      // Save payment plans
      for (const plan of customPlans) {
        try {
          await api.plan.add({
            name: plan.name,
            duration_days: plan.duration_days,
            price: plan.price,
            description: plan.description
          });
        } catch (err) {
          console.error('Failed to save plan:', err);
        }
      }
      
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
                  value={formData.libraryName}
                  onChange={(e) => handleInputChange('libraryName', e.target.value)}
                  placeholder="Enter your study room name"
                  className="minimal-input"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Total Seats</label>
                <input
                  type="number"
                  value={formData.totalSeats}
                  onChange={(e) => handleInputChange('totalSeats', e.target.value)}
                  placeholder="Total number of seats"
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
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Phone Number <span className="optional">optional</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Contact phone number"
                  className="minimal-input"
                />
              </div>
              
              <div className="input-group">
                <label>Email Address <span className="optional">optional</span></label>
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
            </div>
          </div>
        );

      case 2:
        return (
          <div className="minimal-form">
            <div className="section-group">
              <h3>Day Shift Operating Hours</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Opening Time</label>
                  <input
                    type="time"
                    value={formData.operatingHours.dayShift.openTime}
                    onChange={(e) => handleInputChange('operatingHours.dayShift.openTime', e.target.value)}
                    className="minimal-input"
                  />
                </div>
                
                <div className="input-group">
                  <label>Closing Time</label>
                  <input
                    type="time"
                    value={formData.operatingHours.dayShift.closeTime}
                    onChange={(e) => handleInputChange('operatingHours.dayShift.closeTime', e.target.value)}
                    className="minimal-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="section-group">
              <div className="option-card">
                <div className="option-content">
                  <h3>Enable Night Shift</h3>
                  <p>Operate during night hours for extended study time</p>
                </div>
                <div className="option-control">
                  <input
                    type="checkbox"
                    id="nightShift"
                    className="toggle-input"
                    checked={formData.operatingHours.enableNightShift}
                    onChange={(e) => handleInputChange('operatingHours.enableNightShift', e.target.checked)}
                  />
                  <label htmlFor="nightShift" className="toggle-label minimal"></label>
                </div>
              </div>
              
              {formData.operatingHours.enableNightShift && (
                <div className="form-grid" style={{marginTop: '1rem'}}>
                  <div className="input-group">
                    <label>Night Shift Opening Time</label>
                    <input
                      type="time"
                      value={formData.operatingHours.nightShift.openTime}
                      onChange={(e) => handleInputChange('operatingHours.nightShift.openTime', e.target.value)}
                      className="minimal-input"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Night Shift Closing Time</label>
                    <input
                      type="time"
                      value={formData.operatingHours.nightShift.closeTime}
                      onChange={(e) => handleInputChange('operatingHours.nightShift.closeTime', e.target.value)}
                      className="minimal-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="minimal-form">
            <div className="section-group">
              <h3>Membership Settings</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Deposit Amount (₹)</label>
                  <div className="currency-input">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="50"
                      value={formData.depositAmount}
                      onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                      placeholder="200"
                      className="minimal-input currency"
                      min="0"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Security deposit required from each member</p>
                </div>
              </div>
            </div>
            
            <div className="section-group">
              <h3>Attendance Settings</h3>
              <div className="options-grid">
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
              
              <div className="form-grid" style={{marginTop: '1rem'}}>
                <div className="input-group">
                  <label>Auto Check-out After (hours)</label>
                  <input
                    type="number"
                    value={formData.autoCheckOutHours}
                    onChange={(e) => handleInputChange('autoCheckOutHours', e.target.value)}
                    placeholder="12"
                    className="minimal-input"
                    min="1"
                    max="24"
                  />
                  <p className="text-xs text-slate-500 mt-1">Members will be automatically checked out after this many hours</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="minimal-form">
            <div className="section-group">
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💳 Payment Plans
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#64748b',
                  margin: 0 
                }}>
                  Create membership plans for your study room
                </p>
              </div>
              
              <div style={{
                backgroundColor: '#ffffff',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: '0.75rem',
                  alignItems: 'end',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      color: '#1e293b'
                    }}>Plan Name</label>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Monthly Plan"
                      className="minimal-input"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      color: '#1e293b'
                    }}>Duration (months)</label>
                    <input
                      type="number"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value }))}
                      className="minimal-input"
                      min="1"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      color: '#1e293b'
                    }}>Amount (₹)</label>
                    <input
                      type="number"
                      value={newPlan.amount}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, amount: e.target.value }))}
                      className="minimal-input"
                      min="0"
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addPlan}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  Add Plan
                </button>
              </div>
              
              {customPlans.length > 0 ? (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  marginBottom: '1.5rem'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.05em' }}>PLAN NAME</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.05em' }}>DURATION</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.05em' }}>AMOUNT</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customPlans.map(plan => (
                        <tr key={plan.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{plan.name}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{plan.duration_days} Days</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>₹{plan.price}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <button
                              type="button"
                              onClick={() => removePlan(plan.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                padding: '0.375rem 0.875rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ margin: 0 }}>No payment plans added yet</p>
                </div>
              )}
            </div>
            
            <div className="section-group" style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#1e293b'
              }}>Payment Configuration</h3>
              
              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#1e293b'
                  }}>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="minimal-select"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="INR">₹ Indian Rupee (INR)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      margin: 0,
                      marginBottom: '0.25rem',
                      color: '#1e293b'
                    }}>Accept Cash Payments</h4>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>Allow cash payments at the library</p>
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
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      margin: 0,
                      marginBottom: '0.25rem',
                      color: '#1e293b'
                    }}>Accept Online Payments</h4>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>Enable digital payment methods</p>
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
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#1e293b'
              }}>Notification Preferences</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      margin: 0,
                      marginBottom: '0.25rem',
                      color: '#1e293b'
                    }}>Email Notifications</h4>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>Send notifications via email</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      className="toggle-input"
                      checked={formData.enableEmailNotifications}
                      onChange={(e) => handleInputChange('enableEmailNotifications', e.target.checked)}
                    />
                    <label htmlFor="emailNotifications" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      margin: 0,
                      marginBottom: '0.25rem',
                      color: '#1e293b'
                    }}>SMS Notifications</h4>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>Send notifications via SMS</p>
                  </div>
                  <div className="option-control">
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      className="toggle-input"
                      checked={formData.enableSMSNotifications}
                      onChange={(e) => handleInputChange('enableSMSNotifications', e.target.checked)}
                    />
                    <label htmlFor="smsNotifications" className="toggle-label minimal"></label>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      margin: 0,
                      marginBottom: '0.25rem',
                      color: '#1e293b'
                    }}>Membership Expiry Reminder</h4>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>Send reminders before membership expires</p>
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
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      margin: 0,
                      marginBottom: '0.25rem',
                      color: '#1e293b'
                    }}>Birthday Wishes</h4>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>Send birthday wishes to members</p>
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
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#1e293b'
                  }}>Reminder Days Before Expiry</label>
                  <input
                    type="number"
                    value={formData.reminderDaysBefore}
                    onChange={(e) => handleInputChange('reminderDaysBefore', e.target.value)}
                    placeholder="7"
                    className="minimal-input"
                    min="1"
                    max="30"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem'
                    }}
                  />
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
                      checked={formData.enableBiometric}
                      onChange={(e) => handleInputChange('enableBiometric', e.target.checked)}
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
                    <label>Keep Backups For (days)</label>
                    <input
                      type="number"
                      value={formData.keepBackupsFor}
                      onChange={(e) => handleInputChange('keepBackupsFor', e.target.value)}
                      placeholder="30"
                      className="minimal-input"
                      min="7"
                      max="365"
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
                  <span>✓ Study Room Information & Contact Details</span>
                  <span>✓ Operating Hours & Schedule</span>
                  <span>✓ Membership & Attendance Settings</span>
                  <span>✓ Payment Methods & Notifications</span>
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
