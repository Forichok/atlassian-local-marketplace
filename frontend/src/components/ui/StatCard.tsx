import React from 'react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
}) => {
  return (
    <div className="stat-card">
      <h3>
        {icon && <span style={{ marginRight: 'var(--space-xs)' }}>{icon}</span>}
        {title}
      </h3>
      <div className="value">{value}</div>
      {subtitle && (
        <div style={{
          marginTop: 'var(--space-md)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
