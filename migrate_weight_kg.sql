-- Add new temporary column
ALTER TABLE assign_partner ADD COLUMN weight_kg_new double precision;

-- Parse and sum the comma-separated weights
UPDATE assign_partner 
SET weight_kg_new = CAST(COALESCE((STRING_TO_ARRAY(weight_kg, ','))[1], '0') AS double precision);

-- Drop old column and rename new one
ALTER TABLE assign_partner DROP COLUMN weight_kg;
ALTER TABLE assign_partner RENAME COLUMN weight_kg_new TO weight_kg;

-- Add NOT NULL constraint and default
ALTER TABLE assign_partner ALTER COLUMN weight_kg SET DEFAULT 0;
