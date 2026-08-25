import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Wallet, MinusCircle, Plus } from 'lucide-react';

const PRESET_CATEGORIES = [
  'Food', 'Dining', 'Rent', 'Utilities', 'Shopping',
  'Entertainment', 'Travel', 'Health', 'Subscription'
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Spend Modal State
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCategory, setSpendCategory] = useState('Food');
  const [spendDescription, setSpendDescription] = useState('');

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await api.get(`dashboard/stats/?_t=${Date.now()}`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timerId;
    let isMounted = true;

    const poll = async () => {
      await fetchDashboardStats();
      if (isMounted) {
        timerId = setTimeout(poll, 2500);
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [fetchDashboardStats]);

  const handleOpenSpendModal = (initialCategory = 'Food') => {
    setSpendCategory(initialCategory);
    setSpendAmount('');
    setSpendDescription('');
    setIsSpendModalOpen(true);
  };

  const handleLogSpend = async (e) => {
    e.preventDefault();
    if (!spendAmount || parseFloat(spendAmount) <= 0) {
      addToast('Please enter a valid expense amount.', 'error');
      return;
    }
    try {
      await api.post('transactions/', {
        amount: spendAmount,
        type: 'expense',
        category: spendCategory.trim(),
        date: new Date().toISOString().split('T')[0],
        description: spendDescription || `Budget expense logged via Dashboard`,
      });

      addToast(`Logged $${parseFloat(spendAmount).toLocaleString()} spent in "${spendCategory}"!`, 'success');
      setIsSpendModalOpen(false);
      setSpendAmount('');
      setSpendDescription('');
      fetchDashboardStats();
    } catch (err) {
      addToast('Failed to record budget expense.', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Dashboard" />
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading dashboard metrics...</div>
      </div>
    );
  }

  const budgetUsagePercent = stats?.monthly_budget > 0
    ? Math.min(Math.round((stats.current_month_expenses / stats.monthly_budget) * 100), 100)
    : 0;

  // Derive categories list from active category budgets + presets
  const availableCategories = Array.from(
    new Set([
      ...(stats?.category_budgets?.map(cb => cb.category) || []),
      ...PRESET_CATEGORIES
    ])
  );

  return (
    <div>
      <Navbar title="Financial Overview" />

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Net Balance"
          value={`$${stats?.net_balance?.toLocaleString() || '0.00'}`}
          icon={DollarSign}
          color="2, 132, 199"
          subtitle="Total income minus expenses"
        />
        <StatCard
          title="Total Income"
          value={`$${stats?.total_income?.toLocaleString() || '0.00'}`}
          icon={TrendingUp}
          color="16, 185, 129"
        />
        <StatCard
          title="Total Expenses"
          value={`$${stats?.total_expenses?.toLocaleString() || '0.00'}`}
          icon={TrendingDown}
          color="244, 63, 94"
        />
        <StatCard
          title="Portfolio Total"
          value={`$${stats?.portfolio_total?.toLocaleString() || '0.00'}`}
          icon={PieChart}
          color="6, 182, 212"
          subtitle={`Unrealized P&L: ${stats?.portfolio_pl >= 0 ? '+' : ''}$${stats?.portfolio_pl?.toLocaleString()}`}
        />
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Monthly Budget Progress Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={18} color="#0284c7" /> Monthly Budget Status
            </h3>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => handleOpenSpendModal()}
              >
                <MinusCircle size={14} /> Spend from Budget
              </button>
              <Link to="/budget" style={{ fontSize: '0.85rem', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                Manage Caps →
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Spent so far</span>
            <span style={{ fontWeight: 600 }}>
              ${stats?.current_month_expenses?.toLocaleString()} / {stats?.monthly_budget > 0 ? `$${stats?.monthly_budget?.toLocaleString()}` : <Link to="/budget" style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 700 }}>Set Budget Limit</Link>}
            </span>
          </div>

          <div style={{
            height: '10px',
            borderRadius: '5px',
            background: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            marginBottom: '1.2rem'
          }}>
            <div style={{
              height: '100%',
              width: `${budgetUsagePercent}%`,
              background: budgetUsagePercent >= 100 ? '#f43f5e' : budgetUsagePercent > 80 ? '#f59e0b' : 'linear-gradient(90deg, #0284c7, #06b6d4)',
              transition: 'width 0.5s ease'
            }} />
          </div>

          {/* Category Budget Mini Breakdown */}
          {stats?.category_budgets && stats.category_budgets.length > 0 && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Category Caps</span>
                <span>Click category to spend</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {stats.category_budgets.slice(0, 5).map((cb) => (
                  <div
                    key={cb.id}
                    style={{ fontSize: '0.85rem', cursor: 'pointer', padding: '0.2rem', borderRadius: '4px' }}
                    onClick={() => handleOpenSpendModal(cb.category)}
                    title={`Click to log spending in ${cb.category}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 500, color: '#38bdf8' }}>{cb.category} 💸</span>
                      <span style={{ color: cb.is_exceeded ? '#f43f5e' : 'var(--text-muted)', fontWeight: cb.is_exceeded ? 700 : 400 }}>
                        ${parseFloat(cb.spent_amount || 0).toLocaleString()} / ${parseFloat(cb.monthly_budget).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(parseFloat(cb.percentage_used || 0), 100)}%`,
                        background: cb.is_exceeded ? '#f43f5e' : parseFloat(cb.percentage_used || 0) >= 80 ? '#f59e0b' : '#10b981'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Top Expense Categories</h3>
          {stats?.category_breakdown?.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No expense records found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {stats?.category_breakdown?.slice(0, 5).map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 500 }}>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: '#f43f5e' }}>${floatVal(cat.total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Activity</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_transactions?.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textTransform: 'none', color: 'var(--text-muted)' }}>No recent transactions recorded.</td>
                </tr>
              ) : (
                stats?.recent_transactions?.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td style={{ fontWeight: 600 }}>{tx.category}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{tx.description || '-'}</td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#f43f5e' }}>
                      {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spend from Budget Modal */}
      <Modal isOpen={isSpendModalOpen} onClose={() => setIsSpendModalOpen(false)} title="Log Expense / Spend from Budget">
        <form onSubmit={handleLogSpend}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={spendCategory}
              onChange={(e) => setSpendCategory(e.target.value)}
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Amount Spent ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 45.50"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Description / Notes (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Groceries, Utility bill, Coffee"
              value={spendDescription}
              onChange={(e) => setSpendDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.75rem' }}>
            Record Expense & Update Dashboard
          </button>
        </form>
      </Modal>
    </div>
  );
};

const floatVal = (val) => parseFloat(val || 0);

export default Dashboard;
