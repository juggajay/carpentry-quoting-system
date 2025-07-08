-- Add user role and permissions migration
-- Run this SQL in your Supabase SQL editor

-- Add UserRole enum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');

-- Add new columns to User table
ALTER TABLE "User" 
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "role" "UserRole" DEFAULT 'VIEWER',
ADD COLUMN "isActive" BOOLEAN DEFAULT true,
ADD COLUMN "canCreateQuotes" BOOLEAN DEFAULT false,
ADD COLUMN "canEditQuotes" BOOLEAN DEFAULT false,
ADD COLUMN "canDeleteQuotes" BOOLEAN DEFAULT false,
ADD COLUMN "canViewAllQuotes" BOOLEAN DEFAULT false,
ADD COLUMN "canManageUsers" BOOLEAN DEFAULT false,
ADD COLUMN "canViewReports" BOOLEAN DEFAULT false,
ADD COLUMN "canManageSettings" BOOLEAN DEFAULT false;

-- Drop the old name column if it exists
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";

-- Update Quote table to add createdBy and assignedTo relations
ALTER TABLE "Quote" 
ADD COLUMN "createdById" TEXT,
ADD COLUMN "assignedToId" TEXT;

-- Migrate existing userId to createdById
UPDATE "Quote" SET "createdById" = "userId" WHERE "createdById" IS NULL;

-- Make createdById NOT NULL after migration
ALTER TABLE "Quote" ALTER COLUMN "createdById" SET NOT NULL;

-- Drop old userId column
ALTER TABLE "Quote" DROP COLUMN "userId";

-- Add foreign key constraints
ALTER TABLE "Quote" 
ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE,
ADD CONSTRAINT "Quote_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Add indexes
CREATE INDEX "Quote_createdById_idx" ON "Quote"("createdById");
CREATE INDEX "Quote_assignedToId_idx" ON "Quote"("assignedToId");

-- Set the first user as OWNER (optional)
UPDATE "User" 
SET "role" = 'OWNER',
    "canCreateQuotes" = true,
    "canEditQuotes" = true,
    "canDeleteQuotes" = true,
    "canViewAllQuotes" = true,
    "canManageUsers" = true,
    "canViewReports" = true,
    "canManageSettings" = true
WHERE "id" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);