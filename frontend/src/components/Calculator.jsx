import React, { useState } from 'react';
import { Calculator as CalcIcon, TrendingUp } from 'lucide-react';

const Calculator = () => {
  const [initial, setInitial] = useState(5000);
  const [monthly, setMonthly] = useState(300);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(10);

  // Compound Interest Calculation Formula
  // FV = P * (1 + r/n)^(nt) + PMT * [ ((1 + r/n)^(nt) - 1) / (r/n) ]
  const r = rate / 100 / 12;
  const n = years * 12;

  const futureValueInitial = initial * Math.pow(1 + r, n);
  const futureValueMonthly = monthly * ((Math.pow(1 + r, n) - 1) / r);
  const totalFutureValue = Math.round(futureValueInitial + futureValueMonthly);

  const totalInvested = initial + (monthly * 12 * years);
  const totalInterestEarned = totalFutureValue - totalInvested;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CalcIcon color="#a855f7" size={20} /> Investment Wealth Projection Calculator
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="form-label">Initial Amount ($)</label>
          <input type="number" className="form-control" value={initial} onChange={(e) => setInitial(Number(e.target.value))} />
        </div>
        <div>
          <label className="form-label">Monthly Addition ($)</label>
          <input type="number" className="form-control" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
        </div>
        <div>
          <label className="form-label">Expected Return (% per year)</label>
          <input type="number" className="form-control" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
        <div>
          <label className="form-label">Investment Horizon (Years)</label>
          <input type="number" className="form-control" value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(168, 85, 247, 0.1)',
        border: '1px solid rgba(168, 85, 247, 0.2)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projected Future Value</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7' }}>
            ${totalFutureValue.toLocaleString()}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Capital Invested</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            ${totalInvested.toLocaleString()}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Compound Interest Profit</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
            +${totalInterestEarned.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
