-- AlterTable
ALTER TABLE "Plugin" ADD COLUMN     "batchNumber" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SyncJob" ADD COLUMN     "currentBatch" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Plugin_batchNumber_idx" ON "Plugin"("batchNumber");

-- CreateIndex
CREATE INDEX "SyncJob_currentBatch_idx" ON "SyncJob"("currentBatch");
