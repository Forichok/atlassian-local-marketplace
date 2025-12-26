-- CreateEnum for ProductType
DO $$ BEGIN
  CREATE TYPE "ProductType" AS ENUM ('JIRA', 'CONFLUENCE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add productType column to Plugin with default JIRA (if not exists)
DO $$ BEGIN
  ALTER TABLE "Plugin" ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'JIRA';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Rename version compatibility columns in PluginVersion (if not already renamed)
DO $$ BEGIN
  ALTER TABLE "PluginVersion" RENAME COLUMN "jiraMin" TO "productVersionMin";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PluginVersion" RENAME COLUMN "jiraMax" TO "productVersionMax";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

-- Add productType column to SyncJob with default JIRA (if not exists)
DO $$ BEGIN
  ALTER TABLE "SyncJob" ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'JIRA';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Drop old unique constraint on Plugin.addonKey (if exists)
DO $$ BEGIN
  ALTER TABLE "Plugin" DROP CONSTRAINT IF EXISTS "Plugin_addonKey_key";
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Drop old unique index if exists
DROP INDEX IF EXISTS "Plugin_addonKey_key";

-- Create new unique constraint on Plugin (addonKey, productType) if not exists
DO $$ BEGIN
  CREATE UNIQUE INDEX "Plugin_addonKey_productType_key" ON "Plugin"("addonKey", "productType");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Create index on Plugin.productType if not exists
DO $$ BEGIN
  CREATE INDEX "Plugin_productType_idx" ON "Plugin"("productType");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- First, remove any duplicate SyncJob entries for the same stage
-- Keep only the most recent one for each stage
DELETE FROM "SyncJob" a USING "SyncJob" b
WHERE a.stage = b.stage
  AND a."createdAt" < b."createdAt";

-- Create unique constraint on SyncJob (productType, stage) if not exists
DO $$ BEGIN
  CREATE UNIQUE INDEX "SyncJob_productType_stage_key" ON "SyncJob"("productType", "stage");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Create index on SyncJob.productType if not exists
DO $$ BEGIN
  CREATE INDEX "SyncJob_productType_idx" ON "SyncJob"("productType");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;
