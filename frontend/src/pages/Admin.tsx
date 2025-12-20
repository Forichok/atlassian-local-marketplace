import React, { useEffect, useState } from 'react';
import { syncApi, pluginsApi } from '../api/client';
import { SyncStatus, PluginStats } from '../types';
import { Loading } from '../components/Loading';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useToast } from '../components/Toast';

export const Admin: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [stats, setStats] = useState<PluginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStatus = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        syncApi.getStatus(),
        pluginsApi.getStats(),
      ]);
      setSyncStatus(statusRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching status:', error);
      showToast('Failed to fetch status. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: () => Promise<any>, actionName: string) => {
    try {
      await action();
      showToast(`${actionName} successful!`, 'success');
      setTimeout(fetchStatus, 500);
    } catch (error) {
      console.error('Error performing action:', error);
      showToast(`Failed to ${actionName.toLowerCase()}. Please try again.`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <Loading text="Loading sync status..." />
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{
        marginBottom: 'var(--space-2xl)'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: 800,
          background: 'var(--gradient-jira)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          letterSpacing: '-1px'
        }}>
          Sync Administration
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--color-text-secondary)',
          fontWeight: 500
        }}>
          Monitor and control plugin synchronization processes
        </p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>🔌 Total Plugins</h3>
            <div className="value">
              <AnimatedNumber
                value={stats.totalPlugins}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            </div>
          </div>
          <div className="stat-card">
            <h3>📦 Total Versions</h3>
            <div className="value">
              <AnimatedNumber
                value={stats.totalVersions}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            </div>
          </div>
          <div className="stat-card">
            <h3>📄 Downloaded Files</h3>
            <div className="value">
              <AnimatedNumber
                value={stats.downloadedFiles}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            </div>
            {stats.totalFiles > 0 && (
              <div style={{
                marginTop: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-success)'
              }}>
                <AnimatedNumber
                  value={Math.round((stats.downloadedFiles / stats.totalFiles) * 100)}
                  formatter={(v) => `${Math.round(v)}% complete`}
                />
              </div>
            )}
          </div>
          <div className="stat-card">
            <h3>💾 Total Storage</h3>
            <div className="value">
              <AnimatedNumber
                value={stats.totalSize / 1024 / 1024 / 1024}
                decimals={2}
                formatter={(v) => `${v.toFixed(2)} GB`}
              />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0 }}>📥 Stage 1: Metadata Ingestion</h2>
          {syncStatus?.metadata && (
            <span className={`status-badge ${syncStatus.metadata.status.toLowerCase()}`}>
              {syncStatus.metadata.status}
            </span>
          )}
        </div>

        {syncStatus?.metadata && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'rgba(0, 82, 204, 0.05)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Progress
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {syncStatus.metadata.processedItems.toLocaleString()} / {syncStatus.metadata.totalItems.toLocaleString()}
                </div>
              </div>
              {syncStatus.metadata.failedItems > 0 && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(222, 53, 11, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-danger)'
                }}>
                  ⚠️ {syncStatus.metadata.failedItems} failed
                </div>
              )}
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: syncStatus.metadata.totalItems
                    ? `${(syncStatus.metadata.processedItems / syncStatus.metadata.totalItems) * 100}%`
                    : '0%',
                }}
              />
            </div>

            {syncStatus.metadata.lastError && (
              <div style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'rgba(222, 53, 11, 0.05)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-danger)',
                color: 'var(--color-danger)',
                fontSize: '14px',
                fontWeight: 500
              }}>
                ❌ Error: {syncStatus.metadata.lastError}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)' }}>
          {syncStatus?.metadata?.status === 'RUNNING' ? (
            <button className="button secondary" onClick={() => handleAction(syncApi.pauseMetadata, 'Pause metadata sync')}>
              ⏸ Pause
            </button>
          ) : syncStatus?.metadata?.status === 'PAUSED' ? (
            <button className="button" onClick={() => handleAction(syncApi.resumeMetadata, 'Resume metadata sync')}>
              ▶️ Resume
            </button>
          ) : (
            <button className="button" onClick={() => handleAction(syncApi.startMetadata, 'Start metadata sync')}>
              ▶️ Start
            </button>
          )}
        </div>

        {syncStatus?.metadata?.progress && syncStatus.metadata.progress.length > 0 && (
          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {syncStatus.metadata.progress.slice(0, 5).map((p) => (
                <div key={p.id} style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>[{p.phase}]</span> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0 }}>⬇️ Stage 2: Download Latest Versions</h2>
          {syncStatus?.downloadLatest && (
            <span className={`status-badge ${syncStatus.downloadLatest.status.toLowerCase()}`}>
              {syncStatus.downloadLatest.status}
            </span>
          )}
        </div>

        {syncStatus?.downloadLatest && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'rgba(0, 82, 204, 0.05)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Progress
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {syncStatus.downloadLatest.processedItems.toLocaleString()} / {syncStatus.downloadLatest.totalItems.toLocaleString()}
                </div>
              </div>
              {syncStatus.downloadLatest.failedItems > 0 && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(222, 53, 11, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-danger)'
                }}>
                  ⚠️ {syncStatus.downloadLatest.failedItems} failed
                </div>
              )}
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: syncStatus.downloadLatest.totalItems
                    ? `${(syncStatus.downloadLatest.processedItems / syncStatus.downloadLatest.totalItems) * 100}%`
                    : '0%',
                }}
              />
            </div>

            {syncStatus.downloadLatest.lastError && (
              <div style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'rgba(222, 53, 11, 0.05)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-danger)',
                color: 'var(--color-danger)',
                fontSize: '14px',
                fontWeight: 500
              }}>
                ❌ Error: {syncStatus.downloadLatest.lastError}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)' }}>
          {syncStatus?.downloadLatest?.status === 'RUNNING' ? (
            <button className="button secondary" onClick={() => handleAction(syncApi.pauseDownloadLatest, 'Pause latest downloads')}>
              ⏸ Pause
            </button>
          ) : syncStatus?.downloadLatest?.status === 'PAUSED' ? (
            <button className="button" onClick={() => handleAction(syncApi.resumeDownloadLatest, 'Resume latest downloads')}>
              ▶️ Resume
            </button>
          ) : (
            <button className="button" onClick={() => handleAction(syncApi.startDownloadLatest, 'Start latest downloads')}>
              ▶️ Start
            </button>
          )}
        </div>

        {syncStatus?.downloadLatest?.progress && syncStatus.downloadLatest.progress.length > 0 && (
          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {syncStatus.downloadLatest.progress.slice(0, 5).map((p) => (
                <div key={p.id} style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>[{p.phase}]</span> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0 }}>📦 Stage 3: Download All Versions</h2>
          {syncStatus?.downloadAll && (
            <span className={`status-badge ${syncStatus.downloadAll.status.toLowerCase()}`}>
              {syncStatus.downloadAll.status}
            </span>
          )}
        </div>

        {syncStatus?.downloadAll && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'rgba(0, 82, 204, 0.05)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Progress
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {syncStatus.downloadAll.processedItems.toLocaleString()} / {syncStatus.downloadAll.totalItems.toLocaleString()}
                </div>
              </div>
              {syncStatus.downloadAll.failedItems > 0 && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(222, 53, 11, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-danger)'
                }}>
                  ⚠️ {syncStatus.downloadAll.failedItems} failed
                </div>
              )}
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: syncStatus.downloadAll.totalItems
                    ? `${(syncStatus.downloadAll.processedItems / syncStatus.downloadAll.totalItems) * 100}%`
                    : '0%',
                }}
              />
            </div>

            {syncStatus.downloadAll.lastError && (
              <div style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'rgba(222, 53, 11, 0.05)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-danger)',
                color: 'var(--color-danger)',
                fontSize: '14px',
                fontWeight: 500
              }}>
                ❌ Error: {syncStatus.downloadAll.lastError}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)' }}>
          {syncStatus?.downloadAll?.status === 'RUNNING' ? (
            <button className="button secondary" onClick={() => handleAction(syncApi.pauseDownloadAll, 'Pause all downloads')}>
              ⏸ Pause
            </button>
          ) : syncStatus?.downloadAll?.status === 'PAUSED' ? (
            <button className="button" onClick={() => handleAction(syncApi.resumeDownloadAll, 'Resume all downloads')}>
              ▶️ Resume
            </button>
          ) : (
            <button className="button" onClick={() => handleAction(syncApi.startDownloadAll, 'Start all downloads')}>
              ▶️ Start
            </button>
          )}
        </div>

        {syncStatus?.downloadAll?.progress && syncStatus.downloadAll.progress.length > 0 && (
          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {syncStatus.downloadAll.progress.slice(0, 5).map((p) => (
                <div key={p.id} style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>[{p.phase}]</span> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {syncStatus?.metadata?.logs && syncStatus.metadata.logs.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            📋 Recent Logs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {syncStatus.metadata.logs.slice(0, 20).map((log) => (
              <div key={log.id} className={`log-entry ${log.level.toLowerCase()}`}>
                <strong style={{ textTransform: 'uppercase' }}>{log.level}</strong>: {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
