import React, { useEffect, useState, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, FileText, HardDrive, Boxes, BookOpen, Search } from 'lucide-react';
import { pluginsApi, ProductType } from '../api/client';
import { Plugin } from '../types';
import { PluginCardSkeleton } from '../components/PluginCardSkeleton';
import { EmptyState } from '../components/EmptyState';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ProductSelector } from '../components/ProductSelector';
import { CustomSelect } from '../components/CustomSelect';

const PluginCard = memo(({ plugin, ProductIcon, productName, jiraVersion, onClick }: {
  plugin: Plugin;
  ProductIcon: typeof Boxes | typeof BookOpen;
  productName: string;
  jiraVersion?: number;
  onClick: () => void;
}) => {
  return (
  <div className="plugin-card" onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
      <h3 style={{ margin: 0, flex: 1 }}>{plugin.name}</h3>
      <div style={{ marginLeft: 'var(--space-sm)' }}>
        <ProductIcon size={20} />
      </div>
    </div>
    {plugin.vendor && <div className="vendor">by {plugin.vendor}</div>}
    {plugin.summary && <div className="summary">{plugin.summary}</div>}
    {plugin.supportedProductVersions && plugin.supportedProductVersions.length > 0 && (
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, alignSelf: 'center' }}>
          {productName}:
        </span>
        {plugin.supportedProductVersions.map(version => (
          <span
            key={version}
            style={{
              background: version === jiraVersion ? 'linear-gradient(135deg, #0052cc, #0065ff)' : 'rgba(0, 82, 204, 0.12)',
              color: version === jiraVersion ? 'white' : '#0052cc',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              border: version === jiraVersion ? '1px solid rgba(0, 82, 204, 0.3)' : '1px solid rgba(0, 82, 204, 0.2)',
              boxShadow: version === jiraVersion ? '0 2px 8px rgba(0, 82, 204, 0.3)' : 'none'
            }}
          >
            {version}
          </span>
        ))}
      </div>
    )}
    <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontWeight: 600, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ background: 'rgba(0, 82, 204, 0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Package size={14} /> <AnimatedNumber value={plugin._count?.versions || 0} decimals={0} /> versions
      </span>
      {plugin._count?.files && (
        <span style={{ background: 'rgba(0, 135, 90, 0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={14} /> <AnimatedNumber value={plugin._count.files} decimals={0} /> files
        </span>
      )}
      {plugin.totalSize && plugin.totalSize > 0 && (
        <span style={{ background: 'rgba(0, 101, 255, 0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <HardDrive size={14} /> <AnimatedNumber value={plugin.totalSize / 1024 / 1024} decimals={2} formatter={(v) => `${v.toFixed(2)} MB`} />
        </span>
      )}
    </div>
  </div>
  );
});

PluginCard.displayName = 'PluginCard';

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

  const ProductIcon = selectedProduct === 'JIRA' ? Boxes : BookOpen;
  const productName = selectedProduct === 'JIRA' ? 'Jira' : 'Confluence';

  const versionOptions = selectedProduct === 'JIRA'
    ? [
        { value: '', label: 'All versions' },
        { value: '8', label: 'Jira 8' },
        { value: '9', label: 'Jira 9' },
        { value: '10', label: 'Jira 10' },
        { value: '11', label: 'Jira 11' },
      ]
    : [
        { value: '', label: 'All versions' },
        { value: '7.19', label: 'Confluence 7.19' },
        { value: '8.5', label: 'Confluence 8.5' },
        { value: '9.2', label: 'Confluence 9.2' },
        { value: '10.2', label: 'Confluence 10.2' },
      ];

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

      <form onSubmit={handleSearch} className="search-bar">
        <Search size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        <input
          type="text"
          className="input"
          placeholder={`Search ${productName} plugins by name, key, or vendor...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'transparent', border: 'none' }}
        />
        <CustomSelect
          options={versionOptions}
          value={jiraVersion?.toString() ?? ''}
          onChange={(value) => {
            const parsedValue = value ? parseFloat(value) : undefined;
            setJiraVersion(parsedValue);
            setPage(1);
          }}
        />
      </form>

      {loading ? (
        <PluginCardSkeleton count={6} />
      ) : plugins.length === 0 ? (
        <EmptyState
          title="No plugins found"
          description={`Try adjusting your search criteria or ${productName} version filter to find what you're looking for.`}
          icon={<ProductIcon size={48} />}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                ProductIcon={ProductIcon}
                productName={productName}
                jiraVersion={jiraVersion}
                onClick={() => navigate(`/plugins/${plugin.addonKey}?productType=${selectedProduct}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)', borderRadius: '12px', padding: '20px' }}>
              <button className="button secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                ← Previous
              </button>
              <span style={{ background: 'rgba(0, 82, 204, 0.08)', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, border: '1px solid rgba(0, 82, 204, 0.15)' }}>
                Page <AnimatedNumber value={page} decimals={0} /> of {totalPages}
              </span>
              <button className="button secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
