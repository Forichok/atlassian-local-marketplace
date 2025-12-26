import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-lg)',
      gap: 'var(--space-md)'
    }}>
      <div style={{ flex: 1 }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.01em'
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            margin: 'var(--space-xs) 0 0 0',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            fontWeight: 500
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
