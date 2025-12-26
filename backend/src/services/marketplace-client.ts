import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { retry } from '../utils/retry';
import {
  MarketplaceListResponse,
  MarketplaceAddon,
  MarketplaceVersion,
} from '../types';
import { createLogger } from '../lib/logger';
import { ProductType } from '@prisma/client';

const logger = createLogger('MarketplaceClient');

export class MarketplaceClient {
  private client: AxiosInstance;
  private productType: ProductType;

  constructor(productType: ProductType = 'JIRA') {
    this.productType = productType;
    logger.info('Initializing MarketplaceClient', {
      productType: this.productType,
      baseURL: config.marketplace.baseUrl,
      timeout: 30000,
      maxRetries: config.marketplace.maxRetries,
    });

    this.client = axios.create({
      baseURL: config.marketplace.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'DC-PluginX/1.0',
      },
    });

    // Add request interceptor for detailed logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Outgoing HTTP request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          params: config.params,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        logger.error('HTTP request error', {
          message: error.message,
          stack: error.stack,
          code: error.code,
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for detailed logging
    this.client.interceptors.response.use(
      (response) => {
        let dataSize = 0;
        try {
          dataSize = response.data ? JSON.stringify(response.data).length : 0;
        } catch (error) {
          dataSize = -1; // Indicate stringify failed
        }
        logger.debug('Incoming HTTP response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          dataSize,
        });
        return response;
      },
      (error) => {
        logger.error('HTTP response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
          code: error.code,
          responseData: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  async fetchAddons(
    limit: number = 100,
    offset: number = 0
  ): Promise<MarketplaceListResponse> {
    logger.info('Fetching addons list', { limit, offset, productType: this.productType });

    const application = this.productType === 'JIRA' ? 'jira' : 'confluence';

    return retry(
      async () => {
        const response = await this.client.get<MarketplaceListResponse>(
          '/rest/2/addons',
          {
            params: {
              application,
              hosting: 'datacenter',
              limit,
              offset,
            },
          }
        );

        logger.info('Successfully fetched addons', {
          offset,
          limit,
          returned: response.data._embedded?.addons?.length || 0,
          total: response.data.count || response.data.size || 0,
        });

        return response.data;
      },
      {
        maxRetries: config.marketplace.maxRetries,
        retryDelay: config.marketplace.retryDelay,
        onRetry: (error, attempt) => {
          logger.warn('Retrying fetchAddons', {
            attempt,
            maxRetries: config.marketplace.maxRetries,
            offset,
            message: error.message,
            code: (error as any).code,
          });
        },
      }
    );
  }

  async fetchAddon(addonKey: string): Promise<MarketplaceAddon | null> {
    logger.info('Fetching addon details', { addonKey });

    return retry(
      async () => {
        const response = await this.client.get<MarketplaceAddon>(
          `/rest/2/addons/${addonKey}`
        );

        logger.info('Successfully fetched addon', {
          addonKey,
          name: response.data.name,
          vendor: response.data.vendor?.name,
        });

        return response.data;
      },
      {
        maxRetries: config.marketplace.maxRetries,
        retryDelay: config.marketplace.retryDelay,
        onRetry: (error, attempt) => {
          logger.warn('Retrying fetchAddon', {
            attempt,
            maxRetries: config.marketplace.maxRetries,
            addonKey,
            message: error.message,
            code: (error as any).code,
          });
        },
      }
    ).catch((error) => {
      logger.error('Failed to fetch addon after all retries', {
        addonKey,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      });
      return null;
    });
  }

  async fetchAddonVersions(addonKey: string, maxVersions: number = 25): Promise<MarketplaceVersion[]> {
    logger.debug('Fetching addon versions', { addonKey, maxVersions });

    // No delay for version fetching to speed up Stage 1

    const allVersions: MarketplaceVersion[] = [];
    let offset = 0;
    const limit = Math.min(50, maxVersions); // Maximum allowed by API, but respect maxVersions
    let hasMore = true;

    while (hasMore && allVersions.length < maxVersions) {
      const versions = await retry(
        async () => {
          const response = await this.client.get<{
            _embedded?: { versions?: MarketplaceVersion[] },
            count?: number,
            _links?: { next?: { href: string } }
          }>(
            `/rest/2/addons/${addonKey}/versions`,
            {
              params: { limit, offset, hosting: 'datacenter' }
            }
          );

          const versions = response.data._embedded?.versions || [];
          const totalCount = response.data.count || 0;

          logger.debug('Fetched addon versions page', {
            addonKey,
            offset,
            limit,
            returned: versions.length,
            total: totalCount,
          });

          return {
            versions,
            hasNext: response.data._links?.next !== undefined,
            totalCount,
          };
        },
        {
          maxRetries: config.marketplace.maxRetries,
          retryDelay: config.marketplace.retryDelay,
          onRetry: (error, attempt) => {
            logger.warn('Retrying fetchAddonVersions', {
              attempt,
              maxRetries: config.marketplace.maxRetries,
              addonKey,
              offset,
              message: error.message,
              code: (error as any).code,
            });
          },
        }
      );

      allVersions.push(...versions.versions);

      hasMore = versions.hasNext && versions.versions.length === limit;
      offset += versions.versions.length;

      if (!hasMore || allVersions.length >= maxVersions) {
        logger.info('Successfully fetched addon versions', {
          addonKey,
          totalFetched: allVersions.length,
          expectedTotal: versions.totalCount,
          limitedTo: maxVersions,
        });
      }
    }

    // Trim to maxVersions if we fetched more than needed
    const result = allVersions.slice(0, maxVersions);

    logger.info('Completed fetching addon versions', {
      addonKey,
      totalVersions: result.length,
      maxVersions,
    });

    return result;
  }

  async fetchVersionDetails(addonKey: string, buildNumber: number): Promise<MarketplaceVersion | null> {
    logger.debug('Fetching version details', { addonKey, buildNumber });

    // No delay for version details to speed up Stage 1

    return retry(
      async () => {
        const response = await this.client.get<MarketplaceVersion>(
          `/rest/2/addons/${addonKey}/versions/build/${buildNumber}`
        );

        logger.debug('Successfully fetched version details', {
          addonKey,
          buildNumber,
          version: response.data.name,
        });

        return response.data;
      },
      {
        maxRetries: config.marketplace.maxRetries,
        retryDelay: config.marketplace.retryDelay,
        onRetry: (error, attempt) => {
          logger.warn('Retrying fetchVersionDetails', {
            attempt,
            maxRetries: config.marketplace.maxRetries,
            addonKey,
            buildNumber,
            message: error.message,
            code: (error as any).code,
          });
        },
      }
    ).catch((error) => {
      logger.error('Failed to fetch version details after all retries', {
        addonKey,
        buildNumber,
        message: error.message,
        code: (error as any).code,
      });
      return null;
    });
  }

  async downloadFile(url: string, outputPath: string): Promise<void> {
    logger.info('Starting file download', { url, outputPath });

    const startTime = Date.now();

    return retry(
      async () => {
        const response = await this.client.get(url, {
          responseType: 'stream',
        });

        const fs = await import('fs');
        const path = await import('path');

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          logger.debug('Creating directory for download', { dir });
          fs.mkdirSync(dir, { recursive: true });
        }

        const writer = fs.createWriteStream(outputPath);
        let downloadedBytes = 0;

        response.data.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
        });

        return new Promise<void>((resolve, reject) => {
          response.data.pipe(writer);
          let error: Error | null = null;

          writer.on('error', (err) => {
            error = err;
            writer.close();
            logger.error('File write error during download', {
              url,
              outputPath,
              message: err.message,
              code: (err as any).code,
              downloadedBytes,
            });
            reject(err);
          });

          writer.on('close', () => {
            if (!error) {
              const duration = Date.now() - startTime;
              logger.info('File download completed', {
                url,
                outputPath,
                downloadedBytes,
                duration: `${duration}ms`,
                speed: `${(downloadedBytes / 1024 / (duration / 1000)).toFixed(2)} KB/s`,
              });
              resolve();
            }
          });
        });
      },
      {
        maxRetries: config.marketplace.maxRetries,
        retryDelay: config.marketplace.retryDelay,
        onRetry: (error, attempt) => {
          logger.warn('Retrying file download', {
            attempt,
            maxRetries: config.marketplace.maxRetries,
            url,
            outputPath,
            message: error.message,
            code: (error as any).code,
          });
        },
      }
    );
  }
}
