# small Talk — Comprehensive Audit Report

**Date:** April 11, 2026
**Scope:** Every file in the codebase — SEO, copy, voice, design, animations, functionality

---

## 1. SEO

### What's Working
- `metadataBase` set to `https://usesmalltalk.com` in root layout
- Title, description, and OG tags configured globally
- Twitter card set to `summary_large_image`
- Sitemap at `/sitemap.ts` with 6 routes, priority weighting, weekly changefreq
- `robots.txt` blocks `/dashboard`, `/api`, `/r/`, `/login`, `/signup`, `/onboarding`
- JSON-LD structured data (Organization + FAQPage) on landing page
- Route-level metadata on `/login`, `/signup`, `/onboarding`, `/privacy`, `/terms`, `/contact`
- `noindex` on `/onboarding` and `/r/[code]` layouts
- Security headers (HSTS, X-Frame-Options) help with trust signals

### Issues

| # | Severity | Issue | File | Detail |
|---|----------|-------|------|--------|
| 1 | Critical | **OG image is SVG** | `public/og-image.svg` | Facebook, LinkedIn, WhatsApp, Slack, and iMessage do not render SVG OG images. Convert to PNG or JPG (1200x630). |
| 2 | Medium | **Sitemap includes /login and /signup** | `app/sitemap.ts` | Both are `Disallow`ed in robots.txt. Contradictory signals — remove them from the sitemap. |
| 3 | Low | **No canonical URLs** | All pages | No explicit `<link rel="canonical">` — Next.js infers from `metadataBase` but explicit is safer for SEO. |
| 4 | Low | **Missing `alternates` in metadata** | `app/layout.tsx` | No `canonical` field in the metadata export. |

---

## 2. Copy

### What's Working
- Landing page copy is sharp, benefit-driven, and speaks directly to the business owner
- CTA text ("Start Getting Better Reviews") is clear and action-oriented
- FAQ section answers real objections (legality, review gating, pricing)
- Consumer flow copy is warm, personal, and adapts to the customer's name/service/employee
- Contact page copy is concise and functional

### Issues

| # | Severity | Issue | File | Detail |
|---|----------|-------|------|--------|
| 5 | Critical | **Privacy policy is placeholder** | `app/privacy/page.tsx` | "Full policy coming soon." — Cannot launch without a real privacy policy. You collect PII (names, emails, phone numbers, review text). |
| 6 | Critical | **Terms of service is placeholder** | `app/terms/page.tsx` | "Full terms coming soon." — Cannot launch without real terms. Stripe requires ToS for payment processing. |
| 7 | Medium | **"PLACEHOLDER" in test Google URL** | `lib/test-data.ts` (hardcoded) | `googleReviewUrl` contains `placeid=PLACEHOLDER`. Fine for Phase 1 but will break if not gated before production. |

---

## 3. Voice Consistency

### What's Working
- Brand name is consistently "small Talk" (lowercase s, capital T) across landing page, review flow, email templates, and AI prompts
- Consumer flow voice is warm, conversational, and non-judgmental — matches the Typeform-meets-Airbnb brief
- Dashboard voice is clean and professional — matches the Square/Venmo brief
- AI-generated review prompts correctly instruct for natural variability and sentiment-matched tone

### Issues

| # | Severity | Issue | File | Detail |
|---|----------|-------|------|--------|
| 8 | Low | **Login/signup feel corporate** | `app/login/page.tsx`, `app/signup/page.tsx` | "Sign in to your account" / "Create your account" — generic SaaS copy. Should match the warm consumer voice since these pages use consumer-facing URLs. |
| 9 | Low | **Contact page is minimal** | `app/contact/page.tsx` | Just an email link. Consider adding a brief warm sentence ("We'd love to hear from you" or similar). |

---

## 4. Design & UI/UX

### What's Working
- Two distinct design systems properly separated: Consumer (Fraunces/DM Sans, #F9F6F0, #E05A3D) and Dashboard (Inter, blue accents)
- CSS custom properties defined for both systems in `globals.css`
- Landing page is polished — section spacing (~160px), card shadows, pill buttons all match the spec
- Consumer review flow (`/r/[code]`) uses correct warm palette
- Onboarding uses consumer design system correctly (Fraunces headings, DM Sans body, warm background)
- Dashboard uses `font-dashboard` class and Inter consistently
- Star rating component is large, tappable, satisfying
- Mobile-first throughout — `max-w-[480px]` on consumer flow, `max-w-[600px]` on dashboard
- Card radius 16px, pill radius 99px — both match spec
- Toast component has mobile-safe positioning with `safe-area-inset-bottom`

### Issues

| # | Severity | Issue | File | Detail |
|---|----------|-------|------|--------|
| 10 | Critical | **Login page uses dashboard design system** | `app/login/page.tsx` | Background is `#F8F9FA` (dashboard grey) instead of `#F9F6F0` (consumer warm). Primary color is `#0070EB` (dashboard blue) instead of `#E05A3D` (consumer coral). Uses `font-dashboard` instead of `font-body`. These are consumer-facing pages — they should match the consumer design system. |
| 11 | Critical | **Signup page uses dashboard design system** | `app/signup/page.tsx` | Same issue as login. Wrong background, wrong primary, wrong font family. |
| 12 | High | **~55+ hardcoded hex colors** | Multiple files | Colors like `#E05A3D`, `#F9F6F0`, `#0070EB`, `#c84a2f` are hardcoded inline instead of using CSS variables (`var(--color-primary)`, etc.). Makes theming and maintenance fragile. Worst offenders: login (13 instances), signup (10), landing page (5+), dashboard settings (30+). |
| 13 | High | **`--dash-primary` is wrong color** | `app/globals.css` | `--dash-primary: #E05A3D` — this is the consumer primary color, not the dashboard primary. Should be `#0070EB` per the CLAUDE.md spec. Dashboard components that reference `var(--dash-primary)` get the wrong color. |
| 14 | Medium | **Muted text contrast concern** | Multiple files | `#8A9B93` (consumer muted) on `#F9F6F0` (background) calculates to approximately 3.2:1 contrast ratio — below WCAG AA's 4.5:1 requirement for normal text. Verify with a contrast checker. |
| 15 | Medium | **Landing page uses non-system border color** | `app/page.tsx` | `border-[#D1C4B0]` is not in the design system palette. Should use `--color-accent` (#DDE5DF) or be added to the system formally. |
| 16 | Medium | **Hover states are hardcoded** | `app/page.tsx`, login, signup | `hover:bg-[#c84a2f]` and `hover:bg-[#005BBF]` — hardcoded darkened variants. Consider using `hover:brightness-90` or defining hover variables. |
| 17 | Low | **No error boundary** | Missing `error.tsx` | No `error.tsx` at root or route level. Unhandled errors show the browser's default error page instead of a branded experience. |
| 18 | Low | **No loading.tsx** | Missing globally | No route-level loading states. The skeleton component exists in dashboard but isn't wired up as a Next.js loading boundary. |

---

## 5. Animations & Transitions

### What's Working
- `fade-in` (400ms ease-out) used consistently across onboarding steps and consumer flow
- `fade-up` (800ms) used for landing page scroll reveals — matches the 800ms spec
- `sweep` animation (300ms) for progress indicators
- `active:scale-[0.97]` on tappable chips — satisfying micro-interaction
- `transition-all duration-300` on interactive elements — matches the ~300ms spec
- `prefers-reduced-motion` media query properly disables all animations and transitions
- Star rating has hover/active scale transforms

### Issues

| # | Severity | Issue | File | Detail |
|---|----------|-------|------|--------|
| 19 | Medium | **Chip add/remove has no animation** | `app/onboarding/page.tsx` | Adding or removing chips in the onboarding ChipInput snaps instantly. A subtle scale-in or fade-in on new chips would feel more polished. |
| 20 | Low | **No page transition animation** | Global | Navigating between pages has no transition. Consider a simple fade for route changes. |
| 21 | Low | **Landing demo has no entrance animation** | `components/landing-demo.tsx` | The interactive review demo on the landing page appears without animation — a fade-up would match surrounding sections. |

---

## 6. Functionality

### What's Working
- Auth flow works: signup → onboarding → dashboard, with proper redirect gating
- `fetchWithAuth` pattern consistently used for API routes with Bearer token
- Rate limiting middleware (30 req/min per IP, webhooks exempt)
- Security headers (HSTS, X-Frame-Options DENY, nosniff, strict referrer, permissions policy)
- Stripe subscription lifecycle properly mapped (trialing, active, past_due, canceled, paused)
- `mapSubscriptionStatus` extracted to shared utility — no duplication
- Onboarding duplicate prevention (DB check + useEffect load on mount)
- Consumer flow adapts to rating (1-2 stars get private feedback option)
- Review generation uses correct model routing (Haiku for high ratings, Sonnet for low)
- Twilio SMS integration for review link delivery
- Toast notifications with auto-dismiss

### Issues

| # | Severity | Issue | File | Detail |
|---|----------|-------|------|--------|
| 22 | High | **Supabase error messages exposed to users** | `app/signup/page.tsx`, `app/dashboard/settings/page.tsx` | `error.message` from Supabase is shown directly in the UI. Could leak internal details (table names, constraint names, etc.). Show generic user-friendly messages instead. |
| 23 | Medium | **Rate limiter uses in-memory Map** | `middleware.ts` | Won't work across multiple serverless instances on Vercel. Each instance gets its own Map. Acceptable for Phase 1 but needs Redis/Upstash for production scale. |
| 24 | Medium | **No API route error boundaries** | `app/api/*` | API routes use try/catch but some don't handle all failure modes. A malformed request body could throw an unhandled JSON parse error. |
| 25 | Low | **Google Places API key is placeholder** | `.env.local` | `GOOGLE_PLACES_API_KEY=your_google_places_api_key_here` — onboarding Step 1 (Find Business) won't function without a real key. |
| 26 | Low | **`not-found.tsx` exists but no `error.tsx`** | Root | Custom 404 page exists, but no custom error page for 500s. |

---

## 7. What We Did Well

- **Design system discipline**: Two fully distinct visual identities (consumer warm vs. dashboard clean) with CSS custom properties, correct font loading, and proper separation
- **Adaptive review flow**: Not a fixed form — dynamically generates screens based on rating and selected topics. Low ratings get a genuine private feedback option (not review gating)
- **Auth architecture**: Server-side `getUser()` verification, Bearer token pattern for API routes, proper redirect gating between onboarding and dashboard
- **Accessibility**: aria-labels, role attributes, sr-only labels, focus traps on modals, autoComplete on form fields, prefers-reduced-motion support
- **Security**: HSTS, X-Frame-Options, nosniff, strict referrer policy, permissions policy, rate limiting, webhook exemptions for Stripe signature verification
- **SEO foundation**: Structured data (JSON-LD), sitemap, robots.txt, route-level metadata, noindex on private routes
- **Animation taste**: Subtle, 300ms transitions, satisfying micro-interactions (scale on tap), 800ms scroll reveals. Not overdone
- **Mobile-first**: 480px consumer flow, 600px dashboard, safe-area-inset handling, large touch targets
- **Shared utilities**: `mapSubscriptionStatus`, `fetchWithAuth`, centralized test data — no code duplication
- **Onboarding UX**: Progressive disclosure (5 focused steps), "Just me" skip option, chip-based input with duplicate prevention, progress bar with checkmarks

---

## 8. What Needs Improvement

### Must Fix Before Launch
1. **Convert OG image from SVG to PNG** — social sharing is broken without this
2. **Write real privacy policy and terms of service** — legal requirement, Stripe requirement
3. **Fix login/signup design system** — consumer-facing pages should use consumer design, not dashboard
4. **Stop exposing Supabase error messages** — show user-friendly errors instead
5. **Fix `--dash-primary` CSS variable** — currently set to consumer color (#E05A3D), should be #0070EB

### Should Fix Soon
6. **Migrate hardcoded colors to CSS variables** — 55+ instances across 11+ files
7. **Remove /login and /signup from sitemap** — contradicts robots.txt disallow
8. **Verify muted text contrast ratio** — #8A9B93 on #F9F6F0 may fail WCAG AA
9. **Add `error.tsx` error boundary** — branded error page instead of browser default
10. **Add chip add/remove animations in onboarding** — currently snaps without transition

### Nice to Have
11. Add canonical URLs to metadata
12. Add `loading.tsx` route-level loading states
13. Warm up login/signup copy to match brand voice
14. Add page transition animations
15. Consider Upstash Redis for rate limiting at scale

---

## 9. Competitive Readiness

### vs. Podium, Birdeye, NiceJob (enterprise review management)
**Advantage:** small Talk's guided conversation approach generates genuinely unique, detailed reviews. Competitors send "leave us a review" links that dump customers on a blank text box — resulting in generic "Great service!" reviews or no review at all.

**Gap:** No dashboard analytics yet (review volume trends, average rating over time, response rate). Enterprise tools have this. Not blocking for launch but needed for retention.

### vs. GatherUp, Grade.us (SMB review tools)
**Advantage:** The adaptive flow (rating-aware topics, spectrum answers, AI drafting) is meaningfully differentiated. The honest-review philosophy (not review gating) is a strong trust signal.

**Gap:** No multi-platform support yet (Yelp, Facebook). Google-only is fine for launch but limits the value prop.

### vs. Doing Nothing (the real competitor)
**Advantage:** Most small service businesses have zero review strategy. The SMS-based flow (customer gets a text, taps through in 60 seconds, copies a review) removes all friction. This is the real value prop.

**Gap:** The copy-paste step (can't submit to Google programmatically) is friction. The coaching on the success screen helps, but it's still a manual step the customer might skip.

### Launch Readiness Score

| Category | Score | Notes |
|----------|-------|-------|
| SEO | 7/10 | Strong foundation, OG image format is the main blocker |
| Copy | 5/10 | Landing page is excellent, but placeholder legal pages are a hard blocker |
| Voice | 8/10 | Consistent brand voice, minor polish needed on auth pages |
| Design | 7/10 | Beautiful consumer flow, login/signup design system mismatch |
| Animations | 8/10 | Tasteful and restrained, minor opportunities for more polish |
| Functionality | 8/10 | Solid architecture, error exposure is the main concern |
| Accessibility | 8/10 | Good foundation, contrast ratio needs verification |
| Security | 9/10 | Excellent headers, rate limiting, auth patterns |
| **Overall** | **7.5/10** | **Fix the 5 "must fix" items and this is launch-ready** |

---

*Generated by comprehensive codebase audit — April 11, 2026*
