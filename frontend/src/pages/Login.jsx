import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { Lock, User, ArrowLeft, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordInputRef = useRef(null);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Username Regex: 3 to 20 chars, alphanumeric & underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  // Password Regex: Starts with Capital letter, min 8 chars, includes number & special char
  const passwordRegex = /^(?=[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!._-]).{8,50}$/;

  const handleUsernameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!usernameRegex.test(username)) {
        setError('Username is not proper. Must be 3–20 characters (alphanumeric & underscores only).');
        addToast('Username is not proper.', 'error');
      } else {
        setError('');
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameRegex.test(username)) {
      setError('Username is not proper. Must be 3–20 characters (alphanumeric & underscores only).');
      addToast('Username is not proper.', 'error');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError('Password must start with a Capital letter, be at least 8 characters long, and contain a number and a special character.');
      addToast('Password format invalid.', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate credentials
      const res = await api.post('auth/login/', { username, password });
      const token = res.data.access;

      // 2. Strict Portal Lockout: User Portal ONLY allows standard users (is_staff === False)
      const userRes = await api.get('auth/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userRes.data.is_staff) {
        setError('ACCESS DENIED: Administrator accounts cannot sign in via the User Portal. Please use the Admin Control Suite portal.');
        addToast('Access Denied: Administrator accounts must sign in via the Admin Portal.', 'error');
        setLoading(false);
        return;
      }

      // 3. User verified successfully!
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      addToast('Welcome back to your FinVest dashboard!', 'success');
      window.location.href = '/';
    } catch (err) {
      setError('ACCESS DENIED: Invalid user username or password.');
      addToast('Invalid login credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'var(--bg-gradient)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.8rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)'
          }}>
            F
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Portal Sign In</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Sign in to access your personal financial dashboard
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f43f5e',
            padding: '0.85rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.2rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            <ShieldAlert size={20} style={{ margin: '0 auto 0.4rem auto', display: 'block' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleUsernameKeyDown}
              required
              autoComplete="off"
              name="user_login_field_nobrowser"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                ref={passwordInputRef}
                type="text"
                className="form-control"
                placeholder="Enter password"
                style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                name="user_security_pass_nobrowser"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.8rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In to User Portal'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', fontSize: '0.85rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => navigate('/portal-select')}
          >
            <ArrowLeft size={14} /> Portals
          </button>

          <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
