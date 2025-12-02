import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '../services/api';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayAttendance: 0,
    activeMembers: 0,
    avgDailyAttendance: 0
  });
  const [filters, setFilters] = useState({
    memberId: '',
    dateFrom: '',
    dateTo: '',
    source: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    memberId: '',
    checkIn: '',
    checkOut: '',
    source: 'manual'
  });

  useEffect(() => {
    loadMembers();
    loadAttendance();
    loadStats();

    // Set up auto check-out interval
    const autoCheckOutInterval = setInterval(() => {
      handleAutoCheckOut();
    }, 60000); // Check every minute

    return () => clearInterval(autoCheckOutInterval);
  }, []);

  useEffect(() => {
    loadAttendance();
    loadStats(); // Also reload stats when filters change
  }, [filters]);

  const loadMembers = async () => {
    try {
      const result = await api.member.list();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      const result = await api.attendance.list(filters);
      if (result.success) {
        setAttendanceRecords(result.data);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const loadStats = async () => {
    try {
      const todayResult = await api.attendance.today();
      const statsResult = await api.dashboard.stats();

      // Get monthly records by calling API with monthly filter
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const monthlyFilter = {
        dateFrom: firstDayOfMonth.toISOString().split('T')[0],
        dateTo: lastDayOfMonth.toISOString().split('T')[0]
      };

      const monthlyResult = await api.attendance.list(monthlyFilter);
      const monthlyRecords = monthlyResult.success ? monthlyResult.data.length : 0;

      if (todayResult.success && statsResult.success) {
        setStats({
          totalRecords: monthlyRecords,
          todayAttendance: todayResult.data.length,
          activeMembers: statsResult.data.activeMembers,
          avgDailyAttendance: Math.round(statsResult.data.todayAttendance || 0)
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ memberId: '', dateFrom: '', dateTo: '', source: '' });
  };

  const handleAddAttendance = async () => {
    if (!newAttendance.memberId) {
      alert('Please select a member');
      return;
    }

    try {
      const result = await api.attendance.add(newAttendance);
      if (result.success) {
        setShowAddModal(false);
        setNewAttendance({ memberId: '', checkIn: '', checkOut: '', source: 'manual' });
        loadAttendance();
        loadStats();
      } else {
        alert(result.message || 'Failed to add attendance');
      }
    } catch (error) {
      console.error('Failed to add attendance:', error);
      alert('Failed to add attendance');
    }
  };

  const handleQuickCheckIn = async (memberId) => {
    try {
      const result = await api.attendance.checkin({ memberId, source: 'manual' });
      if (result.success) {
        loadAttendance();
        loadStats();
      } else {
        alert(result.message || 'Failed to check in');
      }
    } catch (error) {
      console.error('Failed to check in:', error);
      alert('Failed to check in');
    }
  };

  const handleQuickCheckOut = async (memberId) => {
    try {
      const result = await api.attendance.checkout({ memberId });
      if (result.success) {
        loadAttendance();
        loadStats();
      } else {
        alert(result.message || 'Failed to check out');
      }
    } catch (error) {
      console.error('Failed to check out:', error);
      alert('Failed to check out');
    }
  };

  const handleAutoCheckOut = async () => {
    try {
      // Auto check-out after specified hours (will be configurable from Settings page)
      const autoCheckOutHours = 12; // Default value, can be fetched from settings
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - autoCheckOutHours);

      // Get active attendance records that are older than cutoff time
      const activeRecords = attendanceRecords.filter(record =>
        !record.check_out &&
        new Date(record.check_in) < cutoffTime
      );

      // Auto check-out these records
      for (const record of activeRecords) {
        await api.attendance.checkout({
          memberId: record.member_id,
          autoCheckOut: true
        });
      }

      if (activeRecords.length > 0) {
        loadAttendance();
        loadStats();
      }
    } catch (error) {
      console.error('Auto check-out failed:', error);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      manual: '#6b7280',
      biometric: '#10b981'
    };
    return colors[source] || '#6b7280';
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Attendance Management</h1>
          <p className="page-subtitle">Track and manage member attendance records</p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="button button-secondary"
          >
            Quick Actions
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="button button-primary"
          >
            + Add Attendance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalRecords}</div>
          <div className="stat-label">Monthly Record</div>
          <div className="stat-sublabel">Current month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.todayAttendance}</div>
          <div className="stat-label">Today's Attendance</div>
          <div className="stat-sublabel">{format(new Date(), 'dd MMM yyyy')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeMembers}</div>
          <div className="stat-label">Active Members</div>
          <div className="stat-sublabel">Currently enrolled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgDailyAttendance}</div>
          <div className="stat-label">Avg Daily</div>
          <div className="stat-sublabel">Recent average</div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="card">
          <div className="card-header">
            <h3>Quick Check-In/Out</h3>
            <p className="card-subtitle">Quickly check members in or out</p>
          </div>
          <div className="quick-actions-grid">
            {members.filter(m => m.status === 'active').slice(0, 6).map(member => (
              <div key={member.id} className="quick-action-item">
                <div className="member-info">
                  <strong>{member.name}</strong>
                  <span className="member-plan">{member.plan_name || 'No Plan'}</span>
                </div>
                <div className="quick-actions">
                  <button
                    onClick={() => handleQuickCheckIn(member.id)}
                    className="button button-sm button-success"
                  >
                    Check In
                  </button>
                  <button
                    onClick={() => handleQuickCheckOut(member.id)}
                    className="button button-sm button-warning"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card filters-card">
        <div className="card-header">
          <h3>Filter Attendance</h3>
          <p className="card-subtitle">Filter attendance records by member, date range, or source</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="member-filter">Member</label>
            <select
              id="member-filter"
              value={filters.memberId}
              onChange={(e) => handleFilterChange('memberId', e.target.value)}
              className="form-control"
            >
              <option value="">All Members</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="date-from">From Date</label>
            <input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="date-to">To Date</label>
            <input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="source-filter">Source</label>
            <select
              id="source-filter"
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="form-control"
            >
              <option value="">All Sources</option>
              <option value="manual">Manual</option>
              <option value="biometric">Biometric</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button onClick={clearFilters} className="button button-secondary">
            Clear All Filters
          </button>
          {(filters.memberId || filters.dateFrom || filters.dateTo || filters.source) && (
            <span className="filter-indicator">
              {Object.values(filters).filter(Boolean).length} filter(s) active
            </span>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-header">
          <h3>Attendance History</h3>
          <p className="card-subtitle">
            Showing {attendanceRecords.length} record{attendanceRecords.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div>
                      <h3>No attendance records found</h3>
                      <p>Try adjusting your filters or add a new attendance record</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="button button-primary"
                      >
                        Add First Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                attendanceRecords.map(record => {
                  const checkIn = record.check_in ? new Date(record.check_in) : null;
                  const checkOut = record.check_out ? new Date(record.check_out) : null;
                  const duration = checkIn && checkOut ?
                    Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 100)) / 10 : null;

                  return (
                    <tr key={record.id}>
                      <td>
                        <div className="member-cell">
                          <strong>{record.member_name}</strong>
                          <span className="member-id">ID: {record.member_id}</span>
                        </div>
                      </td>
                      <td>{formatDateTime(record.check_in)}</td>
                      <td>{formatDateTime(record.check_out)}</td>
                      <td>
                        {duration ? `${duration}h` : record.check_out ? '-' : 'Active'}
                      </td>
                      <td>
                        <span
                          className="source-badge"
                          style={{ backgroundColor: getSourceColor(record.source) }}
                        >
                          {record.source.charAt(0).toUpperCase() + record.source.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${record.check_out ? 'completed' : 'active'}`}>
                          {record.check_out ? 'Completed' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {!record.check_out && (
                            <button
                              onClick={() => handleQuickCheckOut(record.member_id)}
                              className="button button-sm button-warning"
                              title="Check Out"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Attendance Record</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="modal-close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="attendance-member">Member *</label>
                <select
                  id="attendance-member"
                  value={newAttendance.memberId}
                  onChange={(e) => setNewAttendance(prev => ({ ...prev, memberId: e.target.value }))}
                  className="form-control"
                  required
                >
                  <option value="">Select Member</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.plan_name || 'No Plan'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="attendance-checkin">Check In</label>
                  <input
                    id="attendance-checkin"
                    type="datetime-local"
                    value={newAttendance.checkIn}
                    onChange={(e) => setNewAttendance(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="form-control"
                  />
                  <span className="form-help">Leave empty for current time</span>
                </div>

                <div className="form-group">
                  <label htmlFor="attendance-checkout">Check Out</label>
                  <input
                    id="attendance-checkout"
                    type="datetime-local"
                    value={newAttendance.checkOut}
                    onChange={(e) => setNewAttendance(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="form-control"
                  />
                  <span className="form-help">Leave empty if still active</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="attendance-source">Source</label>
                <select
                  id="attendance-source"
                  value={newAttendance.source}
                  onChange={(e) => setNewAttendance(prev => ({ ...prev, source: e.target.value }))}
                  className="form-control"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="biometric">Biometric Scan</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                className="button button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttendance}
                className="button button-primary"
                disabled={!newAttendance.memberId}
              >
                Add Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
