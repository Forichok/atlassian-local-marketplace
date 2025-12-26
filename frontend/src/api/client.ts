import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type ProductType = 'JIRA' | 'CONFLUENCE';

export const syncApi = {
  getStatus: (productType: ProductType = 'JIRA') =>
    api.get('/api/sync/status', { params: { productType } }),

  startMetadata: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/metadata/start', { productType }),
  pauseMetadata: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/metadata/pause', { productType }),
  resumeMetadata: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/metadata/resume', { productType }),
  restartMetadata: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/metadata/restart', { productType }),

  startDownloadLatest: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-latest/start', { productType }),
  pauseDownloadLatest: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-latest/pause', { productType }),
  resumeDownloadLatest: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-latest/resume', { productType }),
  restartDownloadLatest: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-latest/restart', { productType }),

  startDownloadAll: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-all/start', { productType }),
  pauseDownloadAll: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-all/pause', { productType }),
  resumeDownloadAll: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-all/resume', { productType }),
  restartDownloadAll: (productType: ProductType = 'JIRA') =>
    api.post('/api/sync/download-all/restart', { productType }),
};

export const pluginsApi = {
  getPlugins: (params?: {
    search?: string;
    jiraVersion?: number;
    productType?: ProductType;
    page?: number;
    limit?: number;
  }) => api.get('/api/plugins', { params }),

  getPlugin: (addonKey: string, productType: ProductType = 'JIRA') =>
    api.get(`/api/plugins/${addonKey}`, { params: { productType } }),

  getVersions: (addonKey: string, jiraVersion?: number, productType: ProductType = 'JIRA') =>
    api.get(`/api/plugins/${addonKey}/versions`, {
      params: { jiraVersion, productType },
    }),

  downloadVersion: (addonKey: string, version: string, productType: ProductType = 'JIRA') =>
    api.get(`/api/plugins/${addonKey}/download/${version}`, {
      responseType: 'blob',
      params: { productType },
    }),

  resyncPlugin: (addonKey: string, productType: ProductType = 'JIRA') =>
    api.post(`/api/plugins/${addonKey}/resync`, { productType }),

  forceDownloadVersion: (addonKey: string, version: string, productType: ProductType = 'JIRA') =>
    api.post(`/api/plugins/${addonKey}/force-download/${version}`, { productType }),

  getStats: (productType: ProductType = 'JIRA') =>
    api.get('/api/plugins/stats/summary', { params: { productType } }),
};
