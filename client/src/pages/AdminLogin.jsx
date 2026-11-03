import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaShieldAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password, 'admin');
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response
          ? 'Login failed. Please check your credentials.'
          : 'Cannot reach the server. Start the project with npm run dev and try again.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card admin-login-card">
        <div className="auth-header">
          <div className="auth-icon auth-icon-dark">
            <FaShieldAlt size={28} />
          </div>
          <h2>Admin Login</h2>
          <p>Administrative access to manage civic issues</p>
        </div>

        <div className="admin-credentials-hint">
          <p><strong>Default Credentials:</strong></p>
          <p>Email: admin@civic.com</p>
          <p>Password: admin123</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter admin email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-dark btn-block" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span> Signing In...
              </>
            ) : (
              <>
                <FaSignInAlt /> Admin Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Not an admin? <Link to="/login">User Login here</Link>
          </p>
          <p>
            Gov. Officer? <Link to="/officer/login">Officer Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
