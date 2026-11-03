import { useState, useEffect } from 'react';
import api from '../services/api';
import IssueCard from '../components/IssueCard';
import { FaSearch, FaFilter, FaClipboardList, FaInbox } from 'react-icons/fa';

const categories = [
  'All',
  'Garbage Overflow',
  'Damaged Roads',
  'Water Leakage',
  'Street Lights',
  'Drainage',
  'Other',
];

const statuses = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];
const priorities = ['All', 'Medium', 'Low'];

const AdminIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    priority: 'All',
    search: '',
  });

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status !== 'All') params.status = filters.status;
      if (filters.category !== 'All') params.category = filters.category;
      if (filters.priority !== 'All') params.priority = filters.priority;
      if (filters.search.trim()) params.search = filters.search.trim();

      const res = await api.get('/issues', { params });
      setIssues(res.data.issues || res.data);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="dashboard-page admin-issues-page">
      <div className="dashboard-header">
        <div>
          <h1>
            <FaClipboardList /> Manage Issues
          </h1>
          <p className="dashboard-subtitle">View and manage low- and medium-priority civic issues</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Status' : s}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority === 'All' ? 'All Priorities' : priority}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group search-group">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            name="search"
            placeholder="Search issues..."
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-search-input"
          />
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <FaInbox size={64} />
          <h3>No Issues Found</h3>
          <p>No issues match your current filters. Try adjusting the filters.</p>
        </div>
      ) : (
        <>
          <p className="results-count">{issues.length} issue(s) found</p>
          <div className="issues-grid">
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminIssues;
