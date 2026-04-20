-- Private feedback handling and public recourse support

ALTER TABLE review_sessions
  ADD COLUMN IF NOT EXISTS private_feedback_status text NOT NULL DEFAULT 'new'
    CHECK (private_feedback_status IN ('new', 'handled')),
  ADD COLUMN IF NOT EXISTS private_feedback_handled_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_private_feedback_session_id uuid
    REFERENCES review_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_review_sessions_private_feedback_status
  ON review_sessions (review_link_id, private_feedback_status, updated_at DESC)
  WHERE feedback_type = 'private';

CREATE INDEX IF NOT EXISTS idx_review_sessions_parent_private_feedback
  ON review_sessions (parent_private_feedback_session_id)
  WHERE parent_private_feedback_session_id IS NOT NULL;
