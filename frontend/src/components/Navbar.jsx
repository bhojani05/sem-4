import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, User, Sun, Moon } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-panel navbar-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.1rem 1.75rem',
      marginBottom: '2rem',
      borderRadius: '20px',
    }}>
      <div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          FinVest Financial Platform &bull; Real-Time Telemetry
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* 1-Click Theme Toggle Button */}
        <button
          className="btn btn-secondary"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light White Theme' : 'Switch to Dark Black Theme'}
          style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#0284c7" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* High-Contrast User Session Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {user?.is_staff ? <Shield size={18} color="#0284c7" /> : <User size={18} color="#0284c7" />}
          
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.01em' }}>
            {user?.username}
          </span>

          <span className="badge" style={{
            fontSize: '0.7rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            background: user?.is_staff ? 'rgba(2, 132, 199, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: user?.is_staff ? '#0284c7' : (theme === 'light' ? '#047857' : '#10b981'),
            border: user?.is_staff ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            {user?.is_staff ? 'Admin' : 'Active'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
