# small Talk — Post-Fix Audit Report

**Date:** 2026-04-10
**Scope:** Full codebase audit against original 51-item findings + new onboarding flow

---

## 1. ORIGINAL ISSUES — STATUS UPDATE

### Sprint 1: Security (9 items)

| # | Issue | Status |
|---|-------|--------|
| S1 | API routes missing auth (`send-sms`, `billing-portal`, `places-search`) | ✅ FIXED — All three routes now require Bearer token auth via `fetchWithAuth` |
| S2 | `generate-review` accepts requests without session validation | ✅ FIXED — Validates `session_id` against `review_sessions` table, returns 403 if invalid |
| S3 | XSS in email template (`notify-owner` renders customer name as raw HTML) | ✅ FIXED — `escapeHtml()` helper added, `customerName` escaped in subject and body |
| S4 | PII logging in `send-sms` (phone numbers, SMS body, Twilio FROM) | ✅ FIXED — All PII logging removed |
| S5 | User input reflected in error messages (`send-sms`) | ✅ FIXED — Generic error messages only |
| S6 | Weak API key generation (`Math.random`) | ✅ FIXED — Uses `crypto.getRandomValues(32 bytes)` with `st_` prefix |
| S7 | `api_key` leaked to browser via `select("*")` in auth-context | ✅ FIXED — Explicit column list, `api_key` excluded |
| S8 | Service role key silent fallback to anon key | ✅ FIXED — All routes `throw new Error()` at module load if missing |
| S9 | Dead webhook secret in `.env.local` | ✅ FIXED — Removed |

### Sprint 2: Broken Features (18 items)

| # | Issue | Status |
|---|-------|--------|
| F1 | Reply error shown inside textarea instead of banner | ✅ FIXED — Red banner with `replyError` state |
| F2 | Delete account button does `console.log` instead of feedback | ✅ FIXED — Uses `toast()` with info message |
| F3 | Legal pages (`/privacy`, `/terms`, `/contact`) are dead `#` links | ✅ FIXED — Three pages created with correct design system |
| F4 | No `robots.txt` | ✅ FIXED — Created with correct allow/disallow rules |
| F5 | No favicon | ✅ FIXED — SVG + ICO created, referenced in layout.tsx |
| F6 | Hero copy says "detailed 5-star Google reviews" | ✅ FIXED — Says "detailed Google reviews" |
| F7 | "Small Talk" capitalization inconsistent | ⚠️ PARTIALLY FIXED — Landing page, dashboard, nav, footer all correct. **5 instances remain:** `notify-owner` email template (2x), `terms/page.tsx` (1x), `review-generator.ts` prompt (1x), `reply-generator.ts` prompt (1x) |
| F8 | No forgot password flow on login | ✅ FIXED — `resetPasswordForEmail` flow with success message |
| F9 | `alert()` calls in Settings (4 instances) | ✅ FIXED — All replaced with `useToast()` |
| F10 | Login errors show raw Supabase messages | ✅ FIXED — Humanized: "That email and password don't match" etc. |
| F11 | `console.log` in production code | ✅ FIXED — Zero `console.log` calls remain. Only `console.error` in webhook handlers |
| F12 | Duplicate `customer-portal` route | ✅ FIXED — File deleted |
| F13 | Reply generator uses customer review voices instead of owner voices | ✅ FIXED — Separate `REPLY_VOICES` array with 5 owner-specific voices |
| F14 | Paywall doesn't distinguish trial-expired vs never-subscribed | ⚠️ PARTIALLY FIXED — `hadTrial` prop added but checks `"trial"` instead of `"trialing"`. The Stripe status mapping returns `"trialing"`, so `business?.subscription_status === "trial"` will never match. Should be `=== "trialing"` |
| F15 | Dashboard greeting says "Good morning, there" | ✅ FIXED — Conditional: name with comma or `!` suffix |
| F16 | `GoogleReviewMockup` ignores `reviewText` prop | ✅ FIXED — Uses prop, truncates to ~80 chars |
| F17 | `invoice.paid` webhook overwrites "trialing" with "active" | ✅ FIXED — Checks current status before updating |
| F18 | Service role key fallback in `verify-subscription` | ✅ FIXED — Returns 500 error, uses shared `mapSubscriptionStatus` |

### Sprint 3: SEO & Polish (20 items)

| # | Issue | Status |
|---|-------|--------|
| P1 | No sitemap | ✅ FIXED — `app/sitemap.ts` with 6 URLs |
| P2 | No OG/Twitter meta tags, no og-image, no metadataBase | ✅ FIXED — All three added to `layout.tsx` |
| P3 | No page-level metadata | ✅ FIXED — Added to privacy, terms, contact, login, signup, r/[code], onboarding |
| P4 | No JSON-LD structured data | ✅ FIXED — Organization + FAQPage schema on landing page |
| P5 | No `prefers-reduced-motion` support | ✅ FIXED — Global media query disables all animations/transitions |
| P6 | Hero CTA uses `rounded-[8px]` instead of pill | ✅ FIXED — Changed to `rounded-pill` |
| P7 | `stat-card` invalid opacity `bg-[#E05A3D]/8` | ✅ FIXED — Changed to `bg-[#E05A3D]/[0.08]` |
| P8 | No focus traps or Escape key on modals | ✅ FIXED — Both modals have `role="dialog"`, `aria-modal`, `aria-label`, Escape handlers |
| P9 | No `aria-live` on toast container | ✅ FIXED — `role="status"` + `aria-live="polite"` |
| P10 | No `aria-labels` on mic buttons, nav, modal close | ✅ FIXED — All interactive elements labeled |
| P11 | Nav logo not clickable | ✅ FIXED — Both mobile and desktop logos are `<Link href="/dashboard">` |
| P12 | Toast overlaps mobile bottom nav | ✅ FIXED — Positioned above nav with `bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)]` |
| P13 | `/r/[code]` pages indexable by search engines | ✅ FIXED — `robots: { index: false, follow: false }` |
| P14 | No rate limiting | ✅ FIXED — `middleware.ts` with 30 req/min per IP, webhooks exempt |
| P15 | No security headers | ✅ FIXED — X-Frame-Options, nosniff, HSTS, Referrer-Policy, Permissions-Policy |
| P16 | No `role="alert"` on error banners | ✅ FIXED — Added to login and signup |
| P17 | No autocomplete attributes on forms | ✅ FIXED — email, current-password, new-password, organization |
| P18 | No semantic HTML on dashboard | ✅ FIXED — `<main>` wrapper, `<nav>` with aria-labels |
| P19 | Auth loading shows "Loading..." text | ✅ FIXED — Skeleton screen with sidebar + content placeholders |
| P20 | Duplicate `mapSubscriptionStatus` functions | ✅ FIXED — Shared `lib/stripe-utils.ts`, both routes import from it |

---

## 2. NEW ISSUES INTRODUCED

### Critical

**N1. Paywall `hadTrial` check uses wrong status string**
`app/dashboard/send/page.tsx:716` — `hadTrial={business?.subscription_status === "trial" || ...}` checks for `"trial"` but the Stripe mapping returns `"trialing"`. This means the paywall will never detect a trial-expired user correctly — they'll always see the "never subscribed" copy.
- **Fix:** Change `"trial"` to `"trialing"`

### Medium

**N2. "Small Talk" capitalization in 5 remaining locations**
These were present before Sprint 2 but the fix only caught some instances:
- `app/api/notify-owner/route.ts:92` — email footer: "Sent by **Small Talk**"
- `app/api/notify-owner/route.ts:165` — email from: "Small Talk <notifications@...>"
- `app/terms/page.tsx:22` — "Use Small Talk to get honest reviews"
- `lib/review-generator.ts:114` — "Never mention AI, Small Talk, or..."
- `lib/reply-generator.ts:113` — "This review came through Small Talk"

**N3. Nav "Get Started" button uses `rounded-[8px]` instead of pill**
`app/page.tsx:444` — The hero CTA was fixed to `rounded-pill` but the nav bar CTA still uses `rounded-[8px]`. This is a bordered outline button, so the square corners are arguably intentional, but it's inconsistent with the design spec's pill radius for all CTAs.

**N4. `robots.txt` missing `/onboarding` disallow**
The onboarding page has `noindex` in its metadata (correct), but `robots.txt` doesn't include `Disallow: /onboarding`. Low risk since the metadata handles it, but belt-and-suspenders would be better.

**N5. Onboarding `ChipInput` fields lack `<label>` elements**
The chip input fields in Steps 2-4 use placeholder text but no explicit `<label htmlFor>` association. The step headings provide context, but screen readers may not associate them with the input fields.

### Low

**N6. Onboarding doesn't prevent duplicate entries on page refresh**
If a user refreshes the page on Step 2 and adds the same service again, the Supabase insert will succeed (creating a duplicate). The UI checks for duplicates in local state, but local state resets on refresh.

**N7. Dashboard headings use inline `fontFamily` style**
`app/dashboard/page.tsx:682,749` — Two section headings use `style={{ fontFamily: "Inter, sans-serif" }}` instead of the `font-dashboard` CSS class. Functionally equivalent but inconsistent with the rest of the codebase.

**N8. In-memory rate limiting resets on deploy**
`middleware.ts` uses a `Map()` for rate limiting, which resets every time the server restarts or a new serverless instance spins up. Acceptable for MVP but not production-grade — a real rate limiter needs Redis or Vercel Edge Config.

---

## 3. UPDATED SCORECARD

| Category | Before | After | Change | Notes |
|----------|--------|-------|--------|-------|
| **Security** | 3 | 9 | +6 | All auth, XSS, PII, key generation issues fixed. Rate limiting + security headers added. In-memory rate limiting is the only gap. |
| **Copy & Voice** | 5 | 8 | +3 | Hero, pricing, footer, onboarding all correct. 5 capitalization instances remain in backend code and terms page. |
| **Design & UI/UX** | 6 | 9 | +3 | Consumer flow design system consistent. Onboarding is polished. One nav CTA radius inconsistency. Skeleton loading. |
| **SEO** | 2 | 9 | +7 | Sitemap, OG tags, JSON-LD, page metadata, noindex on dynamic pages, robots.txt — all present. |
| **Accessibility** | 3 | 8 | +5 | aria-live, role="dialog", Escape handlers, aria-labels, reduced motion, semantic HTML, autocomplete. ChipInput labels missing. |
| **Functionality** | 6 | 9 | +3 | Reply error, toast notifications, forgot password, paywall, voices, webhooks all fixed. One `hadTrial` status string bug. |
| **Competitive Readiness** | 4 | 8 | +4 | Onboarding flow, legal pages, professional polish. Needs the hadTrial fix and capitalization cleanup to ship. |

---

## 4. REMAINING CRITICAL PATH

### Top 5 blockers before paying customers:

**1. Fix the `hadTrial` status string bug (5 minutes)**
`app/dashboard/send/page.tsx:716` — Change `"trial"` to `"trialing"`. Without this, expired trial users see the wrong paywall copy and button label. Direct revenue impact.

**2. Fix the 5 remaining "Small Talk" capitalizations (10 minutes)**
Every customer-facing touchpoint needs consistent branding. The email template is especially visible — business owners receive these notifications. The AI prompts are less visible but could leak into generated content.

**3. Google Places API key**
`.env.local` has a placeholder `your_google_places_api_key_here`. Step 1 of onboarding (and Settings) won't work until a real API key is provisioned. The entire onboarding flow starts with "Let's find you on Google" — if that's broken, first impressions are dead.

**4. Supabase RLS policy for `onboarding_completed`**
The new `onboarding_completed` column needs an RLS policy allowing authenticated users to update their own record. The signup page inserts the business row, but the onboarding page updates it. If the existing RLS policies don't cover this column, Step 5's "Go to Dashboard" will silently fail.

**5. End-to-end testing of the signup-to-first-review flow**
The full path: Signup -> Onboarding (5 steps) -> Dashboard -> Send review link -> Customer completes review -> Owner gets email notification. This entire flow has never been tested as a connected journey. Individual pieces work, but integration gaps (especially around the new onboarding redirect logic in auth-context) could break the experience.
