import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      jiraVersion,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { addonKey: { contains: search as string, mode: 'insensitive' } },
        { vendor: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    let versionWhere: any = { dataCenterCompatible: true };

    if (jiraVersion) {
      const version = parseInt(jiraVersion as string, 10);
      versionWhere = {
        ...versionWhere,
        OR: [
          {
            AND: [
              { jiraMin: { lte: version.toString() } },
              { jiraMax: { gte: version.toString() } },
            ],
          },
          { jiraMin: null, jiraMax: null },
        ],
      };
    }

    const [plugins, total] = await Promise.all([
      prisma.plugin.findMany({
        where,
        include: {
          versions: {
            where: versionWhere,
            orderBy: { releaseDate: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              versions: true,
              files: true,
            },
          },
          files: {
            where: { downloadStatus: 'COMPLETED' },
            select: { size: true },
          },
        },
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.plugin.count({ where }),
    ]);

    // Calculate total size and supported Jira versions for each plugin
    const pluginsWithMetadata = await Promise.all(plugins.map(async plugin => {
      const totalSize = plugin.files.reduce((sum, file) => sum + (file.size ? Number(file.size) : 0), 0);

      // Get all versions to determine supported Jira versions
      const allVersions = await prisma.pluginVersion.findMany({
        where: {
          pluginId: plugin.id,
          dataCenterCompatible: true,
        },
        select: {
          jiraMin: true,
          jiraMax: true,
        },
      });

      // Calculate which Jira major versions are supported (8, 9, 10, 11)
      const supportedVersions = new Set<number>();
      const jiraVersionsToCheck = [8, 9, 10, 11];

      for (const version of allVersions) {
        if (!version.jiraMin && !version.jiraMax) {
          // If no min/max specified, assume it supports all versions
          jiraVersionsToCheck.forEach(v => supportedVersions.add(v));
        } else {
          const min = version.jiraMin ? parseInt(version.jiraMin.split('.')[0]) : 0;
          const max = version.jiraMax ? parseInt(version.jiraMax.split('.')[0]) : 999;

          for (const jiraVersion of jiraVersionsToCheck) {
            if (min <= jiraVersion && max >= jiraVersion) {
              supportedVersions.add(jiraVersion);
            }
          }
        }
      }

      const { files, ...rest } = plugin;
      return {
        ...rest,
        totalSize,
        supportedJiraVersions: Array.from(supportedVersions).sort()
      };
    }));

    res.json({
      plugins: pluginsWithMetadata,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:addonKey', async (req: Request, res: Response) => {
  try {
    const { addonKey } = req.params;

    const plugin = await prisma.plugin.findUnique({
      where: { addonKey },
      include: {
        versions: {
          orderBy: { releaseDate: 'desc' },
          include: {
            files: true,
          },
        },
      },
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json(plugin);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:addonKey/versions', async (req: Request, res: Response) => {
  try {
    const { addonKey } = req.params;
    const { jiraVersion } = req.query;

    const plugin = await prisma.plugin.findUnique({
      where: { addonKey },
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    let where: any = {
      pluginId: plugin.id,
      dataCenterCompatible: true,
    };

    if (jiraVersion) {
      const version = parseInt(jiraVersion as string, 10);
      where = {
        ...where,
        OR: [
          {
            AND: [
              { jiraMin: { lte: version.toString() } },
              { jiraMax: { gte: version.toString() } },
            ],
          },
          { jiraMin: null, jiraMax: null },
        ],
      };
    }

    const versions = await prisma.pluginVersion.findMany({
      where,
      include: {
        files: true,
      },
      orderBy: { releaseDate: 'desc' },
    });

    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:addonKey/download/:version', async (req: Request, res: Response) => {
  try {
    const { addonKey, version } = req.params;

    const plugin = await prisma.plugin.findUnique({
      where: { addonKey },
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const file = await prisma.pluginFile.findUnique({
      where: {
        pluginId_version: {
          pluginId: plugin.id,
          version,
        },
      },
    });

    if (!file || !file.filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.downloadStatus !== 'COMPLETED') {
      return res.status(404).json({ error: 'File not available' });
    }

    res.download(file.filePath);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:addonKey/force-download/:version', async (req: Request, res: Response) => {
  try {
    const { addonKey, version } = req.params;

    const plugin = await prisma.plugin.findUnique({
      where: { addonKey },
      include: {
        versions: {
          where: { version },
          take: 1,
        },
      },
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    if (!plugin.versions || plugin.versions.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const pluginVersion = plugin.versions[0];

    // Import and execute the download
    const { MarketplaceClient } = await import('../services/marketplace-client');
    const { PluginDownloadStatus } = await import('@prisma/client');
    const path = await import('path');
    const fs = await import('fs');
    const crypto = await import('crypto');
    const { config } = await import('../config');

    const marketplaceClient = new MarketplaceClient();

    // Run download in background
    (async () => {
      try {
        const downloadUrl = pluginVersion.downloadUrl;
        if (!downloadUrl) {
          throw new Error('No download URL available');
        }

        const fileName = `${plugin.addonKey}-${version}.jar`;
        const filePath = path.join(config.jarStoragePath, plugin.addonKey, fileName);

        // Update or create file record
        const fileRecord = await prisma.pluginFile.upsert({
          where: {
            pluginId_version: {
              pluginId: plugin.id,
              version: version,
            },
          },
          create: {
            pluginId: plugin.id,
            versionId: pluginVersion.id,
            version: version,
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

        // Download the file
        await marketplaceClient.downloadFile(downloadUrl, filePath);

        // Calculate checksum
        const calculateChecksum = (filePath: string): Promise<string> => {
          return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (chunk) => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
          });
        };

        const stats = fs.statSync(filePath);
        const checksum = await calculateChecksum(filePath);

        // Update file record with success
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

        console.log(`Successfully downloaded ${addonKey} v${version}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Update file record with failure
        await prisma.pluginFile.updateMany({
          where: {
            pluginId: plugin.id,
            version: version,
          },
          data: {
            downloadStatus: PluginDownloadStatus.FAILED,
            errorMessage,
          },
        });

        console.error(`Failed to download ${addonKey} v${version}:`, errorMessage);
      }
    })().catch((error) => {
      console.error(`Background download failed for ${addonKey} v${version}:`, error);
    });

    res.json({ message: 'Download initiated', addonKey, version });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:addonKey/resync', async (req: Request, res: Response) => {
  try {
    const { addonKey } = req.params;

    const plugin = await prisma.plugin.findUnique({
      where: { addonKey },
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Import and execute the resync
    const { Stage1MetadataIngestion } = await import('../jobs/stage1-metadata');
    const stage1 = new Stage1MetadataIngestion();

    // Run resync in background
    stage1.resyncPlugin(addonKey).catch((error) => {
      console.error(`Background resync failed for ${addonKey}:`, error);
    });

    res.json({ message: 'Plugin resync initiated', addonKey });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const [totalPlugins, totalVersions, totalFiles, downloadedFiles, sizeStats] = await Promise.all([
      prisma.plugin.count(),
      prisma.pluginVersion.count(),
      // Count all versions with downloadUrl (JAR files available in marketplace)
      prisma.pluginVersion.count({ where: { downloadUrl: { not: null } } }),
      // Count only downloaded JAR files
      prisma.pluginFile.count({
        where: {
          downloadStatus: 'COMPLETED',
          downloadUrl: { not: null }
        }
      }),
      prisma.pluginFile.aggregate({
        where: {
          downloadStatus: 'COMPLETED',
          downloadUrl: { not: null }
        },
        _sum: { size: true },
      }),
    ]);

    const totalSize = sizeStats._sum.size ? Number(sizeStats._sum.size) : 0;

    res.json({
      totalPlugins,
      totalVersions,
      totalFiles,
      downloadedFiles,
      totalSize,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
