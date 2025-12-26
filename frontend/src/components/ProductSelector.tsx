import React from 'react';

export type ProductType = 'JIRA' | 'CONFLUENCE';

interface ProductSelectorProps {
  selected: ProductType;
  onChange: (product: ProductType) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ selected, onChange }) => {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '12px',
      padding: '4px',
      gap: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)'
    }}>
      <button
        onClick={() => onChange('JIRA')}
        style={{
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          background: selected === 'JIRA'
            ? 'linear-gradient(135deg, #0052cc 0%, #0065ff 100%)'
            : 'transparent',
          color: selected === 'JIRA' ? 'white' : 'var(--color-text-primary)',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: selected === 'JIRA'
            ? '0 2px 8px rgba(0, 82, 204, 0.3)'
            : 'none',
          transform: selected === 'JIRA' ? 'translateY(-1px)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (selected !== 'JIRA') {
            e.currentTarget.style.background = 'rgba(0, 82, 204, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (selected !== 'JIRA') {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span style={{ fontSize: '16px' }}>🔷</span>
        <span>Jira</span>
      </button>
      <button
        onClick={() => onChange('CONFLUENCE')}
        style={{
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          background: selected === 'CONFLUENCE'
            ? 'linear-gradient(135deg, #0052cc 0%, #0065ff 100%)'
            : 'transparent',
          color: selected === 'CONFLUENCE' ? 'white' : 'var(--color-text-primary)',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: selected === 'CONFLUENCE'
            ? '0 2px 8px rgba(0, 82, 204, 0.3)'
            : 'none',
          transform: selected === 'CONFLUENCE' ? 'translateY(-1px)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (selected !== 'CONFLUENCE') {
            e.currentTarget.style.background = 'rgba(0, 82, 204, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (selected !== 'CONFLUENCE') {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span style={{ fontSize: '16px' }}>📘</span>
        <span>Confluence</span>
      </button>
    </div>
  );
};
