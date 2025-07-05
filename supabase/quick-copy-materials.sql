-- supabase/quick-copy-materials.sql
-- SUPER SIMPLE: Just change the email and run!
-- This copies ALL unique materials to your account

-- 🚀 CHANGE THIS EMAIL TO YOUR EMAIL, THEN RUN THE WHOLE SCRIPT
DO $$
DECLARE
  target_email TEXT := 'your-email@example.com';  -- ← CHANGE THIS!
  target_user_id UUID;
  copied_count INT;
BEGIN
  -- Find the user
  SELECT id INTO target_user_id 
  FROM "User" 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %. Make sure you have signed in at least once!', target_email;
  END IF;
  
  -- Copy all unique materials
  WITH unique_materials AS (
    SELECT DISTINCT ON (name) *
    FROM "Material"
    ORDER BY name, "createdAt" ASC
  ),
  inserted AS (
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
      target_user_id,
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
      AND m."userId" = target_user_id
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO copied_count FROM inserted;
  
  RAISE NOTICE '✅ Successfully copied % materials to %', copied_count, target_email;
END $$;

-- Show what you now have
SELECT 
  COUNT(*) as total_materials,
  COUNT(DISTINCT category) as categories,
  MIN("pricePerUnit") as cheapest_item,
  MAX("pricePerUnit") as most_expensive_item
FROM "Material"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'your-email@example.com'); -- ← CHANGE THIS TOO!