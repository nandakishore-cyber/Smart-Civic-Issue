import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import IssueCard from '../components/IssueCard';
import {
  FaPlusCircle,
  FaClipboardList,
  FaHourglassHalf,
  FaSpinner,
  FaCheckCircle,
  FaInbox,
} from 'react-icons/fa';

const UserDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await api.get('/issues/my');
      setIssues(res.data.issues || res.data);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues =
    statusFilter === 'all'
      ? issues
      : issues.filter((issue) => issue.status?.toLowerCase() === statusFilter.toLowerCase());

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status?.toLowerCase() === 'pending').length,
    inProgress: issues.filter((i) => i.status?.toLowerCase() === 'in progress').length,
    resolved: issues.filter((i) => i.status?.toLowerCase() === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your issues...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name || 'User'}!</h1>
          <p className="dashboard-subtitle">Track and manage your civic issue reports</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          <FaPlusCircle /> Report New Issue
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-grid">
        <div className="dashboard-stat-card stat-total">
          <div className="dashboard-stat-icon">
            <FaClipboardList size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats.total}</h3>
            <p>Total Issues</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-pending">
          <div className="dashboard-stat-icon">
            <FaHourglassHalf size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-progress">
          <div className="dashboard-stat-icon">
            <FaSpinner size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-resolved">
          <div className="dashboard-stat-icon">
            <FaCheckCircle size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats.resolved}</h3>
            <p>Resolved</p>
          </div>
        </div>
      </div>

      {/* Filter and Issues List */}
      <div className="issues-section">
        <div className="issues-section-header">
          <h2>Your Issues</h2>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="empty-state">
            <FaInbox size={64} />
            <h3>No Issues Found</h3>
            <p>
              {statusFilter === 'all'
                ? "You haven't reported any issues yet. Click the button above to report your first civic issue."
                : `No issues with status "${statusFilter}" found.`}
            </p>
            {statusFilter === 'all' && (
              <Link to="/report" className="btn btn-primary">
                <FaPlusCircle /> Report Your First Issue
              </Link>
            )}
          </div>
        ) : (
          <div className="issues-grid">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
