import { useState, useEffect } from 'react';
import { api } from '../services/api';
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
      const result = await api.expenditure.list(filters);
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
      const result = await api.dashboard.stats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      error('Failed to load expenditure stats');
    }
  };

  const handleAddExpenditure = async (expenditureData) => {
    try {
      const result = await api.expenditure.add(expenditureData);
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
      const result = await api.expenditure.update(expenditureData);
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
      const result = await api.expenditure.delete(id);
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expenditures Management</h1>
          <p className="text-slate-500">Track and manage library expenses</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setShowAddModal(true)}
        >
          <span style={{ fontSize: '1.2rem' }}>➕</span> Add Expenditure
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Expenditures</div>
          <div className="stat-value text-red-600">
            ₹{stats?.totalExpenditure?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500">Lifetime spending</div>
          <div className="stat-icon text-red-500">💳</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Today's Expenditures</div>
          <div className="stat-value text-red-600">
            ₹{stats?.todayExpenditure?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500">Spent today</div>
          <div className="stat-icon text-red-500">💸</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Net Income Today</div>
          <div className={`stat-value ${(stats?.todayNetIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{stats?.todayNetIncome?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500">Income - Expenditure</div>
          <div className="stat-icon text-blue-500">📊</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <div className="relative">
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <div className="form-group flex items-end gap-2">
            <button className="button button-primary flex-1" onClick={handleSearch}>
              Search
            </button>
            <button className="button button-secondary flex-1" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Expenditures
            <span className="badge badge-secondary ml-2">{expenditures.length}</span>
          </h3>
        </div>

        {expenditures.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenditures.map(expenditure => (
                  <tr key={expenditure.id}>
                    <td>
                      <span className="text-sm text-gray-600">
                        {new Date(expenditure.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="font-medium">{expenditure.title}</span>
                        {expenditure.description && (
                          <div className="text-sm text-gray-500">{expenditure.description}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {expenditure.category}
                      </span>
                    </td>
                    <td>
                      <span className="text-red-600 font-semibold">
                        ₹{expenditure.amount.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="button button-sm button-secondary"
                          onClick={() => {
                            setSelectedExpenditure(expenditure);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="button button-sm button-primary"
                          onClick={() => {
                            setSelectedExpenditure(expenditure);
                            setShowEditModal(true);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="button button-sm button-danger"
                          onClick={() => handleDeleteExpenditure(expenditure.id)}
                          title="Delete"
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
          <div className="text-center text-gray-500 p-8 flex flex-col items-center gap-2">
            <span style={{ fontSize: '2rem', opacity: 0.5 }}>💸</span>
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
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expenditure) {
      setFormData({
        id: expenditure.id,
        title: expenditure.title || '',
        category: expenditure.category || '',
        amount: expenditure.amount?.toString() || '',
        date: expenditure.date ? expenditure.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: expenditure.description || ''
      });
    }
  }, [expenditure]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label required">Title</label>
                <input
                  type="text"
                  className={`input ${errors.title ? 'error' : ''}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Electricity Bill"
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Category</label>
                <select
                  className={`select ${errors.category ? 'error' : ''}`}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  className={`input ${errors.amount ? 'error' : ''}`}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Date</label>
                <input
                  type="date"
                  className={`input ${errors.date ? 'error' : ''}`}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>
            </div>

            <div className="form-group mt-4">
              <label className="form-label">Description</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details (optional)"
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📊 Expenditure Details</h3>
          <button type="button" className="modal-close-button" onClick={onClose}>×</button>
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
                  <span className={`badge ${expenditure.payment_mode === 'cash' ? 'badge-success' :
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
