-- Direct insert with your email - no user lookup needed
-- This assumes you'll manually provide your user ID

-- First, check if you have a User table and get your ID:
SELECT * FROM auth.users WHERE email = 'jaysonryan21@hotmail.com';
-- Copy the ID from the result above and replace YOUR-USER-ID below

-- GL Timber Beams - Per Linear Meter
INSERT INTO public."Material" ("userId", "name", "description", "sku", "supplier", "unit", "pricePerUnit", "gstInclusive", "category", "inStock") VALUES
('YOUR-USER-ID', '165x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 165x65mm, H3 Treated, GL15C Grade', 'GL-165x65-H3', 'Timber Supplier', 'LM', 101.60, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '195x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 195x65mm, H3 Treated, GL15C Grade', 'GL-195x65-H3', 'Timber Supplier', 'LM', 117.20, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '230x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 230x65mm, H3 Treated, GL15C Grade', 'GL-230x65-H3', 'Timber Supplier', 'LM', 132.25, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '260x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 260x65mm, H3 Treated, GL15C Grade', 'GL-260x65-H3', 'Timber Supplier', 'LM', 155.90, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '295x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 295x65mm, H3 Treated, GL15C Grade', 'GL-295x65-H3', 'Timber Supplier', 'LM', 167.70, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '330x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 330x65mm, H3 Treated, GL15C Grade', 'GL-330x65-H3', 'Timber Supplier', 'LM', 185.45, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '360x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 360x65mm, H3 Treated, GL15C Grade', 'GL-360x65-H3', 'Timber Supplier', 'LM', 212.30, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '395x65 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 395x65mm, H3 Treated, GL15C Grade', 'GL-395x65-H3', 'Timber Supplier', 'LM', 233.25, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '195x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 195x85mm, H3 Treated, GL15C Grade', 'GL-195x85-H3', 'Timber Supplier', 'LM', 146.75, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '230x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 230x85mm, H3 Treated, GL15C Grade', 'GL-230x85-H3', 'Timber Supplier', 'LM', 170.90, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '260x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 260x85mm, H3 Treated, GL15C Grade', 'GL-260x85-H3', 'Timber Supplier', 'LM', 188.70, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '295x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 295x85mm, H3 Treated, GL15C Grade', 'GL-295x85-H3', 'Timber Supplier', 'LM', 203.70, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '330x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 330x85mm, H3 Treated, GL15C Grade', 'GL-330x85-H3', 'Timber Supplier', 'LM', 230.60, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '360x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 360x85mm, H3 Treated, GL15C Grade', 'GL-360x85-H3', 'Timber Supplier', 'LM', 286.50, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '395x85 H3 GL15C Pine Beam', 'Glue Laminated Pine Beam 395x85mm, H3 Treated, GL15C Grade', 'GL-395x85-H3', 'Timber Supplier', 'LM', 312.85, true, 'Structural Timber - GL Beams', true)
ON CONFLICT ("name", "userId") DO NOTHING;

-- GL Timber Beams - 2.4m Lengths
INSERT INTO public."Material" ("userId", "name", "description", "sku", "supplier", "unit", "pricePerUnit", "gstInclusive", "category", "inStock") VALUES
('YOUR-USER-ID', '165x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 165x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-165x65-H3-2400', 'Timber Supplier', 'EA', 243.84, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '195x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 195x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-195x65-H3-2400', 'Timber Supplier', 'EA', 281.28, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '230x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 230x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-230x65-H3-2400', 'Timber Supplier', 'EA', 317.40, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '260x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 260x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-260x65-H3-2400', 'Timber Supplier', 'EA', 374.16, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '295x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 295x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-295x65-H3-2400', 'Timber Supplier', 'EA', 402.48, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '330x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 330x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-330x65-H3-2400', 'Timber Supplier', 'EA', 445.08, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '360x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 360x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-360x65-H3-2400', 'Timber Supplier', 'EA', 509.52, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '395x65 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 395x65mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-395x65-H3-2400', 'Timber Supplier', 'EA', 559.80, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '195x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 195x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-195x85-H3-2400', 'Timber Supplier', 'EA', 352.20, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '230x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 230x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-230x85-H3-2400', 'Timber Supplier', 'EA', 410.16, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '260x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 260x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-260x85-H3-2400', 'Timber Supplier', 'EA', 452.88, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '295x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 295x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-295x85-H3-2400', 'Timber Supplier', 'EA', 488.88, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '330x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 330x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-330x85-H3-2400', 'Timber Supplier', 'EA', 553.44, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '360x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 360x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-360x85-H3-2400', 'Timber Supplier', 'EA', 687.60, true, 'Structural Timber - GL Beams', true),
('YOUR-USER-ID', '395x85 H3 GL15C Pine Beam - 2.4m Length', 'Glue Laminated Pine Beam 395x85mm, H3 Treated, GL15C Grade - Full 2.4m Length', 'GL-395x85-H3-2400', 'Timber Supplier', 'EA', 750.84, true, 'Structural Timber - GL Beams', true)
ON CONFLICT ("name", "userId") DO NOTHING;

-- Common Materials
INSERT INTO public."Material" ("userId", "name", "unit", "pricePerUnit", "category", "supplier", "gstInclusive", "inStock") VALUES
('YOUR-USER-ID', '90x45 MGP10 Pine', 'LM', 8.50, 'Framing Timber', 'Bunnings', true, true),
('YOUR-USER-ID', '70x35 MGP10 Pine', 'LM', 5.20, 'Framing Timber', 'Bunnings', true, true),
('YOUR-USER-ID', '140x45 MGP10 Pine', 'LM', 13.80, 'Framing Timber', 'Bunnings', true, true),
('YOUR-USER-ID', '190x45 MGP10 Pine', 'LM', 18.90, 'Framing Timber', 'Bunnings', true, true),
('YOUR-USER-ID', 'Plywood Structural 17mm F11', 'SQM', 65.00, 'Sheet Materials', 'Bunnings', true, true),
('YOUR-USER-ID', 'Plywood Structural 12mm F11', 'SQM', 45.00, 'Sheet Materials', 'Bunnings', true, true),
('YOUR-USER-ID', 'Villaboard 6mm', 'SQM', 28.50, 'Sheet Materials', 'Bunnings', true, true),
('YOUR-USER-ID', 'Joist Hanger 90x45', 'EA', 3.50, 'Hardware', 'Bunnings', true, true),
('YOUR-USER-ID', 'Joist Hanger 140x45', 'EA', 5.20, 'Hardware', 'Bunnings', true, true),
('YOUR-USER-ID', 'Triple Grip 100x10mm', 'EA', 0.85, 'Fixings', 'Bunnings', true, true),
('YOUR-USER-ID', 'Dynabolts M12x100', 'EA', 2.20, 'Fixings', 'Bunnings', true, true)
ON CONFLICT ("name", "userId") DO NOTHING;