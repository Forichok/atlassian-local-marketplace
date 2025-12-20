import { prisma } from '../lib/prisma';
import { SyncStage, JobStatus, LogLevel } from '@prisma/client';
import { JobProgress } from '../types';
import { createLogger } from '../lib/logger';

const logger = createLogger('JobManager');

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // Convert Error objects to plain objects with message and stack
    if (value instanceof Error) {
      return {
        message: value.message,
        stack: value.stack,
        name: value.name,
      };
    }
    return value;
  });
};

export class JobManager {
  async getOrCreateJob(stage: SyncStage): Promise<string> {
    logger.debug('Getting or creating job', { stage });

    let job = await prisma.syncJob.findFirst({
      where: { stage },
      orderBy: { createdAt: 'desc' },
    });

    if (!job) {
      logger.info('Creating new job', { stage });
      job = await prisma.syncJob.create({
        data: {
          stage,
          status: JobStatus.IDLE,
        },
      });
      logger.info('Job created successfully', {
        stage,
        jobId: job.id,
        status: job.status,
      });
    } else {
      logger.debug('Found existing job', {
        stage,
        jobId: job.id,
        status: job.status,
        createdAt: job.createdAt,
      });
    }

    return job.id;
  }

  async getJob(jobId: string) {
    return prisma.syncJob.findUnique({
      where: { id: jobId },
      include: {
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  async getJobByStage(stage: SyncStage) {
    return prisma.syncJob.findFirst({
      where: { stage },
      orderBy: { createdAt: 'desc' },
      include: {
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  async startJob(jobId: string): Promise<void> {
    logger.info('Starting job', { jobId });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.RUNNING,
        startedAt: new Date(),
        pausedAt: null,
      },
    });

    await this.log(jobId, LogLevel.INFO, 'Job started');
    logger.info('Job started successfully', { jobId });
  }

  async pauseJob(jobId: string): Promise<void> {
    logger.info('Pausing job', { jobId });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.PAUSED,
        pausedAt: new Date(),
      },
    });

    await this.log(jobId, LogLevel.INFO, 'Job paused');
    logger.info('Job paused successfully', { jobId });
  }

  async resumeJob(jobId: string): Promise<void> {
    logger.info('Resuming job', { jobId });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.RUNNING,
        pausedAt: null,
      },
    });

    await this.log(jobId, LogLevel.INFO, 'Job resumed');
    logger.info('Job resumed successfully', { jobId });
  }

  async completeJob(jobId: string): Promise<void> {
    logger.info('Completing job', { jobId });

    const job = await prisma.syncJob.findUnique({ where: { id: jobId } });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.log(jobId, LogLevel.INFO, 'Job completed successfully');
    logger.info('Job completed successfully', {
      jobId,
      totalItems: job?.totalItems,
      processedItems: job?.processedItems,
      failedItems: job?.failedItems,
      duration: job?.startedAt ? Date.now() - job.startedAt.getTime() : 'unknown',
    });
  }

  async failJob(jobId: string, error: string): Promise<void> {
    logger.error('Failing job', { jobId, error });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        lastError: error,
      },
    });

    await this.log(jobId, LogLevel.ERROR, `Job failed: ${error}`);
    logger.error('Job failed', { jobId, error });
  }

  async updateProgress(
    jobId: string,
    updates: {
      totalItems?: number;
      processedItems?: number;
      failedItems?: number;
      currentOffset?: number;
    }
  ): Promise<void> {
    logger.debug('Updating job progress', { jobId, updates });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: updates,
    });
  }

  async incrementProcessed(jobId: string, count: number = 1): Promise<void> {
    logger.debug('Incrementing processed items', { jobId, count });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        processedItems: { increment: count },
      },
    });
  }

  async incrementFailed(jobId: string, count: number = 1): Promise<void> {
    logger.warn('Incrementing failed items', { jobId, count });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        failedItems: { increment: count },
        consecutiveErrors: { increment: count },
      },
    });
  }

  async resetConsecutiveErrors(jobId: string): Promise<void> {
    logger.debug('Resetting consecutive errors', { jobId });

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        consecutiveErrors: 0,
      },
    });
  }

  async addFailedPluginKey(jobId: string, pluginKey: string): Promise<void> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      select: { failedPluginKeys: true },
    });

    if (job && !job.failedPluginKeys.includes(pluginKey)) {
      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          failedPluginKeys: {
            push: pluginKey,
          },
        },
      });
    }
  }

  async removeFailedPluginKey(jobId: string, pluginKey: string): Promise<void> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      select: { failedPluginKeys: true },
    });

    if (job) {
      const updatedKeys = job.failedPluginKeys.filter(key => key !== pluginKey);
      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          failedPluginKeys: updatedKeys,
        },
      });
    }
  }

  async clearFailedPluginKeys(jobId: string): Promise<void> {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        failedPluginKeys: [],
      },
    });
  }

  async getFailedPluginKeys(jobId: string): Promise<string[]> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      select: { failedPluginKeys: true },
    });

    return job?.failedPluginKeys || [];
  }

  async addProgress(
    jobId: string,
    phase: string,
    message?: string,
    currentItem?: string,
    itemsProcessed?: number,
    itemsTotal?: number
  ): Promise<void> {
    await prisma.syncJobProgress.create({
      data: {
        jobId,
        phase,
        message,
        currentItem,
        itemsProcessed: itemsProcessed || 0,
        itemsTotal: itemsTotal || 0,
      },
    });
  }

  async log(
    jobId: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.syncJobLog.create({
      data: {
        jobId,
        level,
        message,
        metadata: metadata ? safeStringify(metadata) : undefined,
      },
    });

    // Log to winston logger as well
    const logData = { jobId, ...metadata };
    switch (level) {
      case LogLevel.ERROR:
        logger.error(message, logData);
        break;
      case LogLevel.WARN:
        logger.warn(message, logData);
        break;
      case LogLevel.INFO:
        logger.info(message, logData);
        break;
      case LogLevel.DEBUG:
        logger.debug(message, logData);
        break;
      default:
        logger.info(message, logData);
    }
  }

  async isJobRunning(jobId: string): Promise<boolean> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    return job?.status === JobStatus.RUNNING;
  }

  async shouldStop(jobId: string): Promise<boolean> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    return job?.status !== JobStatus.RUNNING;
  }

  async getAllJobs(): Promise<JobProgress[]> {
    const jobs = await prisma.syncJob.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => ({
      stage: job.stage,
      status: job.status,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      failedItems: job.failedItems,
      currentOffset: job.currentOffset,
      failedPluginKeys: job.failedPluginKeys,
      consecutiveErrors: job.consecutiveErrors,
      lastError: job.lastError || undefined,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      pausedAt: job.pausedAt || undefined,
    }));
  }
}
