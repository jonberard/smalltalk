ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS current_billing_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_billing_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS extra_request_credits integer NOT NULL DEFAULT 0
    CHECK (extra_request_credits >= 0);

CREATE TABLE IF NOT EXISTS request_reload_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  credits integer NOT NULL CHECK (credits > 0),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  cycle_start_at timestamptz NOT NULL DEFAULT now(),
  cycle_end_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE request_reload_purchases
  ADD COLUMN IF NOT EXISTS cycle_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS cycle_end_at timestamptz;

UPDATE request_reload_purchases
SET
  cycle_start_at = COALESCE(cycle_start_at, created_at),
  cycle_end_at = COALESCE(cycle_end_at, created_at)
WHERE cycle_start_at IS NULL OR cycle_end_at IS NULL;

ALTER TABLE request_reload_purchases
  ALTER COLUMN cycle_start_at SET DEFAULT now(),
  ALTER COLUMN cycle_end_at SET DEFAULT now(),
  ALTER COLUMN cycle_start_at SET NOT NULL,
  ALTER COLUMN cycle_end_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_request_reload_purchases_business_created
  ON request_reload_purchases (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS request_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_link_id uuid UNIQUE REFERENCES review_links(id) ON DELETE SET NULL,
  review_session_id uuid UNIQUE REFERENCES review_sessions(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('personalized_request', 'shared_public_draft')),
  allowance_bucket text NOT NULL CHECK (allowance_bucket IN ('trial', 'included', 'extra')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((review_link_id IS NOT NULL) <> (review_session_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_request_usage_events_business_created
  ON request_usage_events (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_usage_events_business_source_created
  ON request_usage_events (business_id, source, created_at DESC);

ALTER TABLE request_reload_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_request_reload_purchases" ON request_reload_purchases;
CREATE POLICY "owner_read_request_reload_purchases" ON request_reload_purchases
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

DROP POLICY IF EXISTS "owner_read_request_usage_events" ON request_usage_events;
CREATE POLICY "owner_read_request_usage_events" ON request_usage_events
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

GRANT SELECT ON request_reload_purchases TO authenticated;
GRANT SELECT ON request_usage_events TO authenticated;

CREATE OR REPLACE FUNCTION consume_request_allowance(
  p_business_id uuid,
  p_source text,
  p_review_link_id uuid DEFAULT NULL,
  p_review_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business record;
  v_existing request_usage_events%ROWTYPE;
  v_trial_total integer := 10;
  v_trial_remaining integer := 0;
  v_trial_active boolean := false;
  v_used_current_cycle integer := 0;
  v_included_remaining integer := 0;
  v_extra_remaining integer := 0;
BEGIN
  IF p_source NOT IN ('personalized_request', 'shared_public_draft') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_source');
  END IF;

  IF (p_review_link_id IS NULL AND p_review_session_id IS NULL)
    OR (p_review_link_id IS NOT NULL AND p_review_session_id IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_target');
  END IF;

  SELECT
    id,
    subscription_status,
    trial_requests_remaining,
    trial_ends_at,
    current_billing_period_start,
    current_billing_period_end,
    extra_request_credits
  INTO v_business
  FROM businesses
  WHERE id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'business_not_found');
  END IF;

  IF p_review_link_id IS NOT NULL THEN
    SELECT *
    INTO v_existing
    FROM request_usage_events
    WHERE review_link_id = p_review_link_id
    LIMIT 1;
  ELSE
    SELECT *
    INTO v_existing
    FROM request_usage_events
    WHERE review_session_id = p_review_session_id
    LIMIT 1;
  END IF;

  IF v_business.subscription_status = 'trial' THEN
    v_trial_remaining := GREATEST(v_business.trial_requests_remaining, 0);

    IF v_existing.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'ok', true,
        'already_counted', true,
        'plan_kind', 'trial',
        'remaining', v_trial_remaining,
        'used', GREATEST(v_trial_total - v_trial_remaining, 0),
        'total', v_trial_total
      );
    END IF;

    v_trial_active :=
      v_business.trial_ends_at IS NULL
      OR v_business.trial_ends_at > now();

    IF NOT v_trial_active OR v_trial_remaining <= 0 THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'trial_exhausted',
        'plan_kind', 'trial',
        'remaining', v_trial_remaining,
        'used', GREATEST(v_trial_total - v_trial_remaining, 0),
        'total', v_trial_total
      );
    END IF;

    INSERT INTO request_usage_events (
      business_id,
      review_link_id,
      review_session_id,
      source,
      allowance_bucket
    )
    VALUES (
      p_business_id,
      p_review_link_id,
      p_review_session_id,
      p_source,
      'trial'
    );

    UPDATE businesses
    SET trial_requests_remaining = GREATEST(trial_requests_remaining - 1, 0)
    WHERE id = p_business_id;

    v_trial_remaining := GREATEST(v_business.trial_requests_remaining - 1, 0);

    RETURN jsonb_build_object(
      'ok', true,
      'already_counted', false,
      'plan_kind', 'trial',
      'remaining', v_trial_remaining,
      'used', GREATEST(v_trial_total - v_trial_remaining, 0),
      'total', v_trial_total
    );
  END IF;

  IF v_business.subscription_status IN ('active', 'trialing', 'past_due', 'incomplete') THEN
    IF v_business.current_billing_period_start IS NULL
      OR v_business.current_billing_period_end IS NULL THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'missing_billing_period',
        'plan_kind', 'paid'
      );
    END IF;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_used_current_cycle
    FROM request_usage_events
    WHERE business_id = p_business_id
      AND created_at >= v_business.current_billing_period_start
      AND created_at < v_business.current_billing_period_end;

    v_included_remaining := GREATEST(500 - v_used_current_cycle, 0);
    v_extra_remaining := GREATEST(v_business.extra_request_credits, 0);

    IF v_existing.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'ok', true,
        'already_counted', true,
        'plan_kind', 'paid',
        'included', 500,
        'included_remaining', v_included_remaining,
        'extra', v_extra_remaining,
        'used', v_used_current_cycle,
        'total', v_used_current_cycle + v_included_remaining + v_extra_remaining,
        'remaining', v_included_remaining + v_extra_remaining,
        'cycle_start', v_business.current_billing_period_start,
        'cycle_end', v_business.current_billing_period_end
      );
    END IF;

    IF v_included_remaining > 0 THEN
      INSERT INTO request_usage_events (
        business_id,
        review_link_id,
        review_session_id,
        source,
        allowance_bucket
      )
      VALUES (
        p_business_id,
        p_review_link_id,
        p_review_session_id,
        p_source,
        'included'
      );

      v_used_current_cycle := v_used_current_cycle + 1;
      v_included_remaining := GREATEST(500 - v_used_current_cycle, 0);

      RETURN jsonb_build_object(
        'ok', true,
        'already_counted', false,
        'plan_kind', 'paid',
        'included', 500,
        'included_remaining', v_included_remaining,
        'extra', v_extra_remaining,
        'used', v_used_current_cycle,
        'total', v_used_current_cycle + v_included_remaining + v_extra_remaining,
        'remaining', v_included_remaining + v_extra_remaining,
        'cycle_start', v_business.current_billing_period_start,
        'cycle_end', v_business.current_billing_period_end
      );
    END IF;

    IF v_extra_remaining <= 0 THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'request_limit_reached',
        'plan_kind', 'paid',
        'included', 500,
        'included_remaining', 0,
        'extra', 0,
        'used', v_used_current_cycle,
        'total', v_used_current_cycle,
        'remaining', 0,
        'cycle_start', v_business.current_billing_period_start,
        'cycle_end', v_business.current_billing_period_end
      );
    END IF;

    UPDATE businesses
    SET extra_request_credits = extra_request_credits - 1
    WHERE id = p_business_id
    RETURNING extra_request_credits INTO v_extra_remaining;

    INSERT INTO request_usage_events (
      business_id,
      review_link_id,
      review_session_id,
      source,
      allowance_bucket
    )
    VALUES (
      p_business_id,
      p_review_link_id,
      p_review_session_id,
      p_source,
      'extra'
    );

    v_used_current_cycle := v_used_current_cycle + 1;

    RETURN jsonb_build_object(
      'ok', true,
      'already_counted', false,
      'plan_kind', 'paid',
      'included', 500,
      'included_remaining', 0,
      'extra', v_extra_remaining,
      'used', v_used_current_cycle,
      'total', v_used_current_cycle + v_extra_remaining,
      'remaining', v_extra_remaining,
      'cycle_start', v_business.current_billing_period_start,
      'cycle_end', v_business.current_billing_period_end
    );
  END IF;

  RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
END;
$$;

CREATE OR REPLACE FUNCTION release_request_allowance(
  p_business_id uuid,
  p_review_link_id uuid DEFAULT NULL,
  p_review_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business record;
  v_event request_usage_events%ROWTYPE;
  v_trial_total integer := 10;
  v_trial_remaining integer := 0;
  v_used_current_cycle integer := 0;
  v_included_remaining integer := 0;
  v_extra_remaining integer := 0;
BEGIN
  IF (p_review_link_id IS NULL AND p_review_session_id IS NULL)
    OR (p_review_link_id IS NOT NULL AND p_review_session_id IS NOT NULL) THEN
    RETURN jsonb_build_object('released', false, 'reason', 'invalid_target');
  END IF;

  SELECT
    id,
    subscription_status,
    trial_requests_remaining,
    current_billing_period_start,
    current_billing_period_end,
    extra_request_credits
  INTO v_business
  FROM businesses
  WHERE id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('released', false, 'reason', 'business_not_found');
  END IF;

  IF p_review_link_id IS NOT NULL THEN
    DELETE FROM request_usage_events
    WHERE business_id = p_business_id
      AND review_link_id = p_review_link_id
    RETURNING * INTO v_event;
  ELSE
    DELETE FROM request_usage_events
    WHERE business_id = p_business_id
      AND review_session_id = p_review_session_id
    RETURNING * INTO v_event;
  END IF;

  IF v_event.id IS NULL THEN
    RETURN jsonb_build_object('released', false, 'reason', 'not_found');
  END IF;

  IF v_event.allowance_bucket = 'trial' THEN
    UPDATE businesses
    SET trial_requests_remaining = LEAST(trial_requests_remaining + COALESCE(v_event.quantity, 1), v_trial_total)
    WHERE id = p_business_id
    RETURNING trial_requests_remaining INTO v_trial_remaining;

    RETURN jsonb_build_object(
      'released', true,
      'plan_kind', 'trial',
      'remaining', v_trial_remaining,
      'used', GREATEST(v_trial_total - v_trial_remaining, 0),
      'total', v_trial_total
    );
  END IF;

  IF v_event.allowance_bucket = 'extra' THEN
    UPDATE businesses
    SET extra_request_credits = extra_request_credits + COALESCE(v_event.quantity, 1)
    WHERE id = p_business_id
    RETURNING extra_request_credits INTO v_extra_remaining;
  ELSE
    v_extra_remaining := GREATEST(v_business.extra_request_credits, 0);
  END IF;

  IF v_business.current_billing_period_start IS NOT NULL
    AND v_business.current_billing_period_end IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_used_current_cycle
    FROM request_usage_events
    WHERE business_id = p_business_id
      AND created_at >= v_business.current_billing_period_start
      AND created_at < v_business.current_billing_period_end;
  END IF;

  v_included_remaining := GREATEST(500 - v_used_current_cycle, 0);

  RETURN jsonb_build_object(
    'released', true,
    'plan_kind', 'paid',
    'included_remaining', v_included_remaining,
    'extra', v_extra_remaining,
    'used', v_used_current_cycle,
    'remaining', v_included_remaining + v_extra_remaining,
    'total', v_used_current_cycle + v_included_remaining + v_extra_remaining
  );
END;
$$;

CREATE OR REPLACE FUNCTION record_request_reload_purchase(
  p_business_id uuid,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_credits integer DEFAULT 0,
  p_amount_cents integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business record;
  v_cycle_start_at timestamptz;
  v_cycle_end_at timestamptz;
  v_extra_remaining integer := 0;
BEGIN
  IF p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'invalid request reload credit count';
  END IF;

  IF p_amount_cents IS NULL OR p_amount_cents < 0 THEN
    RAISE EXCEPTION 'invalid request reload amount';
  END IF;

  SELECT
    id,
    current_billing_period_start,
    current_billing_period_end
  INTO v_business
  FROM businesses
  WHERE id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business not found';
  END IF;

  v_cycle_start_at := COALESCE(v_business.current_billing_period_start, now());
  v_cycle_end_at := COALESCE(v_business.current_billing_period_end, v_cycle_start_at);

  INSERT INTO request_reload_purchases (
    business_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    credits,
    amount_cents,
    cycle_start_at,
    cycle_end_at
  )
  VALUES (
    p_business_id,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id,
    p_credits,
    p_amount_cents,
    v_cycle_start_at,
    v_cycle_end_at
  )
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT COALESCE(extra_request_credits, 0)
    INTO v_extra_remaining
    FROM businesses
    WHERE id = p_business_id;

    RETURN jsonb_build_object(
      'applied', false,
      'duplicate', true,
      'extra', v_extra_remaining
    );
  END IF;

  UPDATE businesses
  SET extra_request_credits = extra_request_credits + p_credits
  WHERE id = p_business_id
  RETURNING extra_request_credits INTO v_extra_remaining;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business not found';
  END IF;

  RETURN jsonb_build_object(
    'applied', true,
    'duplicate', false,
    'extra', v_extra_remaining
  );
END;
$$;
