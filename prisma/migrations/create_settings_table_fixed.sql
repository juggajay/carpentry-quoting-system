-- Create Settings table for storing user/company default settings
-- First, check if Unit enum type exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Unit') THEN
        CREATE TYPE "Unit" AS ENUM ('EA', 'M', 'M2', 'M3', 'LM', 'L', 'KG', 'HOUR', 'DAY', 'WEEK');
    END IF;
END$$;

-- Create Settings table
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "abn" TEXT,
    "defaultTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "defaultValidityDays" INTEGER NOT NULL DEFAULT 30,
    "defaultTermsConditions" TEXT,
    "defaultNotes" TEXT,
    "defaultUnit" "Unit" NOT NULL DEFAULT 'EA'::"Unit",
    "saturdayRateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "sundayRateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId (one settings record per user)
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_userId_key" ON "Settings"("userId");

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "Settings_userId_idx" ON "Settings"("userId");

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Settings_userId_fkey'
    ) THEN
        ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to Settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON "Settings";
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON "Settings" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();