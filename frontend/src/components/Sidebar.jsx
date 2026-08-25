import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Wallet, 
  CalendarDays, 
  BarChart3, 
  User, 
  Shield, 
  LogOut,
  Sparkles
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/portal-select');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tracker', label: 'Transactions', icon: Receipt },
    { path: '/portfolio', label: 'Portfolio & Markets', icon: PieChart },
    { path: '/budget', label: 'Budget Planner', icon: Wallet },
    { path: '/events', label: 'Event Budgets', icon: CalendarDays },
    { path: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
    { path: '/profile', label: 'Security & Account', icon: User },
  ];

  if (user?.is_staff) {
    navItems.push({ path: '/admin', label: 'Admin Control Suite', icon: Shield });
  }

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="glass-panel" style={{
        width: '260px',
        position: 'fixed',
        top: '1.25rem',
        bottom: '1.25rem',
        left: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        padding: '1.5rem 1rem',
        zIndex: 100,
        borderRadius: '24px',
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.4rem',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)'
            }}>
              F
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                FinVest
              </div>
              <div style={{ fontSize: '0.7rem', color: theme === 'light' ? '#047857' : '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={12} /> Enterprise Suite
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    color: isActive ? '#0284c7' : 'var(--text-muted)',
                    background: isActive ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                  })}
                >
                  <Icon size={19} color={({ isActive }) => (isActive ? '#0284c7' : 'currentColor')} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer Card */}
        <div>
          <div style={{
            padding: '0.9rem',
            borderRadius: '16px',
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: user?.is_staff ? 'rgba(2, 132, 199, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: user?.is_staff ? '#0284c7' : (theme === 'light' ? '#047857' : '#10b981'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              border: user?.is_staff ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: user?.is_staff ? '#0284c7' : (theme === 'light' ? '#047857' : '#10b981') }}>
                {user?.is_staff ? 'Administrator' : 'Active Account'}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem', color: '#f43f5e' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar Navigation (Screens <= 1024px) */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
