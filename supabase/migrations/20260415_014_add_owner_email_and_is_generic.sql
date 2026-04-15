-- Add owner_email to businesses for direct email lookup (replaces broken owner_id join)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email text;

-- Add is_generic flag to review_links for reusable QR/generic links
ALTER TABLE review_links ADD COLUMN IF NOT EXISTS is_generic boolean NOT NULL DEFAULT false;
