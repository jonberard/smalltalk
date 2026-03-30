-- Add voice_id column to review_sessions to track which writing style was used
alter table review_sessions add column voice_id text;
