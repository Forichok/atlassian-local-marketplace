import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div className="card" style={{
      textAlign: 'center',
      padding: '80px 40px',
      background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.02), rgba(0, 101, 255, 0.05))',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>
        {`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 82, 204, 0.05) 0%, transparent 70%)',
        animation: 'rotate 20s linear infinite',
        pointerEvents: 'none'
      }} />

      {icon && (
        <div style={{
          fontSize: '80px',
          marginBottom: '32px',
          display: 'inline-block',
          position: 'relative',
          animation: 'float 3s ease-in-out infinite',
          filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))'
        }}>
          {icon}
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            inset: '-20px',
            background: 'radial-gradient(circle, rgba(0, 82, 204, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            zIndex: -1,
            animation: 'pulse 2s ease-in-out infinite'
          }} />
        </div>
      )}

      <h3 style={{
        fontSize: '28px',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #172b4d, #0052cc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '16px',
        letterSpacing: '-0.5px'
      }}>
        {title}
      </h3>

      {description && (
        <p style={{
          fontSize: '16px',
          color: 'var(--color-text-secondary)',
          maxWidth: '500px',
          margin: '0 auto 32px',
          lineHeight: 1.8,
          fontWeight: 500
        }}>
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="button"
          style={{
            marginTop: '16px',
            boxShadow: '0 4px 12px rgba(0, 82, 204, 0.2)',
            transform: 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 82, 204, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 82, 204, 0.2)';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
