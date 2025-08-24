import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, success } = useNotification();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const statsResult = await window.api.dashboard.stats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Load today's attendance
      const attendanceResult = await window.api.attendance.today();
      if (attendanceResult.success) {
        setRecentAttendance(attendanceResult.data.slice(0, 10)); // Show last 10
      }
    } catch (err) {
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const sendExpiryReminders = async () => {
    try {
      const result = await window.api.notification.sendExpiryReminders();
      if (result.success) {
        success(`Expiry reminders sent to ${result.data.length} members`);
      } else {
        error(result.error || 'Failed to send reminders');
      }
    } catch (err) {
      error('Failed to send expiry reminders');
    }
  };

  const createBackup = async () => {
    try {
      const result = await window.api.scheduler.backup();
      if (result.success) {
        success('Database backup created successfully');
      } else {
        error(result.error || 'Failed to create backup');
      }
    } catch (err) {
      error('Failed to create backup');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 mb-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-xl font-semibold text-blue-600">
                {stats?.totalMembers || 0}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>👥</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Attendance</p>
              <p className="text-xl font-semibold text-green-600">
                {stats?.todayAttendance || 0}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>📅</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Income</p>
              <p className="text-xl font-semibold text-green-600">
                ₹{stats?.todayIncome?.toFixed(2) || '0.00'}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>💰</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Expenditure</p>
              <p className="text-xl font-semibold text-red-600">
                ₹{stats?.todayExpenditure?.toFixed(2) || '0.00'}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>💸</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income Today</p>
              <p className={`text-xl font-semibold ${(stats?.todayNetIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{stats?.todayNetIncome?.toFixed(2) || '0.00'}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>📊</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-xl font-semibold text-yellow-600">
                {stats?.expiringMembers || 0}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>⚠️</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent Attendance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Attendance</h3>
          </div>
          
          {recentAttendance.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map(attendance => (
                    <tr key={attendance.id}>
                      <td>{attendance.member_name}</td>
                      <td>
                        {new Date(attendance.check_in).toLocaleTimeString()}
                      </td>
                      <td>
                        {attendance.check_out 
                          ? new Date(attendance.check_out).toLocaleTimeString()
                          : <span className="badge badge-info">Active</span>
                        }
                      </td>
                      <td>
                        <span className={`badge ${
                          attendance.source === 'biometric' 
                            ? 'badge-success' 
                            : 'badge-info'
                        }`}>
                          {attendance.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4">
              No attendance records for today
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>

          <div className="grid gap-4">
            <button
              onClick={sendExpiryReminders}
              className="button button-warning"
              style={{ justifyContent: 'flex-start' }}
            >
              <span style={{ marginRight: '0.5rem' }}>📧</span>
              Send Expiry Reminders
            </button>

            <button
              onClick={createBackup}
              className="button button-secondary"
              style={{ justifyContent: 'flex-start' }}
            >
              <span style={{ marginRight: '0.5rem' }}>💾</span>
              Create Database Backup
            </button>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f7fafc', 
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                marginBottom: '0.5rem' 
              }}>
                Monthly Summary
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                Total Revenue: ₹{stats?.monthlyIncome?.toFixed(2) || '0.00'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                Total Expenditure: ₹{stats?.monthlyExpenditure?.toFixed(2) || '0.00'}
              </p>
              <p style={{ 
                fontSize: '0.75rem', 
                fontWeight: '600',
                color: (stats?.monthlyNetIncome || 0) >= 0 ? '#38a169' : '#e53e3e'
              }}>
                Net Income: ₹{stats?.monthlyNetIncome?.toFixed(2) || '0.00'}
              </p>
            </div>

            {stats?.expiringMembers > 0 && (
              <div className="alert alert-warning">
                <strong>{stats.expiringMembers}</strong> member(s) will expire within 10 days.
                Consider sending renewal reminders.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
