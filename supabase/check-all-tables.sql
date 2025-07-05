-- Run this in Supabase SQL Editor to see ALL your tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Also check if there's a schema.sql or migration file
-- that shows the expected table structure