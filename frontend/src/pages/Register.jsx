import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, Clock, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  // Regex Rules
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!._-]).{8,50}$/;

  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters long and contain only letters, numbers, and underscores (e.g. nisu05).');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. nisu05@gmail.com).');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError('Password must start with a Capital letter, be at least 8 characters long, and contain a number and a special character (e.g. Nisu@2026).');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/send_otp/', { email, username });
      setStep(2);
      setTimer(300);
      setCanResend(false);
      setOtpCode('');
      addToast('Verification code sent to your email! Please check your email inbox on your phone.', 'info');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.email?.[0] || data?.username?.[0] || 'Failed to send OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('auth/verify_otp/', {
        email,
        otp_code: otpCode,
        username,
        password,
        name,
      });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      addToast('Email verified & Account created successfully!', 'success');
      window.location.href = '/';
    } catch (err) {
      const data = err.response?.data;
      setError(data?.otp_code?.[0] || data?.detail || 'Invalid or expired OTP code.');
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.8rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)'
          }}>
            F
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {step === 1 ? 'Create Account' : 'Verify Email OTP'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            {step === 1
              ? 'Enter your details to receive a 5-minute verification code'
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.2rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            <ShieldAlert size={18} style={{ margin: '0 auto 0.3rem auto', display: 'block' }} />
            {error}
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Nisu Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. nisu05"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Format: 3–20 characters (alphanumeric & underscores)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. nisu05@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Nisu@2026"
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Rule: First letter Capital, min 8 chars, includes number & special char (e.g. Nisu@2026)
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.8rem' }}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#3b82f6',
              fontWeight: 600
            }}>
              <Clock size={18} /> OTP Code Expires In: {formatTime(timer)}
            </div>

            <div style={{
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
              color: '#38bdf8',
              fontSize: '0.85rem'
            }}>
              📩 <strong>Code Sent to Email:</strong> Please check your email inbox on your phone for <strong>{email}</strong> and enter the 6-digit verification code below.
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength="6"
                className="form-control"
                placeholder="123456"
                style={{
                  fontSize: '1.75rem',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '0.75rem'
                }}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otpCode.length !== 6}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.8rem' }}
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.85rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ padding: '0.4rem 0.8rem' }}
              >
                <ArrowLeft size={16} /> Edit Info
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={!canResend || loading}
                onClick={handleSendOTP}
                style={{ padding: '0.4rem 0.8rem' }}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
