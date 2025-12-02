import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';

export default function InitialSetup() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [formData, setFormData] = useState({
    library_name: '',
    library_address: '',
    library_city: '',
    library_state: '',
    library_pincode: '',
    library_phone: '',
    library_email: '',
    library_owner_name: '',
    total_seats: '',
    notification_days: '10',
    receipt_prefix: 'RR',
    late_fee_per_day: '10',
    business_hours_open: '06:00',
    business_hours_close: '22:00',
    gst_number: '',
    enable_biometric: false,
    enable_notifications: false,
  });

  useEffect(() => {
    checkIfSetupCompleted();
  }, []);

  const checkIfSetupCompleted = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'setup_completed')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking setup status:', error);
      }

      if (data && data.value === 'true') {
        // Setup already completed, redirect to dashboard
        window.location.href = '/';
      } else {
        // Load any existing settings
        await loadExistingSettings();
      }
    } catch (error) {
      console.error('Error in setup check:', error);
    } finally {
      setCheckingSetup(false);
    }
  };

  const loadExistingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const newFormData = { ...formData };
        data.forEach(setting => {
          if (setting.key === 'business_hours') {
            try {
              const hours = JSON.parse(setting.value);
              newFormData.business_hours_open = hours.open;
              newFormData.business_hours_close = hours.close;
            } catch (e) {
              console.error('Error parsing business hours:', e);
            }
          } else if (setting.key === 'enable_biometric' || setting.key === 'enable_notifications') {
            newFormData[setting.key] = setting.value === 'true';
          } else if (setting.key !== 'setup_completed' && setting.key !== 'auto_backup') {
            newFormData[setting.key] = setting.value || '';
          }
        });
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.library_name || !formData.library_phone || !formData.total_seats) {
        addNotification('Please fill in all required fields', 'error');
        setLoading(false);
        return;
      }

      if (parseInt(formData.total_seats) < 1) {
        addNotification('Total seats must be at least 1', 'error');
        setLoading(false);
        return;
      }

      // Prepare settings array
      const settings = [
        { key: 'library_name', value: formData.library_name },
        { key: 'library_address', value: formData.library_address },
        { key: 'library_city', value: formData.library_city },
        { key: 'library_state', value: formData.library_state },
        { key: 'library_pincode', value: formData.library_pincode },
        { key: 'library_phone', value: formData.library_phone },
        { key: 'library_email', value: formData.library_email },
        { key: 'library_owner_name', value: formData.library_owner_name },
        { key: 'total_seats', value: formData.total_seats },
        { key: 'notification_days', value: formData.notification_days },
        { key: 'receipt_prefix', value: formData.receipt_prefix },
        { key: 'late_fee_per_day', value: formData.late_fee_per_day },
        { key: 'business_hours', value: JSON.stringify({ 
          open: formData.business_hours_open, 
          close: formData.business_hours_close 
        })},
        { key: 'gst_number', value: formData.gst_number },
        { key: 'enable_biometric', value: formData.enable_biometric.toString() },
        { key: 'enable_notifications', value: formData.enable_notifications.toString() },
        { key: 'setup_completed', value: 'true' }
      ];

      // Upsert all settings
      for (const setting of settings) {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'key' 
          });

        if (error) throw error;
      }

      addNotification('Library setup completed successfully!', 'success');
      window.location.href = '/';
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('Failed to save settings: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Welcome to Reading Room Management</h1>
            <p className="mt-2 text-blue-100">Let's set up your library - This is a one-time setup</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
            {/* Library Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
                Library Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Library Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="library_name"
                    value={formData.library_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Study Point Reading Room"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner/Manager Name
                  </label>
                  <input
                    type="text"
                    name="library_owner_name"
                    value={formData.library_owner_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Owner name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="library_phone"
                    value={formData.library_phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="library_email"
                    value={formData.library_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="library@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    name="library_address"
                    value={formData.library_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street, Building, Landmark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="library_city"
                    value={formData.library_city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="library_state"
                    value={formData.library_state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="library_pincode"
                    value={formData.library_pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number (if applicable)
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="GST Number"
                  />
                </div>
              </div>
            </div>

            {/* Operational Settings */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
                Operational Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Seats Available <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_seats"
                    value={formData.total_seats}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Prefix
                  </label>
                  <input
                    type="text"
                    name="receipt_prefix"
                    value={formData.receipt_prefix}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="RR"
                    maxLength="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    name="business_hours_open"
                    value={formData.business_hours_open}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    name="business_hours_close"
                    value={formData.business_hours_close}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Days Before Expiry
                  </label>
                  <input
                    type="number"
                    name="notification_days"
                    value={formData.notification_days}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days before membership expiry to send reminder</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Late Fee Per Day (₹)
                  </label>
                  <input
                    type="number"
                    name="late_fee_per_day"
                    value={formData.late_fee_per_day}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
                Features
              </h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_biometric"
                    checked={formData.enable_biometric}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Enable Biometric Attendance</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_notifications"
                    checked={formData.enable_notifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Enable Email/SMS Notifications</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-6">
          You can always update these settings later from the Settings page
        </p>
      </div>
    </div>
  );
}
