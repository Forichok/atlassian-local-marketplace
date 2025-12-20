import React from 'react';

interface LoadingProps {
  text?: string;
  variant?: 'spinner' | 'pulse' | 'dots';
}

export const Loading: React.FC<LoadingProps> = ({ text = 'Loading...', variant = 'spinner' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      gap: '24px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          @keyframes spinMulti {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}
      </style>

      {variant === 'spinner' && (
        <div style={{
          width: '80px',
          height: '80px',
          position: 'relative'
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid rgba(0, 82, 204, 0.1)',
          }} />
          {/* Spinning gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#0052cc',
            borderRightColor: '#0065ff',
            animation: 'spinMulti 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
            filter: 'drop-shadow(0 0 8px rgba(0, 82, 204, 0.3))'
          }} />
          {/* Inner dot */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '12px',
            height: '12px',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0052cc, #0065ff)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </div>
      )}

      {variant === 'pulse' && (
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0052cc, #0065ff)',
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                boxShadow: '0 0 10px rgba(0, 82, 204, 0.4)'
              }}
            />
          ))}
        </div>
      )}

      {variant === 'dots' && (
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          height: '48px'
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${
                  i % 2 === 0 ? '#0052cc' : '#00875a'
                }, ${i % 2 === 0 ? '#0065ff' : '#36b37e'})`,
                animation: `bounce 1s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                boxShadow: `0 0 8px ${i % 2 === 0 ? 'rgba(0, 82, 204, 0.4)' : 'rgba(0, 135, 90, 0.4)'}`
              }}
            />
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <p style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          margin: 0,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {text}
        </p>
        <div style={{
          width: '40px',
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #0052cc, transparent)',
          borderRadius: '2px',
          animation: 'shimmer 2s ease-in-out infinite'
        }}>
          <style>
            {`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};
