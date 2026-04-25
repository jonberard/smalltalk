# small Talk — Deep Code Review

## Pre-Ship Fixes

### Legal (Blocking)

**Privacy Policy** — Your current page is a placeholder. You need to disclose:
- What you collect: customer names, phone numbers, emails, star ratings, review text, voice transcriptions, IP addresses, device tokens
- Who processes it: Supabase (database), Twilio (SMS), Resend (email), Stripe (billing), PostHog (analytics), Anthropic/OpenAI/Google (AI generation)
- How long you keep it: session data, review text, private feedback, delivery logs
- Customer rights: deletion, export, opt-out of analytics
- Cookie usage: your HMAC-signed session cookies, PostHog cookies
- CCPA "Do Not Sell" disclosure (you don't sell data, but you need to say so)
- Data sub-processor list with links to each vendor's DPA

**Terms of Service** — Needs to cover:
- Review authenticity: customers own their words, small Talk doesn't fabricate content
- AI disclosure: reviews are AI-drafted from customer inputs, not AI-generated from nothing
- Acceptable use: no fake reviews, no incentivized reviews, no review manipulation
- Business owner liability: they're responsible for how they use the platform
- Service availability: no uptime SLA (you're a startup)
- Cancellation and refund terms aligned with your Stripe billing

**Not-Review-Gating page** — You already have `/not-review-gating` which is smart. Make sure it explicitly cites Google's review policy and explains the equal-prominence private/public choice with screenshots.

### Security (Blocking)

**Rate limit login/signup.** Add IP-based rate limiting to `app/api/auth/recover-business/route.ts` and your Supabase auth calls. 5 attempts per 15 minutes per IP is standard. You already have the pattern in `lib/public-rate-limit.ts` — reuse it.

**Rate limit SMS/email sends.** `app/api/send-review-request/route.ts` has no per-business throttle. A compromised account could blast hundreds of messages. Add a per-business hourly cap (e.g., 50/hour) using the same Supabase rate-limit pattern you use for the consumer flow.

**Add webhook idempotency.** In `app/api/webhooks/stripe/route.ts`, store `event.id` in a `processed_webhook_events` table before processing. Check for existence first. Stripe retries webhooks up to 3 days — without this, a `checkout.session.completed` retry could corrupt subscription state.

**Expire legacy plaintext API keys.** `app/api/v1/webhook/review-request/route.ts:61-86` still falls back to plaintext `api_key` matching. Set a hard cutoff date and remove the fallback. Any integration still using old keys gets a 401 with a migration message.

**Validate timezone strings.** `lib/quiet-hours.ts` passes user-provided timezone strings directly to `Intl.DateTimeFormat`. Wrap in try/catch with a fallback to `America/Chicago`. Invalid timezones will crash the cron job and skip all reminders for that business.

### Error Reporting (Blocking)

**Add Sentry.** Your `app/error.tsx` catches errors but logs nothing. Install `@sentry/nextjs`, wrap the root layout, and instrument API routes. You need visibility into production failures before you ship. PostHog error tracking is not a substitute — it doesn't capture server-side errors or stack traces.

### Accessibility (Should-Fix)

**Add `prefers-reduced-motion` checks to JS animations.** In `app/r/[code]/page.tsx`, the star scaling animation, confetti, voice pulse, and interstitial cursor all run unconditionally. Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip or simplify animations.

**Add `aria-label` to follow-up option buttons.** Each topic follow-up screen has tappable options ("Early", "Right on time", etc.) that need `aria-label={`${topicLabel}: ${optionText}`}` so screen readers get context.

**Add `aria-live="polite"` to the voice input status region.** When it switches to "Listening..." or shows an error, screen readers need to announce it.

### UX Polish (Should-Fix)

**Show password toggle on login/signup forms.** Add an eye icon button inside the password field. Mobile users mistype constantly.

**Add retry on review generation failure.** When `/api/public/review-flow/[code]/generate` fails, show a "Try again" button instead of a dead error message. One retry with a 2-second delay resolves most transient AI provider failures.

**Fix onboarding skip inconsistency.** Steps 2-4 require at least 1 entry but also show skip buttons. Either make them truly skippable or remove the skip buttons and explain why 1 entry is needed. The copy also varies ("Skip for now" / "Just me" / "Skip — I'll add these later") — pick one.

**Add email verification confirmation.** After signup, show "Check your email to verify your account" instead of silently redirecting. Users who don't verify will have broken sessions.

---

## Features That Beat the Competition

The main competitors are Podium ($399/mo), Birdeye ($299/mo), NiceJob ($75/mo), and Grade.us ($110/mo). Here's what none of them do well:

### 1. Review Intelligence Dashboard
You're sitting on data nobody else has — per-topic sentiment at scale. You know that 40% of Crystal Clear Pools customers mention "Timeliness" and 80% of those say "Right on time." Surface this:
- **Topic frequency chart** — which topics customers mention most
- **Sentiment breakdown per topic** — "Work Quality: 90% positive, 10% needs improvement"
- **Trend lines** — "Communication mentions up 30% this month" (early warning system)
- **Employee comparison** — "Marcus gets 95% positive on Work Quality, Derek gets 70%"

No competitor gives business owners this granularity. Podium shows star counts. Birdeye shows sentiment scores. Nobody breaks it down by topic and employee.

### 2. Review Authenticity Score
You can prove your reviews are real because you have the full input chain: star rating -> topics selected -> follow-up answers -> optional text -> AI draft -> customer edits -> final copy. Build a visible "Authenticity" badge or score that shows:
- Review was generated from verified customer inputs
- Customer made X edits to the draft (more edits = more authentic)
- Time spent in flow (15 seconds = probably fake, 90 seconds = real)

This matters because Google is cracking down on fake reviews. A business that can demonstrate review authenticity has a competitive moat. Consider making this data available to the business owner as a report they can show to Google if flagged.

### 3. Smart Review Timing
You have quiet hours and batch send windows already. Go further:
- **Optimal send time per customer** — track when each customer's link gets the highest open/completion rate. Some people respond at 7am, others at 8pm.
- **Post-service delay optimization** — a pool cleaning customer should get the link 2 hours after service (pool is still sparkling). An HVAC repair customer should get it 24 hours later (they need time to confirm the fix held). Let businesses configure per-service-type delay.
- **Weather-aware scheduling** — for outdoor services (pools, landscaping), don't send review requests on days with bad weather in the customer's area. The customer's mood affects review quality.

### 4. Private Feedback Loop Closure
Your private feedback path is a strong differentiator, but it ends at "the business sees it." Close the loop:
- **Templated owner responses** — "Hi [customer], thank you for telling us directly. Here's what we're doing about it: ___"
- **Resolution tracking** — owner marks feedback as "Contacted," "Resolved," "Offered discount"
- **Follow-up prompt** — 7 days after resolution, automatically ask the customer: "Did [Business] make it right? Would you like to update your review?" This turns 2-star private feedback into 4-star public reviews. Nobody else does this.

### 5. QR Code Context Awareness
Your QR code currently generates a generic link. Make it smarter:
- **Location-tagged QR** — different QR for the truck, the invoice, the front door. Track which placement gets the most scans.
- **Time-decay QR** — the QR code works for 72 hours after service. After that, it shows "This link has expired — contact [Business] for a new one." Prevents stale reviews months later.
- **Seasonal QR campaigns** — "End of pool season? Tell us how we did this year" with a different topic set than the standard weekly-clean flow.

### 6. Integration Webhook for CRM/FSM
You already have `app/api/v1/webhook/review-request/route.ts`. Expand this into a proper integration layer:
- **Inbound webhooks** from Jobber, Housecall Pro, ServiceTitan — auto-create review requests when a job is marked complete. Zero manual work for the business owner.
- **Outbound webhooks** — POST to the business's CRM when a review is posted, when private feedback comes in, when a customer copies their review. Let them build automations.
- This is how you move upmarket. Podium charges $399/mo partly because they integrate with everything. You can offer the same at $79/mo.

---

## SEO Specifics

### Technical SEO

**Unique OG images per vertical.** Your `app/opengraph-image.tsx` generates one image for all pages. Create per-route OG images:
- `/for/pool-companies` -> "Get More Pool Service Reviews" with a pool-themed visual
- `/for/hvac` -> "Get More HVAC Reviews" with an HVAC-themed visual
- Use Next.js `generateMetadata()` per page to set unique `openGraph.images`

**Add structured data to industry pages.** You have FAQ schema on the landing page. Add it to each vertical too. Also add `LocalBusiness` schema referencing the industry type (`Plumber`, `HVACBusiness`, `LandscapingService` — these are valid schema.org types). Google surfaces FAQ rich results in SERPs.

**Create a `/blog` or `/guides` section.** You need indexable content for long-tail keywords. Specific articles:
- "How to Ask Customers for Google Reviews (Without Being Awkward)"
- "Google Review Policy 2026: What Small Businesses Need to Know"
- "What Is Review Gating and Why Google Bans It"
- "How to Respond to Negative Google Reviews [Templates]"
- "Pool Service Marketing: Why Reviews Beat Ads"
- One per industry vertical: "HVAC Reviews: Why They Matter More Than Referrals"

These target high-intent informational queries. The people searching "how to get more google reviews" are your exact customers.

**Add `hreflang` and `lang` attributes.** Your `<html>` tag needs `lang="en"`. Even if you're English-only now, it's a baseline SEO signal.

**Add canonical URLs explicitly.** Your industry pages should have `<link rel="canonical" href="https://usesmalltalk.com/for/pool-companies" />` to prevent duplicate content issues. Use `alternates.canonical` in `generateMetadata()`.

**Improve sitemap.** Your current sitemap is missing:
- `/not-review-gating` (this is a content page that should be indexed — it's a differentiator)
- `/contact`
- Future blog/guide pages
- Add `lastmod` dates from git or a CMS timestamp

**Add `robots` meta per page type.** Onboarding is already `noindex` (good). Make sure `/dashboard/*`, `/admin/*`, `/login`, `/signup` are all `noindex, nofollow`. Your sitemap correctly excludes them, but belt-and-suspenders.

### Content & Keyword Strategy

**Target "review management" + industry keywords.** Your verticals are good but the URLs and titles could be more keyword-dense:
- Current: `/for/pool-companies` -> Title: "Pool Companies | small Talk"
- Better: `/for/pool-service-reviews` -> Title: "Pool Service Review Management Software | small Talk"
- Target keywords: "pool service google reviews," "hvac review management," "plumber review software"

**Add a comparison page.** Create `/vs/podium`, `/vs/birdeye`, `/vs/nicejob` pages. These capture high-intent bottom-of-funnel traffic. Structure:
- Feature comparison table (you vs them)
- Pricing comparison (you're 5x cheaper than Podium)
- "Why small Talk is different" (honest reviews, not review gating)
- These pages rank for "[competitor] alternative" queries

**Add a pricing page at `/pricing`.** Your landing page mentions $79/mo but there's no dedicated pricing page. Google indexes pricing pages and they rank for "[product] pricing" queries. Include the trial details, what's included, and a simple FAQ.

**Internal linking.** Your industry pages don't link to each other. Add a "small Talk also works for..." section at the bottom of each vertical page linking to the other 4. This distributes page authority and keeps users on-site.

**Title tag optimization.** Your root page title should lead with the keyword, not the brand:
- Current: "small Talk — Get More Detailed Google Reviews"
- Better: "Get More Detailed Google Reviews | small Talk — Guided Review Software for Service Businesses"
- Keep it under 60 characters for SERP display: "Guided Google Reviews for Service Businesses | small Talk"

### Local SEO (for your customers, but also for you)

**Create a Google Business Profile for small Talk itself.** You're a software product, but having a GBP improves brand search results and gives you a knowledge panel.

**Add schema for your SaaS pricing.** Use `Product` + `Offer` schema with `price: "79.00"`, `priceCurrency: "USD"`, `priceValidUntil`. Google can surface this in search results.

### Performance SEO

**Optimize font loading per route.** Load Inter only on `/dashboard/*` routes. Load Fraunces/DM Sans only on consumer and landing routes. This reduces First Contentful Paint by ~200-400ms on each route family. Use Next.js route groups with separate layouts.

**Add `<link rel="preconnect">` hints.** In your root layout, add preconnect for:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```
Next.js Font module handles this automatically for Google Fonts, but verify it's working in your production build by checking the `<head>` output.

**Check Core Web Vitals.** Run Lighthouse on your landing page and consumer flow. Your warm background color, card shadows, and animations could cause CLS (Cumulative Layout Shift) if fonts swap late. The `display: "swap"` helps but measure it.

---

## Summary Scorecard

| Area | Grade | Notes |
|------|-------|-------|
| **Design System** | A | Cohesive, warm, premium. Spec adherence is excellent. |
| **Consumer Flow UX** | A- | Adaptive, fast, honest. Accessibility gaps knock it down. |
| **AI/Review Generation** | A | 15 voices, rating-aware tone, multi-provider fallback. Sophisticated. |
| **Security** | B+ | Strong fundamentals, but missing rate limits on key endpoints, no webhook idempotency, thin admin auth. |
| **Dashboard** | B | Feature-complete for Phase 1, but no caching, no pagination, no analytics. |
| **Admin Panel** | B+ | Attention scoring is smart. Needs audit logging and proper auth. |
| **Landing/Marketing** | B+ | Beautiful design, clear value prop. Missing social proof, video, competitor comparison. |
| **SEO** | B | Good structure, but shared OG images, no per-vertical differentiation. |
| **Legal/Compliance** | F | Placeholder pages. Must fix before launch. |
| **Error Handling** | C | Basic error boundaries, no reporting, no retry logic. |
| **Accessibility** | C+ | Color contrast good, motion preferences partially respected, ARIA gaps. |

**Overall: B+** — Well-built product with a strong design foundation and a genuinely thoughtful core flow. The main gaps are operational (legal, error reporting, rate limiting) rather than architectural. The codebase is clean, consistent, and well-organized. Ship the legal pages, add error reporting, and tighten the security gaps, and this is launch-ready.
