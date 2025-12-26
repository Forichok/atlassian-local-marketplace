import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const sizeStyles = size === 'small'
    ? { padding: '6px 12px', fontSize: '12px' }
    : { padding: '8px 16px', fontSize: '13px' };

  return (
    <span
      className={`status-badge ${status.toLowerCase()}`}
      style={sizeStyles}
    >
      {status}
    </span>
  );
};
