import { Router, Request, Response } from 'express';
import { Stage1MetadataIngestion } from '../jobs/stage1-metadata';
import { Stage2DownloadLatest } from '../jobs/stage2-download-latest';
import { Stage3DownloadAll } from '../jobs/stage3-download-all';
import { BatchSyncCoordinator } from '../jobs/batch-sync-coordinator';
import { JobManager } from '../services/job-manager';
import { SyncStage, ProductType } from '@prisma/client';
import { createLogger } from '../lib/logger';

const logger = createLogger('SyncRoutes');
const router = Router();
const jobManager = new JobManager();

// Batch sync endpoints
router.post('/batch/start', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;

    // Validate productType
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Batch sync start requested', { productType: validProductType });
    const batchCoordinator = new BatchSyncCoordinator(validProductType);
    batchCoordinator.start().catch((error: Error) => {
      logger.error('Batch sync failed', { error: error.message });
    });
    res.json({ success: true, message: 'Batch sync started', productType: validProductType });
    logger.info('API: Batch sync started successfully', { productType: validProductType });
  } catch (error) {
    logger.error('API: Failed to start batch sync', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/batch/continue', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;

    // Validate productType
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Continue batch sync requested', { productType: validProductType });
    const batchCoordinator = new BatchSyncCoordinator(validProductType);
    batchCoordinator.continueNextBatch().catch((error: Error) => {
      logger.error('Continue batch sync failed', { error: error.message });
    });
    res.json({ success: true, message: 'Continuing to next batch', productType: validProductType });
    logger.info('API: Continuing to next batch', { productType: validProductType });
  } catch (error) {
    logger.error('API: Failed to continue batch sync', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Legacy stage-specific endpoints
router.post('/metadata/start', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Metadata ingestion start requested', { productType: validProductType });
    const stage1 = new Stage1MetadataIngestion(validProductType);
    stage1.start().catch((error: Error) => {
      logger.error('Metadata ingestion failed', { error: error.message });
    });
    res.json({ success: true, message: 'Metadata ingestion started', productType: validProductType });
    logger.info('API: Metadata ingestion started successfully');
  } catch (error) {
    logger.error('API: Failed to start metadata ingestion', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/metadata/pause', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Metadata ingestion pause requested', { productType: validProductType });
    const stage1 = new Stage1MetadataIngestion(validProductType);
    await stage1.pause();
    res.json({ success: true, message: 'Metadata ingestion paused', productType: validProductType });
    logger.info('API: Metadata ingestion paused successfully');
  } catch (error) {
    logger.error('API: Failed to pause metadata ingestion', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/metadata/resume', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Metadata ingestion resume requested', { productType: validProductType });
    const stage1 = new Stage1MetadataIngestion(validProductType);
    stage1.resume().catch((error) => {
      logger.error('Metadata ingestion resume failed', { error: error.message });
    });
    res.json({ success: true, message: 'Metadata ingestion resumed', productType: validProductType });
    logger.info('API: Metadata ingestion resumed successfully');
  } catch (error) {
    logger.error('API: Failed to resume metadata ingestion', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/metadata/cancel-auto-start', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Cancel auto-start requested', { productType: validProductType });
    const stage1 = new Stage1MetadataIngestion(validProductType);
    stage1.cancelAutoStart();
    res.json({ success: true, message: 'Auto-start of next stage cancelled', productType: validProductType });
    logger.info('API: Auto-start cancelled successfully');
  } catch (error) {
    logger.error('API: Failed to cancel auto-start', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/metadata/restart', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Metadata ingestion restart requested', { productType: validProductType });
    const stage1 = new Stage1MetadataIngestion(validProductType);
    stage1.restart().catch((error) => {
      logger.error('Metadata ingestion restart failed', { error: error.message });
    });
    res.json({ success: true, message: 'Metadata ingestion restarted', productType: validProductType });
    logger.info('API: Metadata ingestion restarted successfully');
  } catch (error) {
    logger.error('API: Failed to restart metadata ingestion', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-latest/start', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download latest start requested', { productType: validProductType });
    const stage2 = new Stage2DownloadLatest(validProductType);
    stage2.start().catch((error) => {
      logger.error('Download latest failed', { error: error.message });
    });
    res.json({ success: true, message: 'Latest version download started', productType: validProductType });
    logger.info('API: Latest version download started successfully');
  } catch (error) {
    logger.error('API: Failed to start latest version download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-latest/pause', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download latest pause requested', { productType: validProductType });
    const stage2 = new Stage2DownloadLatest(validProductType);
    await stage2.pause();
    res.json({ success: true, message: 'Latest version download paused', productType: validProductType });
    logger.info('API: Latest version download paused successfully');
  } catch (error) {
    logger.error('API: Failed to pause latest version download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-latest/resume', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download latest resume requested', { productType: validProductType });
    const stage2 = new Stage2DownloadLatest(validProductType);
    stage2.resume().catch((error) => {
      logger.error('Download latest resume failed', { error: error.message });
    });
    res.json({ success: true, message: 'Latest version download resumed', productType: validProductType });
    logger.info('API: Latest version download resumed successfully');
  } catch (error) {
    logger.error('API: Failed to resume latest version download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-latest/restart', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download latest restart requested', { productType: validProductType });
    const stage2 = new Stage2DownloadLatest(validProductType);
    stage2.restart().catch((error) => {
      logger.error('Download latest restart failed', { error: error.message });
    });
    res.json({ success: true, message: 'Latest version download restarted', productType: validProductType });
    logger.info('API: Latest version download restarted successfully');
  } catch (error) {
    logger.error('API: Failed to restart latest version download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-all/start', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download all start requested', { productType: validProductType });
    const stage3 = new Stage3DownloadAll(validProductType);
    stage3.start().catch((error) => {
      logger.error('Download all failed', { error: error.message });
    });
    res.json({ success: true, message: 'All versions download started', productType: validProductType });
    logger.info('API: All versions download started successfully');
  } catch (error) {
    logger.error('API: Failed to start all versions download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-all/pause', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download all pause requested', { productType: validProductType });
    const stage3 = new Stage3DownloadAll(validProductType);
    await stage3.pause();
    res.json({ success: true, message: 'All versions download paused', productType: validProductType });
    logger.info('API: All versions download paused successfully');
  } catch (error) {
    logger.error('API: Failed to pause all versions download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-all/resume', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download all resume requested', { productType: validProductType });
    const stage3 = new Stage3DownloadAll(validProductType);
    stage3.resume().catch((error) => {
      logger.error('Download all resume failed', { error: error.message });
    });
    res.json({ success: true, message: 'All versions download resumed', productType: validProductType });
    logger.info('API: All versions download resumed successfully');
  } catch (error) {
    logger.error('API: Failed to resume all versions download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/download-all/restart', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.body;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.info('API: Download all restart requested', { productType: validProductType });
    const stage3 = new Stage3DownloadAll(validProductType);
    stage3.restart().catch((error) => {
      logger.error('Download all restart failed', { error: error.message });
    });
    res.json({ success: true, message: 'All versions download restarted', productType: validProductType });
    logger.info('API: All versions download restarted successfully');
  } catch (error) {
    logger.error('API: Failed to restart all versions download', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const { productType = 'JIRA' } = req.query;
    const validProductType = (productType === 'JIRA' || productType === 'CONFLUENCE') ? productType as ProductType : 'JIRA';

    logger.debug('API: Status requested', { productType: validProductType });

    const [metadataJob, latestJob, allJob] = await Promise.all([
      jobManager.getJobByStage(SyncStage.METADATA_INGESTION, validProductType),
      jobManager.getJobByStage(SyncStage.DOWNLOAD_LATEST, validProductType),
      jobManager.getJobByStage(SyncStage.DOWNLOAD_ALL, validProductType),
    ]);

    logger.debug('API: Status retrieved', {
      metadataStatus: metadataJob?.status,
      latestStatus: latestJob?.status,
      allStatus: allJob?.status,
    });

    res.json({
      metadata: metadataJob
        ? {
            status: metadataJob.status,
            totalItems: metadataJob.totalItems,
            processedItems: metadataJob.processedItems,
            failedItems: metadataJob.failedItems,
            currentOffset: metadataJob.currentOffset,
            currentBatch: metadataJob.currentBatch,
            lastError: metadataJob.lastError,
            startedAt: metadataJob.startedAt,
            completedAt: metadataJob.completedAt,
            pausedAt: metadataJob.pausedAt,
            progress: metadataJob.progress,
            logs: metadataJob.logs,
          }
        : null,
      downloadLatest: latestJob
        ? {
            status: latestJob.status,
            totalItems: latestJob.totalItems,
            processedItems: latestJob.processedItems,
            failedItems: latestJob.failedItems,
            currentOffset: latestJob.currentOffset,
            lastError: latestJob.lastError,
            startedAt: latestJob.startedAt,
            completedAt: latestJob.completedAt,
            pausedAt: latestJob.pausedAt,
            progress: latestJob.progress,
            logs: latestJob.logs,
          }
        : null,
      downloadAll: allJob
        ? {
            status: allJob.status,
            totalItems: allJob.totalItems,
            processedItems: allJob.processedItems,
            failedItems: allJob.failedItems,
            currentOffset: allJob.currentOffset,
            lastError: allJob.lastError,
            startedAt: allJob.startedAt,
            completedAt: allJob.completedAt,
            pausedAt: allJob.pausedAt,
            progress: allJob.progress,
            logs: allJob.logs,
          }
        : null,
    });
  } catch (error) {
    logger.error('API: Failed to get status', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
