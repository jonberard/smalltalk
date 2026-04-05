# Database Schema

Supabase (Postgres). All tables use UUIDs as primary keys with `gen_random_uuid()` defaults. Timestamps are `timestamptz` defaulting to `now()`.

---

## How It All Connects

```
Business signs up (auth.uid() becomes their businesses.id)
    │
    ├── Creates services ("Weekly Pool Cleaning")
    ├── Creates employees ("Marcus")
    ├── Optionally customizes topics (or uses global defaults)
    │
    └── Creates a review_link for a specific customer
            │
            │  customer_name: "Sarah"
            │  unique_code: "abc123" → usesmalltalk.com/r/abc123
            │
            └── Customer opens link → review_session created
                    │
                    ├── Picks star rating (1-5)
                    ├── Selects topics, answers follow-ups
                    ├── Optionally adds text
                    ├── AI generates review draft
                    └── Customer copies & posts to Google
                        (or sends private feedback if 1-2 stars)
```

---

## Tables

### businesses

The business owner's account. The row's `id` IS the Supabase auth user's UUID — set on signup so `auth.uid() = id` works for RLS.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | Same as auth.uid() |
| name | text | Business display name |
| logo_url | text, nullable | Logo for branding in the consumer flow |
| google_review_url | text | Google Business review link customers post to |
| google_place_id | text, nullable | Google Places ID — used to construct review URLs with mobile deep linking |
| business_city | text, nullable | City/area extracted from Google Places — used for SEO in generated reviews |
| neighborhoods | text[], nullable | Service area neighborhoods — one randomly picked per review for hyper-local SEO |
| stripe_customer_id | text, nullable | Stripe customer ID for billing |
| stripe_subscription_id | text, nullable | Stripe subscription ID for lifecycle tracking |
| subscription_status | text, default `'none'` | `none`, `trialing`, `active`, `past_due`, `canceled`, `paused` |
| trial_requests_remaining | integer, default `10` | Free review links before requiring payment |
| trial_ends_at | timestamptz, nullable | When the free trial expires (7 days from signup) |
| created_at | timestamptz | |

**RLS:** Users can select, insert, and update only their own row (`auth.uid() = id`).

---

### services

Types of work the business offers. Referenced when creating review links so the customer sees "How was your Weekly Pool Cleaning?" instead of a generic prompt.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | |
| business_id | uuid (FK → businesses) | Owner |
| name | text | e.g. "Weekly Pool Cleaning", "Equipment Repair" |
| created_at | timestamptz | |

**RLS:** Full CRUD where `business_id = auth.uid()`. Cascade deletes when business is removed.

---

### employees

Individual technicians/workers. Optional on review links — some businesses don't track per-employee.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | |
| business_id | uuid (FK → businesses) | Owner |
| name | text | e.g. "Marcus" |
| created_at | timestamptz | |

**RLS:** Full CRUD where `business_id = auth.uid()`. Cascade deletes when business is removed.

---

### topics

The tappable chips customers see in the review flow. Each topic has a follow-up question with multiple-choice answers on a spectrum.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | |
| business_id | uuid (FK → businesses), nullable | `null` = global default, set = business-customized |
| label | text | Chip label, e.g. "Timeliness", "Work Quality" |
| tier | text | `positive`, `neutral`, or `negative` (see below) |
| follow_up_question | text | e.g. "How was the timing?" |
| follow_up_options | text[] | e.g. `["Early", "Right on time", "A bit late", "Very late"]` |
| sort_order | integer | Display order within a tier |
| created_at | timestamptz | |

**RLS:** Users can CRUD their own topics (`business_id = auth.uid()`). Anyone (including anonymous) can read global defaults (`business_id is null`).

#### Rating Tiers

The tier determines which set of topics a customer sees based on their star rating:

- **positive** (4-5 stars): Celebratory topics — "Went Above & Beyond", "Would Recommend"
- **neutral** (3 stars): Balanced topics — "What Went Well", "What Could Improve"
- **negative** (1-2 stars): Problem-focused topics — "Responsiveness", "Follow-Through", "Didn't Fix the Problem"

The first 6 topics (Timeliness, Work Quality, Communication, Pricing/Value, Professionalism, Cleanliness) are shared across all tiers with identical follow-up questions. The tier-specific topics come after these shared ones.

#### Topic Resolution

When loading topics for a customer:
1. Check if the business has custom topics for the relevant tier
2. If yes, use those
3. If no, fall back to global defaults (`business_id is null`)

The 25 global seed topics (8 positive + 8 neutral + 9 negative) ship with the database and are never deleted.

---

### review_links

A unique link sent to a specific customer after a job. Each link is single-use — one customer, one review.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | |
| business_id | uuid (FK → businesses) | Owner |
| service_id | uuid (FK → services) | What service was performed |
| employee_id | uuid (FK → employees), nullable | Who did the work (optional) |
| customer_name | text | Personalize the flow: "Hi Sarah!" |
| customer_contact | text | Phone number or email for SMS/email delivery |
| unique_code | text, unique | Short code for the URL: `/r/{unique_code}` |
| created_at | timestamptz | |

**Unique index** on `unique_code` for fast lookups.

**RLS:**
- Authenticated users can select, insert, update where `business_id = auth.uid()`
- Anonymous users can select any link (needed for the consumer flow to resolve `/r/[code]`)

**FK behavior:** Cascade deletes with business and service. Employee uses `on delete set null` — if an employee is removed, existing review links survive.

---

### review_sessions

Tracks a customer's progress through the review flow. Created when they open the link, updated as they complete each step.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | |
| review_link_id | uuid (FK → review_links) | Which link this session belongs to |
| star_rating | integer, nullable | 1-5, set on first screen |
| topics_selected | jsonb, nullable | Array of `{ topic_id, label, follow_up_answer }` |
| optional_text | text, nullable | Free-form text the customer adds |
| generated_review | text, nullable | AI-drafted review text |
| status | text, default `'created'` | `created` → `in_progress` → `drafted` → `copied` → `posted` |
| feedback_type | text, default `'public'` | `public` (Google review) or `private` (direct to business) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Check constraints:** `star_rating` between 1 and 5, `feedback_type` in (`public`, `private`).

**RLS:**
- Authenticated users can select sessions where the linked review_link's `business_id = auth.uid()` (subquery join)
- Anonymous users can insert and update (the consumer flow operates without auth)

---

## TypeScript Types

All types are defined in `lib/types.ts` with row, insert, and update variants for each table. The `topics_selected` JSONB column is typed as `TopicSelection[]`:

```typescript
type TopicSelection = {
  topic_id: string;
  label: string;
  follow_up_answer: string;
};
```
