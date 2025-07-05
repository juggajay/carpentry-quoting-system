-- Create the Material table based on your Prisma schema
CREATE TABLE IF NOT EXISTS public."Material" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sku" TEXT,
  "supplier" TEXT,
  "unit" TEXT NOT NULL,
  "pricePerUnit" DOUBLE PRECISION NOT NULL,
  "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
  "category" TEXT,
  "inStock" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the LaborRate table
CREATE TABLE IF NOT EXISTS public."LaborRate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "level" TEXT,
  "baseRate" DOUBLE PRECISION NOT NULL,
  "loadedRate" DOUBLE PRECISION NOT NULL,
  "saturdayRate" DOUBLE PRECISION,
  "sundayRate" DOUBLE PRECISION,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Material_name_userId_key" ON public."Material"("name", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "LaborRate_title_level_userId_key" ON public."LaborRate"("title", "level", "userId");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Material_userId_idx" ON public."Material"("userId");
CREATE INDEX IF NOT EXISTS "Material_category_idx" ON public."Material"("category");
CREATE INDEX IF NOT EXISTS "LaborRate_userId_idx" ON public."LaborRate"("userId");