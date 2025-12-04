import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';

const Payments = () => {
  const { showNotification } = useNotification();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [librarySettings, setLibrarySettings] = useState({});
  const [filters, setFilters] = useState({
    memberId: '',
    dateFrom: '',
    dateTo: '',
    mode: '',
    search: '',
    planId: '',
    period: '' // Added for monthly filter
  });

  const [newPayment, setNewPayment] = useState({
    memberId: '',
    amount: '',
    mode: 'cash',
    note: '',
    receiptNumber: '',
    planId: '' // Added plan selection
  });

  // Payment modes - Updated to only Cash and Online
  const paymentModes = [
    { value: 'cash', label: 'Cash' },
    { value: 'online', label: 'Online' }
  ];

  // Load initial data
  useEffect(() => {
    loadPayments();
    loadMembers();
    loadMembershipPlans();
    loadLibrarySettings();
  }, []);

  // Load payments when filters change
  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const result = await api.payment.list(filters);
      if (result.success) {
        setPayments(result.data);
      } else {
        showNotification('Failed to load payments: ' + result.message, 'error');
      }
    } catch (error) {
      showNotification('Failed to load payments: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const result = await api.member.list({ status: 'active' });
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadMembershipPlans = async () => {
    try {
      const result = await api.plan.list();
      if (result.success) {
        setMembershipPlans(result.data);
      }
    } catch (error) {
      console.error('Failed to load membership plans:', error);
    }
  };

  const loadLibrarySettings = async () => {
    try {
      const result = await api.settings.getSettings();
      if (result.success) {
        setLibrarySettings(result.settings || {});
      }
    } catch (error) {
      console.error('Failed to load library settings:', error);
    }
  };

  const handlePlanSelection = (planId) => {
    const selectedPlan = membershipPlans.find(plan => plan.id === parseInt(planId));
    setNewPayment(prev => ({
      ...prev,
      planId: planId,
      amount: selectedPlan ? selectedPlan.price.toString() : ''
    }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!newPayment.memberId || !newPayment.planId) {
      showNotification('Please select both member and membership plan', 'error');
      return;
    }

    try {
      const result = await api.payment.add({
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      });

      if (result.success) {
        showNotification('Payment added successfully', 'success');
        setShowAddPayment(false);
        setNewPayment({
          memberId: '',
          amount: '',
          mode: 'cash',
          note: '',
          receiptNumber: '',
          planId: ''
        });
        loadPayments();
        // Receipt handling for web
        if (result.data) {
          showNotification('Payment saved. Receipt available for download.', 'success');
        }
      } else {
        showNotification('Failed to add payment: ' + result.message, 'error');
      }
    } catch (error) {
      showNotification('Failed to add payment: ' + error.message, 'error');
    }
  };

  const handleFilterChange = (field, value) => {
    if (field === 'search') {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Update the filter immediately for UI responsiveness
      setFilters(prev => ({ ...prev, [field]: value }));

      // Set a new timeout for the actual search
      const newTimeout = setTimeout(() => {
        // This will trigger the useEffect to reload payments
        setFilters(prev => ({ ...prev, [field]: value }));
      }, 300); // 300ms delay

      setSearchTimeout(newTimeout);
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({
      memberId: '',
      dateFrom: '',
      dateTo: '',
      mode: '',
      search: '',
      planId: '',
      period: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentModeColor = (mode) => {
    const colors = {
      cash: '#10b981',
      online: '#3b82f6'
    };
    return colors[mode] || '#6b7280';
  };

  const getTotalAmount = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const getTodayAmount = () => {
    const today = new Date().toISOString().split('T')[0];
    return payments
      .filter(payment => payment.paid_at.startsWith(today))
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const generateReceiptHTML = (payment) => {
    const member = members.find(m => m.id === payment.member_id);
    const plan = membershipPlans.find(p => p.id === payment.plan_id);
    
    // Extract library details from settings
    const libraryName = librarySettings.library_name || librarySettings.general_libraryName || 'Libro';
    const libraryAddress = librarySettings.library_address || librarySettings.general_address || '';
    const libraryPhone = librarySettings.library_phone || librarySettings.general_phone || '';
    const libraryEmail = librarySettings.library_email || librarySettings.general_email || '';
    const ownerName = librarySettings.library_owner_name || librarySettings.general_ownerName || '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${payment.receipt_number || payment.id}</title>
  <style>
    @media print {
      @page { 
        margin: 0.5cm;
        size: A4 portrait;
      }
      body { 
        margin: 0;
        padding: 0.3cm;
      }
      .receipt-container {
        page-break-inside: avoid;
      }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
      color: #333;
    }
    .receipt-container {
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 15px;
      background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      color: #2563eb;
      font-size: 22px;
    }
    .header p {
      margin: 3px 0;
      color: #64748b;
      font-size: 13px;
    }
    .header .library-details {
      margin-top: 5px;
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }
    .receipt-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    .info-section {
      background: white;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .info-section h3 {
      margin: 0 0 8px 0;
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #1e293b;
      font-weight: 600;
    }
    .payment-details {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      border: 2px dashed #cbd5e1;
    }
    .amount-section {
      text-align: center;
      padding: 15px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      color: white;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .amount-section h2 {
      margin: 0 0 5px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      margin: 5px 0;
    }
    .payment-mode {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 12px;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 10px;
      line-height: 1.4;
    }
    .footer p {
      margin: 3px 0;
    }
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 20px;
      padding-top: 15px;
    }
    .signature-line {
      border-top: 2px solid #cbd5e1;
      padding-top: 8px;
      text-align: center;
      color: #64748b;
      font-size: 11px;
    }
    .note-section {
      background: #fef3c7;
      padding: 10px;
      border-radius: 6px;
      border-left: 4px solid #f59e0b;
      margin: 12px 0;
      font-size: 11px;
    }
    .note-section strong {
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>📚 ${libraryName}</h1>
      <p>Payment Receipt</p>
      <div class="library-details">
        ${libraryAddress ? `<div>${libraryAddress}</div>` : ''}
        ${libraryPhone || libraryEmail ? `<div>
          ${libraryPhone ? `📞 ${libraryPhone}` : ''} 
          ${libraryPhone && libraryEmail ? ' | ' : ''}
          ${libraryEmail ? `📧 ${libraryEmail}` : ''}
        </div>` : ''}
        ${ownerName ? `<div><strong>Proprietor:</strong> ${ownerName}</div>` : ''}
      </div>
    </div>

    <div class="receipt-info">
      <div class="info-section">
        <h3>Receipt Details</h3>
        <div class="info-row">
          <span class="info-label">Receipt No:</span>
          <span class="info-value">${payment.receipt_number || payment.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formatDate(payment.paid_at || payment.payment_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Transaction ID:</span>
          <span class="info-value">${payment.transaction_id || 'N/A'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3>Member Details</h3>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${member?.name || payment.member_name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Member ID:</span>
          <span class="info-value">${payment.member_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contact:</span>
          <span class="info-value">${member?.phone || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="payment-details">
      <div class="info-row">
        <span class="info-label">Membership Plan:</span>
        <span class="info-value">${plan?.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Duration:</span>
        <span class="info-value">${plan?.duration_days ? plan.duration_days + ' days' : 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Type:</span>
        <span class="info-value">${payment.type || 'Membership'}</span>
      </div>
    </div>

    <div class="amount-section">
      <h2>Total Amount Paid</h2>
      <div class="amount">${formatCurrency(payment.amount)}</div>
      <div class="payment-mode">Payment Mode: ${payment.payment_method || payment.mode || 'Cash'}</div>
    </div>

    ${payment.note ? `
    <div class="note-section">
      <strong>Note:</strong> ${payment.note}
    </div>
    ` : ''}

    <div class="signature-section">
      <div class="signature-line">
        Received By
      </div>
      <div class="signature-line">
        Member Signature
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for your payment!</strong></p>
      <p>This is a computer-generated receipt and does not require a signature.</p>
      <p>For any queries, please contact the library administration.</p>
      <p style="margin-top: 8px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrintReceipt = (payment) => {
    const receiptHTML = generateReceiptHTML(payment);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadReceipt = (payment) => {
    const receiptHTML = generateReceiptHTML(payment);
    
    // Create a hidden iframe to handle PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(receiptHTML);
    iframeDoc.close();
    
    // Wait for content to load then trigger print dialog with save as PDF
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Clean up after print dialog is closed
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      showNotification('Use "Save as PDF" or "Print to PDF" in the print dialog to save the receipt', 'info');
    }, 500);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments Management</h1>
          <p className="text-slate-500">Track and manage all payment transactions</p>
        </div>
        <button
          onClick={() => setShowAddPayment(true)}
          className="button button-primary"
        >
          <span style={{ fontSize: '1.2rem' }}>➕</span>
          Add Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Amount</div>
          <div className="stat-value text-primary-600">{formatCurrency(getTotalAmount())}</div>
          <div className="text-sm text-gray-500">{payments.length} transactions</div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Collection</div>
          <div className="stat-value text-success-600">{formatCurrency(getTodayAmount())}</div>
          <div className="text-sm text-gray-500">
            {payments.filter(p => p.paid_at.startsWith(new Date().toISOString().split('T')[0])).length} payments
          </div>
          <div className="stat-icon text-success-500">📅</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cash Payments</div>
          <div className="stat-value text-amber-600">
            {payments.filter(p => p.mode === 'cash').length}
          </div>
          <div className="text-sm text-gray-500">
            {formatCurrency(payments.filter(p => p.mode === 'cash').reduce((sum, p) => sum + p.amount, 0))}
          </div>
          <div className="stat-icon text-amber-500">💵</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Online Payments</div>
          <div className="stat-value text-blue-600">
            {payments.filter(p => p.mode !== 'cash').length}
          </div>
          <div className="text-sm text-gray-500">
            {formatCurrency(payments.filter(p => p.mode !== 'cash').reduce((sum, p) => sum + p.amount, 0))}
          </div>
          <div className="stat-icon text-blue-500">💳</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Filter Payments</h3>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by member name..."
            />
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Period</label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="select"
            >
              <option value="">All Time</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Member</label>
            <select
              value={filters.memberId}
              onChange={(e) => handleFilterChange('memberId', e.target.value)}
              className="select"
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
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select
              value={filters.mode}
              onChange={(e) => handleFilterChange('mode', e.target.value)}
              className="select"
            >
              <option value="">All Modes</option>
              {paymentModes.map(mode => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={clearFilters} className="button button-secondary">
            Clear All Filters
          </button>
          <button onClick={loadPayments} className="button button-primary">
            Apply Filter
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Payment History
            <span className="badge badge-secondary ml-2">{payments.length}</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="loading-spinner mb-2"></div>
            <p>Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center text-gray-500 p-8 flex flex-col items-center gap-2">
            <span style={{ fontSize: '2rem', opacity: 0.5 }}>💰</span>
            <h3>No payments found</h3>
            <p>
              {filters.memberId || filters.dateFrom || filters.dateTo || filters.mode || filters.search || filters.period
                ? 'No payments match your current filters.'
                : 'No payments have been recorded yet.'}
            </p>
            {(filters.memberId || filters.dateFrom || filters.dateTo || filters.mode || filters.search || filters.period) && (
              <button onClick={clearFilters} className="button button-secondary mt-3">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Plan</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>
                      <span className="font-mono text-sm text-gray-600">{payment.receipt_number}</span>
                    </td>
                    <td>
                      <div className="font-medium">
                        {payment.member_name || (
                          <span className="text-red-500 italic">
                            Deleted Member
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-800">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${payment.mode === 'cash' ? 'badge-success' : 'badge-info'}`}
                      >
                        {paymentModes.find(m => m.value === payment.mode)?.label || payment.mode}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{payment.plan_name || '-'}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {formatDate(payment.paid_at)}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-gray-500 truncate max-w-[150px]" title={payment.note}>
                        {payment.note || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="button button-secondary button-sm"
                          onClick={() => handlePrintReceipt(payment)}
                          title="Print Receipt"
                        >
                          🖨️
                        </button>

                        <button
                          className="button button-secondary button-sm"
                          onClick={() => handleDownloadReceipt(payment)}
                          title="Download Receipt"
                        >
                          ⬇️
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

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="modal-overlay" onClick={() => setShowAddPayment(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💰 Add New Payment</h3>
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                className="modal-close-button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Member *</label>
                  <select
                    value={newPayment.memberId}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, memberId: e.target.value }))}
                    className="select"
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.email || member.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label required">Membership Plan *</label>
                    <select
                      value={newPayment.planId}
                      onChange={(e) => handlePlanSelection(e.target.value)}
                      className="select"
                      required
                    >
                      <option value="">Select Plan</option>
                      {membershipPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <div className="relative">
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPayment.amount}
                        className="input"
                        style={{ paddingLeft: '2rem' }}
                        placeholder="Auto-filled"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select
                      value={newPayment.mode}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, mode: e.target.value }))}
                      className="select"
                    >
                      {paymentModes.map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receipt Number</label>
                    <input
                      type="text"
                      value={newPayment.receiptNumber}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, receiptNumber: e.target.value }))}
                      className="input"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Note</label>
                  <textarea
                    value={newPayment.note}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, note: e.target.value }))}
                    className="input"
                    rows="3"
                    placeholder="Optional payment note..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  💰 Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
