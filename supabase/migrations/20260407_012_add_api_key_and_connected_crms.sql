-- Add API key and connected CRMs to businesses table for CRM integration

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS api_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS connected_crms jsonb NOT NULL DEFAULT '{}';

-- Index on api_key for fast webhook auth lookups
CREATE INDEX IF NOT EXISTS idx_businesses_api_key ON businesses (api_key) WHERE api_key IS NOT NULL;

-- Add source column to review_links for analytics
ALTER TABLE review_links
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
