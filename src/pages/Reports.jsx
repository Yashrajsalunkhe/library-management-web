import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { api } from '../services/api';

const Reports = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab?.tab || 'overview');
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState({
    overview: null,
    attendance: [],
    payments: [],
    expenditures: [],
    members: []
  });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'expenditures', label: 'Expenditures', icon: '💸' },
    { id: 'members', label: 'Members', icon: '👥' }
  ];

  useEffect(() => {
    loadReportData();
  }, [activeTab, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Validate date range
      if (activeTab !== 'overview') {
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);

        if (fromDate > toDate) {
          console.error('Invalid date range: from date is after to date');
          return;
        }

        // Check if date range is too far in the future
        const today = new Date();
        if (fromDate > today) {
          console.warn('Date range starts in the future');
        }
      }

      switch (activeTab) {
        case 'overview':
          await loadOverviewData();
          break;
        case 'attendance':
          await loadAttendanceReport();
          break;
        case 'payments':
          await loadPaymentsReport();
          break;
        case 'expenditures':
          await loadExpendituresReport();
          break;
        case 'members':
          await loadMembersReport();
          break;
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      const stats = await api.dashboard.stats();
      if (stats.success) {
        setReportData(prev => ({ ...prev, overview: stats.data }));
      }
    } catch (error) {
      console.error('Failed to load overview data:', error);
    }
  };

  const loadAttendanceReport = async () => {
    try {
      console.log('Loading attendance report for date range:', dateRange);
      const result = await api.report.attendance({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });
      if (result.success) {
        console.log('Attendance report loaded:', result.data.length, 'records');
        setReportData(prev => ({ ...prev, attendance: result.data }));
      } else {
        console.error('Failed to load attendance report:', result.message);
        setReportData(prev => ({ ...prev, attendance: [] }));
      }
    } catch (error) {
      console.error('Failed to load attendance report:', error);
      setReportData(prev => ({ ...prev, attendance: [] }));
    }
  };

  const loadPaymentsReport = async () => {
    try {
      console.log('Loading payments report for date range:', dateRange);
      const result = await api.report.payments({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });
      if (result.success) {
        console.log('Payments report loaded:', result.data.length, 'records');
        setReportData(prev => ({ ...prev, payments: result.data }));
      } else {
        console.error('Failed to load payments report:', result.message);
        setReportData(prev => ({ ...prev, payments: [] }));
      }
    } catch (error) {
      console.error('Failed to load payments report:', error);
      setReportData(prev => ({ ...prev, payments: [] }));
    }
  };

  const loadExpendituresReport = async () => {
    try {
      console.log('Loading expenditures report for date range:', dateRange);
      const result = await api.report.expenditures({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });
      if (result.success) {
        console.log('Expenditures report loaded:', result.data.length, 'records');
        setReportData(prev => ({ ...prev, expenditures: result.data }));
      } else {
        console.error('Failed to load expenditures report:', result.message);
        setReportData(prev => ({ ...prev, expenditures: [] }));
      }
    } catch (error) {
      console.error('Failed to load expenditures report:', error);
      setReportData(prev => ({ ...prev, expenditures: [] }));
    }
  };

  const loadMembersReport = async () => {
    try {
      const result = await api.member.list();
      if (result.success) {
        setReportData(prev => ({ ...prev, members: result.data }));
      }
    } catch (error) {
      console.error('Failed to load members report:', error);
    }
  };

  const setQuickDateRange = (months) => {
    const endDate = new Date();
    const startDate = subMonths(endDate, months);
    setDateRange({
      from: format(startOfMonth(startDate), 'yyyy-MM-dd'),
      to: format(endOfMonth(endDate), 'yyyy-MM-dd')
    });
  };

  const exportReport = async (type, format = 'csv') => {
    setExportLoading(true);
    try {
      console.log('Exporting report:', { type, format, dateRange });

      const dataToExport = reportData[type];
      if (!dataToExport || dataToExport.length === 0) {
        alert(`No ${type} data available to export for the selected date range (${dateRange.from} to ${dateRange.to}).\n\nPlease:\n1. Select a different date range\n2. Check if there's data for the selected period\n3. Ensure you're connected to the database`);
        return;
      }

      console.log(`Exporting ${dataToExport.length} ${type} records`);

      const result = await api.report.exportWithDialog({
        type,
        format,
        dateRange,
        data: dataToExport
      });

      if (result.success) {
        const formatName = format.toUpperCase();
        alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully!\n\n📊 Format: ${formatName}\n📁 Records: ${result.recordCount || dataToExport.length}\n📅 Period: ${dateRange.from} to ${dateRange.to}\n\n📂 Saved to: ${result.filepath}\n\nThe file explorer will open automatically to show your exported file.`);
      } else if (result.message === 'Export cancelled by user') {
        console.log('Export cancelled by user');
        // Don't show an error alert for user cancellation
      } else {
        console.error('Export failed:', result.message);
        alert(`❌ Failed to export ${type} report:\n\n${result.message}\n\nPlease try again or check the console for more details.`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`❌ Export failed due to an unexpected error:\n\n${error.message}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      setExportLoading(false);
    }
  };

  const renderOverview = () => {
    if (!reportData.overview) return <div className="loading">Loading overview...</div>;

    const { totalMembers, todayAttendance, monthlyRevenue, recentPayments } = reportData.overview;

    return (
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Members</h3>
            <div className="card-value">{totalMembers}</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Today's Attendance</h3>
            <div className="card-value">{todayAttendance}</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Monthly Revenue</h3>
            <div className="card-value">₹{monthlyRevenue?.toLocaleString() || 0}</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">🆕</div>
          <div className="card-content">
            <h3>Recent Payments</h3>
            <div className="card-value">{recentPayments}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAttendanceReport = () => {
    if (loading) return <div className="loading">Loading attendance report...</div>;

    return (
      <div className="report-content">
        <div className="report-header">
          <h3>Attendance Report ({dateRange.from} to {dateRange.to})</h3>
          <div className="report-actions">
            <button
              onClick={() => exportReport('attendance', 'csv')}
              className="button button-secondary"
              disabled={exportLoading || !reportData.attendance?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📄 Export CSV'}
            </button>
            <button
              onClick={() => exportReport('attendance', 'xlsx')}
              className="button button-primary"
              disabled={exportLoading || !reportData.attendance?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📊 Export Excel'}
            </button>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.attendance.map((record, index) => (
                <tr key={index}>
                  <td>{record.date ? format(new Date(record.date), 'dd/MM/yyyy') : '-'}</td>
                  <td>{record.member_name}</td>
                  <td>{record.check_in || '-'}</td>
                  <td>{record.check_out || '-'}</td>
                  <td>{record.duration || '-'}</td>
                  <td>
                    <span className={`status ${record.status?.toLowerCase() || 'pending'}`}>
                      {record.status || 'In Progress'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportData.attendance.length === 0 && (
            <div className="no-data">No attendance data found for selected date range</div>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentsReport = () => {
    if (loading) return <div className="loading">Loading payments report...</div>;

    const totalAmount = reportData.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return (
      <div className="report-content">
        <div className="report-header">
          <h3>Payments Report ({dateRange.from} to {dateRange.to})</h3>
          <div className="report-summary">
            <span className="summary-item">Total: ₹{totalAmount.toLocaleString()}</span>
            <span className="summary-item">Count: {reportData.payments.length}</span>
          </div>
          <div className="report-actions">
            <button
              onClick={() => exportReport('payments', 'csv')}
              className="button button-secondary"
              disabled={exportLoading || !reportData.payments?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📄 Export CSV'}
            </button>
            <button
              onClick={() => exportReport('payments', 'xlsx')}
              className="button button-primary"
              disabled={exportLoading || !reportData.payments?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📊 Export Excel'}
            </button>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {reportData.payments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : '-'}</td>
                  <td>{payment.member_name}</td>
                  <td>{payment.plan_name}</td>
                  <td>₹{payment.amount?.toLocaleString()}</td>
                  <td>{payment.payment_method}</td>
                  <td>
                    <span className={`status ${payment.status?.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.reference_number || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportData.payments.length === 0 && (
            <div className="no-data">No payment data found for selected date range</div>
          )}
        </div>
      </div>
    );
  };

  const renderExpendituresReport = () => {
    if (loading) return <div className="loading">Loading expenditures report...</div>;

    const totalAmount = reportData.expenditures.reduce((sum, expenditure) => sum + (expenditure.amount || 0), 0);

    return (
      <div className="report-content">
        <div className="report-header">
          <h3>Expenditures Report ({dateRange.from} to {dateRange.to})</h3>
          <div className="report-summary">
            <span className="summary-item">Total: ₹{totalAmount.toLocaleString()}</span>
            <span className="summary-item">Count: {reportData.expenditures.length}</span>
          </div>
          <div className="report-actions">
            <button
              onClick={() => exportReport('expenditures', 'csv')}
              className="button button-secondary"
              disabled={exportLoading || !reportData.expenditures?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📄 Export CSV'}
            </button>
            <button
              onClick={() => exportReport('expenditures', 'xlsx')}
              className="button button-primary"
              disabled={exportLoading || !reportData.expenditures?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📊 Export Excel'}
            </button>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Receipt #</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {reportData.expenditures.map((expenditure, index) => {
                // Safely format the date
                let dateDisplay = '-';
                try {
                  const dateValue = expenditure.expenditure_date || expenditure.date;
                  if (dateValue) {
                    dateDisplay = format(new Date(dateValue), 'dd/MM/yyyy');
                  }
                } catch (error) {
                  console.error('Date formatting error for expenditure:', expenditure, error);
                  dateDisplay = expenditure.expenditure_date || expenditure.date || '-';
                }

                return (
                  <tr key={expenditure.id || index}>
                    <td>{dateDisplay}</td>
                    <td>{expenditure.description || '-'}</td>
                    <td>{expenditure.category || '-'}</td>
                    <td>₹{expenditure.amount?.toLocaleString() || '0'}</td>
                    <td>{expenditure.payment_mode || '-'}</td>
                    <td>{expenditure.receipt_number || '-'}</td>
                    <td>{expenditure.created_by_name || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reportData.expenditures.length === 0 && (
            <div className="no-data">No expenditure data found for selected date range</div>
          )}
        </div>
      </div>
    );
  };

  const renderMembersReport = () => {
    if (loading) return <div className="loading">Loading members report...</div>;

    const activeMembers = reportData.members.filter(m => m.status === 'active').length;
    const inactiveMembers = reportData.members.filter(m => m.status === 'inactive').length;

    return (
      <div className="report-content">
        <div className="report-header">
          <h3>Members Report</h3>
          <div className="report-summary">
            <span className="summary-item">Active: {activeMembers}</span>
            <span className="summary-item">Inactive: {inactiveMembers}</span>
            <span className="summary-item">Total: {reportData.members.length}</span>
          </div>
          <div className="report-actions">
            <button
              onClick={() => exportReport('members', 'csv')}
              className="button button-secondary"
              disabled={exportLoading || !reportData.members?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📄 Export CSV'}
            </button>
            <button
              onClick={() => exportReport('members', 'xlsx')}
              className="button button-primary"
              disabled={exportLoading || !reportData.members?.length}
            >
              {exportLoading ? '⏳ Exporting...' : '📊 Export Excel'}
            </button>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.members.map((member, index) => (
                <tr key={index}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  <td>{member.plan}</td>
                  <td>{member.created_at ? format(new Date(member.created_at), 'dd/MM/yyyy') : '-'}</td>
                  <td>
                    <span className={`status ${member.status?.toLowerCase()}`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportData.members.length === 0 && (
            <div className="no-data">No members found</div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'attendance':
        return renderAttendanceReport();
      case 'payments':
        return renderPaymentsReport();
      case 'expenditures':
        return renderExpendituresReport();
      case 'members':
        return renderMembersReport();
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate comprehensive reports and export data</p>
      </div>

      <div className="reports-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'overview' && (
        <div className="date-controls">
          <div className="date-range">
            <label>
              From:
              <input
                type="date"
                value={dateRange.from}
                max={dateRange.to} // Prevent from date being after to date
                onChange={(e) => {
                  const newFromDate = e.target.value;
                  setDateRange(prev => ({
                    ...prev,
                    from: newFromDate,
                    // Adjust to date if it's before the new from date
                    to: prev.to < newFromDate ? newFromDate : prev.to
                  }));
                }}
              />
            </label>
            <label>
              To:
              <input
                type="date"
                value={dateRange.to}
                min={dateRange.from} // Prevent to date being before from date
                max={format(new Date(), 'yyyy-MM-dd')} // Prevent future dates beyond today
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </label>
          </div>

          <div className="quick-filters">
            <button onClick={() => setQuickDateRange(1)} className="quick-filter">Last Month</button>
            <button onClick={() => setQuickDateRange(3)} className="quick-filter">Last 3 Months</button>
            <button onClick={() => setQuickDateRange(6)} className="quick-filter">Last 6 Months</button>
            <button onClick={() => setQuickDateRange(12)} className="quick-filter">Last Year</button>
          </div>

          <div className="date-info">
            {dateRange.from && dateRange.to && (
              <span className="date-range-display">
                📅 Showing data from {format(new Date(dateRange.from), 'dd/MM/yyyy')} to {format(new Date(dateRange.to), 'dd/MM/yyyy')}
                {reportData[activeTab] && (
                  <span className="record-count"> ({reportData[activeTab].length} records)</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="reports-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;
