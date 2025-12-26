import React, { useState, useEffect, useRef } from 'react';
import { PluginVersion } from '../types';

interface VersionModalProps {
  version: PluginVersion;
  onClose: () => void;
  onDownload?: (version: string) => void;
}

type TabType = 'details' | 'changelog' | 'notes';

interface ParsedReleaseNote {
  type: 'highlight' | 'feature' | 'bugfix' | 'security' | 'text';
  content: string;
  icon?: string;
}

export const VersionModal: React.FC<VersionModalProps> = ({ version, onClose, onDownload }) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [animatedSize, setAnimatedSize] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const file = version.files?.[0];
  const size = file?.size ? Number(file.size) : 0;
  const sizeInMB = size > 0 ? (size / 1024 / 1024).toFixed(2) : null;

  // Animated number counter
  useEffect(() => {
    if (!sizeInMB) return;
    const target = parseFloat(sizeInMB);
    const duration = 1000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedSize(target);
        clearInterval(timer);
      } else {
        setAnimatedSize(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [sizeInMB]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (activeTab === 'details' && hasChangelog) setActiveTab('changelog');
        else if (activeTab === 'changelog' && hasReleaseNotes) setActiveTab('notes');
      } else if (e.key === 'ArrowLeft') {
        if (activeTab === 'notes') setActiveTab(hasChangelog ? 'changelog' : 'details');
        else if (activeTab === 'changelog') setActiveTab('details');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, onClose]);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(isNaN(progress) ? 0 : progress);
    };
    contentRef.current?.addEventListener('scroll', handleScroll);
    return () => contentRef.current?.removeEventListener('scroll', handleScroll);
  }, []);

  const copyToClipboard = (text: string, showConfettiEffect = false) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (showConfettiEffect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const getCompatibilityPercentage = () => {
    if (!version.productVersionMin && !version.productVersionMax) return 100;
    const min = version.productVersionMin ? parseInt(version.productVersionMin.split('.')[0]) : 8;
    const max = version.productVersionMax ? parseInt(version.productVersionMax.split('.')[0]) : 11;
    const range = 11 - 8; // Product versions 8 to 11
    const covered = max - min + 1;
    return Math.min(100, (covered / range) * 100);
  };

  const parseReleaseNotes = (html: string): ParsedReleaseNote[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results: ParsedReleaseNote[] = [];

    // Find Highlights section
    const textContent = doc.body.textContent || '';
    if (textContent.includes('Highlights:')) {
      results.push({ type: 'highlight', content: 'Highlights:', icon: '✨' });

      // Parse list items
      const lists = doc.querySelectorAll('ul, ol');
      lists.forEach(list => {
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          const text = item.textContent || '';
          let type: ParsedReleaseNote['type'] = 'text';
          let icon = '•';

          if (text.toLowerCase().includes('security') || text.toLowerCase().includes('vulnerabilit')) {
            type = 'security';
            icon = '🔒';
          } else if (text.toLowerCase().includes('fix') || text.toLowerCase().includes('bug')) {
            type = 'bugfix';
            icon = '🐛';
          } else if (text.toLowerCase().includes('new') || text.toLowerCase().includes('add')) {
            type = 'feature';
            icon = '✨';
          }

          results.push({ type, content: text, icon });
        });
      });
    }

    return results;
  };

  const parseChangelog = (text: string): { type: string; items: string[] }[] => {
    const lines = text.split('\n');
    const sections: { type: string; items: string[] }[] = [];
    let currentSection: { type: string; items: string[] } | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detect section headers
      if (trimmed.match(/^(Added|Fixed|Changed|Removed|Improved|Security|New|Features?):/i)) {
        if (currentSection) sections.push(currentSection);
        const type = trimmed.replace(':', '');
        currentSection = { type, items: [] };
      } else if (currentSection && (trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        currentSection.items.push(trimmed.substring(1).trim());
      } else if (currentSection) {
        currentSection.items.push(trimmed);
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const getSectionIcon = (type: string): string => {
    const lower = type.toLowerCase();
    if (lower.includes('add') || lower.includes('new') || lower.includes('feature')) return '✨';
    if (lower.includes('fix') || lower.includes('bug')) return '🐛';
    if (lower.includes('secur')) return '🔒';
    if (lower.includes('improv')) return '⚡';
    if (lower.includes('chang')) return '🔄';
    if (lower.includes('remov')) return '🗑️';
    return '📝';
  };

  const hasChangelog = !!(version.changelog || version.changelogUrl);
  const hasReleaseNotes = !!version.releaseNotes;
  const parsedNotes = hasReleaseNotes ? parseReleaseNotes(version.releaseNotes || '') : [];
  const parsedChangelog = version.changelog ? parseChangelog(version.changelog) : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 10000
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: '10px',
                height: '10px',
                background: ['#0052cc', '#00875a', '#ff991f', '#de350b'][Math.floor(Math.random() * 4)],
                animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
                opacity: Math.random(),
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        .ripple-container {
          position: relative;
          overflow: hidden;
        }
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .version-modal-tab {
          position: relative;
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
        }
        .version-modal-tab:hover {
          color: var(--color-primary);
          background: var(--color-bg-tertiary);
        }
        .version-modal-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }
        .version-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .version-info-card {
          background: linear-gradient(135deg, rgba(0, 82, 204, 0.05) 0%, rgba(0, 101, 255, 0.08) 100%);
          border: 1px solid rgba(0, 82, 204, 0.15);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .version-info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s;
        }
        .version-info-card:hover::before {
          left: 100%;
        }
        .version-info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 82, 204, 0.15);
          border-color: rgba(0, 82, 204, 0.3);
        }
        .version-info-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }
        .version-info-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text-primary);
          word-break: break-all;
        }
        .compatibility-bar {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          height: 8px;
          overflow: hidden;
          margin-top: 8px;
          position: relative;
        }
        .compatibility-fill {
          height: 100%;
          background: linear-gradient(90deg, #00875a, #36b37e, #57d9a3);
          border-radius: 20px;
          transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1);
          position: relative;
          overflow: hidden;
        }
        .compatibility-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }
        .copy-button {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 10px;
          background: rgba(0, 82, 204, 0.1);
          border: 1px solid rgba(0, 82, 204, 0.2);
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-primary);
          transition: all 0.2s;
        }
        .copy-button:hover {
          background: var(--color-primary);
          color: white;
          transform: scale(1.05);
        }
        .content-section {
          background: var(--color-bg-secondary);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--border-color);
        }
        .highlight-box {
          background: linear-gradient(135deg, rgba(0, 168, 112, 0.08), rgba(87, 217, 163, 0.12));
          border-left: 4px solid #00875a;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }
        .highlight-box h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-success);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .highlight-item {
          font-size: 14px;
          color: var(--color-text-primary);
          line-height: 1.6;
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        .highlight-item::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--color-success);
          font-weight: bold;
        }
        .deprecated-banner {
          background: linear-gradient(135deg, rgba(222, 53, 11, 0.1), rgba(255, 86, 48, 0.15));
          border-left: 4px solid #de350b;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>

      <div
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2xl)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scroll Progress Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #00875a, #36b37e)',
          width: `${scrollProgress}%`,
          transition: 'width 0.1s ease-out',
          zIndex: 1001,
          boxShadow: '0 0 10px rgba(0, 168, 112, 0.5)'
        }} />

        {/* Header with Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0052cc 0%, #0065ff 100%)',
            padding: '28px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: 0.1,
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
          }} />

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1.2px'
              }}>
                Version Details
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '36px',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {version.version}
                {copied && (
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'rgba(0, 168, 112, 0.95)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    ✓ Copied!
                  </span>
                )}
              </h2>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(window.location.href + '#v' + version.version, true);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  🔗 Share Link
                </button>
                {onDownload && file?.downloadStatus === 'COMPLETED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(version.version);
                    }}
                    style={{
                      background: 'rgba(0, 168, 112, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 168, 112, 1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 168, 112, 0.9)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    📥 Download
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                title="Close (ESC)"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '0',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 300,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
          padding: '0 24px',
          background: 'var(--color-bg-secondary)',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`version-modal-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
              title="Details"
            >
              📊 Details
            </button>
            {hasChangelog && (
              <button
                className={`version-modal-tab ${activeTab === 'changelog' ? 'active' : ''}`}
                onClick={() => setActiveTab('changelog')}
                title="Changelog"
              >
                📝 Changelog
              </button>
            )}
            {hasReleaseNotes && (
              <button
                className={`version-modal-tab ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
                title="Release Notes"
              >
                📋 Release Notes
              </button>
            )}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            padding: '8px 12px',
            display: 'flex',
            gap: '12px'
          }}>
            <span>⌨️ ESC to close</span>
            <span>← → to navigate</span>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          style={{
            padding: '28px 32px',
            overflow: 'auto',
            flex: 1
          }}
        >
          {version.deprecated && (
            <div className="deprecated-banner">
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '4px' }}>
                  Deprecated Version
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  This version is no longer recommended for use
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <>
              <div className="version-info-grid">
                {version.releaseDate && (
                  <div className="version-info-card">
                    <div className="version-info-label">
                      📅 Release Date
                    </div>
                    <div className="version-info-value">
                      {new Date(version.releaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {sizeInMB && (
                  <div className="version-info-card">
                    <div className="version-info-label">
                      💾 File Size
                    </div>
                    <div className="version-info-value" style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontFeatureSettings: '"tnum"'
                    }}>
                      {animatedSize.toFixed(2)} MB
                    </div>
                  </div>
                )}

                {file && (
                  <div className="version-info-card">
                    <div className="version-info-label">
                      📦 Status
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`status-badge ${file.downloadStatus.toLowerCase()}`}>
                        {file.downloadStatus}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {(version.productVersionMin || version.productVersionMax) && (
                <div className="version-info-card" style={{ marginBottom: '24px', gridColumn: '1 / -1' }}>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(`${version.productVersionMin || '?'} - ${version.productVersionMax || '?'}`)}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <div className="version-info-label">
                    🔧 Product Compatibility
                  </div>
                  <div className="version-info-value" style={{ marginBottom: '4px' }}>
                    {version.productVersionMin || '8.0.0'} - {version.productVersionMax || '9.17.5'}
                  </div>
                  <div className="compatibility-bar">
                    <div
                      className="compatibility-fill"
                      style={{ width: `${getCompatibilityPercentage()}%` }}
                    />
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '6px',
                    fontWeight: 600
                  }}>
                    {getCompatibilityPercentage().toFixed(0)}% Version Coverage
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'changelog' && (
            <div className="content-section">
              {version.changelog ? (
                parsedChangelog.length > 0 ? (
                  <div>
                    {parsedChangelog.map((section, idx) => (
                      <div key={idx} style={{ marginBottom: '24px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.08), rgba(0, 101, 255, 0.12))',
                          borderRadius: '8px',
                          borderLeft: '4px solid var(--color-primary)'
                        }}>
                          <span style={{ fontSize: '20px' }}>{getSectionIcon(section.type)}</span>
                          <h3 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--color-primary)'
                          }}>
                            {section.type}
                          </h3>
                        </div>
                        <ul style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0
                        }}>
                          {section.items.map((item, itemIdx) => (
                            <li key={itemIdx} style={{
                              padding: '10px 16px 10px 40px',
                              position: 'relative',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              color: 'var(--color-text-primary)',
                              borderBottom: itemIdx < section.items.length - 1 ? '1px solid var(--border-color)' : 'none'
                            }}>
                              <span style={{
                                position: 'absolute',
                                left: '16px',
                                color: 'var(--color-primary)',
                                fontWeight: 'bold'
                              }}>
                                •
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {version.changelog}
                  </div>
                )
              ) : version.changelogUrl ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                    View the full changelog on Atlassian Marketplace
                  </div>
                  <a
                    href={version.changelogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button"
                  >
                    Open Changelog
                  </a>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'notes' && version.releaseNotes && (
            <div className="content-section">
              {parsedNotes.length > 0 ? (
                <div>
                  {parsedNotes.map((note, idx) => {
                    if (note.type === 'highlight' && note.content === 'Highlights:') {
                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, rgba(0, 168, 112, 0.08), rgba(87, 217, 163, 0.12))',
                          borderRadius: '8px',
                          borderLeft: '4px solid var(--color-success)'
                        }}>
                          <span style={{ fontSize: '24px' }}>{note.icon}</span>
                          <h3 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--color-success)'
                          }}>
                            {note.content}
                          </h3>
                        </div>
                      );
                    }

                    const bgColor = note.type === 'security' ? 'rgba(222, 53, 11, 0.05)' :
                                   note.type === 'bugfix' ? 'rgba(255, 171, 0, 0.05)' :
                                   note.type === 'feature' ? 'rgba(0, 82, 204, 0.05)' :
                                   'transparent';

                    return (
                      <div key={idx} style={{
                        padding: '12px 16px 12px 44px',
                        position: 'relative',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        color: 'var(--color-text-primary)',
                        marginBottom: '8px',
                        background: bgColor,
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: '16px',
                          fontSize: '18px'
                        }}>
                          {note.icon}
                        </span>
                        {note.content}
                      </div>
                    );
                  })}

                  {/* Original HTML below parsed highlights */}
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid var(--border-color)' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.8',
                        color: 'var(--color-text-primary)',
                      }}
                      dangerouslySetInnerHTML={{ __html: version.releaseNotes }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: 'var(--color-text-primary)',
                  }}
                  dangerouslySetInnerHTML={{ __html: version.releaseNotes }}
                />
              )}
            </div>
          )}

          {activeTab === 'details' && !hasChangelog && !hasReleaseNotes && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
              No additional information available for this version
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 32px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-bg-secondary)'
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {version.releaseDate && (
              <>Released {new Date(version.releaseDate).toLocaleDateString()}</>
            )}
          </div>
          <button
            className="button secondary"
            onClick={onClose}
            style={{ marginRight: 0 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
