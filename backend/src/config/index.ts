import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jarStoragePath: process.env.JAR_STORAGE_PATH || './jars',
  marketplace: {
    baseUrl: process.env.MARKETPLACE_BASE_URL || 'https://marketplace.atlassian.com',
    maxRetries: parseInt(process.env.MARKETPLACE_MAX_RETRIES || '5', 10),
    retryDelay: parseInt(process.env.MARKETPLACE_RETRY_DELAY || '5000', 10),
    // Random delay configuration (if needed)
    randomDelayMin: parseInt(process.env.MARKETPLACE_RANDOM_DELAY_MIN || '0', 10),
    randomDelayMax: parseInt(process.env.MARKETPLACE_RANDOM_DELAY_MAX || '100', 10),
  },
  job: {
    chunkSize: parseInt(process.env.JOB_CHUNK_SIZE || '100', 10),
    concurrentDownloads: parseInt(process.env.JOB_CONCURRENT_DOWNLOADS || '5', 10),
    autoContinue: process.env.JOB_AUTO_CONTINUE === 'true',
    errorThreshold: {
      consecutiveErrors: parseInt(process.env.JOB_ERROR_CONSECUTIVE_THRESHOLD || '10', 10),
      errorRate: parseFloat(process.env.JOB_ERROR_RATE_THRESHOLD || '0.5'),
      minItemsForRateCheck: parseInt(process.env.JOB_ERROR_MIN_ITEMS || '20', 10),
    },
  },
};
