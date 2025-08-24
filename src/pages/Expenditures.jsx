import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

const Expenditures = () => {
  const { showNotification } = useNotification();
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    paymentMode: '',
    search: ''
  });

  const [newExpenditure, setNewExpenditure] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    paymentMode: 'cash',
    billDate: new Date().toISOString().split('T')[0]
  });

  // Expenditure categories
  const categories = [
    'Electricity Bill',
    'Water Bill',
    'Internet Bill',
    'Rent',
    'Maintenance',
    'Office Supplies',
    'Equipment',
    'Cleaning',
    'Security',
    'Insurance',
    'Other'
  ];

  // Payment modes
  const paymentModes = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' }
  ];

  useEffect(() => {
    loadExpenditures();
  }, []);

  // Remove the second useEffect that depends on filters to avoid infinite loops
  // We'll handle filter changes manually

  const loadExpenditures = async () => {
    try {
      setLoading(true);
      const result = await window.api.expenditure.list(filters);
      if (result.success) {
        setExpenditures(result.data || []); // Ensure we always set an array
      } else {
        showNotification('Failed to load expenditures: ' + result.message, 'error');
        setExpenditures([]); // Set empty array on error
      }
    } catch (error) {
      showNotification('Failed to load expenditures: ' + error.message, 'error');
      setExpenditures([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (!newExpenditure.title || !newExpenditure.amount || !newExpenditure.category) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Close modal immediately
    setShowAddModal(false);
    
    // Reset form immediately
    const formData = { ...newExpenditure };
    setNewExpenditure({
      title: '',
      amount: '',
      category: '',
      description: '',
      paymentMode: 'cash',
      billDate: new Date().toISOString().split('T')[0]
    });

    try {
      console.log('Adding expenditure...');
      const result = await window.api.expenditure.add({
        ...formData,
        amount: parseFloat(formData.amount)
      });

      console.log('Add result:', result);

      if (result.success) {
        showNotification('Expenditure added successfully', 'success');
        console.log('Reloading expenditures...');
        await loadExpenditures(); // Make sure this is awaited
        console.log('Done!');
      } else {
        showNotification('Failed to add expenditure: ' + result.message, 'error');
        // Reopen modal if there was an error
        setShowAddModal(true);
        setNewExpenditure(formData);
      }
    } catch (error) {
      console.error('Error adding expenditure:', error);
      showNotification('Failed to add expenditure: ' + error.message, 'error');
      // Reopen modal if there was an error
      setShowAddModal(true);
      setNewExpenditure(formData);
    }
  };

  const handleDeleteExpenditure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expenditure?')) {
      return;
    }

    try {
      const result = await window.api.expenditure.delete(id);
      if (result.success) {
        showNotification('Expenditure deleted successfully', 'success');
        await loadExpenditures(); // Refresh the list
      } else {
        showNotification('Failed to delete expenditure: ' + result.message, 'error');
      }
    } catch (error) {
      showNotification('Failed to delete expenditure: ' + error.message, 'error');
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Manually trigger load with new filters
    loadExpendituresWithFilters(newFilters);
  };

  const loadExpendituresWithFilters = async (filterParams = filters) => {
    try {
      setLoading(true);
      const result = await window.api.expenditure.list(filterParams);
      if (result.success) {
        setExpenditures(result.data || []); // Ensure we always set an array
      } else {
        showNotification('Failed to load expenditures: ' + result.message, 'error');
        setExpenditures([]); // Set empty array on error
      }
    } catch (error) {
      showNotification('Failed to load expenditures: ' + error.message, 'error');
      setExpenditures([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      dateFrom: '',
      dateTo: '',
      paymentMode: '',
      search: ''
    };
    setFilters(clearedFilters);
    // Manually reload with cleared filters
    loadExpendituresWithFilters(clearedFilters);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getTotalAmount = () => {
    return expenditures.reduce((total, expenditure) => total + expenditure.amount, 0);
  };

  const getTodayAmount = () => {
    const today = new Date().toISOString().split('T')[0];
    return expenditures
      .filter(exp => exp.bill_date.startsWith(today))
      .reduce((total, expenditure) => total + expenditure.amount, 0);
  };

  const getMonthlyAmount = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return expenditures
      .filter(exp => exp.bill_date.startsWith(currentMonth))
      .reduce((total, expenditure) => total + expenditure.amount, 0);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>💸 Expenditures Management</h1>
          <p>Track and manage all business expenditures</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="button button-primary"
        >
          + Add Expenditure
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(getTotalAmount())}</div>
          <div className="stat-label">Total Expenditures</div>
          <div className="stat-subtitle">{expenditures.length} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(getTodayAmount())}</div>
          <div className="stat-label">Today's Expenditures</div>
          <div className="stat-subtitle">
            {expenditures.filter(exp => exp.bill_date.startsWith(new Date().toISOString().split('T')[0])).length} transactions
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(getMonthlyAmount())}</div>
          <div className="stat-label">This Month</div>
          <div className="stat-subtitle">
            {expenditures.filter(exp => exp.bill_date.startsWith(new Date().toISOString().slice(0, 7))).length} transactions
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="card-header">
          <h3>Filter Expenditures</h3>
          <p className="card-subtitle">Filter expenditures by category, date range, or payment mode</p>
        </div>
        
        {/* Search Bar */}
        <div className="search-section">
          <div className="form-group">
            <label htmlFor="expenditure-search">
              <span className="search-icon">🔍</span>
              Search by Title or Description
            </label>
            <input
              id="expenditure-search"
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="form-control search-input"
              placeholder="Type to search expenditures..."
            />
          </div>
        </div>

        {/* Filter Grid */}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="form-control"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
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
            <label htmlFor="payment-mode-filter">Payment Mode</label>
            <select
              id="payment-mode-filter"
              value={filters.paymentMode}
              onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
              className="form-control"
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
        <div className="form-actions">
          <button onClick={clearFilters} className="button button-secondary">
            Clear All Filters
          </button>
          <button onClick={() => loadExpendituresWithFilters(filters)} className="button button-primary">
            Apply Filter
          </button>
          {(filters.search || filters.category || filters.dateFrom || filters.dateTo || filters.paymentMode) && (
            <span className="filter-indicator">
              {Object.values(filters).filter(Boolean).length} filter(s) active
            </span>
          )}
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="card expenditures-table-card">
        <div className="card-header">
          <h3>Expenditure History</h3>
          <div className="card-subtitle">
            Showing {expenditures.length} expenditure{expenditures.length !== 1 ? 's' : ''}
            {filters.category || filters.dateFrom || filters.dateTo || filters.paymentMode || filters.search ? ' (filtered)' : ''}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading expenditures...</p>
          </div>
        ) : expenditures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h3>No expenditures found</h3>
            <p>
              {filters.category || filters.dateFrom || filters.dateTo || filters.paymentMode || filters.search
                ? 'No expenditures match your current filters.'
                : 'No expenditures have been recorded yet.'}
            </p>
            {(filters.category || filters.dateFrom || filters.dateTo || filters.paymentMode || filters.search) && (
              <button onClick={clearFilters} className="button button-secondary mt-3">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="table expenditures-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Bill Date</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenditures.map(expenditure => (
                    <tr key={expenditure.id}>
                      <td>
                        <div className="expenditure-title">{expenditure.title}</div>
                      </td>
                      <td>
                        <span className="category-badge">{expenditure.category}</span>
                      </td>
                      <td>
                        <span className="expenditure-amount">{formatCurrency(expenditure.amount)}</span>
                      </td>
                      <td>
                        <span className="payment-mode-badge">
                          {paymentModes.find(m => m.value === expenditure.payment_mode)?.label || expenditure.payment_mode}
                        </span>
                      </td>
                      <td>
                        <div className="bill-date">
                          {formatDate(expenditure.bill_date)}
                        </div>
                      </td>
                      <td>
                        <div className="expenditure-description" title={expenditure.description}>
                          {expenditure.description || '-'}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteExpenditure(expenditure.id)}
                          className="button button-danger button-sm"
                          title="Delete expenditure"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Expenditure Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal expenditure-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💸 Add New Expenditure</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="modal-close"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddExpenditure} className="expenditure-form">
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="expenditure-title">Title *</label>
                    <input
                      id="expenditure-title"
                      type="text"
                      value={newExpenditure.title}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, title: e.target.value }))}
                      className="form-control"
                      placeholder="e.g., Electricity Bill - August 2025"
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label htmlFor="expenditure-category">Category *</label>
                      <select
                        id="expenditure-category"
                        value={newExpenditure.category}
                        onChange={(e) => setNewExpenditure(prev => ({ ...prev, category: e.target.value }))}
                        className="form-control"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="expenditure-amount">Amount *</label>
                      <div className="input-group">
                        <span className="input-prefix">₹</span>
                        <input
                          id="expenditure-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newExpenditure.amount}
                          onChange={(e) => setNewExpenditure(prev => ({ ...prev, amount: e.target.value }))}
                          className="form-control"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="expenditure-payment-mode">Payment Mode</label>
                      <select
                        id="expenditure-payment-mode"
                        value={newExpenditure.paymentMode}
                        onChange={(e) => setNewExpenditure(prev => ({ ...prev, paymentMode: e.target.value }))}
                        className="form-control"
                      >
                        {paymentModes.map(mode => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="expenditure-bill-date">Bill Date</label>
                    <input
                      id="expenditure-bill-date"
                      type="date"
                      value={newExpenditure.billDate}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, billDate: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="expenditure-description">Description</label>
                    <textarea
                      id="expenditure-description"
                      value={newExpenditure.description}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, description: e.target.value }))}
                      className="form-control"
                      rows="3"
                      placeholder="Optional details about this expenditure..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  💸 Add Expenditure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenditures;
