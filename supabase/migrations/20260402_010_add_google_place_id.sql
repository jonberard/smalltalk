-- Add google_place_id, business_city, and neighborhoods columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_city TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS neighborhoods TEXT[];
