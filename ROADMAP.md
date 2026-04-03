# Small Talk — Product Roadmap

> "Your customers want to help you. They just need the right words."

Last updated: March 31, 2026

---

## The Mission

Small Talk is the only review tool that eliminates the blank box. We don't send customers to a blank Google review page and hope for the best. We guide the entire experience — stars, topics, follow-ups, AI-drafted text — so every customer leaves a detailed, genuine review that sounds like they spent 10 minutes writing it. In 30 seconds.

We are not a review management platform. We are not an SEO suite. We are a **review writing tool** — the only one that exists.

---

## Competitive Landscape

| Company | What They Do | Price | Their Weakness |
|---------|-------------|-------|----------------|
| Birdeye | All-in-one reputation platform | $299-449/mo | Sends link to blank box. No writing help. |
| Podium | Customer communication + reviews | $399-599/mo | Same blank box. Overkill for small biz. |
| NiceJob | Review generation + referrals | $75-125/mo | Asks for reviews. Doesn't write them. |
| Merchynt | SEO suite + review feature | $50-99/mo | Reviews are a bolt-on feature, not the focus. Open-ended "what did you like" prompt. |
| Spokk | Feedback → AI reviews + loyalty + referrals | $49-166/mo | Two-step process (feedback THEN review). Open text feedback form. Review gates negative feedback with "smart skip logic." Jack of all trades. |
| **Small Talk** | **Guided flow → AI review in one step** | **$79-149/mo** | **We're new. No brand recognition yet.** |

### Our Advantages Over Every Competitor

1. **One flow, not two.** Competitors collect feedback, THEN generate a review. Two interactions. We do both in one continuous 30-second guided experience. Less friction, less drop-off.

2. **Structured input beats open text.** Topic chips + spectrum follow-ups = zero typing. The AI gets richer input from our structured taps than from anyone's blank feedback form.

3. **15 voice styles.** Every review sounds genuinely different. Competitors use one prompt — every review from the same business sounds the same.

4. **Honest reviews by design.** Our adaptive flow handles 1-5 stars with equal care. The public/private fork for negative reviews is genuinely fair — not review gating. We're the only truly Google-compliant review tool.

5. **Negative review alerts.** We don't hide bad reviews. We make sure the business sees them first and can respond fast. The fastest response wins the narrative.

---

## Phase 1 — Launch (Current)

**Goal:** Ship the MVP. Get 10-20 founding customers in Austin. Prove the product works with real businesses.

### Product (Complete or In Progress)

- [x] Consumer review flow — adaptive branching by star rating
- [x] Three rating tiers with tier-specific topic chips
- [x] Follow-up spectrum per topic with optional detail text
- [x] Public/private fork for 1-2 star reviews
- [x] 15 AI writing styles with tone-by-rating modulation
- [x] Multi-LLM architecture (Anthropic implemented, OpenAI/Gemini placeholders)
- [x] Model configurable via ANTHROPIC_MODEL env var
- [x] Business dashboard — Home (stats, funnel, activity, needs attention), Send, Settings
- [x] Supabase database with RLS policies
- [x] Auth (signup, login, protected routes)
- [x] Dynamic consumer flow reading from database
- [x] Review session tracking through entire funnel
- [x] Marketing landing page
- [x] Deployed to Vercel
- [x] Interstitial handoff screen (visual paste coaching before Google opens)
- [ ] Mobile deep link to Google Maps app with fallback
- [x] Stripe integration ($79/mo Starter, $149/mo Growth)
- [x] 7-day free trial with 10 review requests
- [x] Subscription gating on Send functionality
- [x] CSV bulk sends locked behind paid plan
- [ ] Twilio 10DLC registration (submit and wait for approval)
- [ ] Native SMS share as interim (pre-fills message, business owner sends from their phone)
- [x] Resend email notifications for negative public reviews
- [ ] Resend domain verification (usesmalltalk.com)
- [ ] Point usesmalltalk.com DNS to Vercel
- [ ] Debug label removed from review draft screen (voice_id + model)
- [ ] Business intake workflow after signup (business name, Google Place ID, services, employees, topics, logo — populates dashboard)
- [x] Add SEO keyword injection to AI review generation — business name, service type, and city woven naturally into every generated review
- [ ] Voice-to-text input as alternative to topic chips on the consumer flow. Add a microphone icon option on the topic selection screen: "Or just tell us what happened." Customer taps the mic, speaks for 10-15 seconds, Web Speech API transcribes it, AI cleans it into a polished review — removes ums, ahs, and rambling while keeping their genuine sentiment and specific details. This gives the customer TWO paths: tap through chips (structured, fast) or talk (natural, richer input). Both feed into the same 15-voice AI generation system.

### Landing Page Updates

- [ ] Update headline positioning: "Your customers want to help you. They just need the right words."
- [ ] Add competitor comparison section: "Other tools send a link to a blank box. Small Talk eliminates the blank box entirely."
- [ ] Add the honest review angle prominently: "The only review tool that handles negative feedback honestly — because your reputation depends on trust, not suppression."
- [ ] Update pricing to $79/$149 with founding customer rate ($49/$99 for first 20-30 customers)
- [ ] Add FAQ: "How is this different from Birdeye/Podium?" — "They charge $300-500/mo to send a link to a blank text box. We guide the entire writing experience for a fraction of the cost."
- [ ] Add FAQ: "How is this different from Spokk/Merchynt?" — "They collect feedback first, then generate a review — two steps. Small Talk does it in one 30-second flow. And we handle negative reviews honestly instead of filtering them out."
- [ ] Social proof: replace fake "500+ businesses" with "Built for pool companies, landscapers, contractors, and local pros" until we have real numbers
- [ ] Add "As seen working with" section once first 5 customers are active (with permission)
- [ ] Add SEO value proposition section to landing page. Headline: "Every review boosts your Google ranking." Explain that Small Talk's AI naturally weaves in the business name, service type, and city — the exact keywords Google indexes for local Map Pack results. Position as: "Other tools get you reviews. Small Talk gets you reviews AND rankings." Key differentiator against Spokk and Merchynt — neither explicitly optimize review text for local SEO.
- [ ] Update the hero subheadline or add a secondary benefit line that mentions the SEO angle: "Turn happy clients into detailed Google reviews that boost your ranking."
- [ ] Add a stat or visual to the SEO section: "Google reviews with specific keywords rank 2x higher in local search results" (research and verify this claim before publishing)

### Go-To-Market

- [ ] Pool guy (first customer) — free forever as case study
- [ ] 5 Austin-area service businesses — personal outreach, founding rate $49/mo
- [ ] Collect before/after data: review count, average length, star rating before and after Small Talk
- [ ] Get 3 video testimonials from founding customers
- [ ] Document the "12 words to 85 words" stat with real data
- [ ] Create a one-page PDF sales sheet for in-person pitches

### Business Setup

- [ ] Meet with CPA (FERS medical retirement + business income structure)
- [ ] Meet with business attorney (entity formation — LLC vs S-Corp)
- [ ] Form business entity
- [ ] Business bank account
- [ ] Register Twilio 10DLC under business entity
- [ ] Request Twilio A2P 10DLC campaign approval
- [ ] Stripe account (live mode, not test mode)
- [ ] Configure Stripe (products, prices, webhook endpoint, customer portal)
- [ ] Configure Resend (API key, domain verification, sender address)
- [ ] Configure Twilio (phone number, messaging service, env vars)
- [ ] Google Places API key (enable Places API in Google Cloud Console)

---

## Phase 2 — The Features That Kill Spokk (Month 2-3)

**Goal:** Match and exceed Spokk's feature set while maintaining our core advantage (one-flow, structured input, honest reviews).

### Automated SMS Sequences

- [ ] "Set and forget" automation mode
- [ ] Business owner marks job complete → Small Talk sends review request automatically
- [ ] Timing sequence: review request at 2 hours, gentle reminder at 24 hours if no response
- [ ] Smart skip: don't remind if already completed
- [ ] Configurable timing in Settings (default 2hr/24hr, adjustable)

### Staff Performance Dashboard

- [ ] Dashboard view: employee name, average star rating, total reviews, topic breakdown
- [ ] "Marcus: 4.8 avg across 23 reviews. Top qualities: On Time, Quality, Professionalism"
- [ ] "David: 4.2 avg across 15 reviews. Lowest: Communication, Timeliness"
- [ ] Data already exists in review_sessions → review_links → employees. Just needs a UI.
- [ ] Monthly email summary to business owner: "Your team's review performance this month"

### Multi-Platform Review Support

- [ ] Add Yelp as a secondary review target
- [ ] Add industry-specific platforms:
  - Angi / HomeAdvisor (contractors, plumbers, HVAC)
  - Healthgrades (dentists, doctors)
  - Avvo (lawyers)
  - TripAdvisor (restaurants, hospitality)
- [ ] Business owner selects their platforms in Settings
- [ ] Consumer flow shows platform options on the draft screen: "Post to Google" (primary) + "Also post to Yelp" (secondary)
- [ ] Track which platforms each review was posted to

### SEO-Optimized Review Generation

- [ ] Add business city and service category to the AI generation prompt
- [ ] AI naturally weaves in local SEO keywords: "best pool cleaning in Austin" or "reliable HVAC repair in Cedar Park"
- [ ] Don't make it obvious — the keywords should feel natural, not stuffed
- [ ] Track which keywords appear in generated reviews for reporting

### Referral Nudge (Light Version)

- [ ] After a 4-5 star review is posted, show: "Know someone who could use [Business Name]? Share their link."
- [ ] Pre-filled text message with the business's review link
- [ ] Track referral source in review_links table
- [ ] Don't build a full referral program yet — just the nudge

### Landing Page Updates

- [ ] Add staff performance screenshot to features section
- [ ] Add multi-platform logos (Google, Yelp, Angi, Healthgrades)
- [ ] Add SEO benefit messaging: "Every review boosts your Google ranking"
- [ ] Real social proof: actual customer count, actual review stats
- [ ] Case study page: "How Crystal Clear Pools went from 4.2 to 4.8 stars in 60 days"

---

## Phase 3 — The Distribution That Kills Merchynt (Month 4-6)

**Goal:** Open the agency distribution channel and CRM integrations. Shift from direct sales to scalable distribution.

### White-Label Program for Marketing Agencies

- [ ] Agency pricing: $30-40/location wholesale (agencies mark up to whatever they want)
- [ ] Custom branding: agency's logo, colors, and domain on the consumer flow
- [ ] Agency dashboard: manage multiple client businesses from one login
- [ ] Onboarding kit: sales scripts, pitch deck, demo account for agencies
- [ ] Agency portal: billing, client management, white-label settings
- [ ] Target: 5 agencies managing 10+ locations each = 50+ accounts from 5 sales conversations

### CRM Integrations

- [ ] ServiceTitan (pool, HVAC, plumbing, electrical)
- [ ] Jobber (landscaping, cleaning, general contracting)
- [ ] Housecall Pro (home services)
- [ ] HubSpot (general CRM)
- [ ] Salesforce (larger businesses)
- [ ] Integration pattern: when job is marked "complete" in CRM → auto-create review_link → trigger SMS sequence
- [ ] Prioritize based on which CRMs actual customers use — don't build speculatively
- [ ] Zapier integration as a catch-all for CRMs we don't directly support

### AI Review Response Suggestions

- [ ] When a new Google review appears (via Places API monitoring), show it in the dashboard
- [ ] AI generates a suggested reply using the same Claude/GPT infrastructure
- [ ] Business owner approves, edits, or writes their own
- [ ] One-click post reply to Google (Google Business Profile API supports this for responses, unlike reviews)
- [ ] Handles both positive and negative review responses with appropriate tone

### Google Places API Integration

- [ ] Pull live Google rating, review count, and recent reviews into dashboard Home
- [ ] Show rating trend over time: "Your rating this month: 4.7 → 4.8 (+0.1)"
- [ ] "Since you started using Small Talk" benchmark line on the trend chart
- [ ] Review monitoring: alert when new Google reviews appear (not just Small Talk reviews)

### Admin Dashboard

- [ ] Route: /admin (protected by admin email check)
- [ ] Current state: smart routing sends 4-5 star reviews to Haiku (cheap) and 1-3 star reviews to Sonnet (nuanced). ANTHROPIC_MODEL env var overrides this when set.
- [ ] Admin dashboard model selector should let me switch between: smart routing (default), force all to Haiku, force all to Sonnet, force all to a specific OpenAI or Gemini model
- [ ] Implement OpenAI provider: install SDK, write callOpenAI function, add API key. Same prompt system, different API call.
- [ ] Implement Gemini provider: install SDK, write callGemini function, add API key. Same prompt system, different API call.
- [ ] Build automatic fallback chain: Anthropic → OpenAI → Gemini. If primary fails, try next provider automatically. Customer never sees an error unless ALL providers are down.
- [ ] Log every provider failure with timestamp and error so I can see reliability patterns
- [ ] The smart rating-based routing should work WITHIN each provider too — if we're on OpenAI, use GPT-4o-mini for positive reviews and GPT-4o for negative reviews. Same cost-saving logic, different models.
- [ ] All of this saves to site_settings table in Supabase, not env vars. Changes take effect immediately without redeployment.
- [ ] Cost tracker: log every API call with provider, model, tokens, estimated cost
- [ ] Review quality log: last 50 generated reviews with voice, provider, model metadata
- [ ] System health: Twilio status, Resend status, Supabase status, API response times

### Pricing Update

- [ ] Add Pro tier: $249/mo, up to 10 locations, custom branding, dedicated onboarding
- [ ] Based on validation from Phase 2 — only add if multi-location demand exists
- [ ] Consider annual pricing: 2 months free (like Spokk does)

---

## Phase 4 — The Moat Nobody Can Copy (Month 6-12)

**Goal:** Build defensible advantages through data, intelligence, and brand positioning that competitors can't replicate quickly.

### Industry-Specific Voice Packs

- [ ] Expand from 15 to 25+ writing styles
- [ ] Industry-tuned voices: dental review voices use different language than plumbing review voices
- [ ] "The Dental Patient" voice knows to mention things like "gentle," "painless," "explained everything"
- [ ] "The Homeowner" voice knows to mention things like "showed up on time," "cleaned up after," "fair estimate"
- [ ] Business owner can preview and select preferred voices in Settings
- [ ] AI learns which voices convert best for each industry over time

### Review Intelligence & Analytics

- [ ] Topic analysis: "Your reviews mention 'on time' 47% of the time but never mention 'clean.' Tell your team to focus on cleanliness."
- [ ] Sentiment trending: which topics are improving vs declining month over month
- [ ] Competitor benchmarking: "Businesses like yours in Austin average 4.6 stars. You're at 4.8."
- [ ] Review velocity: "You're getting 12 reviews/month. Top performers in your industry get 20+."
- [ ] Actionable insights email: monthly digest with specific recommendations

### The Honest Review Brand

- [ ] Publish the "Honest Review Manifesto" — a public document explaining why review gating is harmful and how Small Talk handles every rating with equal care
- [ ] Blog content: "Is AI Review Generation Legal? The FTC's Definitive Answer"
- [ ] Blog content: "What Birdeye and Podium Don't Tell You About Review Gating"
- [ ] Blog content: "Why Your 4-Star Reviews Are Worth More Than Your 5-Star Reviews"
- [ ] Seek coverage in local business publications and podcasts
- [ ] Position as thought leader in honest review practices
- [ ] Apply for Google Business Profile partnership or certification if available

### Loyalty Program (If Validated)

- [ ] Only build if founding customers request it
- [ ] QR code check-in at point of service
- [ ] Visit tracking with customizable reward milestones
- [ ] Automated SMS reward notification when earned
- [ ] Integrate with the review flow: loyalty check-in triggers review request after the visit
- [ ] This competes directly with Spokk's loyalty feature

### Referral Program (Full Version)

- [ ] Only build if the Phase 2 referral nudge shows traction
- [ ] Unique referral link per customer
- [ ] Both sides rewarded (referrer and new customer)
- [ ] Full referral tracking dashboard
- [ ] Automated SMS referral link sent after positive review

### Multi-Location Support

- [ ] Add locations table to Supabase
- [ ] Move google_review_url and business name from businesses to locations
- [ ] Location switcher in dashboard header
- [ ] Per-location stats, funnel, and activity feed
- [ ] "All Locations" combined view
- [ ] Per-location custom topics and employees
- [ ] This is the architectural refactor we planned — Option A from the earlier discussion

### The Public API — "Stripe of Review Generation"

The long game. Stop being a tool businesses log into. Become the infrastructure layer that every other tool plugs into.

- [ ] Build a public REST API: POST /api/v1/generate-review with API key authentication
- [ ] Any platform — Jobber, NiceJob, ServiceTitan, Housecall Pro, even Spokk — can send customer feedback data to Small Talk and get back a polished, SEO-optimized, voice-varied review
- [ ] Pricing: per-generation (e.g., $0.10-0.25 per review) or monthly API tier
- [ ] Small Talk becomes the "Intel Inside" of review generation — our engine, their interface
- [ ] This means we don't have to beat Spokk on loyalty programs or Birdeye on feature breadth. We become the engine they all depend on.
- [ ] Developer documentation, SDKs, and a "Powered by Small Talk" badge
- [ ] The moat: our 15+ voice system, tone-by-rating modulation, SEO keyword injection, and industry-specific tuning are hard to replicate. The API packages all of it into one call.

---

## Technical Debt & Infrastructure (Ongoing)

- [ ] Implement OpenAI provider in review-generator.ts
- [ ] Implement Gemini provider in review-generator.ts
- [ ] A/B test review quality across providers
- [ ] Move from env var model selection to site_settings table (admin dashboard)
- [ ] Automatic fallback chain across providers
- [ ] Rate limiting on API routes (prevent abuse)
- [ ] Soft caps on review requests (500/mo Starter, 1500/mo Growth, 5000/mo Pro — internal circuit breakers, not customer-facing limits)
- [ ] Monitoring and alerting (Sentry or similar for error tracking)
- [ ] Database backups strategy (Supabase handles this but verify)
- [ ] Performance optimization: review generation response time
- [ ] Accessibility audit on consumer flow (WCAG compliance)
- [ ] Unit tests for critical paths (review generation, billing, auth)

---

## Key Metrics to Track

| Metric | What It Tells Us | Target |
|--------|-----------------|--------|
| Funnel completion rate | % of customers who finish the flow | >60% |
| Paste-through rate | % who actually paste to Google | >40% |
| Average review word count | Are we solving the blank box problem | >50 words |
| Review voice diversity | Are the 15 voices producing varied output | No two identical |
| Trial to paid conversion | Is the product sticky enough | >25% |
| Monthly churn rate | Are businesses staying | <5% |
| Average revenue per customer | Are we priced right | >$70/mo |
| Customer acquisition cost | How much to get a new customer | <$100 |
| Net Promoter Score | Would they recommend us | >50 |
| Time to first review | How fast does a new customer see value | <24 hours |

---

## The North Star

Every competitor in this space sends customers to a blank text box and says "good luck." We are the only product that turns that blank box into a guided, 30-second experience that produces genuine, detailed, varied reviews.

The business isn't "we auto-submit to Google." The business is "we turn a 5-minute writing task into a 30-second tapping task." That's worth $79-149/month to any business that depends on Google reviews for customers.

The company that owns the writing step owns the review market.

We own the writing step.

---

*This roadmap is a living document. Update it as we learn from real customers and real data. Every feature decision after Phase 1 should be validated by customer demand, not speculation.*

---

## The Vision

Phase 1: We're the best review writing tool.
Phase 2: We're the best review writing tool with automation and intelligence.
Phase 3: We're the engine that agencies use to manage reviews at scale.
Phase 4: We're the infrastructure that the entire review industry runs on.

Every phase builds on the last. Every feature compounds. The company that owns the writing step owns the review market. Then it owns the review infrastructure. Then it's the Stripe of reviews.

---
