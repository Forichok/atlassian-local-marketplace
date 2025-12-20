-- CreateEnum
CREATE TYPE "PluginDownloadStatus" AS ENUM ('PENDING', 'DOWNLOADING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SyncStage" AS ENUM ('METADATA_INGESTION', 'DOWNLOAD_LATEST', 'DOWNLOAD_ALL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "Plugin" (
    "id" TEXT NOT NULL,
    "addonKey" TEXT NOT NULL,
    "appId" TEXT,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "summary" TEXT,
    "marketplaceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plugin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginVersion" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "jiraMin" TEXT,
    "jiraMax" TEXT,
    "dataCenterCompatible" BOOLEAN NOT NULL DEFAULT true,
    "releaseNotes" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluginVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginFile" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "versionId" TEXT,
    "version" TEXT NOT NULL,
    "filePath" TEXT,
    "checksum" TEXT,
    "size" BIGINT,
    "downloadStatus" "PluginDownloadStatus" NOT NULL DEFAULT 'PENDING',
    "downloadUrl" TEXT,
    "errorMessage" TEXT,
    "downloadAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluginFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "stage" "SyncStage" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'IDLE',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "currentOffset" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJobProgress" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "currentItem" TEXT,
    "message" TEXT,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJobProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJobLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plugin_addonKey_key" ON "Plugin"("addonKey");

-- CreateIndex
CREATE INDEX "Plugin_addonKey_idx" ON "Plugin"("addonKey");

-- CreateIndex
CREATE INDEX "Plugin_name_idx" ON "Plugin"("name");

-- CreateIndex
CREATE INDEX "PluginVersion_pluginId_idx" ON "PluginVersion"("pluginId");

-- CreateIndex
CREATE INDEX "PluginVersion_version_idx" ON "PluginVersion"("version");

-- CreateIndex
CREATE INDEX "PluginVersion_dataCenterCompatible_idx" ON "PluginVersion"("dataCenterCompatible");

-- CreateIndex
CREATE UNIQUE INDEX "PluginVersion_pluginId_version_key" ON "PluginVersion"("pluginId", "version");

-- CreateIndex
CREATE INDEX "PluginFile_pluginId_idx" ON "PluginFile"("pluginId");

-- CreateIndex
CREATE INDEX "PluginFile_versionId_idx" ON "PluginFile"("versionId");

-- CreateIndex
CREATE INDEX "PluginFile_downloadStatus_idx" ON "PluginFile"("downloadStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PluginFile_pluginId_version_key" ON "PluginFile"("pluginId", "version");

-- CreateIndex
CREATE INDEX "SyncJob_stage_idx" ON "SyncJob"("stage");

-- CreateIndex
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");

-- CreateIndex
CREATE INDEX "SyncJobProgress_jobId_idx" ON "SyncJobProgress"("jobId");

-- CreateIndex
CREATE INDEX "SyncJobProgress_createdAt_idx" ON "SyncJobProgress"("createdAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_jobId_idx" ON "SyncJobLog"("jobId");

-- CreateIndex
CREATE INDEX "SyncJobLog_createdAt_idx" ON "SyncJobLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_level_idx" ON "SyncJobLog"("level");

-- AddForeignKey
ALTER TABLE "PluginVersion" ADD CONSTRAINT "PluginVersion_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginFile" ADD CONSTRAINT "PluginFile_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginFile" ADD CONSTRAINT "PluginFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PluginVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJobProgress" ADD CONSTRAINT "SyncJobProgress_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJobLog" ADD CONSTRAINT "SyncJobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
