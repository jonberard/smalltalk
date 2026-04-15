-- ═══════════════════════════════════════════════════════════
-- P0 RLS LOCKDOWN: Restrict anonymous access to safe columns
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════
-- 1. BUSINESSES — restrict anon to safe columns
-- ═══════════════════════════════════════════

-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Anonymous can select businesses" ON businesses;
DROP POLICY IF EXISTS "Anyone can read businesses" ON businesses;
DROP POLICY IF EXISTS "anon_business_select" ON businesses;

-- Row-level: anon can see any row (consumer flow looks up by id)
CREATE POLICY "anon_read_business_safe_columns" ON businesses
  FOR SELECT TO anon USING (true);

-- Column-level: anon only gets what the consumer flow needs
REVOKE ALL ON businesses FROM anon;
GRANT SELECT (id, name, logo_url, google_review_url, google_place_id, business_city, neighborhoods) ON businesses TO anon;

-- Replace the old authenticated select with a clean one
DROP POLICY IF EXISTS "Users can select own business" ON businesses;
CREATE POLICY "authenticated_read_own_business" ON businesses
  FOR SELECT TO authenticated USING (id = auth.uid());


-- ═══════════════════════════════════════════
-- 2. REVIEW LINKS — restrict anon to safe columns
-- ═══════════════════════════════════════════

-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Anonymous can select review link by code" ON review_links;
DROP POLICY IF EXISTS "Anyone can read review_links" ON review_links;

-- Row-level: anon can read any link (filtered by unique_code in the app)
CREATE POLICY "anon_read_review_link_by_code" ON review_links
  FOR SELECT TO anon USING (true);

-- Column-level: exclude customer_contact and other sensitive fields from anon
REVOKE ALL ON review_links FROM anon;
GRANT SELECT (id, unique_code, business_id, service_id, employee_id, customer_name, is_generic) ON review_links TO anon;


-- ═══════════════════════════════════════════
-- 3. REVIEW SESSIONS — restrict anon columns
-- ═══════════════════════════════════════════

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anonymous can select review sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anyone can read review_sessions" ON review_sessions;
DROP POLICY IF EXISTS "anon_select_sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anyone can update review_sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anonymous can update review sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anyone can insert review sessions" ON review_sessions;
DROP POLICY IF EXISTS "Anonymous can insert review sessions" ON review_sessions;

-- Row-level: anon can read/update/insert sessions (consumer flow needs all three)
CREATE POLICY "anon_read_own_session" ON review_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_own_session" ON review_sessions
  FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_insert_session" ON review_sessions
  FOR INSERT TO anon WITH CHECK (true);

-- Column-level: restrict what anon can see and write
REVOKE ALL ON review_sessions FROM anon;
GRANT SELECT (id, review_link_id, status, star_rating, topics_selected, generated_review, voice_id, feedback_type, optional_text, device_token, created_at, updated_at) ON review_sessions TO anon;
GRANT UPDATE (status, star_rating, topics_selected, generated_review, voice_id, feedback_type, optional_text, device_token, updated_at) ON review_sessions TO anon;
GRANT INSERT ON review_sessions TO anon;


-- ═══════════════════════════════════════════
-- 4. BUSINESSES — restrict owner updates to safe fields
-- ═══════════════════════════════════════════

-- Drop old policy
DROP POLICY IF EXISTS "Users can update own business" ON businesses;

-- Row-level: owners can update their own business
CREATE POLICY "authenticated_update_own_business" ON businesses
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Column-level: prevent client-side updates to subscription_status, trial_requests_remaining,
-- stripe fields, api_key, owner_email from the browser
REVOKE UPDATE ON businesses FROM authenticated;
GRANT UPDATE (name, logo_url, google_review_url, google_place_id, business_city, neighborhoods, onboarding_completed, reply_voice_id, custom_reply_voice) ON businesses TO authenticated;


-- ═══════════════════════════════════════════
-- 5. PERFORMANCE INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_review_sessions_link_device ON review_sessions (review_link_id, device_token, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_business ON services (business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business ON employees (business_id);
CREATE INDEX IF NOT EXISTS idx_review_links_business ON review_links (business_id);
CREATE INDEX IF NOT EXISTS idx_review_links_business_created ON review_links (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_links_business_generic ON review_links (business_id, is_generic);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer ON businesses (stripe_customer_id);


-- ═══════════════════════════════════════════
-- 6. UNIQUE CONSTRAINT — one generic link per business
-- ═══════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS unique_generic_per_business ON review_links (business_id) WHERE (is_generic = true);
