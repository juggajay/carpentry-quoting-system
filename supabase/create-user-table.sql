-- Check if User table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'User';

-- If it doesn't exist, create it:
CREATE TABLE IF NOT EXISTS public."User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clerkId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for clerk ID lookups
CREATE INDEX IF NOT EXISTS "User_clerkId_idx" ON public."User"("clerkId");

-- If you need to manually create your user record:
-- Get your auth.users ID first
SELECT id FROM auth.users WHERE email = 'jaysonryan21@hotmail.com';

-- Then insert into User table (replace the IDs):
-- INSERT INTO public."User" ("id", "clerkId", "email", "name") VALUES
-- ('YOUR-AUTH-USER-ID', 'YOUR-CLERK-ID', 'jaysonryan21@hotmail.com', 'Your Name');