-- Reminder sequence foundation for review request follow-ups

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS reminder_sequence_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours_start integer DEFAULT 21 CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23),
  ADD COLUMN IF NOT EXISTS quiet_hours_end integer DEFAULT 9 CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23),
  ADD COLUMN IF NOT EXISTS business_timezone text DEFAULT 'America/Chicago';

ALTER TABLE review_links
  ADD COLUMN IF NOT EXISTS reminder_sequence_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sequence_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS initial_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS review_message_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_link_id uuid NOT NULL REFERENCES review_links(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  kind text NOT NULL CHECK (kind IN ('initial', 'reminder_1', 'reminder_2')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  claimed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  provider_sid text,
  last_error text,
  skipped_reason text,
  to_address text NOT NULL,
  normalized_phone text,
  message_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_unique_kind
  ON review_message_deliveries (review_link_id, channel, kind);

CREATE INDEX IF NOT EXISTS idx_deliveries_pending
  ON review_message_deliveries (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deliveries_link
  ON review_message_deliveries (review_link_id);

CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_opt_outs_global
  ON sms_opt_outs (phone_number)
  WHERE business_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opt_outs_scoped
  ON sms_opt_outs (phone_number, business_id)
  WHERE business_id IS NOT NULL;

CREATE OR REPLACE FUNCTION set_review_message_delivery_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_message_deliveries_updated_at ON review_message_deliveries;
CREATE TRIGGER trg_review_message_deliveries_updated_at
BEFORE UPDATE ON review_message_deliveries
FOR EACH ROW
EXECUTE FUNCTION set_review_message_delivery_updated_at();

CREATE OR REPLACE FUNCTION mark_link_sequence_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'copied' THEN
    UPDATE review_links
    SET sequence_completed = true
    WHERE id = NEW.review_link_id
      AND sequence_completed = false;
  ELSIF NEW.feedback_type = 'private'
    AND btrim(coalesce(NEW.optional_text, '')) <> '' THEN
    UPDATE review_links
    SET sequence_completed = true
    WHERE id = NEW.review_link_id
      AND sequence_completed = false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_link_complete ON review_sessions;
CREATE TRIGGER trg_mark_link_complete
AFTER INSERT OR UPDATE ON review_sessions
FOR EACH ROW
EXECUTE FUNCTION mark_link_sequence_complete();

CREATE OR REPLACE FUNCTION claim_due_reminder_deliveries(p_limit integer DEFAULT 50)
RETURNS SETOF review_message_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE review_message_deliveries
  SET claimed_at = now(),
      updated_at = now()
  WHERE id IN (
    SELECT id
    FROM review_message_deliveries
    WHERE status = 'pending'
      AND kind IN ('reminder_1', 'reminder_2')
      AND scheduled_for <= now()
      AND (claimed_at IS NULL OR claimed_at < now() - interval '10 minutes')
      AND attempt_count < 3
    ORDER BY scheduled_for ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

ALTER TABLE review_message_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own review deliveries" ON review_message_deliveries;
CREATE POLICY "Users can select own review deliveries" ON review_message_deliveries
  FOR SELECT TO authenticated USING (business_id = auth.uid());

ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON review_message_deliveries FROM anon;
REVOKE ALL ON review_message_deliveries FROM authenticated;
GRANT SELECT ON review_message_deliveries TO authenticated;

REVOKE ALL ON sms_opt_outs FROM anon;
REVOKE ALL ON sms_opt_outs FROM authenticated;

GRANT UPDATE (reminder_sequence_enabled, quiet_hours_start, quiet_hours_end, business_timezone)
  ON businesses TO authenticated;
