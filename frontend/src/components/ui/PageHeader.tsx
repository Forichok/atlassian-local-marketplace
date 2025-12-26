import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-2xl)',
      gap: 'var(--space-xl)'
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 42px)',
          fontWeight: 800,
          background: 'var(--gradient-jira)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 'var(--space-sm)',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          {icon && <span style={{ fontSize: '0.9em' }}>{icon}</span>}
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: 'clamp(14px, 2vw, 16px)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
            lineHeight: 1.5,
            margin: 0
          }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
