import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import RoleSelect from './pages/RoleSelect';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import Portfolio from './pages/Portfolio';
import Budget from './pages/Budget';
import Events from './pages/Events';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/portal-select" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
      <BottomNav />
    </div>
  );
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.is_staff) {
    return <Navigate to="/portal-select" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/portal-select" element={<RoleSelect />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/tracker" element={<ProtectedLayout><Tracker /></ProtectedLayout>} />
              <Route path="/portfolio" element={<ProtectedLayout><Portfolio /></ProtectedLayout>} />
              <Route path="/budget" element={<ProtectedLayout><Budget /></ProtectedLayout>} />
              <Route path="/events" element={<ProtectedLayout><Events /></ProtectedLayout>} />
              <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
              <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
              <Route path="/admin" element={<ProtectedLayout><AdminRoute><Admin /></AdminRoute></ProtectedLayout>} />
              
              <Route path="*" element={<Navigate to="/portal-select" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
