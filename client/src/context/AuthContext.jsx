import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:expired', handleExpired);

    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user || res.data);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [token]);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    const data = res.data;
    const newToken = data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(data.user || data);
    return data;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    const data = res.data;
    const newToken = data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(data.user || data);
    return data;
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout session cleanup failed:', error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isGovOfficer: user?.role === 'govOfficer',
    isUser: user?.role === 'user',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
