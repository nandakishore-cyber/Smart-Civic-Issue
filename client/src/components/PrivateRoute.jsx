import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={role === 'admin' ? '/admin/login' : role === 'govOfficer' ? '/officer/login' : '/login'}
        replace
      />
    );
  }

  if (role && user?.role !== role) {
    return (
      <Navigate
        to={
          user?.role === 'admin'
            ? '/admin/dashboard'
            : user?.role === 'govOfficer'
              ? '/officer/dashboard'
              : '/dashboard'
        }
        replace
      />
    );
  }

  return children;
};

export default PrivateRoute;
