import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { CalendarDays, Plus, Trash2, Tag, MinusCircle, DollarSign, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const EVENT_EXPENSE_CATEGORIES = [
  'Flights & Transport', 'Hotel & Lodging', 'Food & Dining',
  'Activities & Entertainment', 'Shopping & Souvenirs', 'Emergency & Other'
];

const formatApiError = (err, defaultMsg) => {
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      const parts = [];
      for (const [k, v] of Object.entries(data)) {
        const valStr = Array.isArray(v) ? v.join(', ') : String(v);
        parts.push(k !== 'detail' ? `${k}: ${valStr}` : valStr);
      }
      if (parts.length > 0) return parts.join(' | ');
    }
  }
  return err.message || defaultMsg;
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  // Create Event Form State
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [budget, setBudget] = useState('');
  const [excludeFromMain, setExcludeFromMain] = useState(false);

  // Spend Modal State
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCategory, setSpendCategory] = useState('Food & Dining');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().split('T')[0]);
  const [spendDescription, setSpendDescription] = useState('');
  const [syncToMain, setSyncToMain] = useState(true);

  // Expandable Transaction View
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('events/');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load event budgets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter an event name.', 'error');
      return;
    }
    const payload = {
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      exclude_from_main_budget: excludeFromMain,
    };
    if (budget && parseFloat(budget) > 0) {
      payload.budget = parseFloat(budget);
    }

    try {
      await api.post('events/', payload);
      setIsModalOpen(false);
      resetForm();
      addToast(`Event "${name}" created!`, 'success');
      fetchEvents();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to create event'), 'error');
    }
  };

  const handleDelete = async (id, eventName) => {
    if (window.confirm(`Delete event "${eventName}" and all its recorded expenses?`)) {
      try {
        await api.delete(`events/${id}/`);
        addToast(`Event "${eventName}" removed.`, 'info');
        fetchEvents();
      } catch (err) {
        addToast('Failed to delete event', 'error');
      }
    }
  };

  const handleOpenSpendModal = (event) => {
    setSelectedEvent(event);
    setSpendAmount('');
    setSpendCategory('Food & Dining');
    setSpendDate(new Date().toISOString().split('T')[0]);
    setSpendDescription('');
    setSyncToMain(!event.exclude_from_main_budget);
    setIsSpendModalOpen(true);
  };

  const handleLogEventExpense = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !spendAmount || parseFloat(spendAmount) <= 0) {
      addToast('Please enter a valid expense amount.', 'error');
      return;
    }
    try {
      await api.post('event-transactions/', {
        event: selectedEvent.id,
        amount: spendAmount,
        type: 'expense',
        category: spendCategory,
        date: spendDate,
        description: spendDescription || `Expense for ${selectedEvent.name}`,
        sync_to_main: syncToMain,
      });

      addToast(`Logged $${parseFloat(spendAmount).toLocaleString()} spent on "${selectedEvent.name}"!`, 'success');
      setIsSpendModalOpen(false);
      setSpendAmount('');
      setSpendDescription('');
      fetchEvents();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to log event expense.'), 'error');
    }
  };

  const handleDeleteEventTx = async (txId) => {
    if (window.confirm('Delete this event expense record?')) {
      try {
        await api.delete(`event-transactions/${txId}/`);
        addToast('Event expense deleted.', 'info');
        fetchEvents();
      } catch (err) {
        addToast('Failed to delete transaction.', 'error');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setBudget('');
    setExcludeFromMain(false);
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Event-Based Budgeting" />
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading event budgets...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Event-Based Budgeting" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Special Event Budgets</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Create isolated budgets for vacations, weddings, renovations, or milestone trips.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Event Budget
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {events.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No special event budgets created yet. Click "New Event Budget" above to track spending for your next vacation or event.
          </div>
        ) : (
          events.map((ev) => {
            const targetBudget = parseFloat(ev.budget || 0);
            const totalSpent = parseFloat(ev.total_spent || 0);
            const remaining = targetBudget - totalSpent;
            const pct = targetBudget > 0 ? Math.min(Math.round((totalSpent / targetBudget) * 100), 100) : 0;
            const isExceeded = targetBudget > 0 && totalSpent > targetBudget;
            const isExpanded = expandedEventId === ev.id;

            return (
              <div key={ev.id} className="glass-panel" style={{ padding: '1.5rem', border: isExceeded ? '1px solid rgba(244, 63, 94, 0.5)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{ev.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <CalendarDays size={14} /> {ev.start_date} to {ev.end_date}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                      title="Log expense against this event"
                      onClick={() => handleOpenSpendModal(ev)}
                    >
                      <MinusCircle size={14} /> Log Expense
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem', color: '#ef4444' }}
                      title="Delete event"
                      onClick={() => handleDelete(ev.id, ev.name)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {targetBudget > 0 && (
                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Spent: ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      <span style={{ fontWeight: 700 }}>Target: ${targetBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{
                      height: '8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isExceeded ? '#f43f5e' : pct >= 80 ? '#f59e0b' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Budget</span>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#38bdf8' }}>
                      {targetBudget > 0 ? `$${targetBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Flexible'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Spent</span>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: isExceeded ? '#f43f5e' : '#ef4444' }}>
                      ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remaining</span>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: remaining >= 0 ? '#10b981' : '#f43f5e' }}>
                      {targetBudget > 0 ? `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Event Transactions Toggle */}
                {ev.event_transactions && ev.event_transactions.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '0.6rem' }}>
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0284c7',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: 0
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Hide' : 'View'} Expenses ({ev.event_transactions.length})
                    </button>

                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.6rem' }}>
                        {ev.event_transactions.map((tx) => (
                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{tx.category}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.date} {tx.description ? `• ${tx.description}` : ''}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, color: '#f43f5e' }}>-${parseFloat(tx.amount).toLocaleString()}</span>
                              <button
                                onClick={() => handleDeleteEventTx(tx.id)}
                                style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 0 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Special Event Budget">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Summer Vacation in Europe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Event Budget ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 2500.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Create Event Budget
          </button>
        </form>
      </Modal>

      {/* Log Event Expense Modal */}
      <Modal isOpen={isSpendModalOpen} onClose={() => setIsSpendModalOpen(false)} title={`Log Expense for "${selectedEvent?.name || 'Event'}"`}>
        <form onSubmit={handleLogEventExpense}>
          <div className="form-group">
            <label className="form-label">Expense Category</label>
            <select
              className="form-control"
              value={spendCategory}
              onChange={(e) => setSpendCategory(e.target.value)}
            >
              {EVENT_EXPENSE_CATEGORIES.map((cat) => (
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
              placeholder="e.g. 150.00"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={spendDate}
              onChange={(e) => setSpendDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Description / Notes (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Hotel booking, Flight ticket, Dinner"
              value={spendDescription}
              onChange={(e) => setSpendDescription(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="syncToMain"
              checked={syncToMain}
              onChange={(e) => setSyncToMain(e.target.checked)}
            />
            <label htmlFor="syncToMain" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Also reflect this expense in Main Transaction Tracker
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.75rem' }}>
            Record Event Expense
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Events;
