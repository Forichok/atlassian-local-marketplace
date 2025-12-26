import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pluginsApi, ProductType } from '../api/client';
import { Plugin } from '../types';
import { PluginCardSkeleton } from '../components/PluginCardSkeleton';
import { EmptyState } from '../components/EmptyState';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ProductSelector } from '../components/ProductSelector';

export const Plugins: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedProduct, setSelectedProduct] = useState<ProductType>(
    (searchParams.get('productType') as ProductType) || 'JIRA'
  );
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [jiraVersion, setJiraVersion] = useState<number | undefined>(
    searchParams.get('jiraVersion') ? parseInt(searchParams.get('jiraVersion')!, 10) : undefined
  );
  const [page, setPage] = useState(
    searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1
  );
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await pluginsApi.getPlugins({
        search: search || undefined,
        jiraVersion,
        productType: selectedProduct,
        page,
        limit: 20,
      });
      setPlugins(response.data.plugins);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params: Record<string, string> = {};

    if (search) {
      params.search = search;
    }
    if (jiraVersion !== undefined) {
      params.jiraVersion = jiraVersion.toString();
    }
    if (selectedProduct) {
      params.productType = selectedProduct;
    }
    if (page > 1) {
      params.page = page.toString();
    }

    setSearchParams(params, { replace: true });
  }, [search, jiraVersion, selectedProduct, page, setSearchParams]);

  useEffect(() => {
    fetchPlugins();
  }, [search, jiraVersion, selectedProduct, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPlugins();
  };

  const productIcon = selectedProduct === 'JIRA' ? '🔷' : '📘';
  const productName = selectedProduct === 'JIRA' ? 'Jira' : 'Confluence';

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-xl)'
      }}>
        <div>
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
            Plugin Marketplace
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--color-text-secondary)',
            fontWeight: 500
          }}>
            Browse and manage {productName} Data Center plugins
          </p>
        </div>
        <ProductSelector
          selected={selectedProduct}
          onChange={(product) => {
            setSelectedProduct(product);
            setPage(1);
          }}
        />
      </div>

      <form onSubmit={handleSearch} className="search-bar" style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
        borderRadius: '16px',
        padding: '8px'
      }}>
        <input
          type="text"
          className="input"
          placeholder={`🔍 Search ${productName} plugins by name, key, or vendor...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none'
          }}
        />
        <select
          className="select"
          value={jiraVersion ?? ''}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined;
            setJiraVersion(value);
            setPage(1);
          }}
          style={{
            background: 'rgba(0, 82, 204, 0.05)',
            border: '1px solid rgba(0, 82, 204, 0.1)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <option value="">All versions</option>
          {selectedProduct === 'JIRA' ? (
            <>
              <option value={8}>Jira 8</option>
              <option value={9}>Jira 9</option>
              <option value={10}>Jira 10</option>
              <option value={11}>Jira 11</option>
            </>
          ) : (
            <>
              <option value={7.19}>Confluence 7.19</option>
              <option value={8.5}>Confluence 8.5</option>
              <option value={9.2}>Confluence 9.2</option>
              <option value={10.2}>Confluence 10.2</option>
            </>
          )}
        </select>
      </form>

      {loading ? (
        <PluginCardSkeleton count={6} />
      ) : plugins.length === 0 ? (
        <EmptyState
          title="No plugins found"
          description={`Try adjusting your search criteria or ${productName} version filter to find what you're looking for.`}
          icon={productIcon}
        />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gap: 'var(--space-md)'
          }}>
            {plugins.map((plugin, index) => (
              <div
                key={plugin.id}
                className="plugin-card"
                onClick={() => navigate(`/plugins/${plugin.addonKey}?productType=${selectedProduct}`)}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 82, 204, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(0, 82, 204, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(0, 82, 204, 0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }} />

                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  transition: 'left 0.5s',
                  pointerEvents: 'none'
                }} className="shine-effect" />

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-sm)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{plugin.name}</h3>
                  <span style={{
                    fontSize: '20px',
                    marginLeft: 'var(--space-sm)'
                  }}>
                    {productIcon}
                  </span>
                </div>

                {plugin.vendor && <div className="vendor" style={{ position: 'relative', zIndex: 1 }}>by {plugin.vendor}</div>}
                {plugin.summary && <div className="summary" style={{ position: 'relative', zIndex: 1 }}>{plugin.summary}</div>}

                {plugin.supportedProductVersions && plugin.supportedProductVersions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '8px',
                    marginBottom: '8px',
                    position: 'relative',
                    zIndex: 1,
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 600,
                      alignSelf: 'center'
                    }}>
                      {productName}:
                    </span>
                    {plugin.supportedProductVersions.map(version => (
                      <span
                        key={version}
                        style={{
                          background: version === jiraVersion
                            ? 'linear-gradient(135deg, #0052cc, #0065ff)'
                            : 'rgba(0, 82, 204, 0.12)',
                          color: version === jiraVersion ? 'white' : '#0052cc',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: version === jiraVersion
                            ? '1px solid rgba(0, 82, 204, 0.3)'
                            : '1px solid rgba(0, 82, 204, 0.2)',
                          boxShadow: version === jiraVersion
                            ? '0 2px 8px rgba(0, 82, 204, 0.3)'
                            : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {version}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{
                  fontSize: '13px',
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 600,
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <span style={{
                    background: 'rgba(0, 82, 204, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    📦 <AnimatedNumber value={plugin._count?.versions || 0} decimals={0} /> versions
                  </span>
                  {plugin._count?.files && (
                    <span style={{
                      background: 'rgba(0, 135, 90, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📄 <AnimatedNumber value={plugin._count.files} decimals={0} /> files
                    </span>
                  )}
                  {plugin.totalSize && plugin.totalSize > 0 && (
                    <span style={{
                      background: 'rgba(0, 101, 255, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      💾 <AnimatedNumber
                        value={plugin.totalSize / 1024 / 1024}
                        decimals={2}
                        formatter={(v) => `${v.toFixed(2)} MB`}
                      />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <button
                className="button secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  background: page === 1 ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 82, 204, 0.08)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(0, 82, 204, 0.15)'
                }}
              >
                ← Previous
              </button>
              <span style={{
                background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.1), rgba(0, 101, 255, 0.15))',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 600,
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(0, 82, 204, 0.2)'
              }}>
                Page <AnimatedNumber value={page} decimals={0} /> of {totalPages}
              </span>
              <button
                className="button secondary"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  background: page === totalPages ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 82, 204, 0.08)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(0, 82, 204, 0.15)'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
