import { SyncStage, LogLevel, PluginDownloadStatus } from '@prisma/client';
import { JobManager } from '../services/job-manager';
import { MarketplaceClient } from '../services/marketplace-client';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import PQueue from 'p-queue';

export class Stage3DownloadAll {
  private jobManager: JobManager;
  private marketplaceClient: MarketplaceClient;
  private queue: PQueue;

  constructor() {
    this.jobManager = new JobManager();
    this.marketplaceClient = new MarketplaceClient();
    this.queue = new PQueue({ concurrency: config.job.concurrentDownloads });
  }

  async start(): Promise<void> {
    const jobId = await this.jobManager.getOrCreateJob(SyncStage.DOWNLOAD_ALL);
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
    const job = await this.jobManager.getJobByStage(SyncStage.DOWNLOAD_ALL);
    if (job) {
      await this.jobManager.pauseJob(job.id);
      this.queue.pause();
    }
  }

  async resume(): Promise<void> {
    const job = await this.jobManager.getJobByStage(SyncStage.DOWNLOAD_ALL);
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
    const jobId = await this.jobManager.getOrCreateJob(SyncStage.DOWNLOAD_ALL);
    await this.jobManager.log(
      jobId,
      LogLevel.INFO,
      `Processing batch ${batchNumber} in Stage 3`
    );
    await this.runBatch(jobId, batchNumber);
  }

  private async runBatch(jobId: string, batchNumber: number): Promise<void> {
    try {
      const versions = await prisma.pluginVersion.findMany({
        where: {
          dataCenterCompatible: true,
          downloadUrl: { not: null },
          plugin: { batchNumber },
        },
        include: {
          plugin: true,
          files: true,
        },
      });

      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Found ${versions.length} versions in batch ${batchNumber}`
      );

      let processed = 0;

      for (const version of versions) {
        const existingFile = version.files.find(
          (f) => f.downloadStatus === PluginDownloadStatus.COMPLETED
        );

        processed++;

        if (existingFile) {
          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `Skipping ${processed}/${versions.length}: already downloaded ${version.plugin.addonKey} v${version.version}`
          );
          continue;
        }

        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `Downloading ${processed}/${versions.length}: ${version.plugin.addonKey} v${version.version}`,
          { addonKey: version.plugin.addonKey, progress: `${processed}/${versions.length}` }
        );

        await this.queue.add(() => this.downloadVersion(jobId, version.plugin, version));
      }

      await this.queue.onIdle();
      await this.jobManager.log(
        jobId,
        LogLevel.INFO,
        `Batch ${batchNumber} Stage 3 completed`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.log(
        jobId,
        LogLevel.ERROR,
        `Error in batch ${batchNumber} Stage 3: ${errorMessage}`
      );
      throw error;
    }
  }

  private async run(jobId: string): Promise<void> {
    try {
      await this.jobManager.log(jobId, LogLevel.INFO, 'Starting download of all versions');

      const versions = await prisma.pluginVersion.findMany({
        where: {
          dataCenterCompatible: true,
          downloadUrl: { not: null },
        },
        include: {
          plugin: true,
          files: true,
        },
      });

      await this.jobManager.updateProgress(jobId, { totalItems: versions.length });

      let processed = 0;

      for (const version of versions) {
        if (await this.jobManager.shouldStop(jobId)) {
          await this.jobManager.log(jobId, LogLevel.INFO, 'Job stopped by user');
          this.queue.clear();
          return;
        }

        const existingFile = version.files.find(
          (f) => f.downloadStatus === PluginDownloadStatus.COMPLETED
        );

        processed++;

        if (existingFile) {
          await this.jobManager.log(
            jobId,
            LogLevel.INFO,
            `Skipping ${processed}/${versions.length}: already downloaded ${version.plugin.addonKey} v${version.version}`
          );
          await this.jobManager.updateProgress(jobId, { processedItems: processed });
          continue;
        }

        await this.jobManager.addProgress(
          jobId,
          'Downloading all versions',
          `Downloading ${processed}/${versions.length}: ${version.plugin.addonKey} v${version.version}`,
          `${version.plugin.addonKey}@${version.version}`,
          processed,
          versions.length
        );

        await this.jobManager.log(
          jobId,
          LogLevel.INFO,
          `Downloading version ${processed}/${versions.length}: ${version.plugin.addonKey} v${version.version}`,
          { addonKey: version.plugin.addonKey, progress: `${processed}/${versions.length}` }
        );

        await this.queue.add(() => this.downloadVersion(jobId, version.plugin, version));

        await this.jobManager.updateProgress(jobId, { processedItems: processed });
      }

      await this.queue.onIdle();
      await this.jobManager.completeJob(jobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.jobManager.failJob(jobId, errorMessage);
      throw error;
    }
  }

  private async downloadVersion(jobId: string, plugin: any, version: any): Promise<void> {
    try {
      const downloadUrl = version.downloadUrl;
      if (!downloadUrl) {
        await this.jobManager.log(
          jobId,
          LogLevel.WARN,
          `No download URL for ${plugin.addonKey} v${version.version}`
        );

        await prisma.pluginFile.upsert({
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
            downloadStatus: PluginDownloadStatus.SKIPPED,
            errorMessage: 'No download URL available',
          },
          update: {
            downloadStatus: PluginDownloadStatus.SKIPPED,
            errorMessage: 'No download URL available',
          },
        });

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

      if (fs.existsSync(filePath)) {
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
          `Already exists ${plugin.addonKey} v${version.version}`
        );

        // Don't increment processedItems - it was already counted when initially downloaded
        return;
      }

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
