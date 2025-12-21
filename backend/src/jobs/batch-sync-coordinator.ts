import { SyncStage, LogLevel } from '@prisma/client';
import { JobManager } from '../services/job-manager';
import { MarketplaceClient } from '../services/marketplace-client';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { Stage2DownloadLatest } from './stage2-download-latest';
import { Stage3DownloadAll } from './stage3-download-all';

export class BatchSyncCoordinator {
  private jobManager: JobManager;
  private marketplaceClient: MarketplaceClient;
  private stage2: Stage2DownloadLatest;
  private stage3: Stage3DownloadAll;
  private currentBatch: number = 0;

  constructor() {
    this.jobManager = new JobManager();
    this.marketplaceClient = new MarketplaceClient();
    this.stage2 = new Stage2DownloadLatest();
    this.stage3 = new Stage3DownloadAll();
  }

  async start(): Promise<void> {
    const jobId = await this.jobManager.getOrCreateJob(SyncStage.METADATA_INGESTION);
    const job = await this.jobManager.getJob(jobId);

    if (!job) {
      throw new Error('Failed to create job');
    }

    if (job.status === 'RUNNING') {
      throw new Error('Job is already running');
    }

    // Get current batch from job or start from 0
    this.currentBatch = job.currentBatch || 0;

    await this.jobManager.startJob(jobId);
    await this.run(jobId);
  }

  async continueNextBatch(): Promise<void> {
    const jobId = await this.jobManager.getOrCreateJob(SyncStage.METADATA_INGESTION);
    const job = await this.jobManager.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    this.currentBatch = job.currentBatch || 0;

    await this.jobManager.log(
      jobId,
      LogLevel.INFO,
      `Manually continuing to next batch (${this.currentBatch + 1})`
    );

    await this.jobManager.startJob(jobId);
    await this.run(jobId);
  }

  private async run(jobId: string): Promise<void> {
    try {
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `🚀 Starting Batch #${this.currentBatch + 1} - Metadata Sync`
      );

      // Stage 1: Fetch metadata for next chunk of plugins
      const plugins = await this.fetchPluginBatch(jobId);

      if (plugins.length === 0) {
        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          '🎉 All plugins have been synchronized! No more batches to process.'
        );
        await this.jobManager.completeJob(jobId);
        return;
      }

      // Stage 2: Download latest versions for this batch
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `⬇️  Batch #${this.currentBatch + 1}: Starting Stage 2 - Downloading latest versions for ${plugins.length} plugins`
      );
      await this.stage2.processBatch(this.currentBatch);

      // Stage 3: Download all versions for this batch
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `📦 Batch #${this.currentBatch + 1}: Starting Stage 3 - Downloading all versions for ${plugins.length} plugins`
      );
      await this.stage3.processBatch(this.currentBatch);

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `✅ Batch #${this.currentBatch + 1} completed successfully! Processed ${plugins.length} plugins.`
      );

      // Update current batch
      this.currentBatch++;
      await prisma.syncJob.update({
        where: { id: jobId },
        data: { currentBatch: this.currentBatch },
      });

      // Check if we should continue to next batch
      if (config.job.autoContinue) {
        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `⏭️  Auto-continue enabled: Starting Batch #${this.currentBatch + 1} in 5 seconds...`
        );

        setTimeout(async () => {
          await this.run(jobId);
        }, 5000);
      } else {
        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `⏸️  Batch #${this.currentBatch} completed. Manual mode - call /sync/continue to process the next batch.`
        );
        await this.jobManager.completeJob(jobId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.failJob(jobId, errorMessage);
      throw error;
    }
  }

  private async fetchPluginBatch(jobId: string): Promise<any[]> {
    const limit = config.job.chunkSize;
    const offset = this.currentBatch * limit;

    try {
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `📥 Batch #${this.currentBatch + 1}: Fetching ${limit} plugins from marketplace (starting at plugin #${offset + 1})`,
        { offset, limit, batch: this.currentBatch }
      );

      const response = await this.marketplaceClient.fetchAddons(limit, offset);
      const addons = response._embedded?.addons || [];

      if (addons.length === 0) {
        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `✅ Batch #${this.currentBatch + 1}: No more plugins found - all plugins have been synced!`
        );
        return [];
      }

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `📦 Batch #${this.currentBatch + 1}: Retrieved ${addons.length} plugins from marketplace, processing...`
      );

      const processedPlugins = [];
      let processedCount = 0;

      for (const addon of addons) {
        processedCount++;

        if (await this.jobManager.shouldStop(jobId)) {
          await this.jobManager.log(jobId, LogLevel.INFO, '⏹️  Job stopped by user');
          return processedPlugins;
        }

        try {
          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `🔄 Batch #${this.currentBatch + 1}: Processing plugin ${processedCount}/${addons.length} - ${addon.name || addon.key}`,
            { addonKey: addon.key, progress: `${processedCount}/${addons.length}` }
          );

          const plugin = await this.processAddon(jobId, addon);
          if (plugin) {
            processedPlugins.push(plugin);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.jobManager.log(
            jobId,
            LogLevel.ERROR,
            `❌ Batch #${this.currentBatch + 1}: Failed to process ${addon.key}: ${errorMessage}`,
            { addonKey: addon.key, error: errorMessage }
          );
        }
      }

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `✅ Batch #${this.currentBatch + 1}: Successfully processed ${processedPlugins.length}/${addons.length} plugins`
      );

      return processedPlugins;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.log(
        jobId,
        LogLevel.ERROR,
        `❌ Batch #${this.currentBatch + 1}: Failed to fetch plugins: ${errorMessage}`,
        { batch: this.currentBatch, error: errorMessage }
      );
      throw error;
    }
  }

  private async processAddon(jobId: string, addon: any): Promise<any> {
    const alternateLink = typeof addon._links?.alternate === 'string'
      ? addon._links.alternate
      : addon._links?.alternate?.href;

    const appId = alternateLink?.match(/\/apps\/(\d+)\//)?.[1];

    const marketplaceUrl = alternateLink
      ? `https://marketplace.atlassian.com${alternateLink}?hosting=datacenter`
      : undefined;

    const plugin = await prisma.plugin.upsert({
      where: { addonKey: addon.key },
      create: {
        addonKey: addon.key,
        appId: appId,
        name: addon.name,
        vendor: addon.vendor?.name,
        summary: addon.summary,
        marketplaceUrl: marketplaceUrl,
        batchNumber: this.currentBatch,
      },
      update: {
        name: addon.name,
        vendor: addon.vendor?.name,
        summary: addon.summary,
        marketplaceUrl: marketplaceUrl,
        batchNumber: this.currentBatch,
      },
    });

    // Fetch and process versions
    try {
      const versions = await this.marketplaceClient.fetchAddonVersions(addon.key);

      for (const version of versions) {
        // Extract buildNumber from _links.self.href (e.g., "/versions/build/1009990")
        const selfLink = typeof version._links?.self === 'string'
          ? version._links.self
          : (version._links?.self as any)?.href;

        const buildNumber = selfLink?.match(/\/build\/(\d+)$/)?.[1];

        if (buildNumber) {
          const fullVersion = await this.marketplaceClient.fetchVersionDetails(addon.key, parseInt(buildNumber));
          if (fullVersion) {
            await this.processVersion(jobId, plugin.id, fullVersion);
          } else {
            // Fallback to basic version if details fetch fails
            await this.processVersion(jobId, plugin.id, version);
          }
        } else {
          await this.processVersion(jobId, plugin.id, version);
        }
      }
    } catch (error) {
      await this.jobManager.log(
        jobId,
        LogLevel.WARN,
        `Failed to fetch versions for ${addon.key}: ${error instanceof Error ? error.message : String(error)}`
      );
    }


    return plugin;
  }

  private async processVersion(jobId: string, pluginId: string, version: any): Promise<void> {
    if (!version.deployment?.dataCenter) {
      return;
    }

    const downloadUrl = version._embedded?.artifact?._links?.binary?.href;

    // Extract Jira compatibility from compatibilities array
    let jiraMin: string | undefined = undefined;
    let jiraMax: string | undefined = undefined;

    if (version.compatibilities && Array.isArray(version.compatibilities)) {
      for (const compat of version.compatibilities) {
        if (compat.application === 'jira' && compat.hosting?.dataCenter) {
          jiraMin = compat.hosting.dataCenter.min?.version;
          jiraMax = compat.hosting.dataCenter.max?.version;
          break;
        }
      }
    }

    // Extract changelog information
    const changelogUrl = version._links?.changelog?.href;
    let changelog: string | undefined = undefined;

    // If changelog is embedded in the version response
    if (version.changelog) {
      changelog = typeof version.changelog === 'string'
        ? version.changelog
        : version.changelog.content || version.changelog.text;
    }

    await prisma.pluginVersion.upsert({
      where: {
        pluginId_version: {
          pluginId,
          version: version.name,
        },
      },
      create: {
        pluginId,
        version: version.name,
        releaseDate: version.release?.date ? new Date(version.release.date) : undefined,
        jiraMin,
        jiraMax,
        dataCenterCompatible: true,
        downloadUrl: downloadUrl,
        changelogUrl,
        changelog,
        hidden: version.status === 'hidden',
        deprecated: version.status === 'deprecated',
      },
      update: {
        releaseDate: version.release?.date ? new Date(version.release.date) : undefined,
        jiraMin,
        jiraMax,
        downloadUrl: downloadUrl,
        changelogUrl,
        changelog,
        hidden: version.status === 'hidden',
        deprecated: version.status === 'deprecated',
      },
    });
  }
}
