import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '99, 102, 241', subtitle }) => {
  return (
    <div className="glass-panel" style={{
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '16px',
        background: `rgba(${color}, 0.15)`,
        border: `1px solid rgba(${color}, 0.3)`,
        color: `rgb(${color})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 8px 24px rgba(${color}, 0.2)`
      }}>
        {Icon && <Icon size={26} />}
      </div>

      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.15rem' }}>
          {value}
        </div>
        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'block' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
