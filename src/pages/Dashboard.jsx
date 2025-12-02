import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import BiometricStatus from '../components/BiometricStatus';
import { api } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [seatStats, setSeatStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const { error, success } = useNotification();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard stats
      const statsResult = await api.dashboard.stats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Load seat statistics
      const seatStatsResult = await api.member.getSeatStats();
      if (seatStatsResult.success) {
        setSeatStats(seatStatsResult.data);
      }

      // Load today's attendance
      const attendanceResult = await api.attendance.today();
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
      const result = await api.notification.sendExpiryReminders();
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
    setBackupLoading(true);
    try {
      const result = await api.backup.createBackup();
      if (result.success) {
        success(`Database backup created successfully! Saved as: ${result.timestamp}`);
      } else {
        error(result.message || 'Failed to create backup');
      }
    } catch (err) {
      console.error('Backup error:', err);
      error('Failed to create backup: ' + (err.message || 'Unknown error'));
    } finally {
      setBackupLoading(false);
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
    <div className="dashboard-container animate-fade-in">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value">{stats?.totalMembers || 0}</div>
          <div className="text-sm text-gray-500">Active library members</div>
          <div className="stat-icon">👥</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Today's Attendance</div>
          <div className="stat-value">{stats?.todayAttendance || 0}</div>
          <div className="text-sm text-gray-500">Checked in today</div>
          <div className="stat-icon">📅</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Available Seats</div>
          <div className="stat-value" style={{
            background: seatStats?.availableSeats > 0 
              ? 'linear-gradient(135deg, var(--success-500), #059669)'
              : 'linear-gradient(135deg, var(--error-500), #dc2626)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {seatStats?.availableSeats || 0}/{seatStats?.totalSeats || 0}
          </div>
          <div className="text-sm text-gray-500">
            {seatStats?.utilizationPercentage || 0}% occupied
          </div>
          <div className="stat-icon">💺</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Today's Income</div>
          <div className="stat-value" style={{
            background: 'linear-gradient(135deg, var(--success-500), #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ₹{stats?.todayIncome?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500">Revenue collected today</div>
          <div className="stat-icon" style={{ color: 'var(--success-500)' }}>💰</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Expiring Soon</div>
          <div className="stat-value" style={{
            background: 'linear-gradient(135deg, var(--warning-500), #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats?.expiringMembers || 0}
          </div>
          <div className="text-sm text-gray-500">Memberships ending in 10 days</div>
          <div className="stat-icon" style={{ color: 'var(--warning-500)' }}>⚠️</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Attendance */}
        <div className="card dashboard-card-large">
          <div className="card-header">
            <h3 className="card-title">
              <span style={{ fontSize: '1.5rem' }}>👋</span>
              Today's Attendance
            </h3>
            <span className="badge badge-info">
              {recentAttendance.length} Records
            </span>
          </div>

          {recentAttendance.length > 0 ? (
            <div className="table-container">
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
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--primary-100)',
                            color: 'var(--primary-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '0.8rem'
                          }}>
                            {attendance.member_name.charAt(0)}
                          </div>
                          <span className="font-medium">{attendance.member_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {new Date(attendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        {attendance.check_out
                          ? <span className="text-sm text-gray-600">{new Date(attendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          : <span className="badge badge-success">Active</span>
                        }
                      </td>
                      <td>
                        <span className={`badge ${attendance.source === 'biometric'
                          ? 'badge-info'
                          : 'badge-secondary'
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
            <div className="text-center text-gray-500 p-8 flex flex-col items-center gap-2">
              <span style={{ fontSize: '2rem', opacity: 0.5 }}>📭</span>
              <p>No attendance records for today</p>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Financial Summary */}
        <div className="dashboard-sidebar">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                Quick Actions
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={sendExpiryReminders}
                className="button button-warning w-full"
                style={{ justifyContent: 'flex-start' }}
              >
                <span style={{ fontSize: '1.2rem' }}>📧</span>
                Send Expiry Reminders
              </button>

              <button
                onClick={createBackup}
                className="button button-secondary w-full"
                style={{ justifyContent: 'flex-start' }}
                disabled={backupLoading}
              >
                <span style={{ fontSize: '1.2rem' }}>
                  {backupLoading ? '⏳' : '💾'}
                </span>
                {backupLoading ? 'Creating Backup...' : 'Create Database Backup'}
              </button>

              {stats?.expiringMembers > 0 && (
                <div className="alert alert-warning mt-2">
                  <span>⚠️ <strong>{stats.expiringMembers}</strong> memberships expiring soon.</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: 'white', border: 'none' }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <h3 className="card-title" style={{ color: 'white' }}>
                <span style={{ fontSize: '1.5rem' }}>📈</span>
                Monthly Overview
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span style={{ opacity: 0.8 }}>Total Revenue</span>
                <span className="font-semibold text-lg">₹{stats?.monthlyIncome?.toFixed(2) || '0.00'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span style={{ opacity: 0.8 }}>Total Expenditure</span>
                <span className="font-semibold text-lg">₹{stats?.monthlyExpenditure?.toFixed(2) || '0.00'}</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.5rem 0' }}></div>

              <div className="flex justify-between items-center">
                <span style={{ fontWeight: '600' }}>Net Income</span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: (stats?.monthlyNetIncome || 0) >= 0 ? '#4ade80' : '#f87171'
                }}>
                  ₹{stats?.monthlyNetIncome?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Biometric Status */}
          <BiometricStatus />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
