# small Talk — Product Roadmap

> "Your customers want to help you. They just need the right words."

Last updated: April 21, 2026

---

## Purpose

This is the working build guide for small Talk.

We use it for:
- pre-launch priorities
- post-launch priorities
- founder operations
- deciding what **not** to build yet

Legend:
- `[x]` done
- `[ ]` not done yet

---

## North Star

small Talk should be the cleanest way for a local service business to:
- get more detailed Google reviews
- hear unhappy customers before the situation gets worse
- follow up quickly
- run the whole process from a phone without friction

We are not trying to become a bloated reputation suite.
We win by owning the writing step, the recovery step, and the follow-through.

---

## Build Principles

1. **Honest reviews, not filtered reviews**
Every customer gets a real choice. No review gating. No suppression.

2. **The owner experience matters as much as the customer experience**
Capturing feedback is only half the product. The business owner needs to act on it.

3. **Mobile is not optional**
Many owners will live in the dashboard from their phone. If mobile feels cramped or confusing, the product feels unfinished.

4. **Reliability before feature breadth**
If the AI provider goes down, review generation cannot go down with it. Same for sends, reminders, and notifications.

5. **Customer pull beats founder imagination**
Anything big and complicated needs to earn its way onto the roadmap through real usage.

---

## Current State

### Core product

- [x] Adaptive consumer review flow
- [x] Public/private fork for low ratings
- [x] Structured topic + follow-up flow
- [x] AI-generated review draft flow
- [x] Google handoff flow with interstitial guidance
- [x] Private feedback recourse: customers can still post publicly later
- [x] Generic QR flow starts fresh after completion
- [x] Optional contact info for QR/private feedback
- [x] Reminder sequence MVP
- [x] Authentication, billing gates, and basic dashboard
- [x] Server-controlled public flow hardening
- [x] Legacy public endpoints retired

### Website and analytics

- [x] Landing page messaging cleanup
- [x] Industry pages + shared template refactor
- [x] PostHog instrumentation

### Owner-side basics

- [x] Private feedback email notification
- [x] Deep link from private feedback email to the dashboard
- [x] Mark private feedback as handled
- [x] Contact info shown when available

### Still true right now

- [x] Basic owner dashboard exists
- [ ] The owner dashboard is not yet a fully polished action center
- [ ] The admin dashboard does not exist yet
- [ ] Multi-provider AI failover does not exist yet

---

## How To Use This Roadmap

This roadmap now combines:
- the original broad product vision
- what we have actually built
- what we now know matters most before launch

So nothing important is supposed to disappear.
Instead, every item should live in one of these buckets:
- `Pre-Launch — Must Do Next`
- `Post-Launch — Should Do Soon`
- `Later — Only If Customers Pull It Out Of Us`
- `Not Important Right Now`

If an older idea is missing, it either:
- got intentionally deprioritized
- got folded into a broader section
- or needs to be added back explicitly

---

## Pre-Launch — Must Do Next (0-30 Days)

These are the highest-leverage items before pushing harder on acquisition and paid growth.

### 1. Owner Dashboard V2 — Highest Product Priority

The customer flow is getting strong. The owner experience is the biggest remaining gap.

- [x] **Mobile dashboard cleanup — foundation shipped**
  - Cramped activity rows were replaced with calmer stacked sections
  - Secondary actions were moved out of crowded inline rows
  - Mobile nav now reflects real owner workflows more closely
  - Still to do:
    - final spacing/tap-target QA pass
    - tighten a few remaining desktop modal/button layouts

- [x] **Private feedback inbox — foundation shipped**
  - New vs Handled filters
  - Cleaner private feedback cards
  - Clear contact, service, employee, rating, and message display
  - Still to do:
    - internal owner notes
    - richer filtering and bulk triage later if needed

- [ ] **Actionable owner workflow**
  - [x] Call / Email / Mark handled
  - [ ] Internal note field like "Called customer", "Resolved", or "No response"

- [x] **Request detail / timeline view — foundation shipped**
  - sent
  - opened
  - started
  - reminder events
  - private feedback sent
  - handled
  - public review drafted/copied later
  - reply drafted/copied later
  - Still to do:
    - deepen linked context between inbox, replies, and send history
    - keep labels truthful until Google sync exists

- [ ] **Manual send/share tools before full Twilio rollout**
  - [x] Copy personalized link
  - [ ] Copy ready-to-send SMS text
  - [ ] Copy ready-to-send email text
  - [ ] Copy link again / resend workflow

- [x] **Reply center foundation — foundation shipped**
  - unreplied review list
  - draft reply
  - copy reply
  - mark replied
  - Still to do:
    - better reply status grouping
    - richer request linking and follow-through states

- [x] **Owner dashboard information architecture — foundation shipped**
  - home overview
  - private feedback inbox
  - request detail view
  - replies area
  - cleaner mobile navigation

- [x] **Owner support page — foundation shipped**
  - plain-English explanation of how guided reviews work
  - plain-English explanation of private feedback and reminders
  - direct founder message form from inside the dashboard
  - Still to do:
    - turn it into a real owner help center, not just a support page
    - add workflow-first help home and article pages
    - land messages in the founder admin inbox, not just email
    - add richer FAQs based on real owner confusion
    - consider attaching screenshots or screen recordings later

- [ ] **Screen-by-screen mobile QA**
  - dashboard home
  - send page
  - private feedback modal
  - request detail/timeline
  - settings
  - billing

Why this is top priority:
If the owner cannot comfortably work through feedback and review activity from their phone, the product still feels incomplete.

---

### 2. AI Reliability and Provider Failover — Highest Technical Priority

small Talk depends on AI generation. That means provider resilience is a launch requirement, not a luxury.

- [x] Anthropic review generation is live
- [ ] OpenAI provider implementation
- [ ] Gemini provider implementation
- [ ] Automatic provider fallback chain
  - Anthropic → OpenAI → Gemini
  - Customer only sees an error if all providers fail

- [ ] Admin control for model/provider selection
  - default mode
  - forced provider mode
  - emergency provider override
  - system-tab visibility into live provider health and fallback status
  - quick manual provider switch if Anthropic is degraded or down

- [ ] Provider health logging
  - failures
  - latency
  - model used
  - cost estimates

- [ ] Internal usage + cost tracker
  - provider
  - model
  - tokens
  - estimated cost

- [ ] Smart routing preserved across providers
  - cheaper model for straightforward positive reviews
  - more nuanced model for negative reviews

- [ ] Admin provider selector moved out of env-only control and into app-managed settings

- [ ] Review quality log
  - recent generated reviews
  - voice used
  - provider used
  - model used

Why this is top priority:
If one provider goes down and review generation dies, the product stops being dependable. This has to be solved before scale.

---

### 3. Founder Admin Dashboard V1 — Highest Internal Ops Priority

This is for running small Talk itself, not for business owners.

- [ ] **Admin shell + navigation**
  - Desktop-first founder layout
  - Tabs:
    - Home
    - Businesses
    - Support / Risk
    - Revenue
    - AI / System
  - Warm small Talk visual language, but more utilitarian than the owner dashboard

- [ ] **Founder home — operations first**
  - Chosen direction from wireframes: **operations-first**, not revenue-first
  - Lead with `Needs attention now`
  - businesses past due
  - onboarding stuck
  - failed sends / failed reminders
  - AI/provider failures
  - support/dispute queue preview
  - lighter summary metrics below that
  - keep it calm and actionable, not a vanity dashboard

- [ ] **Businesses list**
  - search
  - sort by:
    - needs attention
    - alphabetical
    - MRR later, once reliable
  - business status
  - trial / paid / canceled / past due
  - onboarding complete / stuck
  - recent activity / inactivity
  - quick way to open business detail

- [ ] **Business detail page**
  - owner contact
  - subscription / trial state
  - onboarding state
  - request volume
  - review volume
  - private feedback volume
  - reminder health
  - recent activity
  - failed sends / errors
  - founder notes

- [ ] **Support / Risk queue**
  - make this a first-class screen, not just a card on Home
  - owner support inbox with unread state and close/review workflow
  - private feedback issues
  - businesses stuck in onboarding
  - businesses with no recent activity
  - failed reminder sends
  - failed message deliveries
  - angry-customer edge cases
  - support escalations / founder follow-up list

- [ ] **Revenue tab**
  - MRR
  - new MRR
  - churned MRR
  - net MRR change
  - past due count
  - trial-to-paid conversion
  - cancellations
  - restrained trends, not a finance cockpit
  - revenue is important, but still secondary to operational attention on the founder home screen

- [ ] **AI / System health**
  - provider usage
  - provider failures
  - failover events
  - delivery failures
  - estimated AI cost
  - recent system issues

- [x] **Founder notes**
  - [x] support notes per business
  - [x] follow-up state
  - [x] one reminder date per business note
  - [x] reminder queue visible in urgency order
  - [x] quick context before replying

- [ ] **Founder mobile / narrow-screen fallback**
  - home priority stack
  - compact businesses list
  - usable business detail
  - support queue that stays scannable

Why this is top priority:
Before you have a team, you need one clean place to handle communication, data, edge cases, and support without digging through raw systems.

#### Founder Admin V1 — Build order

1. Admin shell + navigation
2. Founder home
3. Businesses list
4. Business detail page
5. Support / Risk queue
6. Revenue tab
7. AI / System health tab

#### Founder Admin V1 — Screen-by-screen scope from wireframes

- [ ] **Screen 01 · Founder home**
  - `Needs attention now` at the top
  - quick cards for:
    - active
    - trialing
    - past due
    - canceled
  - operational alerts below:
    - onboarding stuck
    - failed reminder sends
    - failed message deliveries
    - AI/provider failures
  - short previews for:
    - support / risk queue
    - newest signups
    - businesses with no recent activity

- [ ] **Screen 02 · Businesses**
  - searchable list
  - urgency-first default sort
  - status pills:
    - trial
    - active
    - canceled
    - past due
  - onboarding state
  - recent activity / inactivity
  - quick link into business detail

- [ ] **Screen 03 · Business detail**
  - business profile summary
  - owner contact
  - subscription / trial state
  - onboarding state
  - review request volume
  - private feedback volume
  - reminder health
  - failed sends / errors
  - [x] founder notes
  - quick links into owner-facing dashboard context when useful

- [ ] **Screen 04 · Support / Risk**
  - businesses stuck in onboarding
  - failed reminders
  - failed deliveries
  - no recent activity
  - private-feedback / dispute edge cases
  - severity grouping so the ugliest issues rise first

- [ ] **Screen 05 · Revenue**
  - MRR
  - net MRR change
  - new MRR
  - churned MRR
  - past due count
  - conversion snapshots
  - simple trend views only

- [ ] **Screen 06 · AI / System**
  - provider failures
  - failover events
  - delivery failures
  - estimated AI cost later, once real tracking exists
  - reliability first, engineering-console noise second

- [ ] **Screen 07 · Narrow-screen fallback**
  - founder home stays useful on tablet / narrow laptop
  - support queue remains scannable
  - business detail does not collapse into a mess

#### Founder Admin V1 — Metrics we can ship truthfully now

- [ ] Active businesses
- [ ] Trialing businesses
- [ ] Canceled businesses
- [ ] Past due businesses
- [ ] New signups
- [ ] Onboarding complete / stuck
- [ ] Businesses with no recent activity
- [ ] Review requests sent
- [ ] Completion rate
- [ ] Private feedback count / rate
- [ ] Failed sends
- [ ] Failed reminders
- [ ] AI/provider failures

These are the numbers we can feel good about putting in front of you early, because they come from states we already own or can query directly without inventing math.

#### Founder Admin V1 — Needs plumbing before it is trustworthy

- [ ] MRR
- [ ] New MRR
- [ ] Churned MRR
- [ ] Net MRR change
- [ ] Trial-to-paid conversion trend
- [ ] Reactivated MRR
- [ ] Past-due dollars at risk
- [ ] Estimated AI cost
- [ ] Provider usage by cost and token volume

These are important, but they should not show up in the founder dashboard until the underlying reporting is stable enough that you would trust them when making a decision.

#### Founder Admin V1 — Plumbing required for those metrics

- [ ] Normalize Stripe subscription and revenue snapshots into app-owned reporting tables
- [ ] Record billing state changes with timestamps so MRR movement is historical, not guessed
- [ ] Add cancellation / churn reason tracking if we want useful churn analytics later
- [ ] Persist AI generation provider, model, latency, and estimated token/cost data
- [ ] Add delivery event summaries that are easy to aggregate by day/business/channel
- [ ] Decide which metrics live in raw views first vs materialized rollups later
- [ ] Add a churn / cancellation event model so `net MRR change` and `churned MRR` are based on real deltas, not best guesses
- [ ] Add a founder-reporting definition doc so terms like `active`, `past due`, `conversion`, and `churned` mean the same thing everywhere

---

### 4. Google Review Sync + Truthful Statuses

The dashboard should only claim what we truly know.

- [ ] **Keep pre-sync labels honest**
  - Use states like `Copied review`, `Opened Google`, and `Completed handoff`
  - Do **not** say `Posted on Google` unless we have direct confirmation

- [ ] **Google Business Profile review sync**
  - connect the correct Google Business Profile account/location
  - fetch real review data after it appears on Google
  - detect new and updated reviews through Google Business Profile APIs / notifications

- [ ] **Upgrade dashboard states after sync**
  - `Review detected on Google`
  - `New Google review received`
  - `Review updated on Google`

- [ ] **Keep handoff vs confirmed review separate**
  - one state for what happened inside small Talk
  - a different state for what Google actually confirmed later

Why this matters:
Trust is part of the product. If we overstate what happened, the dashboard feels sloppy. If we stay precise, owners trust the system more.

---

### 5. Launch Operations and Business Readiness

- [ ] Twilio A2P / 10DLC registration approved
- [ ] Native SMS share flow polished as fallback until A2P is fully live
- [ ] Resend domain verification complete
- [ ] Live Stripe setup fully verified
- [ ] Mobile QA pass across owner dashboard and customer flow
- [ ] Business onboarding / intake flow completed
  - business name
  - Google Place ID
  - services
  - employees
  - topics
  - logo

- [ ] Mobile deep link to Google Maps app with fallback
- [ ] Voice-to-text path in customer flow refined and production-ready
- [ ] Safe fallback when business has zero services or zero employees
- [ ] Account deletion flow completed
- [ ] Monitoring / alerting in place
- [ ] Debug/developer labels removed from customer-facing review draft experience

Why this matters:
These are the quiet launch blockers. The product can look good and still break trust if ops are messy.

---

### 6. Real Usage Validation

- [ ] 1-3 beta businesses actively using small Talk every week
- [ ] Before/after data captured
  - review count
  - review length
  - private feedback volume
  - completion rate

- [ ] 1-2 real testimonials or case studies
- [ ] Sales one-pager / case-study PDF

Why this matters:
The roadmap should start bending around real customer behavior as fast as possible.

---

## Post-Launch — Should Do Soon (30-90 Days)

These matter, but they come after the pre-launch items above.

### 1. Owner Product Expansion

- [ ] Staff performance dashboard
  - by employee
  - by service
  - rating trends
  - common praise / complaint themes

- [ ] Reminder controls
  - pause reminders
  - send reminder now
  - resend link
  - clearer reminder status

- [ ] Better filtering in owner dashboard
  - private feedback
  - unreplied reviews
  - low ratings
  - stalled requests

- [ ] Google review sync / monitoring
  - recent review visibility
  - response tracking
  - trend visibility
  - rating trend over time
  - "since you started using small Talk" benchmarks

- [ ] SEO reporting layer
  - keyword coverage in generated reviews
  - business/service/city usage visibility
  - lightweight ranking-impact storytelling without overclaiming

---

### 2. Growth and Conversion

- [ ] Comparison pages
  - Podium alternative
  - NiceJob alternative
  - Birdeye alternative
  - Spokk alternative

- [ ] More industry pages based on demand
  - roofers
  - electricians
  - cleaning companies
  - auto repair

- [ ] Proof and trust upgrades
  - real customer logos
  - real stats
  - customer stories

- [ ] Search Console and SEO hygiene
- [ ] Blog content around honest reviews, review gating, AI review legality, and review response strategy
- [ ] Better landing-page comparison and differentiation blocks
- [ ] Real case study pages
- [ ] Industry proof once enough customer data exists

---

### 3. Integrations and Workflow Automation

- [ ] Public webhook / Zapier-style setup documented cleanly
- [ ] First CRM integration based on actual customer demand
  - ServiceTitan
  - Jobber
  - Housecall Pro
  - not all at once

- [ ] Better automatic review-request triggers from completed jobs
- [ ] CRM-triggered send flow uses the same billing and eligibility rules as manual sends

---

### 4. Commercial and Pricing Expansion

- [ ] Validate whether Growth / Pro tier changes are actually needed
- [ ] Consider annual pricing only after churn and retention are understood
- [ ] Revisit multi-location pricing only after single-location value is proven

---

## Later — Only If Customers Clearly Pull It Out Of Us

These are real possibilities, but not now.

### Bigger platform expansion

- [ ] Multi-location support
- [ ] Agency / white-label program
- [ ] Multi-platform review support beyond Google
- [ ] Dedicated Pro / multi-location pricing

### Growth loops

- [ ] Referral nudge improvements
- [ ] Full referral program
- [ ] Loyalty / rewards

### Infrastructure moat

- [ ] Public API
- [ ] Industry-specific voice packs
- [ ] Review intelligence / benchmarking
- [ ] Industry-specific tuning and insights
- [ ] Expanded voice system beyond current set

These only matter after single-location owner workflow is excellent.

---

## Not Important Right Now

These are the easiest places to waste time.

- Do **not** build an in-app owner/customer messaging thread yet
- Do **not** turn small Talk into a generic all-in-one reputation platform
- Do **not** overbuild multi-location before single-location usage is strong
- Do **not** chase agency features before direct customer value is proven
- Do **not** overbuild analytics before enough real volume exists
- Do **not** expand hard into Yelp/Angi/etc. before Google is fully nailed

---

## Definition of "Launch Ready"

We are ready to lean harder into launch when these are true:

- [ ] Owner dashboard works cleanly on mobile
- [ ] Private feedback is easy for owners to review and act on
- [ ] Personalized and generic send flows both feel usable
- [ ] Twilio path is approved or the manual send fallback is excellent
- [ ] AI provider failover exists
- [ ] Founder admin dashboard can surface operational issues quickly
- [ ] 1-3 real businesses are actively using the product

---

## Owner Dashboard V2 — Specific Build Scope

This is the concrete scope for the next major product build.

- [ ] **Mobile home cleanup**
  - reduce crowded row layouts
  - make one primary status visually dominant
  - move secondary actions into expandable detail or dedicated screens

- [ ] **Private feedback inbox**
  - New
  - Handled
  - tap to open full detail
  - call/email actions
  - internal owner notes

- [ ] **Request detail view**
  - customer info
  - service
  - employee
  - reminders sent
  - funnel status
  - generated review
  - private feedback/public follow-up relationship

- [ ] **Replies area**
  - unreplied public reviews
  - AI draft reply
  - copy
  - mark replied

- [ ] **Settings cleanup**
  - reminders
  - timezone
  - business info
  - review destinations

- [ ] **Bottom nav re-evaluation for mobile**
  - current nav should reflect most-used owner actions, not just placeholder sections

---

## Why The Priorities Changed

The old roadmap leaned too far toward feature breadth.

What matters most right now is:
1. mobile owner usability
2. operational follow-through after feedback comes in
3. reliability when a provider or delivery service fails
4. founder visibility into the whole system

That is how small Talk becomes a dependable business tool instead of just a clever review demo.

---

## The Vision

Phase 1: We become the best way to turn real customer experiences into better-written Google reviews.

Phase 2: We become the best way for local service businesses to capture reviews **and** handle unhappy customers quickly.

Phase 3: We become the operating layer that helps owners, teams, and eventually agencies run review workflow without chaos.

The company that owns the writing step can eventually own much more.
But first, we need to own the customer flow, the owner workflow, and the operational reliability around both.
