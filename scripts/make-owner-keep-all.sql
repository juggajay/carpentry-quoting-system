-- Make user OWNER without deleting any data
-- Run this in your Supabase SQL editor

-- Option 1: Update existing user to OWNER
UPDATE "User"
SET 
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
WHERE "clerkId" = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';

-- Option 2: If user doesn't exist, create them
INSERT INTO "User" (
    "id",
    "clerkId",
    "email",
    "firstName",
    "lastName",
    "role",
    "isActive",
    "canCreateQuotes",
    "canEditQuotes",
    "canDeleteQuotes",
    "canViewAllQuotes",
    "canManageUsers",
    "canViewReports",
    "canManageSettings",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'user_2zP6d1S9ItBzgW0H14yQxboNGQ7',
    'jaysonryan21@hotmail.com',
    'Jayson',
    'Ryan',
    'OWNER',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("clerkId") 
DO UPDATE SET
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
    "updatedAt" = NOW();

-- Optional: Downgrade any other OWNERS to ADMIN (only one OWNER recommended)
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "role" = 'OWNER' 
AND "clerkId" != 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';

-- Show the results
SELECT 
    "id",
    "email",
    "firstName" || ' ' || "lastName" as "name",
    "role",
    CASE 
        WHEN "canManageUsers" AND "canManageSettings" THEN '✅ All permissions'
        ELSE '⚠️ Limited permissions'
    END as "permissions"
FROM "User"
WHERE "clerkId" = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';

-- Show summary
SELECT 
    COUNT(*) as "total_users",
    COUNT(CASE WHEN "role" = 'OWNER' THEN 1 END) as "owners",
    COUNT(CASE WHEN "role" = 'ADMIN' THEN 1 END) as "admins"
FROM "User";