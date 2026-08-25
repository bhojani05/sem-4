import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { User, Lock, ShieldCheck } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await api.put('auth/me/', { name, email });
      addToast('Profile information updated successfully!', 'success');
    } catch (err) {
      addToast('Failed to update profile info.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    try {
      await api.post('auth/change_password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      addToast('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      addToast(err.response?.data?.old_password?.[0] || 'Password update failed.', 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div>
      <Navbar title="Account Settings & Profile" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Info Form */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User color="#6366f1" size={20} /> Personal Profile Details
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" value={user?.username || ''} disabled style={{ opacity: 0.7 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loadingProfile} style={{ marginTop: '0.5rem' }}>
              {loadingProfile ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock color="#ec4899" size={20} /> Security & Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loadingPassword} style={{ marginTop: '0.5rem' }}>
              {loadingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
