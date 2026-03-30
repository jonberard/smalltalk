# Pre-Launch Review Checklist

Items to review and address before going live.

---

## RLS Policy: review_sessions insert/update too permissive

**File:** `supabase/migrations/20260329_007_fix_session_insert_policy.sql`

Currently `with check (true)` — any user (anon or authenticated) can insert or update any review session. This was done to unblock development where authenticated users testing the consumer flow were being rejected by the original anon-only policy.

**Risk:** Low. Session IDs are UUIDs with no incentive to tamper, but it's still overly permissive.

**Fix:** Scope updates so a session can only be modified by its creator — e.g., match on a session token (cookie), or verify the session's `review_link_id` matches the link the user arrived from.

---

## Consumer review flow: visual cohesion and option quality

**File:** `app/r/[code]/page.tsx`

The screens in the customer review flow feel disjointed — transitions, spacing, and visual treatment aren't consistent across steps. Needs a design pass to make the full flow feel like one cohesive experience.

Additionally, some of the follow-up topic options need reviewing — the wording and range of choices should be re-evaluated to make sure they feel natural and capture the right nuance for each topic.

---

## Remove debug label from review draft screen

**File:** `app/r/[code]/page.tsx`

The review draft screen shows a debug label below the review text displaying the voice name and model used (e.g., "Voice: Casual · claude-haiku-4-5-20251001"). This is for development testing only.

**Fix:** Remove the `debugInfo` state, the `setDebugInfo` call in the API handler, and the `<p>` element that renders it.
