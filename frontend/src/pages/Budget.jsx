import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Wallet, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, PieChart, DollarSign, MinusCircle } from 'lucide-react';

const PRESET_CATEGORIES = [
  'Food', 'Dining', 'Rent', 'Utilities', 'Shopping',
  'Entertainment', 'Travel', 'Health', 'Subscription'
];

const Budget = () => {
  const [overallBudget, setOverallBudget] = useState(null);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const { addToast } = useToast();

  // Form State
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [category, setCategory] = useState('');
  const [categoryBudgetInput, setCategoryBudgetInput] = useState('');

  // Spend Modal State
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCategory, setSpendCategory] = useState('Food');
  const [spendDescription, setSpendDescription] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const bRes = await api.get('budgets/');
      if (bRes.data.length > 0) {
        setOverallBudget(bRes.data[0]);
        setMonthlyBudgetInput(bRes.data[0].monthly_budget);
      } else {
        setOverallBudget(null);
        setMonthlyBudgetInput('');
      }

      const cbRes = await api.get('category-budgets/');
      setCategoryBudgets(cbRes.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load budget data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOverallBudget = async (e) => {
    e.preventDefault();
    if (!monthlyBudgetInput || parseFloat(monthlyBudgetInput) < 0) {
      addToast('Please enter a valid monthly limit.', 'error');
      return;
    }
    try {
      await api.post('budgets/', { monthly_budget: monthlyBudgetInput });
      addToast('Overall monthly budget updated successfully!', 'success');
      fetchBudgets();
    } catch (err) {
      addToast('Failed to update monthly budget.', 'error');
    }
  };

  const handleOpenAddModal = () => {
    setEditingCategoryId(null);
    setCategory('');
    setCategoryBudgetInput('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditModal = (cb) => {
    setEditingCategoryId(cb.id);
    setCategory(cb.category);
    setCategoryBudgetInput(cb.monthly_budget);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryBudget = async (e) => {
    e.preventDefault();
    if (!category.trim() || !categoryBudgetInput || parseFloat(categoryBudgetInput) <= 0) {
      addToast('Please enter a category name and valid budget amount.', 'error');
      return;
    }
    try {
      await api.post('category-budgets/', {
        category: category.trim(),
        monthly_budget: categoryBudgetInput,
      });
      setIsCategoryModalOpen(false);
      setCategory('');
      setCategoryBudgetInput('');
      setEditingCategoryId(null);
      addToast(`Category budget for "${category}" saved!`, 'success');
      fetchBudgets();
    } catch (err) {
      addToast('Failed to save category budget.', 'error');
    }
  };

  const handleDeleteCategoryBudget = async (id, catName) => {
    if (window.confirm(`Are you sure you want to remove the budget cap for ${catName}?`)) {
      try {
        await api.delete(`category-budgets/${id}/`);
        addToast(`Budget cap for "${catName}" removed.`, 'info');
        fetchBudgets();
      } catch (err) {
        addToast('Failed to delete category budget.', 'error');
      }
    }
  };

  const handleOpenSpendModal = (targetCategory = 'Food') => {
    setSpendCategory(targetCategory);
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
        description: spendDescription || `Logged spending against ${spendCategory} budget`,
      });

      addToast(`Logged $${parseFloat(spendAmount).toLocaleString()} spent in "${spendCategory}"!`, 'success');
      setIsSpendModalOpen(false);
      setSpendAmount('');
      setSpendDescription('');
      fetchBudgets();
    } catch (err) {
      addToast('Failed to record budget expense.', 'error');
    }
  };

  // Summary Metrics
  const overallLimit = parseFloat(overallBudget?.monthly_budget || 0);
  const overallSpent = parseFloat(overallBudget?.spent_amount || 0);
  const overallRemaining = overallLimit - overallSpent;
  const overallPct = overallLimit > 0 ? Math.min(Math.round((overallSpent / overallLimit) * 100), 100) : 0;

  const totalCategoryCaps = categoryBudgets.reduce((acc, cb) => acc + parseFloat(cb.monthly_budget || 0), 0);
  const totalCategorySpent = categoryBudgets.reduce((acc, cb) => acc + parseFloat(cb.spent_amount || 0), 0);
  const exceededCategoriesCount = categoryBudgets.filter(cb => cb.is_exceeded).length;

  if (loading) {
    return (
      <div>
        <Navbar title="Budget Planning" />
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading budget parameters and spending telemetry...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Budget & Spending Caps" />

      {/* Exceeded Warning Banner */}
      {exceededCategoriesCount > 0 && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#f43f5e'
        }}>
          <AlertTriangle size={24} />
          <div>
            <div style={{ fontWeight: 700 }}>Budget Alert Notice</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', opacity: 0.9 }}>
              You have exceeded your monthly cap in <strong>{exceededCategoriesCount}</strong> {exceededCategoriesCount === 1 ? 'category' : 'categories'}. Review your caps below.
            </div>
          </div>
        </div>
      )}

      {/* Top Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            OVERALL MONTHLY CAP
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>
            ${overallLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            SPENT THIS MONTH
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: overallSpent > overallLimit && overallLimit > 0 ? '#f43f5e' : 'var(--text-main)' }}>
            ${overallSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            OVERALL REMAINING
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: overallRemaining >= 0 ? '#10b981' : '#f43f5e' }}>
            ${overallRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            SUM OF CATEGORY CAPS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4' }}>
            ${totalCategoryCaps.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Overall Monthly Budget Configuration Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet color="#0284c7" size={22} /> Main Monthly Spending Cap
          </h3>
          <span className="badge" style={{
            background: overallPct > 90 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(2, 132, 199, 0.2)',
            color: overallPct > 90 ? '#f43f5e' : '#0284c7',
            padding: '0.4rem 0.8rem',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            {overallPct}% Used
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Spent: ${overallSpent.toLocaleString()}</span>
            <span style={{ fontWeight: 600 }}>Limit: ${overallLimit.toLocaleString()}</span>
          </div>
          <div style={{
            height: '12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${overallPct}%`,
              background: overallPct >= 100 ? '#f43f5e' : overallPct >= 80 ? '#f59e0b' : 'linear-gradient(90deg, #0284c7, #06b6d4)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        <form onSubmit={handleUpdateOverallBudget} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '540px' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Set Monthly Spending Cap ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 5000.00"
              value={monthlyBudgetInput}
              onChange={(e) => setMonthlyBudgetInput(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            Save Main Budget
          </button>
        </form>
      </div>

      {/* Category Budgets Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Category-Specific Caps</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Set custom spending limits per category to automatically catch overspending.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Add Category Budget
        </button>
      </div>

      {/* Category Budgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {categoryBudgets.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No category budgets created yet. Click "Add Category Budget" above to assign spending caps for Food, Rent, Entertainment, and more.
          </div>
        ) : (
          categoryBudgets.map((cb, idx) => {
            const limit = parseFloat(cb.monthly_budget || 0);
            const spent = parseFloat(cb.spent_amount || 0);
            const remaining = limit - spent;
            const pct = parseFloat(cb.percentage_used || 0);
            const isExceeded = cb.is_exceeded || spent > limit;

            return (
              <div key={cb.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', border: isExceeded ? '1px solid rgba(244, 63, 94, 0.5)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#0284c7' }}>#{idx + 1}</span>
                    {cb.category}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      title="Log spending against this cap"
                      onClick={() => handleOpenSpendModal(cb.category)}
                    >
                      <MinusCircle size={13} /> Spend
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem' }}
                      title="Edit Category Cap"
                      onClick={() => handleOpenEditModal(cb)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem', color: '#f43f5e' }}
                      title="Delete Category Cap"
                      onClick={() => handleDeleteCategoryBudget(cb.id, cb.category)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Spent: ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span style={{ fontWeight: 700 }}>Cap: ${limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: isExceeded ? '#f43f5e' : pct >= 80 ? '#f59e0b' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Status Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  {isExceeded ? (
                    <span style={{ color: '#f43f5e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertTriangle size={14} /> EXCEEDED by ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>
                      Remaining: <strong style={{ color: '#10b981' }}>${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  )}
                  <span style={{
                    fontWeight: 700,
                    color: isExceeded ? '#f43f5e' : pct >= 80 ? '#f59e0b' : 'var(--text-muted)'
                  }}>
                    {pct}% used
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Budget Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategoryId ? "Edit Category Budget" : "Add Category Budget"}>
        <form onSubmit={handleSaveCategoryBudget}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Food, Rent, Dining"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            {/* Preset Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
              {PRESET_CATEGORIES.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setCategory(preset)}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: category === preset ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: category === preset ? '#38bdf8' : 'var(--text-muted)',
                    borderRadius: '20px',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.2rem' }}>
            <label className="form-label">Monthly Spending Cap ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 500.00"
              value={categoryBudgetInput}
              onChange={(e) => setCategoryBudgetInput(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.75rem' }}>
            {editingCategoryId ? 'Update Category Budget' : 'Save Category Budget'}
          </button>
        </form>
      </Modal>

      {/* Spend from Budget Modal */}
      <Modal isOpen={isSpendModalOpen} onClose={() => setIsSpendModalOpen(false)} title={`Log Expense in "${spendCategory}"`}>
        <form onSubmit={handleLogSpend}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-control"
              value={spendCategory}
              onChange={(e) => setSpendCategory(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Amount Spent ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 50.00"
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
              placeholder="e.g. Dinner, Grocery run, Rent payment"
              value={spendDescription}
              onChange={(e) => setSpendDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.75rem' }}>
            Record Expense & Deduct from Budget
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Budget;
