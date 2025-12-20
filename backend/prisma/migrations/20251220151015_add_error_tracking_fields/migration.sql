-- AlterTable
ALTER TABLE "SyncJob" ADD COLUMN     "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "failedPluginKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
