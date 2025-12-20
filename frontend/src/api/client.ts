import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const syncApi = {
  getStatus: () => api.get('/api/sync/status'),

  startMetadata: () => api.post('/api/sync/metadata/start'),
  pauseMetadata: () => api.post('/api/sync/metadata/pause'),
  resumeMetadata: () => api.post('/api/sync/metadata/resume'),

  startDownloadLatest: () => api.post('/api/sync/download-latest/start'),
  pauseDownloadLatest: () => api.post('/api/sync/download-latest/pause'),
  resumeDownloadLatest: () => api.post('/api/sync/download-latest/resume'),

  startDownloadAll: () => api.post('/api/sync/download-all/start'),
  pauseDownloadAll: () => api.post('/api/sync/download-all/pause'),
  resumeDownloadAll: () => api.post('/api/sync/download-all/resume'),
};

export const pluginsApi = {
  getPlugins: (params?: {
    search?: string;
    jiraVersion?: number;
    page?: number;
    limit?: number;
  }) => api.get('/api/plugins', { params }),

  getPlugin: (addonKey: string) => api.get(`/api/plugins/${addonKey}`),

  getVersions: (addonKey: string, jiraVersion?: number) =>
    api.get(`/api/plugins/${addonKey}/versions`, {
      params: jiraVersion ? { jiraVersion } : {},
    }),

  downloadVersion: (addonKey: string, version: string) =>
    api.get(`/api/plugins/${addonKey}/download/${version}`, {
      responseType: 'blob',
    }),

  resyncPlugin: (addonKey: string) =>
    api.post(`/api/plugins/${addonKey}/resync`),

  forceDownloadVersion: (addonKey: string, version: string) =>
    api.post(`/api/plugins/${addonKey}/force-download/${version}`),

  getStats: () => api.get('/api/plugins/stats/summary'),
};
