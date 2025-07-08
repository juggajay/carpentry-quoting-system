-- Fix existing user and make them OWNER
-- Run this in your Supabase SQL editor

-- First, let's see what's in the database
SELECT "id", "clerkId", "email", "role", "firstName", "lastName"
FROM "User"
WHERE "email" = 'jaysonryan21@hotmail.com';

-- Update the existing user with your email to have the correct Clerk ID and OWNER role
UPDATE "User"
SET 
    "clerkId" = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7',
    "role" = 'OWNER',
    "isActive" = true,
    "canCreateQuotes" = true,
    "canEditQuotes" = true,
    "canDeleteQuotes" = true,
    "canViewAllQuotes" = true,
    "canManageUsers" = true,
    "canViewReports" = true,
    "canManageSettings" = true,
    "firstName" = 'Jayson',
    "lastName" = 'Ryan',
    "updatedAt" = NOW()
WHERE "email" = 'jaysonryan21@hotmail.com';

-- Optional: Downgrade any other OWNERS to ADMIN
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "role" = 'OWNER' 
AND "email" != 'jaysonryan21@hotmail.com';

-- Show the final result
SELECT 
    "id",
    "clerkId",
    "email",
    "firstName" || ' ' || "lastName" as "name",
    "role",
    CASE 
        WHEN "canManageUsers" AND "canManageSettings" THEN '✅ All permissions'
        ELSE '⚠️ Limited permissions'
    END as "permissions"
FROM "User"
WHERE "email" = 'jaysonryan21@hotmail.com';

-- Summary
SELECT 
    'Summary' as info,
    COUNT(*) as "total_users",
    COUNT(CASE WHEN "role" = 'OWNER' THEN 1 END) as "owners",
    COUNT(CASE WHEN "role" = 'ADMIN' THEN 1 END) as "admins"
FROM "User";