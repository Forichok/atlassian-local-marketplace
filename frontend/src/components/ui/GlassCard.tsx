import React, { CSSProperties } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  style?: CSSProperties;
  hoverable?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      className={`card ${hoverable ? 'plugin-card' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
};
