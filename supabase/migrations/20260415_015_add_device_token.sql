-- Add device_token to review_sessions for per-device session isolation
ALTER TABLE review_sessions ADD COLUMN IF NOT EXISTS device_token text;
