# Small Talk — Comprehensive Application Audit

**Date:** April 10, 2026
**Scope:** Every file, page, route, and component in the application

---

## 1. SEO AUDIT

### Critical — Missing Entirely
- **No `robots.txt`** — search engines will crawl API routes, dashboard pages, and login flows
- **No `sitemap.xml`** — Google has no map of your public pages
- **No favicon** — the original `favicon.ico` was deleted and never replaced. Every browser tab shows a blank icon
- **No `og:image` or `twitter:image`** — social shares (links texted to customers, shared on Facebook, etc.) show no preview image (`layout.tsx`)
- **No `metadataBase` or canonical URL set** — duplicate content risk (`layout.tsx`)
- **No structured data / JSON-LD** — the FAQ section is a missed opportunity for Google rich snippets. Should also have Organization and SoftwareApplication schemas (`page.tsx` FAQ section)

### Important
- **No page-level `metadata` exports** on login, signup, or any dashboard page — all show "small Talk" as the title with no description
- **No `<main>` or `<section>` semantic elements** on dashboard pages — all generic `<div>` wrappers
- **Stat banner "12 words to 85 words" is an `<h3>`** — semantically wrong, should be a `<p>` or `<blockquote>` (`page.tsx:670`)
- **Decorative SVGs lack `aria-hidden="true"`** — noise for crawlers (`page.tsx` — multiple instances)

### Opportunities
- Landing page has no internal linking strategy
- Blog/content pages would help for "how to get more Google reviews" keywords
- The consumer flow pages (`/r/[code]`) could have noindex meta since they're private per-customer links

---

## 2. COPY AUDIT

### Bugs
- **"Failed to generate reply" gets placed into the editable reply textarea** — user could accidentally copy/paste this as their actual Google reply (`dashboard/page.tsx:407`) — **this is a real bug**

### Wrong Audience / Contradictions
- **Hero says "detailed 5-star Google reviews"** — contradicts the honest-review philosophy. Should say "detailed Google reviews" (`page.tsx:428`)
- **"Small Talk" capitalized wrong** — brand is "small Talk" with lowercase s. Appears uppercase in pricing card and footer (`page.tsx:812, 838`)

### Credibility Risk
- **"The blank box wins 95% of the time"** — unsourced stat (`page.tsx:472`)
- **"Average review length increased from 12 words to 85 words"** — unsourced stat (`page.tsx:671`)

### Placeholder / Dead Copy
- **Footer links Privacy Policy, Terms of Service, Contact** all go to `href="#"` — dead links on a production site (`page.tsx:974-976`)
- **"Coming Soon"** on integrations section in Settings — fine for now but should have a timeline or waitlist
- **"Next billing date will appear in the Stripe portal"** — passive and unhelpful, could show the actual date (`billing/page.tsx:104`)

### Tone Issues
- **Login page shows raw Supabase errors** like "Invalid login credentials" — cold and technical (`login/page.tsx:51-53`)
- **Settings uses native `alert()` for errors and confirmations** — breaks the warm experience (`settings/page.tsx:337, 581, 861, 1077`)
- **Send page paywall title says "Start your free trial" but button says "Subscribe Now"** — contradictory (`send/page.tsx:570, 582`)
- **Dashboard greeting fallback "Good morning, there"** reads awkwardly when no business name loaded yet (`dashboard/page.tsx:468`)
- **$79/mo is hardcoded** in billing page — will diverge if Stripe price changes (`billing/page.tsx:76`)

---

## 3. VOICE CONSISTENCY

### Landing Page — **Strong**
Warm, blunt, conversational. Fraunces headings, editorial feel. Matches the brand voice well. The "You know the drill" problem section and FAQ answers are particularly on-brand.

### Consumer Flow — **Strong**
Personal, friendly, never corporate. Adaptive tone by rating. "We'd love to hear your thoughts" for high ratings, empathetic language for low ratings. Copy is consistently warm.

### Dashboard — **Mostly Good, Some Breaks**
Clean and professional. But breaks character in these spots:
- Native `alert()` dialogs feel jarring after the polished UI
- Raw Supabase error messages on login
- "Failed to generate reply" appearing in the reply textarea
- The billing page is more transactional and less warm than other dashboard pages

### Verdict
The three surfaces (landing, consumer, dashboard) have distinct but complementary voices — which is correct. The breaks are isolated to error states and edge cases, not the core experience.

---

## 4. DESIGN & UI/UX AUDIT

### Design System Violations
- **Dashboard primary color discrepancy** — `globals.css:48` sets `--dash-primary: #E05A3D` (orange). CLAUDE.md spec says dashboard should use `#0070EB` (blue). This appears to be an intentional decision to unify the brand, but it contradicts the spec.
- **Hero CTA uses `rounded-[8px]`** while all other CTAs use `rounded-pill` (99px) — inconsistent (`page.tsx:435`)
- **Nav "Get Started" button uses `rounded-[8px]`** — same inconsistency (`page.tsx:409`)
- **Inline `style={{ fontFamily: "Inter, sans-serif" }}`** instead of using the `font-dashboard` class (`dashboard/page.tsx:681, 748`)
- **`bg-[#E05A3D]/8`** is likely an invalid Tailwind opacity value; should be `bg-[#E05A3D]/[0.08]` (`stat-card.tsx:14`)

### What's Correct
- Typography system is rock solid — Fraunces/DM Sans/Inter correctly loaded and never violated
- Color palette perfectly implemented across consumer and landing identities
- Section spacing (160px), card radii (16px), shadows, pill shapes (99px) all match spec
- Consumer flow maxes at 480px centered — correct

### Accessibility Issues

**Critical:**
- **Reply modal has no `role="dialog"`, `aria-modal`, focus trap, or Escape key handling** (`dashboard/page.tsx:811`)
- **Delete confirmation modal same issues** — no dialog role, no focus trap, no Escape handling (`settings/page.tsx:1104-1132`)
- **Profile dropdown has no `aria-expanded`, `aria-haspopup`, or Escape key handling** (`dashboard/layout.tsx:119`)

**Important:**
- Error banners have no `role="alert"` for screen reader announcement (`login/page.tsx:51`, `signup/page.tsx:114`)
- Toast container has no `aria-live` region (`toast.tsx:40`)
- Autocomplete inputs have no `role="combobox"`, `role="listbox"`, `role="option"`, or `aria-expanded` (`send/page.tsx:146-205`)
- Nav logo is a `<span>`, not a link to `/` (`page.tsx:397`)
- `<nav>` has no `aria-label` (`page.tsx:396`)
- Landing demo tabs lack ARIA tab pattern (`landing-demo.tsx:601-613`)
- Voice mic toggle button has no `aria-label` (`r/[code]/page.tsx:638-668`)
- Neighborhood/topic chip remove buttons have no `aria-label` (`settings/page.tsx:501-509, 901-909`)
- Signup form has no `autocomplete` attributes on inputs
- Star rating SVGs have no `aria-label` or `role="img"` (`dashboard/page.tsx:144-150`)
- Modal close button has no `aria-label` (`dashboard/page.tsx:819-828`)

### Mobile
- **All clear at 390px** — layouts stack correctly, touch targets meet WCAG 44px minimum
- `min-h-dvh` correctly handles dynamic viewport on mobile
- Bottom nav uses `pb-[env(safe-area-inset-bottom,8px)]` for notched devices
- **One issue:** Toast container positioned `bottom-6 right-6` overlaps mobile bottom tab bar (`toast.tsx:40`)

### Loading & Empty States
- **Good:** All dashboard pages use skeleton cards/rows instead of spinners
- **Good:** Empty states have friendly messaging ("No activity yet", "All caught up")
- **Bad:** Auth loading state is just plain "Loading..." text — no skeleton or timeout (`auth-context.tsx:85`)

---

## 5. ANIMATIONS & TRANSITIONS

### Complete Animation Inventory
| Animation | Location | Duration | Verdict |
|-----------|----------|----------|---------|
| Scroll fade-up | Landing page sections | 800ms | Good — matches spec |
| Hero phone float | `page.tsx:87` | 6s infinite | Good feel, but **no `prefers-reduced-motion`** |
| Star bounce | Consumer flow | Spring cubic-bezier | Satisfying |
| Topic chip toggle | Consumer flow | 200ms | Snappy, good |
| Shimmer loading | Review generation | Continuous | Appropriate |
| Confetti | Success screen | One-shot | Fun without being obnoxious |
| Interstitial paste | Google handoff | Stepped | Clear and purposeful |
| Landing demo auto-play | `landing-demo.tsx` | ~15s loop | Well-paced |
| Reply demo word-by-word | `page.tsx` ReplyDemo | ~2s typing | Satisfying |
| Reply demo crossfade | `page.tsx` ReplyDemo | 300ms | Smooth |
| Dashboard page enter | Dashboard pages | CSS class | Subtle, good |
| Blink cursor | Landing page, reply demo | 1s step-end | Correct |

### Issues
- **No `prefers-reduced-motion` on any animation** — accessibility concern for motion-sensitive users. The hero phone float is the most obvious violator.
- All other animations are well-tuned and consistent.

---

## 6. FUNCTIONALITY AUDIT

### Security — Critical

1. **No auth on `api/generate-review/route.ts`** — anyone can burn your Anthropic API credits. Denial-of-wallet attack vector.
2. **No auth on `api/send-sms/route.ts`** — anyone can send SMS via your Twilio account. Spam/phishing/bill-running vector.
3. **No auth on `api/billing-portal/route.ts`** — anyone who guesses a `stripe_customer_id` can manage that customer's subscription.
4. **No auth on `api/notify-owner/route.ts`** — anyone with a review_link_id can spam business owners with emails.
5. **No auth on `api/places-search/route.ts`** — anyone can proxy Google Places API calls.
6. **XSS in notify-owner email** — `customerName` inserted raw into HTML (`notify-owner/route.ts:41`). `reviewText` is escaped but customer name is not.
7. **No rate limiting on any route** — no `middleware.ts` exists.
8. **No security headers** — `next.config.ts` is empty. No CSP, X-Frame-Options, HSTS, or referrer policy.
9. **`select("*")` in auth context** sends `api_key` and `stripe_customer_id` to the browser (`auth-context.tsx:63`).
10. **Weak API key generation** — `crypto.randomUUID()` is not designed for auth tokens. Use `crypto.randomBytes(32).toString('hex')` (`api-key/route.ts:26`).
11. **PII logged** — phone numbers and SMS body content logged to console (`send-sms/route.ts:64, 70`).
12. **Dead secret in `.env.local`** — commented-out webhook secret on line 25. Delete it.
13. **`getSession()` used instead of `getUser()`** — `lib/supabase.ts:14` reads from local storage without server verification.

### Broken / Incomplete Features
- **Delete account button does nothing** — logs to console and closes modal (`settings/page.tsx:1122`). This is customer-facing.
- **"Nudge" button has no onClick handler** — renders but does nothing (`dashboard/page.tsx:782-788`)
- **Drag handle renders on services list but no drag-and-drop is implemented** (`settings/page.tsx:368`)
- **GoogleReviewMockup ignores `reviewText` prop** — always shows hardcoded demo text (`google-review-mockup.tsx:28-30`)
- **ReplyDemo "Copy Reply" button does nothing** — decorative only on landing page (`page.tsx:343-348`)
- **No "Forgot password?" link on login page** (`login/page.tsx`)

### Code Quality
- **`billing-portal/route.ts` and `customer-portal/route.ts` are byte-for-byte identical** — one is dead code
- **`mapSubscriptionStatus` duplicated** between `verify-subscription/route.ts:112` and `webhooks/stripe/route.ts:11`
- **`callOpenAI` and `callGemini` are dead stubs** that throw "not implemented" but sit in the fallback chain, adding wasted error cycles (`review-generator.ts:217-231`)
- **`reply-generator.ts` imports `REVIEW_VOICES`** (customer review writing styles) and uses them for business owner replies. Voice prompts like "Chain them with periods" are written for customer reviews, not owner responses.

### Console.logs to Remove
- `send-sms/route.ts` — 6 instances
- `webhooks/stripe/route.ts` — 12+ instances
- `verify-subscription/route.ts` — 5 instances
- `checkout/route.ts` — 1 instance
- `dashboard/page.tsx` — 2 instances (subscription verification)

### Environment Variables
- All properly referenced via `process.env.*` — no hardcoded secrets in source code
- `.env.local` is in `.gitignore` — verified safe
- Dead commented-out secret should be deleted from `.env.local:25`

---

## 7. WHAT WE DID WELL — Top 10

1. **The adaptive review flow is genuinely well-built** — topic headings, follow-up questions, tone, and paths all shift naturally by rating tier. The low-rating choice screen presents both options with truly equal visual weight. This is not review gating.

2. **Typography and color systems are airtight** — Fraunces/DM Sans for consumer, Inter for dashboard. Colors, shadows, radii, and spacing are consistent across 20+ pages.

3. **Voice input with speech recognition** is a strong differentiator. Error handling, auto-stop, and transcript display are all polished.

4. **Copy across the consumer flow** is warm, human, and never corporate. "What stood out to you?" beats "Please rate the following attributes" every time.

5. **Smart model routing** (Haiku for positive, Sonnet for negative) is a thoughtful cost optimization that most competitors wouldn't bother with.

6. **The review generation prompt engineering** is excellent — rating-adaptive tone, employee name protection for negative reviews, 15 distinct voices, SEO keyword injection, and anti-generic-praise guardrails.

7. **Skeleton loading throughout the dashboard** instead of spinners. Every loading state feels intentional, not an afterthought.

8. **The landing page demo auto-play** — cycling through the full review flow in a phone mockup is compelling and requires zero interaction.

9. **The before/after section** — "Same customer. Different tool." with one-word review vs. paragraph review is the most convincing thing on the landing page.

10. **Mobile-first execution** — `min-h-dvh`, safe area insets, 44px touch targets, proper stacking. The consumer flow at 390px is genuinely pleasant to use.

---

## 8. WHAT NEEDS IMPROVEMENT — Prioritized

### Critical — Must Fix Before Showing Customers

| # | Issue | File | Line |
|---|-------|------|------|
| 1 | Add auth to `generate-review` route (anyone can burn API credits) | `api/generate-review/route.ts` | entire file |
| 2 | Add auth to `send-sms` route (anyone can send SMS on your account) | `api/send-sms/route.ts` | entire file |
| 3 | Add auth to `billing-portal` route (subscription hijacking) | `api/billing-portal/route.ts` | entire file |
| 4 | Fix XSS in notify-owner email (escape `customerName`) | `api/notify-owner/route.ts` | 41 |
| 5 | Stop sending `api_key` and `stripe_customer_id` to browser | `lib/auth-context.tsx` | 63 |
| 6 | Fix "Failed to generate reply" appearing in editable textarea | `dashboard/page.tsx` | 407 |
| 7 | Remove PII from server logs (phone numbers, SMS bodies) | `api/send-sms/route.ts` | 64, 70 |
| 8 | Delete account button does nothing — either implement or remove | `settings/page.tsx` | 1122 |
| 9 | Footer links go to `#` — either add real pages or remove links | `page.tsx` | 974-976 |
| 10 | Add `robots.txt` to prevent crawling of API routes and dashboard | `public/` | missing |
| 11 | Add favicon — blank browser tabs look unfinished | `public/` | missing |

### Important — Fix Soon

| # | Issue | File | Line |
|---|-------|------|------|
| 12 | Add rate limiting middleware | `middleware.ts` | missing |
| 13 | Add security headers (CSP, X-Frame-Options, HSTS) | `next.config.ts` | empty |
| 14 | Add focus traps and Escape handling to all modals | Multiple | See accessibility section |
| 15 | Humanize login error messages | `login/page.tsx` | 51-53 |
| 16 | Replace native `alert()` with toast system in Settings | `settings/page.tsx` | 337, 581, 861, 1077 |
| 17 | Add "Forgot password?" to login page | `login/page.tsx` | missing |
| 18 | Remove or redirect duplicate `customer-portal/route.ts` | `api/customer-portal/route.ts` | entire file |
| 19 | Remove all production console.logs | Multiple | See list above |
| 20 | Fix `reply-generator.ts` voice usage — it imports customer review voices but needs reply-specific voice instructions | `lib/reply-generator.ts` | 2, 38-42 |
| 21 | Add `sitemap.xml` | `public/` | missing |
| 22 | Add `og:image` for social sharing | `layout.tsx` | metadata |
| 23 | Add `prefers-reduced-motion` to hero float animation | `page.tsx` | 87 |
| 24 | Fix `stat-card.tsx` opacity value | `stat-card.tsx` | 14 |
| 25 | Fix hero CTA border-radius inconsistency (rounded-[8px] vs rounded-pill) | `page.tsx` | 409, 435 |
| 26 | Correct "Small Talk" to "small Talk" | `page.tsx` | 812, 838 |
| 27 | Change hero copy from "5-star Google reviews" to "Google reviews" | `page.tsx` | 428 |
| 28 | Add email verification to signup flow | `signup/page.tsx` | 91 |

### Important — Additional Findings

| # | Issue | File | Line |
|---|-------|------|------|
| 28b | GoogleReviewMockup ignores `reviewText` prop — always shows hardcoded demo text instead of user's actual review on interstitial screen | `google-review-mockup.tsx` | 28-30 |
| 28c | `sendSms` in Send page uses plain `fetch` instead of `fetchWithAuth` — potential auth bypass | `send/page.tsx` | 62 |
| 28d | `stripe_customer_id` sent from client in billing portal request body — should be derived server-side | `billing/page.tsx` | 48-51 |
| 28e | Signup requires Google review URL — could block signups from users who don't have it handy | `signup/page.tsx` | 175 |
| 28f | No email verification step after signup — user goes straight to dashboard | `signup/page.tsx` | 91 |
| 28g | Billing catch blocks silently swallow errors — user sees "Redirecting..." then nothing | `billing/page.tsx` | 39-41, 55-57 |
| 28h | Auth context `fetchBusiness` failure leaves user in limbo state — authenticated but null business with no UI indication | `auth-context.tsx` | 69-70 |
| 28i | Service role key silently falls back to anon key in 4 files — should throw instead | `notify-owner`, `webhooks/stripe`, `verify-subscription`, `integrations/core` | various |
| 28j | `verify-subscription` searches ALL recent Stripe checkout sessions globally (limit: 10) — race condition under load | `verify-subscription/route.ts` | 63 |
| 28k | `invoice.paid` webhook unconditionally sets status to "active" — overwrites "trialing" status | `webhooks/stripe/route.ts` | 165 |

### Nice-to-Have — Polish Later

| # | Issue | File | Line |
|---|-------|------|------|
| 29 | Add JSON-LD structured data for FAQ section | `page.tsx` | FAQ section |
| 30 | Add `aria-live` region for toasts | `toast.tsx` | 40 |
| 31 | Add ARIA combobox pattern to autocomplete inputs | `send/page.tsx` | 146-205 |
| 32 | Fix toast overlap with mobile bottom nav | `toast.tsx` | 40 |
| 33 | Show actual next billing date instead of "will appear in portal" | `billing/page.tsx` | 104 |
| 34 | Implement or remove drag handles on services list | `settings/page.tsx` | 368 |
| 35 | Implement or remove "Nudge" button | `dashboard/page.tsx` | 782-788 |
| 36 | Fix GoogleReviewMockup to use actual `reviewText` prop | `google-review-mockup.tsx` | 28-30 |
| 37 | Add `autocomplete` attributes to signup form inputs | `signup/page.tsx` | inputs |
| 38 | Make nav logo a clickable link to `/` | `page.tsx` | 397 |
| 39 | Add `aria-label` to nav | `page.tsx` | 396 |
| 40 | Extract shared `mapSubscriptionStatus` utility | `verify-subscription/route.ts`, `webhooks/stripe/route.ts` | 112, 11 |
| 41 | Replace deprecated `document.execCommand("copy")` fallback | Multiple | consumer flow, dashboard |
| 42 | Auth loading state needs skeleton, not plain text | `auth-context.tsx` | 85 |

---

## 9. COMPETITIVE READINESS

### vs. NiceJob, Spokk, Merchynt

**What makes them choose us:**
- The guided tap-through flow is fundamentally different from "send a link to a blank Google page." No competitor does the topic-chip → spectrum-answer → AI-draft pipeline.
- Voice input is a genuine differentiator — no competitor offers speak-your-review.
- Honest review handling with equal-weight public/private choice is rare and defensible. Most competitors are review-gating tools dressed up as review collectors.
- The consumer experience feels like a product, not a survey. Fraunces typography, warm palette, and thoughtful animations create trust.
- AI review drafting with 15 voice styles produces reviews that don't sound AI-generated.

**What makes them hesitate:**
- No Google Business Profile integration yet — competitors show your existing reviews, ratings, and can auto-reply. We can't pull in organic reviews.
- No multi-location support — businesses with 3+ locations need per-location dashboards.
- No team accounts or role-based access — most competitors offer this.
- Footer links go to dead `#` pages — Privacy Policy, Terms of Service, and Contact are empty. This erodes trust immediately.
- No testimonials, case studies, or social proof on the landing page beyond unsourced stats.

### Single Biggest Weakness
**Security.** Five unauthenticated API routes, no rate limiting, no security headers, PII in logs, and XSS in email templates. A competitor doing a security audit could use this to undermine credibility with enterprise customers. More importantly, a malicious actor could rack up Twilio/Anthropic bills or send unauthorized SMS messages through your account.

### Single Biggest Strength
**The consumer experience.** Nobody else turns 30 seconds of taps into a review that sounds like the customer spent 10 minutes writing it. The combination of structured input → adaptive follow-ups → AI drafting → one-tap Google handoff is genuinely novel. Competitors can copy individual features, but the end-to-end flow design — including how it handles negative reviews with integrity — is hard to replicate.

---

*This report covers 40+ source files across the application. Line numbers reference the codebase as of April 10, 2026.*
