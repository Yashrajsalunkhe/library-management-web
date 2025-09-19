import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

const Expenditures = ({ initialAction = null }) => {
  const [expenditures, setExpenditures] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExpenditure, setSelectedExpenditure] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });
  const { success, error } = useNotification();

  const categories = [
    'Utilities',
    'Maintenance',
    'Office Supplies',
    'Rent',
    'Insurance',
    'Equipment',
    'Marketing',
    'Staff',
    'Other'
  ];

  useEffect(() => {
    loadExpenditures();
    loadStats();
    
    // Handle initial action from menu
    if (initialAction?.action === 'new') {
      setShowAddModal(true);
    }
  }, [initialAction]);

  const loadExpenditures = async () => {
    try {
      const result = await window.api.expenditure.list(filters);
      if (result.success) {
        setExpenditures(result.data);
      }
    } catch (err) {
      error('Failed to load expenditures');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await window.api.dashboard.stats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      error('Failed to load expenditure stats');
    }
  };

  const handleAddExpenditure = async (expenditureData) => {
    try {
      const result = await window.api.expenditure.add(expenditureData);
      if (result.success) {
        success('Expenditure added successfully');
        setShowAddModal(false);
        loadExpenditures();
        loadStats(); // Reload stats after adding
      } else {
        error(result.message || 'Failed to add expenditure');
      }
    } catch (err) {
      error('Failed to add expenditure');
    }
  };

  const handleEditExpenditure = async (expenditureData) => {
    try {
      const result = await window.api.expenditure.update(expenditureData);
      if (result.success) {
        success('Expenditure updated successfully');
        setShowEditModal(false);
        setSelectedExpenditure(null);
        loadExpenditures();
        loadStats(); // Reload stats after editing
      } else {
        error(result.message || 'Failed to update expenditure');
      }
    } catch (err) {
      error('Failed to update expenditure');
    }
  };

  const handleDeleteExpenditure = async (id) => {
    if (!confirm('Are you sure you want to delete this expenditure?')) {
      return;
    }
    
    try {
      const result = await window.api.expenditure.delete(id);
      if (result.success) {
        success('Expenditure deleted successfully');
        loadExpenditures();
        loadStats(); // Reload stats after deleting
      } else {
        error(result.message || 'Failed to delete expenditure');
      }
    } catch (err) {
      error('Failed to delete expenditure');
    }
  };

  const handleSearch = () => {
    loadExpenditures();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    });
    setTimeout(() => loadExpenditures(), 100);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading expenditures...
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenditures</p>
              <p className="text-xl font-semibold text-red-600">
                ₹{stats?.totalExpenditure?.toFixed(2) || '0.00'}
              </p>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>💳</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Expenditures</p>
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
      </div>

      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="card-title">Expenditures Management</h2>
            <button 
              className="button button-primary"
              onClick={() => setShowAddModal(true)}
            >
              <span>➕</span> Add Expenditure
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by description..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            />
          </div>
          <div className="form-group flex items-end gap-2">
            <button className="button button-primary" onClick={handleSearch}>
              Search
            </button>
            <button className="button button-secondary" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Expenditures ({expenditures.length})
          </h3>
        </div>
        
        {expenditures.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenditures.map(expenditure => (
                  <tr key={expenditure.id}>
                    <td>
                      {new Date(expenditure.date).toLocaleDateString()}
                    </td>
                    <td>{expenditure.description}</td>
                    <td>
                      <span className="badge badge-info">
                        {expenditure.category}
                      </span>
                    </td>
                    <td className="text-red-600 font-semibold">
                      ₹{expenditure.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${
                        expenditure.payment_mode === 'cash' ? 'badge-success' :
                        expenditure.payment_mode === 'card' ? 'badge-warning' :
                        expenditure.payment_mode === 'upi' ? 'badge-info' :
                        'badge-secondary'
                      }`}>
                        {expenditure.payment_mode}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="button button-sm button-info"
                          onClick={() => {
                            setSelectedExpenditure(expenditure);
                            setShowDetailsModal(true);
                          }}
                        >
                          👁️
                        </button>
                        <button
                          className="button button-sm button-primary"
                          onClick={() => {
                            setSelectedExpenditure(expenditure);
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="button button-sm button-danger"
                          onClick={() => handleDeleteExpenditure(expenditure.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 p-8">
            <p>No expenditures found</p>
            <button 
              className="button button-primary mt-4"
              onClick={() => setShowAddModal(true)}
            >
              Add your first expenditure
            </button>
          </div>
        )}
      </div>

      {/* Add Expenditure Modal */}
      {showAddModal && (
        <ExpenditureFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddExpenditure}
          categories={categories}
          title="Add New Expenditure"
        />
      )}

      {/* Edit Expenditure Modal */}
      {showEditModal && selectedExpenditure && (
        <ExpenditureFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExpenditure(null);
          }}
          onSubmit={handleEditExpenditure}
          categories={categories}
          expenditure={selectedExpenditure}
          title="Edit Expenditure"
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedExpenditure && (
        <ExpenditureDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExpenditure(null);
          }}
          expenditure={selectedExpenditure}
        />
      )}
    </div>
  );
};

// Expenditure Form Modal Component
const ExpenditureFormModal = ({ isOpen, onClose, onSubmit, categories, expenditure = null, title }) => {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    payment_mode: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receipt_number: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expenditure) {
      setFormData({
        id: expenditure.id,
        description: expenditure.description || '',
        category: expenditure.category || '',
        amount: expenditure.amount?.toString() || '',
        payment_mode: expenditure.payment_mode || 'cash',
        date: expenditure.date ? expenditure.date.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: expenditure.notes || '',
        receipt_number: expenditure.receipt_number || ''
      });
    }
  }, [expenditure]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const expenditureData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onSubmit(expenditureData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label required">Description</label>
                <input
                  type="text"
                  className={`form-input ${errors.description ? 'error' : ''}`}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g., Electricity Bill"
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Category</label>
                <select
                  className={`form-input ${errors.category ? 'error' : ''}`}
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`form-input ${errors.amount ? 'error' : ''}`}
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-input"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Date</label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Receipt Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
                  placeholder="Optional receipt number"
                />
              </div>
            </div>

            <div className="form-group mt-4">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes (optional)"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              {expenditure ? 'Update' : 'Add'} Expenditure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Expenditure Details Modal Component
const ExpenditureDetailsModal = ({ isOpen, onClose, expenditure }) => {
  if (!isOpen || !expenditure) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-md">
        <div className="modal-header">
          <h3 className="modal-title">Expenditure Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-1 text-gray-900">{expenditure.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Category</label>
                <p className="mt-1">
                  <span className="badge badge-info">{expenditure.category}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="mt-1 text-red-600 font-semibold text-lg">
                  ₹{expenditure.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Payment Mode</label>
                <p className="mt-1">
                  <span className={`badge ${
                    expenditure.payment_mode === 'cash' ? 'badge-success' :
                    expenditure.payment_mode === 'card' ? 'badge-warning' :
                    expenditure.payment_mode === 'upi' ? 'badge-info' :
                    'badge-secondary'
                  }`}>
                    {expenditure.payment_mode}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="mt-1 text-gray-900">
                  {new Date(expenditure.date).toLocaleDateString()}
                </p>
              </div>
              {expenditure.receipt_number && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Receipt Number</label>
                  <p className="mt-1 text-gray-900">{expenditure.receipt_number}</p>
                </div>
              )}
            </div>
            
            {expenditure.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <p className="mt-1 text-gray-900 p-3 bg-gray-50 rounded border">
                  {expenditure.notes}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-600">Created At</label>
                <p className="mt-1 text-gray-500 text-sm">
                  {new Date(expenditure.created_at).toLocaleString()}
                </p>
              </div>
              {expenditure.updated_at && expenditure.updated_at !== expenditure.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="mt-1 text-gray-500 text-sm">
                    {new Date(expenditure.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Expenditures;
