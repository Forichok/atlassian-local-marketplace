import React, { CSSProperties } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  style?: CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button',
  fullWidth = false,
  style,
}) => {
  const sizeStyles = {
    small: {
      padding: '8px 16px',
      fontSize: '13px',
      borderRadius: '10px',
    },
    medium: {
      padding: '12px 24px',
      fontSize: '14px',
      borderRadius: '12px',
    },
    large: {
      padding: '16px 32px',
      fontSize: '16px',
      borderRadius: '14px',
    },
  };

  const className = variant === 'primary' ? 'button' : `button ${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...sizeStyles[size],
        width: fullWidth ? '100%' : 'auto',
        ...style
      }}
    >
      {children}
    </button>
  );
};
