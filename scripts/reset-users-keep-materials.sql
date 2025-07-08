-- Reset users but KEEP materials
-- Run this in your Supabase SQL editor

-- Step 1: Remove user references from materials (keep the materials!)
UPDATE "Material" SET "userId" = NULL;

-- Step 2: Delete all user-specific data (in correct order)
DELETE FROM "Quote";
DELETE FROM "Client";
DELETE FROM "UploadedFile";
DELETE FROM "LaborRate";
DELETE FROM "LaborRateTemplate";
DELETE FROM "User";

-- Step 3: Create the OWNER user
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
) RETURNING id;

-- Step 4: Assign all materials to the new owner (optional)
-- Uncomment this if you want to claim ownership of all materials
-- UPDATE "Material" 
-- SET "userId" = (SELECT "id" FROM "User" WHERE "clerkId" = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7');

-- Show results
SELECT 
    'User created' as status,
    "id",
    "email",
    "role"
FROM "User"
WHERE "clerkId" = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';

SELECT 
    'Materials preserved' as status,
    COUNT(*) as total_materials,
    COUNT(CASE WHEN "userId" IS NULL THEN 1 END) as unowned_materials
FROM "Material";