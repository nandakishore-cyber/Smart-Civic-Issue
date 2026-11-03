import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaUserTie, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';

const OfficerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter your officer email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password, 'govOfficer');
      toast.success('Gov. Officer login successful.');
      navigate('/officer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Officer login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card admin-login-card">
        <div className="auth-header">
          <div className="auth-icon auth-icon-dark"><FaUserTie size={28} /></div>
          <h2>Gov. Officer Login</h2>
          <p>Review escalated civic complaints and high-priority cases</p>
        </div>
        <div className="admin-credentials-hint">
          <p><strong>Development account</strong></p>
          <p>officer@civic.com / officer123</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="officer-email">Officer Email</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input id="officer-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="officer-password">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input id="officer-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-dark btn-block" disabled={loading}>
            {loading ? 'Signing In...' : <><FaSignInAlt /> Officer Sign In</>}
          </button>
        </form>
        <div className="auth-footer">
          <p>Citizen? <Link to="/login">User Login</Link></p>
          <p>Administrator? <Link to="/admin/login">Admin Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default OfficerLogin;
