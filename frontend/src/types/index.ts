export interface Plugin {
  id: string;
  addonKey: string;
  appId?: string;
  name: string;
  vendor?: string;
  summary?: string;
  marketplaceUrl?: string;
  totalSize?: number;
  supportedJiraVersions?: number[];
  createdAt: string;
  updatedAt: string;
  versions?: PluginVersion[];
  _count?: {
    versions: number;
    files: number;
  };
}

export interface PluginVersion {
  id: string;
  pluginId: string;
  version: string;
  releaseDate?: string;
  jiraMin?: string;
  jiraMax?: string;
  dataCenterCompatible: boolean;
  releaseNotes?: string;
  changelogUrl?: string;
  changelog?: string;
  hidden: boolean;
  deprecated: boolean;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
  files?: PluginFile[];
}

export interface PluginFile {
  id: string;
  pluginId: string;
  versionId?: string;
  version: string;
  filePath?: string;
  checksum?: string;
  size?: number;
  downloadStatus: 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  downloadUrl?: string;
  errorMessage?: string;
  downloadAttempts: number;
  lastAttemptAt?: string;
  downloadedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJobStatus {
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'COMPLETED';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  currentOffset: number;
  lastError?: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  progress?: SyncJobProgress[];
  logs?: SyncJobLog[];
}

export interface SyncJobProgress {
  id: string;
  phase: string;
  currentItem?: string;
  message?: string;
  itemsProcessed: number;
  itemsTotal: number;
  createdAt: string;
}

export interface SyncJobLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  metadata?: string;
  createdAt: string;
}

export interface SyncStatus {
  metadata: SyncJobStatus | null;
  downloadLatest: SyncJobStatus | null;
  downloadAll: SyncJobStatus | null;
}

export interface PluginStats {
  totalPlugins: number;
  totalVersions: number;
  totalFiles: number;
  downloadedFiles: number;
  totalSize: number;
}
