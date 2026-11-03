import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getIssueImageUrl } from '../utils/issueImage';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaTrash,
  FaExclamationTriangle,
  FaBuilding,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaSpinner,
  FaTimesCircle,
} from 'react-icons/fa';

const departments = [
  'Municipal Corporation',
  'Public Works Dept',
  'Water Board',
  'Electricity Board',
  'Sanitation Dept',
  'Traffic Dept',
];

const statusOptions = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const priorityOptions = ['Low', 'Medium', 'High'];

const IssueDetail = () => {
  const { id } = useParams();
  const { user, isAdmin, isGovOfficer } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [adminForm, setAdminForm] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    supervisorIds: [],
    adminRemarks: '',
  });
  const [officerForm, setOfficerForm] = useState({
    action: '',
    status: 'In Progress',
    assignedTo: '',
    supervisorIds: [],
    officerRemarks: '',
  });

  useEffect(() => {
    fetchIssue();
    if (isAdmin || isGovOfficer) {
      api.get('/supervisors').then((response) => setSupervisors(response.data)).catch(() => {});
    }
  }, [id]);

  const fetchIssue = async () => {
    try {
      const res = await api.get(`/issues/${id}`);
      const issueData = res.data.issue || res.data;
      setIssue(issueData);
      setAdminForm({
        status: issueData.status || 'Pending',
        priority: issueData.priority || '',
        assignedTo: issueData.assignedTo || '',
        supervisorIds: (issueData.supervisors || []).map((supervisor) => supervisor._id || supervisor),
        adminRemarks: issueData.adminRemarks || '',
      });
      setOfficerForm({
        action: '',
        status: issueData.status || 'In Progress',
        assignedTo: issueData.assignedTo || '',
        supervisorIds: (issueData.supervisors || []).map((supervisor) => supervisor._id || supervisor),
        officerRemarks: issueData.officerRemarks || '',
      });
    } catch (err) {
      console.error('Failed to fetch issue:', err);
      toast.error('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleOfficerChange = (e) => {
    setOfficerForm({ ...officerForm, [e.target.name]: e.target.value });
  };

  const handleSupervisorSelection = (event, formName) => {
    const values = Array.from(event.target.selectedOptions, (option) => option.value);
    if (formName === 'admin') setAdminForm({ ...adminForm, supervisorIds: values });
    else setOfficerForm({ ...officerForm, supervisorIds: values });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await api.put(`/issues/${id}`, { ...adminForm, supervisors: adminForm.supervisorIds });
      setIssue(res.data.issue || res.data);
      toast.success('Issue updated successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update issue';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleOfficerUpdate = async (form = officerForm) => {
    setUpdating(true);
    try {
      const res = await api.put(`/issues/officer/${id}`, { ...form, supervisors: form.supervisorIds });
      setIssue(res.data.issue || res.data);
      toast.success('Gov. Officer action saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save officer action.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateWithApproval = async () => {
    setUpdating(true);
    try {
      const res = await api.put(`/issues/${id}`, { ...adminForm, requestOfficerApproval: true });
      setIssue(res.data.issue || res.data);
      toast.success('Complaint sent to the Gov. Officer for approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request officer approval.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/issues/${id}`);
      toast.success('Issue deleted successfully');
      navigate('/admin/issues');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete issue';
      toast.error(message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FaHourglassHalf />;
      case 'in progress':
        return <FaSpinner />;
      case 'resolved':
        return <FaCheckCircle />;
      case 'rejected':
        return <FaTimesCircle />;
      default:
        return <FaClock />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="empty-state">
        <FaExclamationTriangle size={64} />
        <h3>Issue Not Found</h3>
        <p>The issue you are looking for does not exist or has been removed.</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const imageUrl = getIssueImageUrl(issue.image);

  return (
    <div className="issue-detail-page">
      <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <div className="issue-detail-container">
        {/* Image Section */}
        {imageUrl && (
          <div className="issue-detail-image">
            <img src={imageUrl} alt={issue.title} />
          </div>
        )}

        {/* Info Section */}
        <div className="issue-detail-info">
          <div className="issue-detail-header">
            <h1>{issue.title}</h1>
            <div className="issue-detail-badges">
              <StatusBadge status={issue.status} />
              <span className="category-badge">{issue.category}</span>
              {issue.priority && (
                <span className={`priority-badge priority-${issue.priority?.toLowerCase()}`}>
                  {issue.priority}
                </span>
              )}
            </div>
          </div>

          <div className="issue-detail-section">
            <h3>Description</h3>
            <p>{issue.description}</p>
          </div>

          <div className="issue-detail-section">
            <h3>
              <FaMapMarkerAlt /> Location
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">{issue.location?.address || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">City</span>
                <span className="detail-value">{issue.location?.city || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">State</span>
                <span className="detail-value">{issue.location?.state || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pincode</span>
                <span className="detail-value">{issue.location?.pincode || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">GPS Coordinates</span>
                <span className="detail-value">
                  {issue.location?.coordinates
                    ? `${issue.location.coordinates.latitude}, ${issue.location.coordinates.longitude}`
                    : 'Not captured'}
                </span>
              </div>
            </div>
          </div>

          {/* Reporter Info - visible to admin */}
          {isAdmin && issue.user && (
            <div className="issue-detail-section">
              <h3>
                <FaUser /> Reporter Information
              </h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">
                    <FaUser /> Name
                  </span>
                  <span className="detail-value">
                    {issue.user.name || 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <FaEnvelope /> Email
                  </span>
                  <span className="detail-value">
                    {issue.user.email || 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <FaPhone /> Phone
                  </span>
                  <span className="detail-value">
                    {issue.user.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="issue-detail-section">
            <h3>
              <FaCalendarAlt /> Timestamps
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Reported On</span>
                <span className="detail-value">{formatDate(issue.createdAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{formatDate(issue.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* User View - Tracking Info */}
          {!isAdmin && !isGovOfficer && (
            <div className="issue-detail-section">
              <h3>
                <FaClock /> Tracking Status
              </h3>
              <div className="tracking-timeline">
                {['Pending', 'In Progress', 'Resolved'].map((step, index) => {
                  const currentIndex = statusOptions.indexOf(issue.status);
                  const stepIndex = statusOptions.indexOf(step);
                  const isCompleted = issue.status === 'Rejected' ? false : stepIndex <= currentIndex;
                  const isRejected = issue.status === 'Rejected' && step === 'Pending';

                  return (
                    <div
                      key={step}
                      className={`timeline-step ${isCompleted ? 'timeline-step-completed' : ''} ${
                        isRejected ? 'timeline-step-rejected' : ''
                      }`}
                    >
                      <div className="timeline-icon">{getStatusIcon(step)}</div>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>

              {issue.status === 'Rejected' && (
                <div className="rejected-notice">
                  <FaTimesCircle /> This issue has been rejected.
                </div>
              )}

              {issue.assignedTo && (
                <div className="detail-item" style={{ marginTop: '1rem' }}>
                  <span className="detail-label">
                    <FaBuilding /> Assigned Department
                  </span>
                  <span className="detail-value">{issue.assignedTo}</span>
                </div>
              )}

              {issue.adminRemarks && (
                <div className="detail-item" style={{ marginTop: '0.5rem' }}>
                  <span className="detail-label">Admin Remarks</span>
                  <span className="detail-value">{issue.adminRemarks}</span>
                </div>
              )}
              {issue.officerRemarks && (
                <div className="detail-item" style={{ marginTop: '0.5rem' }}>
                  <span className="detail-label">Gov. Officer Response</span>
                  <span className="detail-value">{issue.officerRemarks}</span>
                </div>
              )}
              {issue.supervisor && (
                <div className="detail-item" style={{ marginTop: '0.5rem' }}>
                  <span className="detail-label">Assigned Supervisor</span>
                  <span className="detail-value">{issue.supervisor}</span>
                </div>
              )}
              {issue.supervisors?.length > 0 && (
                <div className="detail-item" style={{ marginTop: '0.5rem' }}>
                  <span className="detail-label">Assigned Supervisors</span>
                  <span className="detail-value">
                    {issue.supervisors.map((supervisor) => `${supervisor.name} (${supervisor.employeeId})`).join(', ')}
                  </span>
                </div>
              )}
              {issue.history?.length > 0 && (
                <div className="lifecycle-history">
                  <h4>Request and response history</h4>
                  {issue.history.map((entry, index) => (
                    <div className="detail-item" key={`${entry.createdAt}-${index}`}>
                      <span className="detail-label">
                        {entry.status} · {new Date(entry.createdAt).toLocaleString('en-IN')}
                      </span>
                      <span className="detail-value">
                        {entry.remarks || 'Status updated'}
                        {entry.assignedTo ? ` · Assigned to ${entry.assignedTo}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isGovOfficer && (
            <div className="admin-panel">
              <h3>Gov. Officer Actions</h3>
              <p className="text-muted">
                {issue.priority === 'High'
                  ? 'This high-priority complaint is handled directly by the Gov. Officer.'
                  : 'Approve or reject this complaint before the admin assigns its local-body supervisor.'}
              </p>
              {issue.priority !== 'High' && (
                <div className="form-row">
                  <button className="btn btn-primary" onClick={() => setOfficerForm({ ...officerForm, action: 'approve' })}>
                    Approve for Admin
                  </button>
                  <button className="btn btn-danger" onClick={() => setOfficerForm({ ...officerForm, action: 'reject' })}>
                    Reject Complaint
                  </button>
                </div>
              )}
              {issue.priority === 'High' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="officer-status">Status</label>
                      <select id="officer-status" name="status" value={officerForm.status} onChange={handleOfficerChange}>
                        {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="officer-assignedTo">Local Body / Department</label>
                      <input id="officer-assignedTo" name="assignedTo" value={officerForm.assignedTo} onChange={handleOfficerChange} placeholder="e.g. Coimbatore Corporation" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="officer-supervisors">Assign exactly two supervisors</label>
                    <select
                      id="officer-supervisors"
                      multiple
                      value={officerForm.supervisorIds}
                      onChange={(event) => handleSupervisorSelection(event, 'officer')}
                    >
                      {supervisors.map((supervisor) => (
                        <option key={supervisor._id} value={supervisor._id}>
                          {supervisor.name} ({supervisor.employeeId}) - {supervisor.localBody}, {supervisor.location}
                        </option>
                      ))}
                    </select>
                    <small>Select two available supervisors.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="officerRemarks">Response to Citizen</label>
                    <textarea id="officerRemarks" name="officerRemarks" rows={3} value={officerForm.officerRemarks} onChange={handleOfficerChange} placeholder="Write the response that will be shown to the citizen..." />
                  </div>
                  <button className="btn btn-primary" onClick={() => handleOfficerUpdate({ ...officerForm, action: 'update' })} disabled={updating}>
                    {updating ? 'Saving...' : 'Send Status and Response'}
                  </button>
                </>
              )}
              {issue.priority !== 'High' && officerForm.action && (
                <div className="form-group">
                  <label htmlFor="approvalRemarks">Officer Remarks</label>
                  <textarea id="approvalRemarks" name="officerRemarks" rows={3} value={officerForm.officerRemarks} onChange={handleOfficerChange} placeholder="Explain the approval or rejection..." />
                  <button className="btn btn-primary" onClick={handleOfficerUpdate} disabled={updating}>
                    {updating ? 'Saving...' : 'Submit Officer Decision'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <div className="admin-panel">
              <h3>Admin Actions</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Update Status</label>
                  <select
                    id="status"
                    name="status"
                    value={adminForm.status}
                    onChange={handleAdminChange}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {issue.priority !== 'High' && issue.officerApproval !== 'Approved' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => handleUpdateWithApproval()}
                    disabled={updating}
                  >
                    Send to Gov. Officer for Approval
                  </button>
                )}

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={adminForm.priority}
                    onChange={handleAdminChange}
                  >
                    <option value="">Select Priority</option>
                    {priorityOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">Assign to Department</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={adminForm.assignedTo}
                  onChange={handleAdminChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="admin-supervisors">Assign one supervisor</label>
                <select
                  id="admin-supervisors"
                  value={adminForm.supervisorIds[0] || ''}
                  onChange={(event) => setAdminForm({ ...adminForm, supervisorIds: event.target.value ? [event.target.value] : [] })}
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor._id} value={supervisor._id}>
                      {supervisor.name} ({supervisor.employeeId}) - {supervisor.localBody}, {supervisor.location}
                    </option>
                  ))}
                </select>
                <small>Available for low- and medium-priority complaints after officer approval.</small>
              </div>

              <div className="form-group">
                <label htmlFor="adminRemarks">Admin Remarks</label>
                <textarea
                  id="adminRemarks"
                  name="adminRemarks"
                  rows={3}
                  placeholder="Add remarks about this issue..."
                  value={adminForm.adminRemarks}
                  onChange={handleAdminChange}
                ></textarea>
              </div>

              <div className="admin-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleUpdate}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-small"></span> Saving...
                    </>
                  ) : (
                    <>
                      <FaSave /> Save Changes
                    </>
                  )}
                </button>

                {!showDeleteConfirm ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <FaTrash /> Delete Issue
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Are you sure you want to delete this issue?</p>
                    <button
                      className="btn btn-danger"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
