-- Add reply voice settings to businesses
ALTER TABLE businesses ADD COLUMN reply_voice_id text DEFAULT 'warm';
ALTER TABLE businesses ADD COLUMN custom_reply_voice text;

-- Add reply tracking to review sessions
ALTER TABLE review_sessions ADD COLUMN reply_text text;
ALTER TABLE review_sessions ADD COLUMN replied_at timestamptz;
