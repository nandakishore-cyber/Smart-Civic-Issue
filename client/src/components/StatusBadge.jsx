const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending badge-pending';
      case 'in progress':
      case 'inprogress':
        return 'status-in-progress badge-in-progress';
      case 'resolved':
        return 'status-resolved badge-resolved';
      case 'rejected':
        return 'status-rejected badge-rejected';
      default:
        return 'status-pending badge-default';
    }
  };

  return <span className={`status-badge ${getStatusClass()}`}>{status || 'Unknown'}</span>;
};

export default StatusBadge;
