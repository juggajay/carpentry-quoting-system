-- Insert Labor Rates for your user
-- First get your user ID:
SELECT * FROM auth.users WHERE email = 'jaysonryan21@hotmail.com';
-- Replace YOUR-USER-ID below with your actual user ID

INSERT INTO public."LaborRate" ("userId", "title", "level", "baseRate", "loadedRate", "saturdayRate", "sundayRate", "effectiveDate") VALUES
('YOUR-USER-ID', 'Carpenter', 'CW3', 45.50, 68.25, 68.25, 91.00, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Carpenter', 'CW2', 42.80, 64.20, 64.20, 85.60, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Leading Hand', '', 49.50, 74.25, 74.25, 99.00, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Apprentice', '1st Year', 22.75, 34.13, 34.13, 45.50, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Apprentice', '2nd Year', 27.30, 40.95, 40.95, 54.60, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Apprentice', '3rd Year', 36.40, 54.60, 54.60, 72.80, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Apprentice', '4th Year', 40.95, 61.43, 61.43, 81.90, CURRENT_TIMESTAMP),
('YOUR-USER-ID', 'Labourer', 'CW1', 35.20, 52.80, 52.80, 70.40, CURRENT_TIMESTAMP)
ON CONFLICT ("title", "level", "userId") DO NOTHING;

-- Verify your data
SELECT COUNT(*) as material_count FROM public."Material" WHERE "userId" = 'YOUR-USER-ID';
SELECT COUNT(*) as labor_count FROM public."LaborRate" WHERE "userId" = 'YOUR-USER-ID';