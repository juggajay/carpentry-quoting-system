-- Create Settings table
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "abn" TEXT,
    "defaultTaxRate" DOUBLE PRECISION DEFAULT 10,
    "defaultValidityDays" INTEGER DEFAULT 30,
    "defaultTermsConditions" TEXT,
    "defaultNotes" TEXT,
    "defaultUnit" TEXT DEFAULT 'EA',
    "saturdayRateMultiplier" DOUBLE PRECISION DEFAULT 1.5,
    "sundayRateMultiplier" DOUBLE PRECISION DEFAULT 2.0,
    "userId" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key
ALTER TABLE "Settings" 
ADD CONSTRAINT "Settings_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;