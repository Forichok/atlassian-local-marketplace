import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const AuroraBackground: React.FC = () => {
  const { theme } = useTheme();

  const background = theme === 'dark'
    ? 'radial-gradient(ellipse at top, #0a0e27 0%, #050810 100%)'
    : 'radial-gradient(ellipse at top, #ffffff 0%, #f0f4ff 50%, #e6f0ff 100%)';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden',
      background,
      pointerEvents: 'none',
      transition: 'background 0.3s ease'
    }}>
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
          50% { transform: translate(-40%, -60%) scale(1.2); opacity: 0.25; }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.12; }
          50% { transform: translate(-60%, -40%) scale(1.1); opacity: 0.22; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: '20%',
        left: '30%',
        width: '600px',
        height: '600px',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(0, 82, 204, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(0, 82, 204, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'aurora1 25s ease-in-out infinite',
        willChange: 'transform'
      }} />

      <div style={{
        position: 'absolute',
        top: '60%',
        left: '70%',
        width: '500px',
        height: '500px',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(0, 101, 255, 0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(0, 101, 255, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'aurora2 30s ease-in-out infinite',
        willChange: 'transform'
      }} />
    </div>
  );
};
