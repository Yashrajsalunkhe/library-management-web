import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import BiometricEnrollment from '../components/BiometricEnrollment';
import { api } from '../services/api';

const Members = ({ initialAction = null }) => {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const { success, error } = useNotification();

  useEffect(() => {
    loadMembers();
    loadPlans();
    loadSettings();

    // Handle initial action from menu
    if (initialAction?.action === 'new') {
      setShowAddModal(true);
    }
  }, [initialAction]);

  const loadSettings = async () => {
    try {
      const result = await api.settings.getSettings();
      if (result.success) {
        setSettings(result.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const result = await api.member.list(filters);
      if (result.success) {
        setMembers(result.data);
      }
    } catch (err) {
      error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const result = await api.plan.list();
      if (result.success) {
        setPlans(result.data);
      }
    } catch (err) {
      error('Failed to load membership plans');
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const result = await api.member.add(memberData);
      if (result.success) {
        success('Member added successfully');
        setShowAddModal(false);
        loadMembers();

        // Send welcome message
        const member = { ...memberData, id: result.data.id };
        api.notification.sendWelcome(member);
      } else {
        error(result.message || 'Failed to add member');
      }
    } catch (err) {
      error('Failed to add member');
    }
  };

  const handleEditMember = async (memberData) => {
    if (isProcessing) return; // Prevent duplicate submissions

    setIsProcessing(true);
    try {
      const result = await api.member.update(memberData);
      if (result.success) {
        success('Member updated successfully');
        setShowEditModal(false);
        setSelectedMember(null);
        loadMembers();
      } else {
        error(result.message || 'Failed to update member');
      }
    } catch (err) {
      console.error('Error updating member:', err);
      error('Failed to update member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenewMember = async (renewalData) => {
    if (isProcessing) return; // Prevent duplicate submissions

    setIsProcessing(true);
    try {
      const result = await api.member.renew(renewalData);
      if (result.success) {
        success('Member renewed successfully');
        setShowRenewModal(false);
        setSelectedMember(null);
        loadMembers();
      } else {
        error(result.message || 'Failed to renew member');
      }
    } catch (err) {
      error('Failed to renew member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    const action = member.status === 'suspended' ? 'activate' : 'suspend';
    const confirmMessage = action === 'suspend'
      ? 'Are you sure you want to suspend this member?'
      : 'Are you sure you want to activate this member?';

    if (confirm(confirmMessage)) {
      try {
        const result = await api.member.delete(memberId);
        if (result.success) {
          success(`Member ${action}d successfully`);
          loadMembers();
        } else {
          error(result.message || `Failed to ${action} member`);
        }
      } catch (err) {
        error(`Failed to ${action} member`);
      }
    }
  };

  const handlePermanentDelete = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    const confirmMessage = `Are you sure you want to permanently delete ${member.name}? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      try {
        const result = await api.member.permanentDelete(memberId);
        if (result.success) {
          success('Member permanently deleted successfully');
          loadMembers();
        } else {
          error(result.message || 'Failed to delete member');
        }
      } catch (err) {
        error('Failed to delete member');
      }
    }
  };

  const getStatusBadge = (status, endDate, planId = null) => {
    // If no plan is assigned or dummy date, show "Not Active"
    if (!planId || !endDate || endDate === '1900-01-01') {
      return <span className="badge badge-secondary">Not Active</span>;
    }

    const isExpired = new Date(endDate) < new Date();

    if (status === 'suspended') {
      return <span className="badge badge-danger">Suspended</span>;
    } else if (isExpired) {
      return <span className="badge badge-danger">Expired</span>;
    } else {
      const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 10) {
        return <span className="badge badge-warning">Expiring Soon ({daysLeft} days left)</span>;
      } else {
        return <span className="badge badge-success">Active ({daysLeft} days left)</span>;
      }
    }
  };

  const activeMembers = members.filter(member =>
    member.status !== 'suspended' &&
    (!filters.search ||
      member.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.phone?.includes(filters.search))
  );

  const suspendedMembers = members.filter(member =>
    member.status === 'suspended' &&
    (!filters.search ||
      member.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.phone?.includes(filters.search))
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading members...
      </div>
    );
  }

  const renderMembersTable = (membersList, title, showActions = true, isSuspended = false) => (
    <div className="card mb-6">
      <div className="card-header">
        <h3 className="card-title">
          {title}
          <span className="badge badge-secondary" style={{ marginLeft: '0.5rem' }}>{membersList.length}</span>
        </h3>
      </div>
      {membersList.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Seat No</th>
                <th>Status</th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {membersList.map(member => (
                <tr key={member.id}>
                  <td>#{member.id}</td>
                  <td>
                    <div>
                      <div className="font-medium">{member.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">#{member.seat_no || 'N/A'}</span>
                  </td>
                  <td>{getStatusBadge(member.status, member.end_date, member.plan_id)}</td>
                  {showActions && (
                    <td>
                      <div className="flex gap-2">
                        {!isSuspended && member.status !== 'suspended' && (
                          (() => {
                            // Check if member has no plan
                            if (!member.plan_id || member.end_date === '1900-01-01') {
                              return (
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowRenewModal(true);
                                  }}
                                  className="button button-success button-sm"
                                >
                                  Add Plan
                                </button>
                              );
                            }

                            // Check if plan is expiring (within 10 days) or expired
                            const endDate = new Date(member.end_date);
                            const today = new Date();
                            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                            const isExpiredOrExpiring = daysLeft <= 10;

                            if (isExpiredOrExpiring) {
                              return (
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowRenewModal(true);
                                  }}
                                  className="button button-success button-sm"
                                >
                                  Renew
                                </button>
                              );
                            }

                            return null; // Don't show any button if plan is not expiring
                          })()
                        )}
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="button button-danger button-sm"
                        >
                          {member.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        {isSuspended && member.status === 'suspended' && (
                          <button
                            onClick={() => handlePermanentDelete(member.id)}
                            className="button button-danger button-sm"
                            style={{ backgroundColor: '#dc2626' }}
                            title="Permanently delete this member"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowBiometricModal(true);
                          }}
                          className="button button-info button-sm"
                          title="Manage Biometric"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6'
                          }}
                        >
                          🔓
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDetailsModal(true);
                          }}
                          className="button button-secondary button-sm"
                          title="More Details"
                          style={{
                            padding: '4px 8px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          ⋯
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 p-4">
          No {title.toLowerCase()} found
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Header Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '0.25rem' }}>
              Members Management
            </h2>
            <p className="text-sm text-gray-500">Manage library members and their memberships</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="button button-primary"
          >
            <span style={{ fontSize: '1.2rem' }}>➕</span>
            Add Member
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '1.1rem' }}>🔍</span>
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Active Members Section */}
      {renderMembersTable(activeMembers, 'Active Members', true, false)}

      {/* Suspended Members Section */}
      {suspendedMembers.length > 0 && (
        <>
          <div className="alert alert-warning mb-4">
            <strong>⚠️ Suspended Members</strong> - These members have been suspended and cannot access library services.
          </div>
          {renderMembersTable(suspendedMembers, 'Suspended Members', true, true)}
        </>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal
          plans={plans}
          settings={settings}
          onSubmit={handleAddMember}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Renew Member Modal */}
      {showRenewModal && selectedMember && (
        <RenewMemberModal
          member={selectedMember}
          plans={plans}
          onSubmit={handleRenewMember}
          onClose={() => {
            setShowRenewModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Member Details Modal */}
      {showDetailsModal && selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <EditMemberModal
          member={selectedMember}
          plans={plans}
          settings={settings}
          onSubmit={handleEditMember}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Biometric Enrollment Modal */}
      {showBiometricModal && selectedMember && (
        <BiometricEnrollment
          member={selectedMember}
          onSuccess={(result) => {
            if (result.deleted) {
              success(`Biometric data deleted for ${selectedMember.name}`);
            } else {
              success(`Biometric enrollment completed for ${selectedMember.name}`);
            }
            loadMembers(); // Refresh the member list if needed
          }}
          onClose={() => {
            setShowBiometricModal(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
};

// Add Member Modal Component
const AddMemberModal = ({ plans, settings, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    address: '',
    idNumber: '',
    idDocumentType: '',
    seatNo: ''
  });
  const [nextSeatNumber, setNextSeatNumber] = useState('');
  const [seatValidation, setSeatValidation] = useState({ isValid: true, message: '' });
  const [validatingInput, setValidatingInput] = useState(false);

  useEffect(() => {
    loadNextSeatNumber();

    // Set default ID document type from settings
    if (settings?.membership?.selectedIdDocumentType) {
      setFormData(prev => ({
        ...prev,
        idDocumentType: settings.membership.selectedIdDocumentType
      }));
    }
  }, [settings]);

  const loadNextSeatNumber = async () => {
    try {
      const result = await api.member.getNextSeatNumber();
      if (result.success) {
        setNextSeatNumber(result.data);
        setFormData(prev => ({ ...prev, seatNo: result.data }));
      } else {
        // Handle case when no seats are available
        setNextSeatNumber('');
        setFormData(prev => ({ ...prev, seatNo: '' }));
        setSeatValidation({
          isValid: false,
          message: result.message || 'No seats available'
        });
      }
    } catch (error) {
      console.error('Failed to get next seat number:', error);
      setSeatValidation({
        isValid: false,
        message: 'Failed to get seat number'
      });
    }
  };

  const validateSeatNumber = async (seatNo) => {
    if (!seatNo || seatNo.trim() === '') {
      setSeatValidation({ isValid: true, message: '' });
      return;
    }

    setValidatingInput(true);
    try {
      const result = await api.member.validateSeatNumber({ 
        seatNo: seatNo.trim(),
        memberId: null // New member, so no memberId to exclude
      });
      if (result.success) {
        setSeatValidation({
          isValid: result.available,
          message: result.available ? '' : result.message || 'Seat not available'
        });
      } else {
        setSeatValidation({
          isValid: false,
          message: result.message || 'Failed to validate seat number'
        });
      }
    } catch (error) {
      console.error('Failed to validate seat number:', error);
      setSeatValidation({ isValid: false, message: 'Failed to validate seat number' });
    } finally {
      setValidatingInput(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate seat number when it changes
    if (name === 'seatNo') {
      validateSeatNumber(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check seat number validation before submitting
    if (!seatValidation.isValid && formData.seatNo.trim() !== '') {
      return;
    }

    // Add default values for plan-related fields when no plan is assigned
    const memberDataWithDefaults = {
      ...formData,
      planId: null,
      joinDate: null,
      endDate: null
    };
    onSubmit(memberDataWithDefaults);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">👤 Add New Member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label required">Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Mobile No *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    className="form-control"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Seat No</label>
                  <input
                    type="text"
                    name="seatNo"
                    className={`form-control ${!seatValidation.isValid ? 'error' : ''}`}
                    value={formData.seatNo}
                    onChange={handleChange}
                    placeholder={nextSeatNumber ? `Next available: ${nextSeatNumber}` : 'No seats available'}
                    disabled={!nextSeatNumber && !formData.seatNo}
                  />
                  {validatingInput && (
                    <small className="form-help text-info">Validating seat number...</small>
                  )}
                  {!validatingInput && seatValidation.message && (
                    <small className="form-help text-danger">{seatValidation.message}</small>
                  )}
                  {!validatingInput && !seatValidation.message && nextSeatNumber && (
                    <small className="form-help">Leave empty to auto-assign next available seat</small>
                  )}
                  {!validatingInput && !nextSeatNumber && !seatValidation.message && (
                    <small className="form-help text-warning">All seats are occupied. Please check settings for total seats configuration.</small>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📄 Identity Document</h4>
              {settings?.membership?.idDocumentTypes?.filter(doc => doc.enabled)?.length > 0 ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Document Type *</label>
                    <select
                      name="idDocumentType"
                      className="form-control"
                      value={formData.idDocumentType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Document Type</option>
                      {settings.membership.idDocumentTypes.filter(doc => doc.enabled).map(docType => (
                        <option key={docType.id} value={docType.id}>
                          {docType.label}
                        </option>
                      ))}
                    </select>
                    <small className="form-help">
                      Select the type of identity document being provided
                      {settings.membership.idDocumentTypes.filter(doc => doc.enabled).length === 1 &&
                        ` (Only ${settings.membership.idDocumentTypes.find(doc => doc.enabled)?.label} is configured)`
                      }
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {formData.idDocumentType && settings?.membership?.idDocumentTypes ?
                        `${settings.membership.idDocumentTypes.find(doc => doc.id === formData.idDocumentType)?.label || 'Document'} Number *` :
                        'Document Number *'
                      }
                    </label>
                    <input
                      type="text"
                      name="idNumber"
                      className="form-control"
                      value={formData.idNumber}
                      onChange={handleChange}
                      placeholder={
                        formData.idDocumentType && settings?.membership?.idDocumentTypes ?
                          `Enter ${settings.membership.idDocumentTypes.find(doc => doc.id === formData.idDocumentType)?.label || 'document'} number` :
                          'Enter document number'
                      }
                      required={formData.idDocumentType ? true : false}
                    />
                    <small className="form-help">
                      {formData.idDocumentType && settings?.membership?.idDocumentTypes ?
                        `Enter ${settings.membership.idDocumentTypes.find(doc => doc.id === formData.idDocumentType)?.label || 'document'} number` :
                        'Enter identity document number'
                      }
                    </small>
                  </div>
                </>
              ) : (
                <div className="no-documents-message">
                  <div className="alert alert-warning">
                    <strong>⚠️ No Document Types Configured</strong>
                    <p>No identity document types are currently enabled in settings. Members can be added without identity documents, but it's recommended to configure at least one document type.</p>
                    <small>Go to Settings → Member Settings → Document Selection to enable document types.</small>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button button-secondary">
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              👤 Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Renew Member Modal Component
const RenewMemberModal = ({ member, plans, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    memberId: member.id,
    planId: member.plan_id || '',
    paymentDetails: {
      mode: 'cash',
      note: member.plan_id ? 'Membership renewal' : 'New membership plan'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === parseInt(formData.planId));
  const isNewPlan = !member.plan_id;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isNewPlan ? `Add Plan - ${member.name}` : `Renew Membership - ${member.name}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!isNewPlan && (
              <div className="alert alert-info mb-4">
                Current membership expires on: <strong>{member.end_date}</strong>
              </div>
            )}

            {isNewPlan && (
              <div className="alert alert-warning mb-4">
                This member currently has no active plan. Select a plan to activate their membership.
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Plan *</label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                className="select"
                required
              >
                <option value="">Select a plan</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                  </option>
                ))}
              </select>
            </div>

            {selectedPlan && (
              <div className="alert alert-success">
                <strong>Plan Details:</strong><br />
                Amount: ₹{selectedPlan.price}<br />
                Duration: {selectedPlan.duration_days} days<br />
                Description: {selectedPlan.description}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                value={formData.paymentDetails.mode}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paymentDetails: { ...prev.paymentDetails, mode: e.target.value }
                }))}
                className="select"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Note</label>
              <input
                type="text"
                value={formData.paymentDetails.note}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paymentDetails: { ...prev.paymentDetails, note: e.target.value }
                }))}
                className="input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="button button-success" disabled={!selectedPlan || isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                isNewPlan ? 'Add Plan' : 'Renew Membership'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Member Details Modal Component
const MemberDetailsModal = ({ member, onEdit, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">👤 Member Details - {member.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <div className="modal-body">
          <div className="member-details-grid">
            {/* Personal Information Section */}
            <div className="details-section">
              <h4 className="section-title">Personal Information</h4>
              <div className="details-row">
                <span className="detail-label">Member ID:</span>
                <span className="detail-value">#{member.id}</span>
              </div>
              <div className="details-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{member.name}</span>
              </div>
              <div className="details-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{member.email || 'Not provided'}</span>
              </div>
              <div className="details-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{member.phone || 'Not provided'}</span>
              </div>
              <div className="details-row">
                <span className="detail-label">Birth Date:</span>
                <span className="detail-value">
                  {member.birth_date ? new Date(member.birth_date).toLocaleDateString() : 'Not provided'}
                </span>
              </div>
              <div className="details-row">
                <span className="detail-label">City:</span>
                <span className="detail-value">{member.city || 'Not provided'}</span>
              </div>
              <div className="details-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{member.address || 'Not provided'}</span>
              </div>
              {member.id_document_type && (
                <div className="details-row">
                  <span className="detail-label">ID Document Type:</span>
                  <span className="detail-value">{member.id_document_type}</span>
                </div>
              )}
              {member.id_number && (
                <div className="details-row">
                  <span className="detail-label">ID Number:</span>
                  <span className="detail-value">{member.id_number}</span>
                </div>
              )}
              {member.qr_code && (
                <div className="details-row">
                  <span className="detail-label">QR Code:</span>
                  <span className="detail-value">{member.qr_code}</span>
                </div>
              )}
            </div>

            {/* Membership Information Section */}
            <div className="details-section">
              <h4 className="section-title">Membership Information</h4>
              <div className="details-row">
                <span className="detail-label">Seat Number:</span>
                <span className="detail-value">
                  <span className="badge badge-info">#{member.seat_no || 'N/A'}</span>
                </span>
              </div>
              <div className="details-row">
                <span className="detail-label">Plan:</span>
                <span className="detail-value">{member.plan_name || 'No plan assigned'}</span>
              </div>
              <div className="details-row">
                <span className="detail-label">Plan Price:</span>
                <span className="detail-value">₹{member.plan_price || 0}</span>
              </div>
              {member.plan_id && member.join_date && member.join_date !== '1900-01-01' && (
                <>
                  <div className="details-row">
                    <span className="detail-label">Join Date:</span>
                    <span className="detail-value">{new Date(member.join_date).toLocaleDateString()}</span>
                  </div>
                  <div className="details-row">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">{new Date(member.end_date).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              <div className="details-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {(() => {
                    if (!member.plan_id || !member.end_date || member.end_date === '1900-01-01') {
                      return <span className="badge badge-secondary">Not Active</span>;
                    }
                    const isExpired = new Date(member.end_date) < new Date();
                    if (member.status === 'suspended') {
                      return <span className="badge badge-danger">Suspended</span>;
                    } else if (isExpired) {
                      return <span className="badge badge-danger">Expired</span>;
                    } else {
                      const daysLeft = Math.ceil((new Date(member.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                      if (daysLeft <= 10) {
                        return <span className="badge badge-warning">Expiring Soon ({daysLeft} days left)</span>;
                      } else {
                        return <span className="badge badge-success">Active ({daysLeft} days left)</span>;
                      }
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button button-secondary">
            Close
          </button>
          <button onClick={onEdit} className="button button-primary">
            ✏️ Edit Member
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Member Modal Component
const EditMemberModal = ({ member, plans, settings, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    id: member.id,
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    birthDate: member.birth_date ? member.birth_date.split('T')[0] : '',
    city: member.city || '',
    address: member.address || '',
    idNumber: member.id_number || '',
    idDocumentType: member.id_document_type || '',
    seatNo: member.seat_no || '',
    planId: member.plan_id || '',
    joinDate: member.join_date ? member.join_date.split('T')[0] : '',
    endDate: member.end_date ? member.end_date.split('T')[0] : ''
  });
  const [seatValidation, setSeatValidation] = useState({ isValid: true, message: '' });
  const [validatingInput, setValidatingInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateSeatNumber = async (seatNo) => {
    if (!seatNo || seatNo.trim() === '' || seatNo === member.seat_no) {
      setSeatValidation({ isValid: true, message: '' });
      return;
    }

    setValidatingInput(true);
    try {
      const result = await api.member.validateSeatNumber({
        seatNo: seatNo.trim(),
        memberId: member.id
      });
      if (result.success) {
        setSeatValidation({
          isValid: result.available,
          message: result.available ? '' : result.message
        });
      }
    } catch (error) {
      console.error('Failed to validate seat number:', error);
      setSeatValidation({ isValid: false, message: 'Failed to validate seat number' });
    } finally {
      setValidatingInput(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate seat number when it changes
    if (name === 'seatNo') {
      validateSeatNumber(value);
    }

    // Auto-calculate end date when plan changes
    if (name === 'planId' && value) {
      const selectedPlan = plans.find(p => p.id === parseInt(value));
      if (selectedPlan) {
        const joinDate = new Date(formData.joinDate);
        const endDate = new Date(joinDate);
        endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }

    // Auto-calculate end date when join date changes
    if (name === 'joinDate' && value && formData.planId) {
      const selectedPlan = plans.find(p => p.id === parseInt(formData.planId));
      if (selectedPlan) {
        const joinDate = new Date(value);
        const endDate = new Date(joinDate);
        endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    // Check seat number validation before submitting
    if (!seatValidation.isValid && formData.seatNo.trim() !== '') {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">✏️ Edit Member - {member.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label required">Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Mobile No *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    className="form-control"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Seat No</label>
                  <input
                    type="text"
                    name="seatNo"
                    className={`form-control ${!seatValidation.isValid ? 'error' : ''}`}
                    value={formData.seatNo}
                    onChange={handleChange}
                  />
                  {validatingInput && (
                    <small className="form-help text-info">Validating seat number...</small>
                  )}
                  {!validatingInput && seatValidation.message && (
                    <small className="form-help text-danger">{seatValidation.message}</small>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>ID & Address Information</h4>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">ID Document Type</label>
                  <select
                    name="idDocumentType"
                    className="form-control"
                    value={formData.idDocumentType}
                    onChange={handleChange}
                  >
                    <option value="">Select Document Type</option>
                    {settings?.membership?.idDocumentTypes?.filter(doc => doc.enabled).map(docType => (
                      <option key={docType.id} value={docType.id}>
                        {docType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {settings?.membership?.idNumber || 'ID Number'}
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    className="form-control"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter full address..."
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Membership Details</h4>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label required">Membership Plan *</label>
                  <select
                    name="planId"
                    className="form-control"
                    value={formData.planId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Join Date *</label>
                  <input
                    type="date"
                    name="joinDate"
                    className="form-control"
                    value={formData.joinDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    className="form-control"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting || (!seatValidation.isValid && formData.seatNo.trim() !== '')}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Updating...
                </>
              ) : (
                <>✏️ Update Member</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Members;
