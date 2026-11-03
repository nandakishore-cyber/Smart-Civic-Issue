import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import OfficerLogin from './pages/OfficerLogin';
import UserDashboard from './pages/UserDashboard';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import AdminIssues from './pages/AdminIssues';
import IssueDetail from './pages/IssueDetail';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminSupervisors from './pages/AdminSupervisors';

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute role="user">
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/report"
            element={
              <PrivateRoute role="user">
                <ReportIssue />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/issues"
            element={
              <PrivateRoute role="admin">
                <AdminIssues />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/supervisors"
            element={
              <PrivateRoute role="admin">
                <AdminSupervisors />
              </PrivateRoute>
            }
          />
          <Route
            path="/officer/dashboard"
            element={
              <PrivateRoute role="govOfficer">
                <OfficerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <PrivateRoute>
                <IssueDetail />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default App;
