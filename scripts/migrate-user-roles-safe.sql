-- Safe migration script that checks for existing objects
-- Run this SQL in your Supabase SQL editor

-- Check and create UserRole enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');
    END IF;
END$$;

-- Add new columns to User table (only if they don't exist)
DO $$ 
BEGIN
    -- Add firstName if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'firstName') THEN
        ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
    END IF;
    
    -- Add lastName if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastName') THEN
        ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
    END IF;
    
    -- Add avatarUrl if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatarUrl') THEN
        ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
    END IF;
    
    -- Add role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') THEN
        ALTER TABLE "User" ADD COLUMN "role" "UserRole" DEFAULT 'VIEWER';
    END IF;
    
    -- Add isActive if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isActive') THEN
        ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
    
    -- Add permission columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canCreateQuotes') THEN
        ALTER TABLE "User" ADD COLUMN "canCreateQuotes" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canEditQuotes') THEN
        ALTER TABLE "User" ADD COLUMN "canEditQuotes" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canDeleteQuotes') THEN
        ALTER TABLE "User" ADD COLUMN "canDeleteQuotes" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canViewAllQuotes') THEN
        ALTER TABLE "User" ADD COLUMN "canViewAllQuotes" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canManageUsers') THEN
        ALTER TABLE "User" ADD COLUMN "canManageUsers" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canViewReports') THEN
        ALTER TABLE "User" ADD COLUMN "canViewReports" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'canManageSettings') THEN
        ALTER TABLE "User" ADD COLUMN "canManageSettings" BOOLEAN DEFAULT false;
    END IF;
END$$;

-- Drop the old name column if it exists
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";

-- Handle Quote table changes
DO $$ 
BEGIN
    -- Add createdById if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'createdById') THEN
        ALTER TABLE "Quote" ADD COLUMN "createdById" TEXT;
        
        -- Migrate existing userId to createdById if userId exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'userId') THEN
            UPDATE "Quote" SET "createdById" = "userId" WHERE "createdById" IS NULL;
            ALTER TABLE "Quote" ALTER COLUMN "createdById" SET NOT NULL;
            ALTER TABLE "Quote" DROP COLUMN "userId";
        END IF;
    END IF;
    
    -- Add assignedToId if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'assignedToId') THEN
        ALTER TABLE "Quote" ADD COLUMN "assignedToId" TEXT;
    END IF;
    
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Quote_createdById_fkey') THEN
        ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Quote_assignedToId_fkey') THEN
        ALTER TABLE "Quote" ADD CONSTRAINT "Quote_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END$$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Quote_createdById_idx" ON "Quote"("createdById");
CREATE INDEX IF NOT EXISTS "Quote_assignedToId_idx" ON "Quote"("assignedToId");

-- Set the first user as OWNER (only if no OWNER exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE "role" = 'OWNER') THEN
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
    END IF;
END$$;

-- Show current status
SELECT 
    'Migration Complete!' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'OWNER' THEN 1 END) as owners,
    COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
FROM "User";