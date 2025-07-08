-- Reset all users and setup OWNER user
-- Run this in your Supabase SQL editor

-- Step 1: Delete all existing data (in correct order due to foreign keys)
DELETE FROM "Quote";
DELETE FROM "Client";
DELETE FROM "UploadedFile";
DELETE FROM "Material";
DELETE FROM "LaborRate";
DELETE FROM "LaborRateTemplate";
DELETE FROM "User";

-- Step 2: Create the OWNER user
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
);

-- Show the created user
SELECT 
    "id",
    "email",
    "firstName" || ' ' || "lastName" as "fullName",
    "role",
    "clerkId"
FROM "User"
WHERE "clerkId" = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';