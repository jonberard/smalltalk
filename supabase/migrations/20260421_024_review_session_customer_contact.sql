ALTER TABLE review_sessions
ADD COLUMN IF NOT EXISTS customer_contact text;
