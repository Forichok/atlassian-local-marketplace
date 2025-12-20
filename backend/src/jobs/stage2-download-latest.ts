import { SyncStage, LogLevel, PluginDownloadStatus } from '@prisma/client';
import { JobManager } from '../services/job-manager';
import { MarketplaceClient } from '../services/marketplace-client';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import PQueue from 'p-queue';

export class Stage2DownloadLatest {
  private jobManager: JobManager;
  private marketplaceClient: MarketplaceClient;
  private queue: PQueue;

  constructor() {
    this.jobManager = new JobManager();
    this.marketplaceClient = new MarketplaceClient();
    this.queue = new PQueue({ concurrency: config.job.concurrentDownloads });
  }

  async start(): Promise<void> {
    const jobId = await this.jobManager.getOrCreateJob(SyncStage.DOWNLOAD_LATEST);
    const job = await this.jobManager.getJob(jobId);

    if (!job) {
      throw new Error('Failed to create job');
    }

    if (job.status === 'RUNNING') {
      throw new Error('Job is already running');
    }

    await this.jobManager.startJob(jobId);
    await this.run(jobId);
  }

  async pause(): Promise<void> {
    const job = await this.jobManager.getJobByStage(SyncStage.DOWNLOAD_LATEST);
    if (job) {
      await this.jobManager.pauseJob(job.id);
      this.queue.pause();
    }
  }

  async resume(): Promise<void> {
    const job = await this.jobManager.getJobByStage(SyncStage.DOWNLOAD_LATEST);
    if (!job) {
      throw new Error('No job found to resume');
    }

    if (job.status !== 'PAUSED') {
      throw new Error('Job is not paused');
    }

    await this.jobManager.resumeJob(job.id);
    this.queue.start();
    await this.run(job.id);
  }

  async processBatch(batchNumber: number): Promise<void> {
    const jobId = await this.jobManager.getOrCreateJob(SyncStage.DOWNLOAD_LATEST);
    await this.jobManager.log(
      jobId,
      LogLevel.INFO,
      `Processing batch ${batchNumber} in Stage 2`
    );
    await this.runBatch(jobId, batchNumber);
  }

  private async runBatch(jobId: string, batchNumber: number): Promise<void> {
    try {
      const targetJiraVersions = ['8.13', '8.20', '9.12', '10.3', '11.3'];

      const plugins = await prisma.plugin.findMany({
        where: { batchNumber } as any,
        include: {
          versions: {
            where: {
              dataCenterCompatible: true,
              hidden: false,
              deprecated: false,
            },
            orderBy: {
              releaseDate: 'desc',
            },
          },
        },
      });

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Found ${plugins.length} plugins in batch ${batchNumber}`
      );

      let processed = 0;

      for (const plugin of plugins) {
        for (const jiraVersion of targetJiraVersions) {
          const latestVersion = this.findLatestCompatibleVersion(plugin.versions, jiraVersion);

          if (!latestVersion) {
            await this.jobManager.log(
              jobId,
              LogLevel.WARN,
              `No compatible version found for ${plugin.addonKey} (Jira ${jiraVersion})`
            );
            processed++;
            continue;
          }

          processed++;
          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `Downloading ${processed}: ${plugin.addonKey} v${latestVersion.version} for Jira ${jiraVersion}`,
            { addonKey: plugin.addonKey, jiraVersion, progress: `${processed}` }
          );

          await this.queue.add(() => this.downloadVersion(jobId, plugin, latestVersion));
        }
      }

      await this.queue.onIdle();
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Batch ${batchNumber} Stage 2 completed`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.log(
        jobId,
        LogLevel.ERROR,
        `Error in batch ${batchNumber} Stage 2: ${errorMessage}`
      );
      throw error;
    }
  }

  private async run(jobId: string): Promise<void> {
    try {
      // Target Jira versions to download for
      const targetJiraVersions = ['8.13', '8.20', '9.12', '10.3', '11.3'];

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Starting download of latest versions for Jira ${targetJiraVersions.join(', ')}`
      );

      const plugins = await prisma.plugin.findMany({
        include: {
          versions: {
            where: {
              dataCenterCompatible: true,
              hidden: false,
              deprecated: false,
            },
            orderBy: {
              releaseDate: 'desc',
            },
          },
        },
      });

      // Total items = plugins * jira versions
      const totalItems = plugins.length * targetJiraVersions.length;
      await this.jobManager.updateProgress(jobId, { totalItems });

      let processed = 0;

      for (const plugin of plugins) {
        if (await this.jobManager.shouldStop(jobId)) {
          await this.jobManager.log(jobId, LogLevel.INFO, 'Job stopped by user');
          this.queue.clear();
          return;
        }

        // Download latest compatible version for each Jira version
        for (const jiraVersion of targetJiraVersions) {
          const latestVersion = this.findLatestCompatibleVersion(plugin.versions, jiraVersion);

          processed++;

          if (!latestVersion) {
            await this.jobManager.log(
              jobId,
              LogLevel.WARN,
              `No compatible version found for ${plugin.addonKey} (Jira ${jiraVersion})`
            );
            await this.jobManager.incrementFailed(jobId);
            await this.jobManager.updateProgress(jobId, { processedItems: processed });
            continue;
          }

          await this.jobManager.addProgress(
            jobId,
            'Downloading latest versions per Jira version',
            `Downloading ${processed}/${totalItems}: ${plugin.addonKey} v${latestVersion.version} (Jira ${jiraVersion})`,
            `${plugin.addonKey}@${jiraVersion}`,
            processed,
            totalItems
          );

          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `Downloading ${processed}/${totalItems}: ${plugin.addonKey} v${latestVersion.version} for Jira ${jiraVersion}`,
            { addonKey: plugin.addonKey, jiraVersion, progress: `${processed}/${totalItems}` }
          );

          await this.queue.add(() => this.downloadVersion(jobId, plugin, latestVersion));

          await this.jobManager.updateProgress(jobId, { processedItems: processed });
        }
      }

      await this.queue.onIdle();
      await this.jobManager.completeJob(jobId);

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        'Stage 2 completed. Stage 3 must be started manually via /sync/download-all/start'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.failJob(jobId, errorMessage);
      throw error;
    }
  }

  private findLatestCompatibleVersion(versions: any[], targetJiraVersion: string): any | null {
    if (versions.length === 0) {
      return null;
    }

    // Parse target Jira version (e.g., "8.13" -> major: 8, minor: 13)
    const [targetMajor, targetMinor] = targetJiraVersion.split('.').map(Number);

    // Try to find versions with explicit Jira compatibility data
    const compatibleVersions = versions.filter((v) => {
      if (v.jiraMin || v.jiraMax) {
        const minVer = v.jiraMin ? this.parseVersion(v.jiraMin) : { major: 0, minor: 0 };
        const maxVer = v.jiraMax ? this.parseVersion(v.jiraMax) : { major: 999, minor: 999 };

        // Check if target version is within the range
        const isAboveMin = targetMajor > minVer.major ||
                          (targetMajor === minVer.major && targetMinor >= minVer.minor);
        const isBelowMax = targetMajor < maxVer.major ||
                          (targetMajor === maxVer.major && targetMinor <= maxVer.minor);

        return isAboveMin && isBelowMax;
      }
      // If no compatibility info, we can't determine compatibility
      return false;
    });

    if (compatibleVersions.length > 0) {
      return compatibleVersions[0]; // Already sorted by releaseDate desc
    }

    // If no version has compatibility data, return the latest version
    // This is a fallback - ideally all versions should have compatibility data
    console.warn(`No compatibility data found for Jira ${targetJiraVersion}, returning latest version`);
    return versions[0];
  }

  private parseVersion(versionString: string): { major: number; minor: number } {
    const parts = versionString.split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0,
    };
  }

  private async downloadVersion(jobId: string, plugin: any, version: any): Promise<void> {
    try {
      const existingFile = await prisma.pluginFile.findUnique({
        where: {
          pluginId_version: {
            pluginId: plugin.id,
            version: version.version,
          },
        },
      });

      if (existingFile?.downloadStatus === PluginDownloadStatus.COMPLETED) {
        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `Skipping already downloaded ${plugin.addonKey} v${version.version}`
        );
        // Don't increment processedItems - it was already counted when initially downloaded
        return;
      }

      const downloadUrl = version.downloadUrl;
      if (!downloadUrl) {
        await this.jobManager.log(
          jobId,
          LogLevel.WARN,
          `No download URL for ${plugin.addonKey} v${version.version}`
        );
        await this.jobManager.incrementFailed(jobId);
        return;
      }

      const fileName = `${plugin.addonKey}-${version.version}.jar`;
      const filePath = path.join(config.jarStoragePath, plugin.addonKey, fileName);

      const fileRecord = await prisma.pluginFile.upsert({
        where: {
          pluginId_version: {
            pluginId: plugin.id,
            version: version.version,
          },
        },
        create: {
          pluginId: plugin.id,
          versionId: version.id,
          version: version.version,
          downloadUrl,
          downloadStatus: PluginDownloadStatus.DOWNLOADING,
          downloadAttempts: 1,
          lastAttemptAt: new Date(),
        },
        update: {
          downloadStatus: PluginDownloadStatus.DOWNLOADING,
          downloadAttempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: null,
        },
      });

      await this.marketplaceClient.downloadFile(downloadUrl, filePath);

      const stats = fs.statSync(filePath);
      const checksum = await this.calculateChecksum(filePath);

      await prisma.pluginFile.update({
        where: { id: fileRecord.id },
        data: {
          filePath,
          checksum,
          size: BigInt(stats.size),
          downloadStatus: PluginDownloadStatus.COMPLETED,
          downloadedAt: new Date(),
        },
      });

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Downloaded ${plugin.addonKey} v${version.version}`,
        { size: stats.size, checksum }
      );

      await this.jobManager.incrementProcessed(jobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await prisma.pluginFile.updateMany({
        where: {
          pluginId: plugin.id,
          version: version.version,
        },
        data: {
          downloadStatus: PluginDownloadStatus.FAILED,
          errorMessage,
        },
      });

      await this.jobManager.log(
        jobId,
        LogLevel.ERROR,
        `Failed to download ${plugin.addonKey} v${version.version}: ${errorMessage}`,
        { error: errorMessage }
      );

      await this.jobManager.incrementFailed(jobId);
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}
