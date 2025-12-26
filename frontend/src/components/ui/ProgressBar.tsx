import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  showLabel = false,
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div style={{
          marginTop: 'var(--space-xs)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textAlign: 'center'
        }}>
          {value.toLocaleString()} / {max.toLocaleString()} ({Math.round(percentage)}%)
        </div>
      )}
    </div>
  );
};
