import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Download, Search } from 'lucide-react';

const Tracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Filter state
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, search]);

  const fetchTransactions = async () => {
    try {
      let query = 'transactions/?';
      if (typeFilter) query += `type=${typeFilter}&`;
      if (categoryFilter) query += `category=${categoryFilter}&`;
      if (search) query += `search=${search}&`;
      const res = await api.get(query);
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('transactions/', {
        amount,
        type,
        category,
        date,
        description,
      });
      setIsModalOpen(false);
      resetForm();
      addToast('Transaction recorded successfully!', 'success');
      fetchTransactions();

      if (type === 'expense') {
        try {
          const cbRes = await api.get('category-budgets/');
          const matchedCb = cbRes.data.find(
            (cb) => cb.category.toLowerCase() === category.trim().toLowerCase()
          );
          if (matchedCb && (matchedCb.is_exceeded || matchedCb.spent_amount > matchedCb.monthly_budget)) {
            addToast(
              `⚠️ Budget Alert: "${matchedCb.category}" cap of $${parseFloat(matchedCb.monthly_budget).toLocaleString()} exceeded! ($${parseFloat(matchedCb.spent_amount).toLocaleString()} spent)`,
              'error'
            );
          }

          const bRes = await api.get('budgets/');
          if (bRes.data.length > 0) {
            const overall = bRes.data[0];
            if (overall.spent_amount > overall.monthly_budget && overall.monthly_budget > 0) {
              addToast(
                `⚠️ Budget Alert: Overall monthly limit of $${parseFloat(overall.monthly_budget).toLocaleString()} exceeded! ($${parseFloat(overall.spent_amount).toLocaleString()} spent)`,
                'error'
              );
            }
          }
        } catch (bErr) {
          console.error('Error checking budget status', bErr);
        }
      }
    } catch (err) {
      addToast('Failed to add transaction.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await api.delete(`transactions/${id}/`);
        addToast('Transaction deleted. Serial numbers automatically updated!', 'info');
        fetchTransactions();
      } catch (err) {
        addToast('Failed to delete transaction.', 'error');
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('transactions/export_csv/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'finvest_transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Transactions exported to CSV!', 'success');
    } catch (err) {
      addToast('CSV export failed.', 'error');
    }
  };

  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  return (
    <div>
      <Navbar title="Transaction Tracker" />

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Category filter..."
            style={{ width: '160px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />

          <input
            type="text"
            className="form-control"
            placeholder="Search description..."
            style={{ width: '200px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textTransform: 'none', color: 'var(--text-muted)' }}>No transactions matching search.</td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                    <td>{tx.date}</td>
                    <td style={{ fontWeight: 600 }}>{tx.category}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{tx.description || '-'}</td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', color: '#ef4444' }}
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Transaction">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Salary, Rent, Food, Travel"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Save Transaction
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Tracker;
