import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: '180px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          paddingRight: '40px',
          border: '1.5px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          background: 'white',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderColor: isOpen ? 'var(--color-primary)' : 'rgba(0, 0, 0, 0.12)',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(0, 82, 204, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
          }
        }}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{
            position: 'absolute',
            right: '14px',
            transition: 'transform var(--transition-base)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          <path fill="currentColor" d="M6 9L1 4h10z" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '280px',
            overflowY: 'auto'
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  background: isSelected ? 'rgba(0, 82, 204, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: index === 0 ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
                  animation: `optionFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.02}s backwards`
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(0, 82, 204, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      d="M13.5 4.5L6 12L2.5 8.5"
                      stroke="var(--color-primary)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes optionFadeIn {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
