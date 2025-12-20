import React from 'react';

export const PluginCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>

      <div style={{
        display: 'grid',
        gap: 'var(--space-md)'
      }}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="card"
            style={{
              position: 'relative',
              padding: '24px',
              cursor: 'default',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
            }}
          >
            {/* Shimmer effect overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite',
              pointerEvents: 'none'
            }} />

            {/* Title skeleton */}
            <div style={{
              height: '28px',
              width: `${60 + Math.random() * 30}%`,
              background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.1), rgba(0, 101, 255, 0.15))',
              borderRadius: '8px',
              marginBottom: '12px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />

            {/* Vendor skeleton */}
            <div style={{
              height: '16px',
              width: `${30 + Math.random() * 20}%`,
              background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.08), rgba(0, 101, 255, 0.12))',
              borderRadius: '6px',
              marginBottom: '12px',
              animation: 'pulse 1.5s ease-in-out infinite 0.1s'
            }} />

            {/* Summary skeleton - multiple lines */}
            <div style={{
              height: '14px',
              width: '95%',
              background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.06), rgba(0, 101, 255, 0.1))',
              borderRadius: '4px',
              marginBottom: '8px',
              animation: 'pulse 1.5s ease-in-out infinite 0.2s'
            }} />
            <div style={{
              height: '14px',
              width: `${70 + Math.random() * 20}%`,
              background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.06), rgba(0, 101, 255, 0.1))',
              borderRadius: '4px',
              marginBottom: '16px',
              animation: 'pulse 1.5s ease-in-out infinite 0.3s'
            }} />

            {/* Stats skeleton */}
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{
                height: '12px',
                width: '80px',
                background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.08), rgba(0, 101, 255, 0.12))',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite 0.4s'
              }} />
              <div style={{
                height: '12px',
                width: '60px',
                background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.08), rgba(0, 101, 255, 0.12))',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite 0.5s'
              }} />
              <div style={{
                height: '12px',
                width: '70px',
                background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.08), rgba(0, 101, 255, 0.12))',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite 0.6s'
              }} />
            </div>

            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(0, 82, 204, 0.05) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
          </div>
        ))}
      </div>
    </>
  );
};
