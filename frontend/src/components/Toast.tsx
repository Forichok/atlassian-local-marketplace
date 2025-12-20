import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, rgba(0, 135, 90, 0.95), rgba(54, 179, 126, 0.95))',
          border: '#00875a',
          shadow: 'rgba(0, 135, 90, 0.4)'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, rgba(222, 53, 11, 0.95), rgba(255, 86, 48, 0.95))',
          border: '#de350b',
          shadow: 'rgba(222, 53, 11, 0.4)'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, rgba(255, 171, 0, 0.95), rgba(255, 153, 31, 0.95))',
          border: '#ff991f',
          shadow: 'rgba(255, 171, 0, 0.4)'
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, rgba(0, 82, 204, 0.95), rgba(0, 101, 255, 0.95))',
          border: '#0052cc',
          shadow: 'rgba(0, 82, 204, 0.4)'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        <style>{`
          @keyframes slideInRight {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
          @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>

        {toasts.map((toast) => {
          const colors = getColors(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                background: colors.bg,
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: `0 8px 24px ${colors.shadow}`,
                border: `1px solid ${colors.border}`,
                minWidth: '320px',
                maxWidth: '480px',
                animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => removeToast(toast.id)}
            >
              {/* Progress bar */}
              {toast.duration && toast.duration > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  animation: `progress ${toast.duration}ms linear`,
                  borderRadius: '0 0 12px 12px'
                }} />
              )}

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {getIcon(toast.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: 1.5
                  }}>
                    {toast.message}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
