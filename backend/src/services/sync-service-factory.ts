import { ProductType } from '@prisma/client';
import { Stage1MetadataIngestion } from '../jobs/stage1-metadata';
import { Stage2DownloadLatest } from '../jobs/stage2-download-latest';
import { Stage3DownloadAll } from '../jobs/stage3-download-all';
import { BatchSyncCoordinator } from '../jobs/batch-sync-coordinator';
import { JobManager } from './job-manager';
import { MarketplaceClient } from './marketplace-client';

/**
 * Factory for creating sync services with specific product type
 * This allows reusing existing job classes for both Jira and Confluence
 */
export class SyncServiceFactory {
  private productType: ProductType;

  constructor(productType: ProductType) {
    this.productType = productType;
  }

  createJobManager(): JobManager {
    return new JobManager();
  }

  createMarketplaceClient(): MarketplaceClient {
    return new MarketplaceClient(this.productType);
  }

  createStage1Service(): Stage1MetadataIngestion {
    return new Stage1MetadataIngestion(this.productType);
  }

  createStage2Service(): Stage2DownloadLatest {
    return new Stage2DownloadLatest(this.productType);
  }

  createStage3Service(): Stage3DownloadAll {
    return new Stage3DownloadAll(this.productType);
  }

  createBatchCoordinator(): BatchSyncCoordinator {
    return new BatchSyncCoordinator(this.productType);
  }

  getProductType(): ProductType {
    return this.productType;
  }
}
