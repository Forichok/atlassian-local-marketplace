import { SyncStage, LogLevel } from '@prisma/client';
import { JobManager } from '../services/job-manager';
import { MarketplaceClient } from '../services/marketplace-client';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { createLogger } from '../lib/logger';

const logger = createLogger('Stage1MetadataIngestion');

export class Stage1MetadataIngestion {
  private jobManager: JobManager;
  private marketplaceClient: MarketplaceClient;
  private autoStartTimer: NodeJS.Timeout | null = null;

  constructor() {
    logger.info('Initializing Stage1MetadataIngestion');
    this.jobManager = new JobManager();
    this.marketplaceClient = new MarketplaceClient();
  }

  cancelAutoStart(): void {
    if (this.autoStartTimer) {
      clearTimeout(this.autoStartTimer);
      this.autoStartTimer = null;
      logger.info('Auto-start of next stage cancelled');
    }
  }

  async resyncPlugin(addonKey: string): Promise<void> {
    logger.info('Starting plugin resync', { addonKey });

    try {
      // Fetch addon details from Marketplace API
      const addon = await this.marketplaceClient.fetchAddon(addonKey);

      if (!addon) {
        throw new Error(`Plugin ${addonKey} not found in Marketplace`);
      }

      logger.info('Addon fetched for resync', {
        addonKey,
        name: addon.name,
        vendor: addon.vendor?.name,
      });

      // Create a temporary job for logging
      const jobId = await this.jobManager.getOrCreateJob(SyncStage.METADATA_INGESTION);

      // Process the addon (this will update metadata and versions)
      await this.processAddon(jobId, addon);

      logger.info('Plugin resync completed successfully', { addonKey });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to resync plugin', {
        addonKey,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async start(): Promise<void> {
    logger.info('Starting Stage 1: Metadata Ingestion');

    const jobId = await this.jobManager.getOrCreateJob(SyncStage.METADATA_INGESTION);
    const job = await this.jobManager.getJob(jobId);

    if (!job) {
      logger.error('Failed to create job');
      throw new Error('Failed to create job');
    }

    if (job.status === 'RUNNING') {
      logger.warn('Attempted to start already running job', { jobId });
      throw new Error('Job is already running');
    }

    logger.info('Job ready to start', {
      jobId,
      currentStatus: job.status,
      processedItems: job.processedItems,
      totalItems: job.totalItems,
    });

    await this.jobManager.startJob(jobId);
    await this.run(jobId);
  }

  async pause(): Promise<void> {
    logger.info('Pausing Stage 1: Metadata Ingestion');

    const job = await this.jobManager.getJobByStage(SyncStage.METADATA_INGESTION);
    if (job) {
      logger.info('Pausing job', { jobId: job.id, status: job.status });
      await this.jobManager.pauseJob(job.id);
    } else {
      logger.warn('No job found to pause');
    }
  }

  async resume(): Promise<void> {
    logger.info('Resuming Stage 1: Metadata Ingestion');

    const job = await this.jobManager.getJobByStage(SyncStage.METADATA_INGESTION);
    if (!job) {
      logger.error('No job found to resume');
      throw new Error('No job found to resume');
    }

    if (job.status !== 'PAUSED') {
      logger.warn('Attempted to resume non-paused job', {
        jobId: job.id,
        currentStatus: job.status,
      });
      throw new Error('Job is not paused');
    }

    logger.info('Resuming job', {
      jobId: job.id,
      processedItems: job.processedItems,
      totalItems: job.totalItems,
    });

    await this.jobManager.resumeJob(job.id);
    await this.run(job.id);
  }

  private async isPluginAlreadyProcessed(jobId: string, addonKey: string): Promise<boolean> {
    const job = await this.jobManager.getJob(jobId);
    if (!job || !job.startedAt) {
      return false;
    }

    // Never skip plugins that are in the failed list (they need to be retried)
    if (job.failedPluginKeys.includes(addonKey)) {
      return false;
    }

    // Check if plugin exists and was updated after job started
    const plugin = await prisma.plugin.findUnique({
      where: { addonKey },
      select: { updatedAt: true },
    });

    if (!plugin) {
      return false;
    }

    // If plugin was updated after job started, it was already processed in this run
    return plugin.updatedAt > job.startedAt;
  }

  private async checkErrorThreshold(jobId: string): Promise<boolean> {
    const job = await this.jobManager.getJob(jobId);
    if (!job) {
      return false;
    }

    const { consecutiveErrors, processedItems, failedItems } = job;
    const { consecutiveErrors: consecutiveThreshold, errorRate, minItemsForRateCheck } = config.job.errorThreshold;

    // Check consecutive errors threshold
    if (consecutiveErrors >= consecutiveThreshold) {
      const errorMsg = `Too many consecutive errors (${consecutiveErrors}). Pausing sync to prevent API rate limiting or cascading failures.`;
      await this.jobManager.log(jobId, LogLevel.ERROR, errorMsg, {
        consecutiveErrors,
        threshold: consecutiveThreshold,
      });
      await this.jobManager.pauseJob(jobId);
      return true;
    }

    // Check error rate threshold (only if we have processed enough items)
    const totalAttempts = processedItems + failedItems;
    if (totalAttempts >= minItemsForRateCheck) {
      const currentErrorRate = failedItems / totalAttempts;
      if (currentErrorRate >= errorRate) {
        const errorMsg = `Error rate too high (${(currentErrorRate * 100).toFixed(1)}%). Pausing sync.`;
        await this.jobManager.log(jobId, LogLevel.ERROR, errorMsg, {
          errorRate: currentErrorRate,
          threshold: errorRate,
          failedItems,
          totalAttempts,
        });
        await this.jobManager.pauseJob(jobId);
        return true;
      }
    }

    return false;
  }

  private async run(jobId: string): Promise<void> {
    try {
      await this.jobManager.log(jobId, LogLevel.INFO, 'Starting metadata ingestion');

      const job = await this.jobManager.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // First, retry failed plugins from previous runs
      const failedPluginKeys = await this.jobManager.getFailedPluginKeys(jobId);
      if (failedPluginKeys.length > 0) {
        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `Retrying ${failedPluginKeys.length} failed plugins from previous run`,
          { count: failedPluginKeys.length }
        );

        for (const pluginKey of failedPluginKeys) {
          if (await this.jobManager.shouldStop(jobId)) {
            await this.jobManager.log(jobId, LogLevel.INFO, 'Job stopped by user');
            return;
          }

          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `Retrying failed plugin: ${pluginKey}`,
            { addonKey: pluginKey }
          );

          try {
            const addon = await this.marketplaceClient.fetchAddon(pluginKey);
            if (addon) {
              await this.processAddon(jobId, addon);
            } else {
              await this.jobManager.log(
                jobId,
                LogLevel.WARN,
                `Failed plugin ${pluginKey} not found in Marketplace, removing from retry list`,
                { addonKey: pluginKey }
              );
              await this.jobManager.removeFailedPluginKey(jobId, pluginKey);
            }
          } catch (error) {
            await this.jobManager.log(
              jobId,
              LogLevel.ERROR,
              `Failed to retry plugin ${pluginKey}: ${error instanceof Error ? error.message : String(error)}`,
              { addonKey: pluginKey }
            );
          }

          // Check error threshold after retrying each failed plugin
          if (await this.checkErrorThreshold(jobId)) {
            return;
          }
        }
      }

      let offset = job.currentOffset;
      let hasMore = true;
      const limit = config.job.chunkSize;
      let processedPlugins = 0;
      let totalPlugins = job.totalItems || 0;

      while (hasMore) {
        if (await this.jobManager.shouldStop(jobId)) {
          await this.jobManager.log(jobId, LogLevel.INFO, 'Job stopped by user');
          return;
        }

        try {
          const response = await this.marketplaceClient.fetchAddons(limit, offset);
          const addons = response._embedded?.addons || [];

          if (addons.length === 0) {
            hasMore = false;
            break;
          }

          // Update total count from API response (use count field)
          const apiTotalCount = response.count || response.size || 0;
          if (apiTotalCount && apiTotalCount !== totalPlugins) {
            totalPlugins = apiTotalCount;
            await this.jobManager.updateProgress(jobId, { totalItems: apiTotalCount });
          }

          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `Fetching addons at offset ${offset} (Total: ${totalPlugins})`,
            { offset, limit, total: totalPlugins }
          );

          await this.jobManager.addProgress(
            jobId,
            'Fetching addons',
            `Fetching addons: ${offset}/${totalPlugins} (offset ${offset})`,
            undefined,
            offset,
            totalPlugins
          );

          for (const addon of addons) {
            if (await this.jobManager.shouldStop(jobId)) {
              await this.jobManager.log(jobId, LogLevel.INFO, 'Job stopped by user');
              return;
            }

            processedPlugins++;
            await this.jobManager.log(
              jobId,
              LogLevel.INFO,
              `Processing plugin ${processedPlugins}/${totalPlugins}: ${addon.key}`,
              { addonKey: addon.key, progress: `${processedPlugins}/${totalPlugins}` }
            );

            // Check if plugin was already processed in this job run
            const shouldSkip = await this.isPluginAlreadyProcessed(jobId, addon.key);
            if (shouldSkip) {
              await this.jobManager.log(
                jobId,
                LogLevel.DEBUG,
                `Skipping already processed plugin: ${addon.key}`,
                { addonKey: addon.key }
              );
              // Don't increment processedItems - it was already counted when initially processed
            } else {
              await this.processAddon(jobId, addon);
            }

            // Check error threshold after processing each addon
            if (await this.checkErrorThreshold(jobId)) {
              return;
            }
          }

          offset += addons.length;
          await this.jobManager.updateProgress(jobId, { currentOffset: offset });

          hasMore = addons.length === limit;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.jobManager.log(
            jobId,
            LogLevel.ERROR,
            `Error fetching addons at offset ${offset}: ${errorMessage}`,
            { offset, error: errorMessage }
          );
          await this.jobManager.incrementFailed(jobId);

          // Check error threshold after fetch error
          if (await this.checkErrorThreshold(jobId)) {
            return;
          }
        }
      }

      await this.jobManager.completeJob(jobId);

      // Auto-start next stage after 50 seconds
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        'Stage 1 completed. Starting Stage 2 in 50 seconds. Call /sync/metadata/cancel-auto-start to prevent this.'
      );

      this.autoStartTimer = setTimeout(async () => {
        try {
          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            'Auto-starting Stage 2 (Download Latest Versions)'
          );

          // Import Stage2 dynamically to avoid circular dependencies
          const { Stage2DownloadLatest } = await import('./stage2-download-latest');
          const stage2 = new Stage2DownloadLatest();
          await stage2.start();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.jobManager.log(
            jobId,
            LogLevel.ERROR,
            `Failed to auto-start Stage 2: ${errorMessage}`
          );
        }
      }, 50000); // 50 seconds
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.failJob(jobId, errorMessage);
      throw error;
    }
  }

  private async processAddon(jobId: string, addon: any): Promise<void> {
    try {
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Processing addon: ${addon.key}`,
        { addonKey: addon.key }
      );

      // Extract app ID from alternate link (e.g., "/apps/1213645/...")
      const alternateLink = typeof addon._links?.alternate === 'string'
        ? addon._links.alternate
        : addon._links?.alternate?.href;

      // Extract numeric app ID from path: /apps/1213645/... -> 1213645
      const appId = alternateLink?.match(/\/apps\/(\d+)\//)?.[1];

      // Build marketplace URL from alternateLink if available
      // alternateLink format: /apps/6820/scriptrunner-for-jira
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
        },
        update: {
          name: addon.name,
          vendor: addon.vendor?.name,
          summary: addon.summary,
          marketplaceUrl: marketplaceUrl,
        },
      });

      try {
        // Fetch only last 25 versions to reduce API load and processing time
        const versions = await this.marketplaceClient.fetchAddonVersions(addon.key, 25);

        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `Fetched ${versions.length} latest versions for ${addon.key}`,
          { addonKey: addon.key, versionCount: versions.length }
        );

        // Process all versions in parallel for maximum speed
        await Promise.all(
          versions.map(async (version) => {
            try {
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
            } catch (error) {
              // Log individual version processing errors but don't fail the whole batch
              await this.jobManager.log(
                jobId,
                LogLevel.WARN,
                `Failed to process version ${version.name} for ${addon.key}: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          })
        );
      } catch (error) {
        await this.jobManager.log(
          jobId,
          LogLevel.WARN,
          `Failed to fetch versions for ${addon.key}: ${error instanceof Error ? error.message : String(error)}`
        );
      }


      await this.jobManager.incrementProcessed(jobId);
      // Reset consecutive errors on successful processing
      await this.jobManager.resetConsecutiveErrors(jobId);
      // Remove from failed plugins if it was there
      await this.jobManager.removeFailedPluginKey(jobId, addon.key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.log(
        jobId,
        LogLevel.ERROR,
        `Error processing addon ${addon.key}: ${errorMessage}`,
        { addonKey: addon.key, error: errorMessage }
      );
      await this.jobManager.incrementFailed(jobId);
      // Add to failed plugins list
      await this.jobManager.addFailedPluginKey(jobId, addon.key);
    }
  }

  private async processVersion(jobId: string, pluginId: string, version: any): Promise<void> {
    // Check if this version is Data Center compatible
    if (!version.deployment?.dataCenter) {
      return;
    }

    // Extract download URL from the correct location
    const downloadUrl = version._embedded?.artifact?._links?.binary?.href;

    // Extract release notes and changelog URL
    const releaseNotes = version.text?.releaseNotes;
    const changelog = version.text?.releaseSummary;

    // Extract changelog URL from alternate link
    const alternateLink = typeof version._links?.alternate === 'string'
      ? version._links.alternate
      : version._links?.alternate?.href;

    const changelogUrl = alternateLink
      ? `https://marketplace.atlassian.com${alternateLink}`
      : undefined;

    // Extract Jira compatibility from compatibilities array
    let jiraMin: string | undefined = undefined;
    let jiraMax: string | undefined = undefined;

    if (version.compatibilities && Array.isArray(version.compatibilities)) {
      for (const compat of version.compatibilities) {
        if (compat.application === 'jira' && compat.hosting?.dataCenter) {
          jiraMin = compat.hosting.dataCenter.min?.version;
          jiraMax = compat.hosting.dataCenter.max?.version;
          logger.debug('Found Jira compatibility for version', {
            version: version.name,
            jiraMin,
            jiraMax,
          });
          break;
        }
      }
    } else {
      logger.debug('No compatibilities field found for version', {
        version: version.name,
      });
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
        releaseNotes,
        changelog,
        changelogUrl,
        downloadUrl: downloadUrl,
        hidden: version.status === 'hidden',
        deprecated: version.status === 'deprecated',
      },
      update: {
        releaseDate: version.release?.date ? new Date(version.release.date) : undefined,
        jiraMin,
        jiraMax,
        releaseNotes,
        changelog,
        changelogUrl,
        downloadUrl: downloadUrl,
        hidden: version.status === 'hidden',
        deprecated: version.status === 'deprecated',
      },
    });
  }
}
