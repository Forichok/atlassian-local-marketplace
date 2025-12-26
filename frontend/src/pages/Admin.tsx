import React, { useEffect, useState } from 'react';
import { Boxes, BookOpen, Package, FileText, HardDrive, Download, PackageOpen, Pause, Play, RotateCw, AlertTriangle, X, ScrollText, Inbox } from 'lucide-react';
import { syncApi, pluginsApi, ProductType } from '../api/client';
import { SyncStatus, PluginStats } from '../types';
import { Loading } from '../components/Loading';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useToast } from '../components/Toast';
import { ProductSelector } from '../components/ProductSelector';
import {
  PageHeader,
  StatCard,
} from '../components/ui';

export const Admin: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('JIRA');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [stats, setStats] = useState<PluginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStatus = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        syncApi.getStatus(selectedProduct),
        pluginsApi.getStats(selectedProduct),
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
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [selectedProduct]);

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

  const ProductIcon = selectedProduct === 'JIRA' ? Boxes : BookOpen;

  return (
    <div className="container">
      <PageHeader
        title="Sync Administration"
        description="Monitor and control plugin synchronization processes"
        action={
          <ProductSelector
            selected={selectedProduct}
            onChange={setSelectedProduct}
          />
        }
      />

      {stats && (
        <div className="stats-grid">
          <StatCard
            icon={<ProductIcon size={24} />}
            title="Total Plugins"
            value={
              <AnimatedNumber
                value={stats.totalPlugins}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            }
          />
          <StatCard
            icon={<Package size={24} />}
            title="Total Versions"
            value={
              <AnimatedNumber
                value={stats.totalVersions}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            }
          />
          <StatCard
            icon={<FileText size={24} />}
            title="Downloaded Files"
            value={
              <AnimatedNumber
                value={stats.downloadedFiles}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            }
            subtitle={
              stats.totalFiles > 0 && (
                <span style={{ color: 'var(--color-success)' }}>
                  <AnimatedNumber
                    value={Math.round((stats.downloadedFiles / stats.totalFiles) * 100)}
                    formatter={(v) => `${Math.round(v)}% complete`}
                  />
                </span>
              )
            }
          />
          <StatCard
            icon={<HardDrive size={24} />}
            title="Total Storage"
            value={
              <AnimatedNumber
                value={stats.totalSize / 1024 / 1024 / 1024}
                decimals={2}
                formatter={(v) => `${v.toFixed(2)} GB`}
              />
            }
          />
        </div>
      )}

      <div className="card stage-card">
        <div className="stage-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={24} /> Stage 1: Metadata Ingestion
          </h2>
          {syncStatus?.metadata && (
            <span className={`status-badge ${syncStatus.metadata.status.toLowerCase()}`}>
              {syncStatus.metadata.status}
            </span>
          )}
        </div>

        {syncStatus?.metadata && (
          <>
            <div className="progress-info">
              <div>
                <div className="progress-label">Progress</div>
                <div className="progress-value">
                  {syncStatus.metadata.processedItems.toLocaleString()} / {syncStatus.metadata.totalItems.toLocaleString()}
                </div>
              </div>
              {syncStatus.metadata.failedItems > 0 && (
                <div className="failed-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> {syncStatus.metadata.failedItems} failed
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
              <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={18} /> Error: {syncStatus.metadata.lastError}
              </div>
            )}
          </>
        )}

        <div className="stage-actions">
          {syncStatus?.metadata?.status === 'RUNNING' ? (
            <button className="button secondary" onClick={() => handleAction(() => syncApi.pauseMetadata(selectedProduct), 'Pause metadata sync')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Pause size={16} /> Pause
            </button>
          ) : syncStatus?.metadata?.status === 'PAUSED' ? (
            <>
              <button className="button" onClick={() => handleAction(() => syncApi.resumeMetadata(selectedProduct), 'Resume metadata sync')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={16} /> Resume
              </button>
              <button className="button secondary" onClick={() => handleAction(() => syncApi.restartMetadata(selectedProduct), 'Restart metadata sync')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCw size={16} /> Restart
              </button>
            </>
          ) : (
            <>
              <button className="button" onClick={() => handleAction(() => syncApi.startMetadata(selectedProduct), 'Start metadata sync')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={16} /> Start
              </button>
              {syncStatus?.metadata && (
                <button className="button secondary" onClick={() => handleAction(() => syncApi.restartMetadata(selectedProduct), 'Restart metadata sync')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCw size={16} /> Restart
                </button>
              )}
            </>
          )}
        </div>

        {syncStatus?.metadata?.progress && syncStatus.metadata.progress.length > 0 && (
          <div className="recent-activity">
            <h3 className="activity-title">Recent Activity</h3>
            <div className="activity-list">
              {syncStatus.metadata.progress.slice(0, 5).map((p) => (
                <div key={p.id} className="activity-item">
                  <span className="activity-phase">[{p.phase}]</span> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card stage-card">
        <div className="stage-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={24} /> Stage 2: Download Latest Versions
          </h2>
          {syncStatus?.downloadLatest && (
            <span className={`status-badge ${syncStatus.downloadLatest.status.toLowerCase()}`}>
              {syncStatus.downloadLatest.status}
            </span>
          )}
        </div>

        {syncStatus?.downloadLatest && (
          <>
            <div className="progress-info">
              <div>
                <div className="progress-label">Progress</div>
                <div className="progress-value">
                  {syncStatus.downloadLatest.processedItems.toLocaleString()} / {syncStatus.downloadLatest.totalItems.toLocaleString()}
                </div>
              </div>
              {syncStatus.downloadLatest.failedItems > 0 && (
                <div className="failed-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> {syncStatus.downloadLatest.failedItems} failed
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
              <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={18} /> Error: {syncStatus.downloadLatest.lastError}
              </div>
            )}
          </>
        )}

        <div className="stage-actions">
          {syncStatus?.downloadLatest?.status === 'RUNNING' ? (
            <button className="button secondary" onClick={() => handleAction(() => syncApi.pauseDownloadLatest(selectedProduct), 'Pause latest downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Pause size={16} /> Pause
            </button>
          ) : syncStatus?.downloadLatest?.status === 'PAUSED' ? (
            <>
              <button className="button" onClick={() => handleAction(() => syncApi.resumeDownloadLatest(selectedProduct), 'Resume latest downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={16} /> Resume
              </button>
              <button className="button secondary" onClick={() => handleAction(() => syncApi.restartDownloadLatest(selectedProduct), 'Restart latest downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCw size={16} /> Restart
              </button>
            </>
          ) : (
            <>
              <button className="button" onClick={() => handleAction(() => syncApi.startDownloadLatest(selectedProduct), 'Start latest downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={16} /> Start
              </button>
              {syncStatus?.downloadLatest && (
                <button className="button secondary" onClick={() => handleAction(() => syncApi.restartDownloadLatest(selectedProduct), 'Restart latest downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCw size={16} /> Restart
                </button>
              )}
            </>
          )}
        </div>

        {syncStatus?.downloadLatest?.progress && syncStatus.downloadLatest.progress.length > 0 && (
          <div className="recent-activity">
            <h3 className="activity-title">Recent Activity</h3>
            <div className="activity-list">
              {syncStatus.downloadLatest.progress.slice(0, 5).map((p) => (
                <div key={p.id} className="activity-item">
                  <span className="activity-phase">[{p.phase}]</span> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card stage-card">
        <div className="stage-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageOpen size={24} /> Stage 3: Download All Versions
          </h2>
          {syncStatus?.downloadAll && (
            <span className={`status-badge ${syncStatus.downloadAll.status.toLowerCase()}`}>
              {syncStatus.downloadAll.status}
            </span>
          )}
        </div>

        {syncStatus?.downloadAll && (
          <>
            <div className="progress-info">
              <div>
                <div className="progress-label">Progress</div>
                <div className="progress-value">
                  {syncStatus.downloadAll.processedItems.toLocaleString()} / {syncStatus.downloadAll.totalItems.toLocaleString()}
                </div>
              </div>
              {syncStatus.downloadAll.failedItems > 0 && (
                <div className="failed-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> {syncStatus.downloadAll.failedItems} failed
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
              <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={18} /> Error: {syncStatus.downloadAll.lastError}
              </div>
            )}
          </>
        )}

        <div className="stage-actions">
          {syncStatus?.downloadAll?.status === 'RUNNING' ? (
            <button className="button secondary" onClick={() => handleAction(() => syncApi.pauseDownloadAll(selectedProduct), 'Pause all downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Pause size={16} /> Pause
            </button>
          ) : syncStatus?.downloadAll?.status === 'PAUSED' ? (
            <>
              <button className="button" onClick={() => handleAction(() => syncApi.resumeDownloadAll(selectedProduct), 'Resume all downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={16} /> Resume
              </button>
              <button className="button secondary" onClick={() => handleAction(() => syncApi.restartDownloadAll(selectedProduct), 'Restart all downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCw size={16} /> Restart
              </button>
            </>
          ) : (
            <>
              <button className="button" onClick={() => handleAction(() => syncApi.startDownloadAll(selectedProduct), 'Start all downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={16} /> Start
              </button>
              {syncStatus?.downloadAll && (
                <button className="button secondary" onClick={() => handleAction(() => syncApi.restartDownloadAll(selectedProduct), 'Restart all downloads')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCw size={16} /> Restart
                </button>
              )}
            </>
          )}
        </div>

        {syncStatus?.downloadAll?.progress && syncStatus.downloadAll.progress.length > 0 && (
          <div className="recent-activity">
            <h3 className="activity-title">Recent Activity</h3>
            <div className="activity-list">
              {syncStatus.downloadAll.progress.slice(0, 5).map((p) => (
                <div key={p.id} className="activity-item">
                  <span className="activity-phase">[{p.phase}]</span> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {syncStatus?.metadata?.logs && syncStatus.metadata.logs.length > 0 && (
        <div className="card">
          <h2 className="logs-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScrollText size={24} /> Recent Logs
          </h2>
          <div className="logs-container">
            {syncStatus.metadata.logs.slice(0, 20).map((log) => (
              <div key={log.id} className={`log-entry ${log.level.toLowerCase()}`}>
                <strong className="log-level">{log.level}</strong>: {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
