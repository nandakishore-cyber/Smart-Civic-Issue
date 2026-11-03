import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { getIssueImageUrl } from '../utils/issueImage';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTrash,
  FaRoad,
  FaWater,
  FaLightbulb,
  FaRecycle,
  FaExclamationTriangle,
  FaEllipsisH,
} from 'react-icons/fa';

const categoryIcons = {
  'Garbage Overflow': FaTrash,
  'Damaged Roads': FaRoad,
  'Water Leakage': FaWater,
  'Street Lights': FaLightbulb,
  'Drainage': FaRecycle,
  'Other': FaEllipsisH,
};

const IssueCard = ({ issue }) => {
  const navigate = useNavigate();
  const Icon = categoryIcons[issue.category] || FaExclamationTriangle;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const imageUrl = getIssueImageUrl(issue.image);

  return (
    <div className="issue-card" onClick={() => navigate(`/issues/${issue._id}`)}>
      <div className="issue-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={issue.title} loading="lazy" />
        ) : (
          <div className="issue-card-no-image">
            <Icon size={40} />
          </div>
        )}
        <div className="issue-card-category-badge">
          <Icon size={12} />
          <span>{issue.category}</span>
        </div>
      </div>
      <div className="issue-card-body">
        <h3 className="issue-card-title">{issue.title}</h3>
        <p className="issue-card-description">
          {issue.description?.substring(0, 100)}
          {issue.description?.length > 100 ? '...' : ''}
        </p>
        <div className="issue-card-meta">
          <span className="issue-card-location">
            <FaMapMarkerAlt />
            {issue.location?.city || 'Unknown'}
          </span>
          <span className="issue-card-date">
            <FaCalendarAlt />
            {formatDate(issue.createdAt)}
          </span>
        </div>
        <div className="issue-card-footer">
          <StatusBadge status={issue.status} />
          {issue.priority && (
            <span className={`priority-badge priority-${issue.priority?.toLowerCase()}`}>
              {issue.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
