import React from 'react';

export const AuroraBackground: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f5f6f7 0%, #e9ecef 100%)',
      pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes aurora1 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.3;
          }
          33% {
            transform: translate(-30%, -60%) scale(1.3) rotate(120deg);
            opacity: 0.5;
          }
          66% {
            transform: translate(-70%, -40%) scale(0.8) rotate(240deg);
            opacity: 0.4;
          }
        }

        @keyframes aurora2 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.25;
          }
          33% {
            transform: translate(-40%, -30%) scale(1.2) rotate(-120deg);
            opacity: 0.45;
          }
          66% {
            transform: translate(-60%, -70%) scale(0.9) rotate(-240deg);
            opacity: 0.35;
          }
        }

        @keyframes aurora3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.2;
          }
          33% {
            transform: translate(-55%, -45%) scale(1.1) rotate(90deg);
            opacity: 0.4;
          }
          66% {
            transform: translate(-45%, -55%) scale(1.15) rotate(180deg);
            opacity: 0.3;
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(-50%) translateY(0) scaleY(1);
          }
          50% {
            transform: translateX(-50%) translateY(-20px) scaleY(1.1);
          }
        }
      `}</style>

      {/* Aurora Orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '30%',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(0, 82, 204, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'aurora1 20s ease-in-out infinite',
        mixBlendMode: 'multiply'
      }} />

      <div style={{
        position: 'absolute',
        top: '60%',
        left: '70%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 101, 255, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        animation: 'aurora2 25s ease-in-out infinite',
        mixBlendMode: 'multiply'
      }} />

      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(0, 135, 90, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        animation: 'aurora3 30s ease-in-out infinite',
        mixBlendMode: 'multiply'
      }} />

      {/* Animated Wave Bottom */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200%',
          height: '300px',
          opacity: 0.15,
          animation: 'wave 8s ease-in-out infinite'
        }}
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0052cc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0065ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 C150,150 350,0 600,100 C850,200 1050,50 1200,100 L1200,300 L0,300 Z"
          fill="url(#wave-gradient)"
        />
      </svg>

      {/* Grid Overlay for Tech Feel */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(0, 82, 204, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 82, 204, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.4
      }} />
    </div>
  );
};
