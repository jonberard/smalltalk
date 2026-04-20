-- Server-gated public review flow hardening

ALTER TABLE review_sessions
  ADD COLUMN IF NOT EXISTS public_owner_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS private_owner_notified_at timestamptz;

CREATE TABLE IF NOT EXISTS public_rate_limit_windows (
  bucket text NOT NULL,
  identifier text NOT NULL,
  scope_key text NOT NULL DEFAULT 'global',
  window_started_at timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, identifier, scope_key)
);

CREATE OR REPLACE FUNCTION set_public_rate_limit_windows_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_public_rate_limit_windows_updated_at ON public_rate_limit_windows;
CREATE TRIGGER trg_public_rate_limit_windows_updated_at
BEFORE UPDATE ON public_rate_limit_windows
FOR EACH ROW
EXECUTE FUNCTION set_public_rate_limit_windows_updated_at();

CREATE OR REPLACE FUNCTION consume_public_rate_limit(
  p_bucket text,
  p_identifier text,
  p_scope_key text DEFAULT 'global',
  p_max_count integer DEFAULT 10,
  p_window_seconds integer DEFAULT 3600
)
RETURNS TABLE (
  allowed boolean,
  current_count integer,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scope_key text := COALESCE(NULLIF(p_scope_key, ''), 'global');
  v_window_started_at timestamptz;
  v_count integer;
BEGIN
  INSERT INTO public_rate_limit_windows (
    bucket,
    identifier,
    scope_key,
    window_started_at,
    count,
    updated_at
  )
  VALUES (
    p_bucket,
    p_identifier,
    v_scope_key,
    now(),
    1,
    now()
  )
  ON CONFLICT (bucket, identifier, scope_key)
  DO UPDATE SET
    count = CASE
      WHEN public_rate_limit_windows.window_started_at <= now() - make_interval(secs => p_window_seconds)
        THEN 1
      ELSE public_rate_limit_windows.count + 1
    END,
    window_started_at = CASE
      WHEN public_rate_limit_windows.window_started_at <= now() - make_interval(secs => p_window_seconds)
        THEN now()
      ELSE public_rate_limit_windows.window_started_at
    END,
    updated_at = now()
  RETURNING count, window_started_at
  INTO v_count, v_window_started_at;

  allowed := v_count <= p_max_count;
  current_count := v_count;
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      0,
      p_window_seconds - FLOOR(EXTRACT(EPOCH FROM (now() - v_window_started_at)))::integer
    )
  END;

  RETURN NEXT;
END;
$$;

ALTER TABLE public_rate_limit_windows ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public_rate_limit_windows FROM anon;
REVOKE ALL ON public_rate_limit_windows FROM authenticated;

-- Remove anonymous public-table access now that the review flow is server-gated
DROP POLICY IF EXISTS "anon_read_business_safe_columns" ON businesses;
DROP POLICY IF EXISTS "Anonymous can select businesses" ON businesses;

DROP POLICY IF EXISTS "anon_read_review_link_by_code" ON review_links;
DROP POLICY IF EXISTS "Anonymous can select review link by code" ON review_links;

DROP POLICY IF EXISTS "anon_read_own_session" ON review_sessions;
DROP POLICY IF EXISTS "anon_update_own_session" ON review_sessions;
DROP POLICY IF EXISTS "anon_insert_session" ON review_sessions;
DROP POLICY IF EXISTS "Anonymous can select review sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anyone can read review_sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anyone can update review_sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anonymous can update review sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anyone can insert review sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anonymous can insert review sessions" ON review_sessions;

DROP POLICY IF EXISTS "Anonymous can select services" ON services;
DROP POLICY IF EXISTS "Anonymous can select employees" ON employees;

DROP POLICY IF EXISTS "Anyone can select global default topics" ON topics;
CREATE POLICY "Authenticated can select global default topics"
  ON topics FOR SELECT TO authenticated
  USING (business_id IS NULL);

REVOKE ALL ON businesses FROM anon;
REVOKE ALL ON review_links FROM anon;
REVOKE ALL ON review_sessions FROM anon;
REVOKE ALL ON services FROM anon;
REVOKE ALL ON employees FROM anon;
REVOKE ALL ON topics FROM anon;
