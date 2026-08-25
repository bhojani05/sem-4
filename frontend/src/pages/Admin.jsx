import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { 
  Shield, 
  Users, 
  DollarSign, 
  PieChart, 
  Wallet,
  CalendarDays,
  Activity,
  ShieldAlert, 
  Eye, 
  Key, 
  Trash2 
} from 'lucide-react';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Inspect User Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedUserSummary, setSelectedUserSummary] = useState(null);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const statsRes = await api.get('admin/stats/');
      setStats(statsRes.data);

      const usersRes = await api.get('admin/users/');
      const sortedUsers = (usersRes.data || []).sort((a, b) => {
        const dateA = new Date(a.date_joined).getTime() || 0;
        const dateB = new Date(b.date_joined).getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        return Number(a.id) - Number(b.id);
      });
      setUsers(sortedUsers);
    } catch (err) {
      console.error(err);
      addToast('Failed to load admin telemetry data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, username, isStaff) => {
    if (window.confirm(`Are you sure you want to ${isStaff ? 'demote' : 'promote'} ${username}?`)) {
      try {
        await api.post(`admin/users/${userId}/toggle_admin/`);
        addToast(`Updated role for ${username}!`, 'success');
        fetchAdminData();
      } catch (err) {
        addToast(err.response?.data?.detail || 'Action failed.', 'error');
      }
    }
  };

  const handleInspectUser = async (userId) => {
    try {
      const res = await api.get(`admin/users/${userId}/user_summary/`);
      setSelectedUserSummary(res.data);
      setInspectModalOpen(true);
    } catch (err) {
      addToast('Failed to inspect user data.', 'error');
    }
  };

  const handleOpenResetPassword = (userId) => {
    setTargetUserId(userId);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`admin/users/${targetUserId}/reset_password/`, { new_password: newPassword });
      addToast('User password reset successfully!', 'success');
      setResetModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Reset failed.', 'error');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`PERMANENT ACTION: Delete user account "${username}" and all associated financial data?`)) {
      try {
        await api.delete(`admin/users/${userId}/`);
        addToast(`User ${username} deleted from system. User list automatically re-indexed!`, 'info');
        fetchAdminData();
      } catch (err) {
        addToast(err.response?.data?.detail || 'Failed to delete user.', 'error');
      }
    }
  };

  const filteredUsers = [...users]
    .filter((u) => {
      const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || (roleFilter === 'admin' && u.is_staff) || (roleFilter === 'user' && !u.is_staff);
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date_joined).getTime() || 0;
      const dateB = new Date(b.date_joined).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return Number(a.id) - Number(b.id);
    });

  return (
    <div>
      <Navbar title="Enterprise Admin Control Panel" />

      {/* System Executive Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Registered Accounts"
          value={stats?.total_users || 0}
          icon={Users}
          color="2, 132, 199"
          subtitle={`${stats?.staff_users || 0} Administrators`}
        />
        <StatCard
          title="Platform Transaction Volume"
          value={`$${stats?.total_volume?.toLocaleString() || '0.00'}`}
          icon={DollarSign}
          color="16, 185, 129"
          subtitle={`${stats?.total_transactions || 0} Total Logged`}
        />
        <StatCard
          title="Total Platform AUM Tracked"
          value={`$${stats?.platform_aum?.toLocaleString() || '0.00'}`}
          icon={PieChart}
          color="6, 182, 212"
          subtitle={`${stats?.total_assets || 0} Portfolio Assets`}
        />
        <StatCard
          title="System Monthly Budget Caps"
          value={`$${stats?.total_budget_sum?.toLocaleString() || '0.00'}`}
          icon={Wallet}
          color="245, 158, 11"
          subtitle={`${stats?.events_count || 0} Event Budgets Active`}
        />
      </div>

      {/* System Platform Stocks & Budget Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Platform Stock & Crypto Holdings Telemetry */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart color="#06b6d4" size={18} /> Platform Asset Holdings Telemetry
          </h3>
          <div className="table-responsive">
            <table className="table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Symbol</th>
                  <th>Asset Name</th>
                  <th>Total Shares</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {stats?.top_stocks_crypto?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textTransform: 'none', color: 'var(--text-muted)' }}>No asset holdings tracked yet.</td>
                  </tr>
                ) : (
                  stats?.top_stocks_crypto?.map((stock, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
                          {stock.symbol}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{stock.name}</td>
                      <td>{stock.total_qty}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>${stock.total_val.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Budget Plans & Event Telemetry */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays color="#f59e0b" size={18} /> Active Budget & Event Plans
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Event Budget Targets</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>
                ${stats?.total_event_budget?.toLocaleString() || '0.00'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Across {stats?.events_count || 0} active user events
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Top Expense Categories Across System:
              </h4>
              {stats?.system_category_expenses?.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  <span>#{idx + 1} {cat.category}</span>
                  <strong style={{ color: '#f43f5e' }}>${cat.total.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* System Audit & Telemetry Log History Table */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity color="#10b981" size={20} /> System Audit & Telemetry Log History
        </h3>
        <div className="table-responsive">
          <table className="table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Telemetry ID</th>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Event Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.telemetry_logs?.map((log, idx) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{log.id}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600 }}>{log.event}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.detail}</td>
                  <td>
                    <span className="badge" style={{ background: `${log.color}20`, color: log.color, border: `1px solid ${log.color}40` }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Directory & Access Control Section */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield color="#0284c7" size={22} /> User Directory & Access Control
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Inspect accounts, manage role permissions, reset credentials, and audit security.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators Only</option>
              <option value="user">Standard Users Only</option>
            </select>

            <input
              type="text"
              className="form-control"
              placeholder="Search user or email..."
              style={{ width: '220px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role Status</th>
                <th>Date Joined</th>
                <th>System Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>
                    {u.username} {u.name ? `(${u.name})` : ''}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{
                      background: u.is_staff ? 'rgba(6, 182, 212, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                      color: u.is_staff ? '#06b6d4' : '#0284c7'
                    }}>
                      {u.is_staff ? 'Administrator' : 'Standard User'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {new Date(u.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', color: u.is_staff ? '#f59e0b' : '#0284c7' }}
                        title={u.is_staff ? 'Demote to User' : 'Promote to Admin'}
                        onClick={() => handleToggleAdmin(u.id, u.username, u.is_staff)}
                      >
                        <ShieldAlert size={16} />
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', color: '#10b981' }}
                        title="Inspect Financial Overview"
                        onClick={() => handleInspectUser(u.id)}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', color: '#06b6d4' }}
                        title="Force Reset Password"
                        onClick={() => handleOpenResetPassword(u.id)}
                      >
                        <Key size={16} />
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', color: '#f43f5e' }}
                        title="Delete User Account"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT USER MODAL */}
      <Modal isOpen={inspectModalOpen} onClose={() => setInspectModalOpen(false)} title={`Inspection: ${selectedUserSummary?.user?.username}`}>
        {selectedUserSummary && (
          <div>
            <div style={{ background: 'rgba(2, 132, 199, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedUserSummary.user.username}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email: {selectedUserSummary.user.email}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Balance</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>${selectedUserSummary.net_balance.toLocaleString()}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Portfolio Value</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#06b6d4' }}>${selectedUserSummary.portfolio_val.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>Total Transactions Logged:</span>
              <strong style={{ color: 'var(--text-main)' }}>{selectedUserSummary.transaction_count}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>Total Assets in Portfolio:</span>
              <strong style={{ color: 'var(--text-main)' }}>{selectedUserSummary.asset_count}</strong>
            </div>
          </div>
        )}
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Force Reset User Password">
        <form onSubmit={handleResetPasswordSubmit}>
          <div className="form-group">
            <label className="form-label">New Password for User</label>
            <input
              type="password"
              className="form-control"
              placeholder="Minimum 8 characters (e.g. Password@2026)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Set New Password
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;
