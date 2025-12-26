import React, { CSSProperties } from 'react';

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  style?: CSSProperties;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  children,
  variant = 'info',
  style,
}) => {
  const colors = {
    info: {
      bg: 'rgba(0, 82, 204, 0.05)',
      border: 'var(--color-primary)',
      text: 'var(--color-text-primary)',
    },
    success: {
      bg: 'rgba(0, 135, 90, 0.05)',
      border: 'var(--color-success)',
      text: 'var(--color-text-primary)',
    },
    warning: {
      bg: 'rgba(255, 171, 0, 0.05)',
      border: 'var(--color-warning)',
      text: 'var(--color-text-primary)',
    },
    error: {
      bg: 'rgba(222, 53, 11, 0.05)',
      border: 'var(--color-danger)',
      text: 'var(--color-danger)',
    },
  };

  const colorScheme = colors[variant];

  return (
    <div style={{
      padding: 'var(--space-md)',
      background: colorScheme.bg,
      borderRadius: 'var(--radius-md)',
      borderLeft: `3px solid ${colorScheme.border}`,
      color: colorScheme.text,
      fontSize: '14px',
      fontWeight: 500,
      ...style
    }}>
      {children}
    </div>
  );
};
