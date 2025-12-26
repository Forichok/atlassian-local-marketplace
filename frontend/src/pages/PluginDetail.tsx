import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { pluginsApi, ProductType } from '../api/client';
import { Plugin, PluginVersion } from '../types';
import { VersionModal } from '../components/VersionModal';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { NeonButton } from '../components/NeonButton';
import { CustomSelect } from '../components/CustomSelect';

export const PluginDetail: React.FC = () => {
  const { addonKey } = useParams<{ addonKey: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [productVersion, setProductVersion] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [resyncing, setResyncing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PluginVersion | null>(null);
  const [visibleVersionsCount, setVisibleVersionsCount] = useState(5);

  const productType = (searchParams.get('productType') === 'CONFLUENCE' ? 'CONFLUENCE' : 'JIRA') as ProductType;
  const productName = productType === 'CONFLUENCE' ? 'Confluence' : 'Jira';

  useEffect(() => {
    const fetchPlugin = async () => {
      if (!addonKey) return;

      try {
        setLoading(true);
        const response = await pluginsApi.getPlugin(addonKey, productType);
        setPlugin(response.data);
      } catch (error) {
        console.error('Error fetching plugin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlugin();
  }, [addonKey, productType]);

  const handleDownload = async (version: string) => {
    if (!addonKey) return;

    try {
      const response = await pluginsApi.downloadVersion(addonKey, version, productType);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${addonKey}-${version}.jar`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Downloading ${addonKey}-${version}.jar`, 'success');
    } catch (error) {
      console.error('Error downloading plugin:', error);
      showToast('Failed to download plugin', 'error');
    }
  };

  const handleResync = async () => {
    if (!addonKey) return;

    try {
      setResyncing(true);
      await pluginsApi.resyncPlugin(addonKey, productType);
      showToast('Plugin resync initiated successfully', 'success');
    } catch (error) {
      console.error('Error resyncing plugin:', error);
      showToast('Failed to initiate plugin resync', 'error');
    } finally {
      setResyncing(false);
    }
  };

  const handleForceDownload = async (version: string) => {
    if (!addonKey) return;

    try {
      await pluginsApi.forceDownloadVersion(addonKey, version, productType);
      showToast(`Download initiated for version ${version}. Page will refresh soon...`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error initiating download:', error);
      showToast('Failed to initiate download', 'error');
    }
  };

  const filteredVersions = plugin?.versions?.filter((v) => {
    if (!v.dataCenterCompatible) return false;
    if (productVersion === undefined) return true;
    if (!v.productVersionMin && !v.productVersionMax) return true;

    const min = v.productVersionMin ? parseInt(v.productVersionMin.split('.')[0]) : 0;
    const max = v.productVersionMax ? parseInt(v.productVersionMax.split('.')[0]) : 999;

    return min <= productVersion && max >= productVersion;
  });

  const visibleVersions = filteredVersions?.slice(0, visibleVersionsCount);
  const hasMoreVersions = filteredVersions && filteredVersions.length > visibleVersionsCount;

  const handleLoadMore = () => {
    setVisibleVersionsCount(prev => prev + 10);
  };

  const supportedProductVersions = React.useMemo(() => {
    if (!plugin?.versions) return [];

    const supportedVersions = new Set<number>();
    const versionsToCheck = productType === 'CONFLUENCE' ? [7, 8, 9] : [8, 9, 10, 11];

    for (const version of plugin.versions) {
      if (!version.dataCenterCompatible) continue;

      if (!version.productVersionMin && !version.productVersionMax) {
        versionsToCheck.forEach(v => supportedVersions.add(v));
      } else {
        const min = version.productVersionMin ? parseInt(version.productVersionMin.split('.')[0]) : 0;
        const max = version.productVersionMax ? parseInt(version.productVersionMax.split('.')[0]) : 999;

        for (const ver of versionsToCheck) {
          if (min <= ver && max >= ver) {
            supportedVersions.add(ver);
          }
        }
      }
    }

    return Array.from(supportedVersions).sort();
  }, [plugin?.versions, productType]);

  const versionFilterOptions = productType === 'CONFLUENCE'
    ? [
        { value: '', label: 'All versions' },
        { value: '7', label: 'Confluence 7' },
        { value: '8', label: 'Confluence 8' },
        { value: '9', label: 'Confluence 9' },
      ]
    : [
        { value: '', label: 'All versions' },
        { value: '8', label: 'Jira 8' },
        { value: '9', label: 'Jira 9' },
        { value: '10', label: 'Jira 10' },
        { value: '11', label: 'Jira 11' },
      ];

  if (loading) {
    return (
      <div className="container">
        <Loading text="Loading plugin details..." variant="pulse" />
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="container">
        <div className="card">
          <p>Plugin not found</p>
          <button className="button" onClick={() => navigate('/plugins')}>
            Back to Plugins
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button className="button secondary" onClick={() => navigate('/plugins')} style={{ marginBottom: '20px' }}>
        ← Back to Plugins
      </button>

      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative orb */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 82, 204, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              marginBottom: '10px',
              background: 'linear-gradient(135deg, #0052cc, #0065ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {plugin.name}
            </h1>
            {plugin.vendor && (
              <p style={{
                background: 'linear-gradient(90deg, rgba(0, 82, 204, 0.7), rgba(0, 101, 255, 0.6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '15px',
                fontWeight: 600
              }}>
                by {plugin.vendor}
              </p>
            )}
          </div>
          <NeonButton
            onClick={handleResync}
            disabled={resyncing}
            variant="primary"
            size="medium"
          >
            {resyncing ? '⏳ Resyncing...' : '🔄 Force Resync'}
          </NeonButton>
        </div>
        {plugin.summary && (
          <p style={{
            marginBottom: '15px',
            position: 'relative',
            zIndex: 1,
            fontSize: '16px',
            lineHeight: 1.6
          }}>
            {plugin.summary}
          </p>
        )}

        {supportedProductVersions.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '15px',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)'
            }}>
              Supported {productName} Versions:
            </span>
            {supportedProductVersions.map((version: number) => (
              <span
                key={version}
                style={{
                  background: version === productVersion
                    ? 'linear-gradient(135deg, #0052cc, #0065ff)'
                    : 'rgba(0, 82, 204, 0.12)',
                  color: version === productVersion ? 'white' : '#0052cc',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: version === productVersion
                    ? '1px solid rgba(0, 82, 204, 0.3)'
                    : '1px solid rgba(0, 82, 204, 0.2)',
                  boxShadow: version === productVersion
                    ? '0 2px 8px rgba(0, 82, 204, 0.3)'
                    : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {productName} {version}
              </span>
            ))}
          </div>
        )}

        <div style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(0, 82, 204, 0.05)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 82, 204, 0.1)'
        }}>
          <strong>Add-on Key:</strong> <code style={{
            background: 'rgba(0, 82, 204, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>{plugin.addonKey}</code>
        </div>
        {plugin.marketplaceUrl && (
          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            marginTop: '10px',
            position: 'relative',
            zIndex: 1
          }}>
            <strong>Marketplace:</strong>{' '}
            <a
              href={plugin.marketplaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0052cc',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '2px solid rgba(0, 82, 204, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              View on Atlassian Marketplace →
            </a>
          </div>
        )}
      </div>

      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{
            background: 'linear-gradient(135deg, #0052cc, #0065ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📦 Versions
          </h2>
          <div style={{
            background: 'rgba(0, 82, 204, 0.05)',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(0, 82, 204, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Filter by {productName}:</label>
            <CustomSelect
              options={versionFilterOptions}
              value={productVersion?.toString() ?? ''}
              onChange={(value) => {
                const parsedValue = value ? parseInt(value, 10) : undefined;
                setProductVersion(parsedValue);
              }}
            />
          </div>
        </div>

        {!filteredVersions || filteredVersions.length === 0 ? (
          <p>No compatible versions found{productVersion ? ` for ${productName} ${productVersion}` : ''}</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Release Date</th>
                  <th>Size</th>
                  <th>{productName} Compatibility</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleVersions?.map((version) => {
                  const file = version.files?.[0];
                  const canDownload = file?.downloadStatus === 'COMPLETED';
                  const size = file?.size ? Number(file.size) : 0;
                  const sizeInMB = size > 0 ? (size / 1024 / 1024).toFixed(2) : null;

                  return (
                    <tr key={version.id}>
                      <td>
                        <strong
                          style={{
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            textDecoration: 'underline',
                          }}
                          onClick={() => setSelectedVersion(version)}
                        >
                          {version.version}
                        </strong>
                      </td>
                      <td>
                        {version.releaseDate
                          ? new Date(version.releaseDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        {sizeInMB ? (
                          <span style={{
                            background: 'rgba(0, 82, 204, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}>
                            <AnimatedNumber
                              value={parseFloat(sizeInMB)}
                              decimals={2}
                              formatter={(v) => `${v.toFixed(2)} MB`}
                            />
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        {version.productVersionMin || version.productVersionMax
                          ? `${version.productVersionMin || '?'} - ${version.productVersionMax || '?'}`
                          : 'All versions'}
                      </td>
                      <td>
                        {file ? (
                          <span className={`status-badge ${file.downloadStatus.toLowerCase()}`}>
                            {file.downloadStatus}
                          </span>
                        ) : (
                          <span className="status-badge idle">Not Downloaded</span>
                        )}
                      </td>
                      <td>
                        {canDownload ? (
                          <NeonButton
                            onClick={() => handleDownload(version.version)}
                            variant="success"
                            size="small"
                          >
                            ⬇️ Download
                          </NeonButton>
                        ) : file?.downloadStatus === 'FAILED' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                            <span style={{
                              fontSize: '12px',
                              color: '#de350b',
                              fontWeight: 600,
                              background: 'rgba(222, 53, 11, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '6px'
                            }}>
                              {file.errorMessage || 'Download failed'}
                            </span>
                            <NeonButton
                              onClick={() => handleForceDownload(version.version)}
                              variant="warning"
                              size="small"
                            >
                              🔄 Retry
                            </NeonButton>
                          </div>
                        ) : file?.downloadStatus === 'DOWNLOADING' ? (
                          <span style={{
                            fontSize: '13px',
                            color: '#0052cc',
                            fontWeight: 600,
                            background: 'rgba(0, 82, 204, 0.1)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span className="loading-spinner" style={{
                              width: '12px',
                              height: '12px',
                              border: '2px solid rgba(0, 82, 204, 0.2)',
                              borderTopColor: '#0052cc',
                              borderRadius: '50%',
                              display: 'inline-block',
                              animation: 'spin 1s linear infinite'
                            }} />
                            Downloading...
                          </span>
                        ) : (
                          <NeonButton
                            onClick={() => handleForceDownload(version.version)}
                            variant="primary"
                            size="small"
                          >
                            ⬇️ Force Download
                          </NeonButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hasMoreVersions && (
              <div style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <NeonButton
                  onClick={handleLoadMore}
                  variant="primary"
                  size="medium"
                >
                  Load More ({filteredVersions.length - visibleVersionsCount} remaining)
                </NeonButton>
              </div>
            )}
          </>
        )}
      </div>

      {filteredVersions && filteredVersions.length > 0 && filteredVersions[0].releaseNotes && (
        <div className="card">
          <h2>Latest Release Notes</h2>
          <div dangerouslySetInnerHTML={{ __html: filteredVersions[0].releaseNotes }} />
        </div>
      )}

      {selectedVersion && (
        <VersionModal
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
