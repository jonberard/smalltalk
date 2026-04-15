-- Add generation counters to review_sessions for rate limiting AI calls
ALTER TABLE review_sessions ADD COLUMN IF NOT EXISTS generation_count integer NOT NULL DEFAULT 0;
ALTER TABLE review_sessions ADD COLUMN IF NOT EXISTS reply_generation_count integer NOT NULL DEFAULT 0;
