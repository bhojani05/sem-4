import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Wallet, 
  CalendarDays, 
  User 
} from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/tracker', label: 'Tracker', icon: Receipt },
    { path: '/portfolio', label: 'Portfolio', icon: PieChart },
    { path: '/budget', label: 'Budget', icon: Wallet },
    { path: '/events', label: 'Events', icon: CalendarDays },
    { path: '/profile', label: 'Account', icon: User },
  ];

  return (
    <nav className="mobile-bottom-nav glass-panel" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '65px',
      borderRadius: 0,
      borderTop: '1px solid var(--glass-border)',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      zIndex: 1000,
      display: 'none', // Shown via CSS media query @media (max-width: 1024px)
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0 0.5rem',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              color: isActive ? '#6366f1' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              fontWeight: isActive ? 700 : 500,
              padding: '0.4rem',
              transition: 'all 0.2s ease',
            })}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
