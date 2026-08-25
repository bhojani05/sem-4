import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { User, Shield, ArrowRight, Sun, Moon } from 'lucide-react';

const RoleSelect = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'var(--bg-gradient)',
      position: 'relative'
    }}>
      {/* Top Corner Theme Switcher */}
      <button
        className="btn btn-secondary"
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          padding: '0.5rem 0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.85rem'
        }}
      >
        {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0284c7" />}
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <div style={{ width: '100%', maxWidth: '840px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '2.4rem',
            marginBottom: '1.25rem',
            boxShadow: '0 12px 35px rgba(2, 132, 199, 0.45)'
          }}>
            F
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            FinVest Gateway
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.6rem' }}>
            Enterprise Financial Security & Personal Wealth Management
          </p>
        </div>

        {/* 2 Portal Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* USER PORTAL CARD */}
          <div
            className="glass-panel"
            style={{
              padding: '2.75rem 2.25rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => navigate('/login')}
          >
            <div>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.2)'
              }}>
                <User size={28} />
              </div>

              <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', marginBottom: '0.75rem' }}>
                Standard Access
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>User Portal Access</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Access personal transaction tracking, live stock & crypto market directory, budget planning, and wealth projections.
              </p>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: 700, fontSize: '0.95rem' }}>
              Sign In to User Portal <ArrowRight size={18} />
            </div>
          </div>

          {/* ADMIN CONTROL SUITE CARD */}
          <div
            className="glass-panel"
            style={{
              padding: '2.75rem 2.25rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              borderColor: 'rgba(6, 182, 212, 0.3)'
            }}
            onClick={() => navigate('/admin-login')}
          >
            <div>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.2)'
              }}>
                <Shield size={28} />
              </div>

              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', marginBottom: '0.75rem' }}>
                Restricted Admin
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Admin Control Suite</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Restricted enterprise suite for administrators to audit security telemetry, inspect user accounts, and manage system assets.
              </p>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06b6d4', fontWeight: 700, fontSize: '0.95rem' }}>
              Authenticate Admin Suite <ArrowRight size={18} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
