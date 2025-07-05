-- supabase/copy-materials.sql
-- Direct SQL script to copy materials between users in Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================
-- OPTION 1: Copy ALL materials to a specific user
-- ============================================

-- STEP 1: First, find your user ID by email
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, name FROM "User" WHERE email = 'your-email@example.com';

-- STEP 2: Copy ALL unique materials to your user
-- Replace 'YOUR-USER-ID-HERE' with the ID from step 1
WITH unique_materials AS (
  SELECT DISTINCT ON (name) 
    name,
    description,
    sku,
    supplier,
    unit,
    "pricePerUnit",
    "gstInclusive",
    category,
    "inStock",
    notes
  FROM "Material"
  ORDER BY name, "createdAt" ASC
)
INSERT INTO "Material" (
  "userId",
  name,
  description,
  sku,
  supplier,
  unit,
  "pricePerUnit",
  "gstInclusive",
  category,
  "inStock",
  notes
)
SELECT 
  'YOUR-USER-ID-HERE' as "userId",
  name,
  description,
  sku,
  supplier,
  unit,
  "pricePerUnit",
  "gstInclusive",
  category,
  "inStock",
  notes
FROM unique_materials
WHERE NOT EXISTS (
  SELECT 1 FROM "Material" m 
  WHERE m.name = unique_materials.name 
  AND m."userId" = 'YOUR-USER-ID-HERE'
);

-- ============================================
-- OPTION 2: Copy from one user to another
-- ============================================

-- Find source user ID
SELECT id, email, name FROM "User" WHERE email = 'source@example.com';

-- Find target user ID  
SELECT id, email, name FROM "User" WHERE email = 'target@example.com';

-- Copy materials from source to target
-- Replace both IDs below
INSERT INTO "Material" (
  "userId",
  name,
  description,
  sku,
  supplier,
  unit,
  "pricePerUnit",
  "gstInclusive",
  category,
  "inStock",
  notes
)
SELECT 
  'TARGET-USER-ID-HERE' as "userId",
  name,
  description,
  sku,
  supplier,
  unit,
  "pricePerUnit",
  "gstInclusive",
  category,
  "inStock",
  notes
FROM "Material"
WHERE "userId" = 'SOURCE-USER-ID-HERE'
AND name NOT IN (
  SELECT name FROM "Material" 
  WHERE "userId" = 'TARGET-USER-ID-HERE'
);

-- ============================================
-- OPTION 3: Quick copy with email lookup (all in one)
-- ============================================

-- Copy ALL materials to a user by email (replace email)
INSERT INTO "Material" (
  "userId",
  name,
  description,
  sku,
  supplier,
  unit,
  "pricePerUnit",
  "gstInclusive",
  category,
  "inStock",
  notes
)
SELECT DISTINCT ON (m.name)
  (SELECT id FROM "User" WHERE email = 'your-email@example.com') as "userId",
  m.name,
  m.description,
  m.sku,
  m.supplier,
  m.unit,
  m."pricePerUnit",
  m."gstInclusive",
  m.category,
  m."inStock",
  m.notes
FROM "Material" m
WHERE NOT EXISTS (
  SELECT 1 FROM "Material" existing 
  WHERE existing.name = m.name 
  AND existing."userId" = (SELECT id FROM "User" WHERE email = 'your-email@example.com')
)
ORDER BY m.name, m."createdAt" ASC;

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Count materials by user
SELECT 
  u.email,
  u.name,
  COUNT(m.id) as material_count
FROM "User" u
LEFT JOIN "Material" m ON u.id = m."userId"
GROUP BY u.id, u.email, u.name
ORDER BY material_count DESC;

-- See all unique material names
SELECT DISTINCT name, unit, "pricePerUnit", category 
FROM "Material" 
ORDER BY category, name;

-- Delete duplicate materials for a user
-- (keeps the oldest one)
DELETE FROM "Material" a
USING "Material" b
WHERE a.id > b.id
AND a.name = b.name
AND a."userId" = b."userId"
AND a."userId" = 'YOUR-USER-ID-HERE';