import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import IssueCard from '../components/IssueCard';
import { FaInbox, FaUserTie } from 'react-icons/fa';

const OfficerDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await api.get('/issues/officer/queue');
        setIssues(response.data.issues || response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1><FaUserTie /> Gov. Officer Queue</h1>
          <p className="dashboard-subtitle">High-priority complaints and admin approval requests</p>
        </div>
      </div>
      <div className="admin-credentials-hint">
        <strong>Workflow:</strong> High priority cases are handled directly here. Low and medium cases require your approval before the admin assigns the local-body supervisor.
      </div>
      {loading ? (
        <div className="loading-container"><div className="spinner"></div><p>Loading officer queue...</p></div>
      ) : issues.length === 0 ? (
        <div className="empty-state"><FaInbox size={64} /><h3>No officer actions pending</h3><p>New high-priority cases and approval requests will appear here.</p></div>
      ) : (
        <div className="issues-grid">
          {issues.map((issue) => (
            <div key={issue._id}>
              <IssueCard issue={issue} />
              <Link className="btn btn-outline btn-block" to={`/issues/${issue._id}`}>Open officer action panel</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
