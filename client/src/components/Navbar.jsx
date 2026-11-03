import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaPlusCircle,
  FaListAlt,
  FaTachometerAlt,
  FaShieldAlt,
  FaClipboardList,
  FaUserTie,
} from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const isGovOfficer = user?.role === 'govOfficer';
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <FaShieldAlt className="navbar-brand-icon" />
          <span>CivicReport</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link" onClick={closeMenu}>
            <FaHome /> <span>Home</span>
          </Link>

          {!isAuthenticated && (
            <>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>
                <FaUser /> <span>User Login</span>
              </Link>
              <Link to="/admin/login" className="navbar-link" onClick={closeMenu}>
                <FaShieldAlt /> <span>Admin Login</span>
              </Link>
              <Link to="/officer/login" className="navbar-link" onClick={closeMenu}>
                <FaShieldAlt /> <span>Officer Login</span>
              </Link>
            </>
          )}

          {isAuthenticated && !isAdmin && !isGovOfficer && (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={closeMenu}>
                <FaListAlt /> <span>My Issues</span>
              </Link>
              <Link to="/report" className="navbar-link navbar-link-cta" onClick={closeMenu}>
                <FaPlusCircle /> <span>Report Issue</span>
              </Link>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <Link to="/admin/dashboard" className="navbar-link" onClick={closeMenu}>
                <FaTachometerAlt /> <span>Dashboard</span>
              </Link>
              <Link to="/admin/issues" className="navbar-link" onClick={closeMenu}>
                <FaClipboardList /> <span>All Issues</span>
              </Link>
              <Link to="/admin/supervisors" className="navbar-link" onClick={closeMenu}>
                <FaUserTie /> <span>Supervisors</span>
              </Link>
            </>
          )}

          {isAuthenticated && isGovOfficer && (
            <Link to="/officer/dashboard" className="navbar-link" onClick={closeMenu}>
              <FaClipboardList /> <span>Officer Queue</span>
            </Link>
          )}

          {isAuthenticated && (
            <div className="navbar-user-section">
              <span className="navbar-user-name">
                <FaUser /> {user?.name}
              </span>
              <button className="navbar-logout-btn" onClick={handleLogout}>
                <FaSignOutAlt /> <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
