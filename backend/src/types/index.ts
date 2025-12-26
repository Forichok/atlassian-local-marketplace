export interface MarketplaceAddon {
  key: string;
  name: string;
  summary?: string;
  vendor?: {
    name?: string;
  };
  _links?: {
    self?: string;
  };
  _embedded?: {
    versions?: MarketplaceVersion[];
  };
}

export interface MarketplaceVersion {
  name: string;
  buildNumber?: number;
  releaseDate?: string;
  release?: {
    date?: string;
  };
  compatibilities?: Array<{
    application: string;
    minVersion?: string;
    maxVersion?: string;
    hosting?: string[] | {
      dataCenter?: {
        min?: { version?: string; build?: number };
        max?: { version?: string; build?: number };
      };
    };
  }>;
  deployment?: {
    server?: boolean;
    cloud?: boolean;
    dataCenter?: boolean;
    dataCenterStatus?: string;
  };
  status?: string;
  text?: {
    releaseNotes?: string;
    releaseSummary?: string;
    moreDetails?: string;
  };
  _links?: {
    self?: string | { href?: string };
    alternate?: string | { href?: string };
    binary?: string;
    artifact?: string;
  };
  _embedded?: {
    artifact?: {
      _links?: {
        binary?: {
          href?: string;
        };
      };
    };
  };
}

export interface MarketplaceListResponse {
  _embedded?: {
    addons?: MarketplaceAddon[];
  };
  _links?: {
    next?: string;
  };
  limit?: number;
  offset?: number;
  count?: number; // Total number of items available
  size?: number; // Legacy field (might not be present)
}

export interface DownloadTask {
  pluginId: string;
  addonKey: string;
  version: string;
  downloadUrl: string;
}

export interface JobProgress {
  stage: string;
  status: string;
  productType?: string;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  currentOffset: number;
  failedPluginKeys?: string[];
  consecutiveErrors?: number;
  lastError?: string;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
}

export interface PluginWithMetadata {
  id: string;
  addonKey: string;
  productType: string;
  appId?: string;
  name: string;
  vendor?: string;
  summary?: string;
  marketplaceUrl?: string;
  totalSize?: number;
  createdAt: string;
  updatedAt: string;
  supportedProductVersions?: number[];
  _count?: {
    versions: number;
    files: number;
  };
}
