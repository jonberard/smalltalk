-- Atomic increment for review generation count
-- Returns the new count on success, or -1 if the cap was already reached
CREATE OR REPLACE FUNCTION increment_generation_count(p_session_id uuid, p_max_count int)
RETURNS int AS $$
DECLARE current_count int;
BEGIN
  UPDATE review_sessions
  SET generation_count = generation_count + 1
  WHERE id = p_session_id AND generation_count < p_max_count
  RETURNING generation_count INTO current_count;

  IF current_count IS NULL THEN
    SELECT generation_count INTO current_count FROM review_sessions WHERE id = p_session_id;
    RETURN -1;
  END IF;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- Atomic increment for reply generation count
-- Returns the new count on success, or -1 if the cap was already reached
CREATE OR REPLACE FUNCTION increment_reply_generation_count(p_session_id uuid, p_max_count int)
RETURNS int AS $$
DECLARE current_count int;
BEGIN
  UPDATE review_sessions
  SET reply_generation_count = reply_generation_count + 1
  WHERE id = p_session_id AND reply_generation_count < p_max_count
  RETURNING reply_generation_count INTO current_count;

  IF current_count IS NULL THEN
    SELECT reply_generation_count INTO current_count FROM review_sessions WHERE id = p_session_id;
    RETURN -1;
  END IF;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql;
