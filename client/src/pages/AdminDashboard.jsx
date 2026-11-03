import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import IssueCard from '../components/IssueCard';
import {
  FaTachometerAlt,
  FaClipboardList,
  FaHourglassHalf,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaListAlt,
  FaChartBar,
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, issuesRes] = await Promise.all([
        api.get('/issues/stats'),
        api.get('/issues'),
      ]);
      setStats(statsRes.data);
      const allIssues = issuesRes.data.issues || issuesRes.data;
      setRecentIssues(Array.isArray(allIssues) ? allIssues.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const categoryArray = stats?.categoryBreakdown || [];
  // Convert array from aggregation [{_id: 'category', count: N}] to object
  const categoryData = {};
  if (Array.isArray(categoryArray)) {
    categoryArray.forEach((item) => {
      if (item._id) categoryData[item._id] = item.count;
    });
  }
  const maxCategoryCount = Math.max(...Object.values(categoryData), 1);

  return (
    <div className="dashboard-page admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            <FaTachometerAlt /> Admin Dashboard
          </h1>
          <p className="dashboard-subtitle">Overview of low- and medium-priority civic issue reports</p>
        </div>
        <Link to="/admin/issues" className="btn btn-primary">
          <FaListAlt /> View All Issues
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-grid stats-cards-5">
        <div className="dashboard-stat-card stat-total">
          <div className="dashboard-stat-icon">
            <FaClipboardList size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats?.total || 0}</h3>
            <p>Total Issues</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-pending">
          <div className="dashboard-stat-icon">
            <FaHourglassHalf size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats?.pending || 0}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-progress">
          <div className="dashboard-stat-icon">
            <FaSpinner size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats?.inProgress || 0}</h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-resolved">
          <div className="dashboard-stat-icon">
            <FaCheckCircle size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats?.resolved || 0}</h3>
            <p>Resolved</p>
          </div>
        </div>
        <div className="dashboard-stat-card stat-rejected">
          <div className="dashboard-stat-icon">
            <FaTimesCircle size={24} />
          </div>
          <div className="dashboard-stat-info">
            <h3>{stats?.rejected || 0}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="admin-section">
        <h2>
          <FaChartBar /> Category Breakdown
        </h2>
        <div className="category-chart">
          {Object.keys(categoryData).length > 0 ? (
            Object.entries(categoryData).map(([category, count]) => (
              <div className="chart-bar-row" key={category}>
                <div className="chart-bar-label">{category}</div>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  >
                    <span className="chart-bar-value">{count}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No category data available</p>
          )}
        </div>
      </div>

      {/* Recent Issues */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Recent Issues</h2>
          <Link to="/admin/issues" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>
        {recentIssues.length > 0 ? (
          <div className="issues-grid">
            {recentIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        ) : (
          <p className="text-muted">No issues to display</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
