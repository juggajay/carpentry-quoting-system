-- Fix database schema to match Prisma schema

-- Add missing columns to Quote table
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "termsConditions" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "versionNumber" INTEGER DEFAULT 1;

-- Fix UploadedFile table columns
ALTER TABLE "UploadedFile" ADD COLUMN IF NOT EXISTS "ocrResult" JSONB;
ALTER TABLE "UploadedFile" ADD COLUMN IF NOT EXISTS "processingError" TEXT;

-- Drop columns that don't exist in Prisma schema
ALTER TABLE "UploadedFile" DROP COLUMN IF EXISTS "extractedText";

-- Fix QuoteItem columns
ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;
ALTER TABLE "QuoteItem" DROP COLUMN IF EXISTS "order";

-- Fix QuoteVersion columns
ALTER TABLE "QuoteVersion" ADD COLUMN IF NOT EXISTS "versionNumber" INTEGER;
ALTER TABLE "QuoteVersion" ADD COLUMN IF NOT EXISTS "changes" JSONB;
ALTER TABLE "QuoteVersion" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "QuoteVersion" DROP COLUMN IF EXISTS "version";
ALTER TABLE "QuoteVersion" DROP COLUMN IF EXISTS "snapshot";

-- Fix Client columns
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Create proper indexes
CREATE INDEX IF NOT EXISTS "QuoteItem_sortOrder_idx" ON "QuoteItem"("sortOrder");
DROP INDEX IF EXISTS "QuoteItem_order_idx";

-- Update the unique constraint on QuoteVersion
ALTER TABLE "QuoteVersion" DROP CONSTRAINT IF EXISTS "QuoteVersion_quoteId_version_key";
CREATE UNIQUE INDEX IF NOT EXISTS "QuoteVersion_quoteId_versionNumber_key" ON "QuoteVersion"("quoteId", "versionNumber");