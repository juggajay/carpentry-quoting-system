-- Create Settings table for storing user/company default settings
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "abn" TEXT,
    "defaultTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "defaultValidityDays" INTEGER NOT NULL DEFAULT 30,
    "defaultTermsConditions" TEXT,
    "defaultNotes" TEXT,
    "defaultUnit" "Unit" NOT NULL DEFAULT 'EA',
    "saturdayRateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "sundayRateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId (one settings record per user)
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- Create index for faster lookups
CREATE INDEX "Settings_userId_idx" ON "Settings"("userId");

-- Add foreign key constraint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;