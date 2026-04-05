# Dashboard Redesign — Design Spec

**Date:** 2026-04-05
**Approach:** Component extraction + restyle (Approach B)

---

## 1. Design System & Shared Tokens

New CSS variables in `globals.css` for the dashboard:

```
--dash-primary:    #E05A3D   (warm coral — CTAs, active nav, accents)
--dash-bg:         #FAFAF8   (warm grey background)
--dash-surface:    #FFFFFF   (card surfaces)
--dash-text:       #1A1D20   (primary text)
--dash-muted:      #6B7280   (secondary text)
--dash-border:     #E8E5E0   (warm border)
--dash-success:    #059669
--dash-warning:    #D97706
--dash-error:      #DC2626
--dash-shadow:     0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)
--dash-radius:     12px      (cards)
--dash-radius-sm:  8px       (buttons, inputs)
```

Page headings use `font-heading` (Fraunces) for just the page title. Everything else uses `font-dashboard` (Inter).

---

## 2. Shared Dashboard Components

New files in `components/dashboard/`:

### `stat-card.tsx`
Reusable stat card with icon slot, value, label, and optional trend indicator. Props: `icon`, `label`, `value`, `trend?` (up/down/neutral with percentage), `className?`.

### `status-pill.tsx`
Colored pill badge for review session status and subscription status. Status-to-color mapping:
- `posted`/`active` → green (`#059669` bg tint + text)
- `drafted`/`trialing` → amber (`#D97706` bg tint + text)
- `in_progress`/`past_due` → coral (`#E05A3D` bg tint + text)
- `sent`/`created`/`none` → grey (`#6B7280` bg tint + text)
- `canceled` → red (`#DC2626` bg tint + text)

### `skeleton.tsx`
Skeleton loading primitives: `SkeletonLine`, `SkeletonCircle`, `SkeletonCard` with `animate-pulse`. Each page composes these into its own loading state.

### `toast.tsx`
`ToastProvider` + `useToast()` hook. Renders bottom-right, auto-dismiss 4s. Variants: `success` (green), `error` (red), `info` (neutral). Replaces inline toast in Send page.

### `empty-state.tsx`
Friendly empty state: `icon` (SVG slot), `title`, `description`, `action?` (button label + onClick). Muted text, centered, generous vertical padding.

---

## 3. Dashboard Layout & Navigation

### Sidebar (desktop, `sm:flex`)
- Width: 220px, white bg, right border `--dash-border`
- Top: "small Talk" in Fraunces 600, "Dashboard" subtitle in muted
- Nav items (4): Home, Send, Billing, Settings
  - Active: `#E05A3D/8%` bg tint, coral text + icon fill, 12px radius
  - Inactive: `#6B7280` text, hover `#FAFAF8` bg
- Bottom: avatar circle (coral tint + initials), business name, `StatusPill` for subscription, "Sign out" as muted text link

### Mobile top bar
- Fixed top. "small Talk" left in Fraunces. Avatar circle right with profile dropdown.

### Mobile bottom tab bar
- 4 tabs: Home, Send, Billing, Settings
- Active: coral icon + text + subtle dot indicator above icon
- Inactive: `#6B7280` icon + text
- Safe area padding for notch devices

### Trial banner
Restyled from blue to warm amber (`#FFF7ED` bg, `#D97706` text). Subscribe button in coral.

### Content area
`sm:pl-[220px]`, `bg-[--dash-bg]`, max-width 960px centered.

---

## 4. Home Page (`/dashboard`)

### Welcome header
"Good [morning/afternoon/evening], [Business Name]" in Fraunces 600, 24px. Muted subtitle below. Time-of-day: morning 5-12, afternoon 12-17, evening 17+.

### Stat cards
Three `StatCard` in a `grid-cols-3` row (stacks on mobile):
- "Reviews This Month" — count + calendar icon
- "Average Rating" — decimal + 5 mini stars filled proportionally in coral
- "Completion Rate" — percentage + SVG progress ring in coral

### Two-column layout
Desktop: `grid-cols-5` (left 3, right 2). Mobile: single column.

**Left — "Recent Activity"**: Unified list (no tab switcher). Each row: avatar initial, customer name, `StatusPill`, star dots, time ago. Last 15 sessions. Empty state if no data.

**Right — "Needs Attention"**: Count badge (coral). List of stuck sessions with "Nudge" button. Empty: green checkmark + "All caught up".

### Conversion funnel
Collapsible at bottom. Toggle: "View conversion funnel" with chevron. Expanded: horizontal flow (Sent → Clicked → Drafted → Posted) with counts and percentages. 300ms slide animation.

### Removed
Google hero card placeholder, desktop FAB button.

---

## 5. Send Page (`/dashboard/send`)

### Form card
White card, generous spacing. Fields (20px gap):
- Customer first name (text, required)
- Phone or email (text, required, placeholder "e.g. (555) 123-4567 or sarah@email.com")
- Service (autocomplete dropdown from business services)
- Employee (optional autocomplete dropdown)

All inputs: 8px radius, `--dash-border`, coral focus ring. "Send Review Link" button: full-width, coral bg, white text, 48px height.

Trial counter below button if applicable.

### Share link section
Subtler card (border only, no shadow). Generic review link with copy button. QR placeholder.

### Recent sends table
Last 10 review links: customer name, masked contact, service, `StatusPill`, time ago. Stacked cards on mobile. Empty state if no data.

### Removed
Bulk CSV tab, `BulkUpload` component, `BulkUpgradePrompt`, mode toggle. `Paywall` kept and restyled with coral.

---

## 6. Billing Page (`/dashboard/billing`) — New

### Current plan card
"small Talk Pro" heading with `StatusPill`. Contextual content by status:
- **Trialing**: trial end date, countdown, progress bar (amber)
- **Active**: next billing date, price
- **Past due**: red warning banner, "Update Payment Method" button (opens Stripe portal)
- **Canceled**: resubscribe message + button (triggers checkout)
- **None**: "Start Free Trial" button (triggers checkout)

"Manage Billing" secondary button (coral border, transparent bg) opens Stripe portal. Only shown when `stripe_customer_id` exists.

### Usage stats
"This month's usage" — `StatCard` with review link count for current month.

### Invoice history
MVP: "View and download invoices in the billing portal" link to Stripe portal. Full invoice list deferred.

### Data
`useAuth()` for business record. Supabase count query for usage. `fetchWithAuth` for portal/checkout.

---

## 7. Settings Page (`/dashboard/settings`)

### Removed
Billing section (now its own page).

### Sections as stacked cards (24px padding, 20px gap between):

**Business Profile**: name input, logo upload, Google Places search. Save button per section, coral, right-aligned.

**Services**: heading + "+ Add" button (coral text). List with delete (trash icon). Inline add input.

**Employees**: same pattern as Services.

**Topics**: keep existing three-tier drag-and-drop. Restyle tier tabs + chips to match new design system. Minimal changes — color/radius only.

**Neighborhoods**: keep existing chips. Restyle add button to coral.

**Account**: email (read-only), "Change password" link (triggers `supabase.auth.resetPasswordForEmail()`), "Sign out" muted link, "Delete account" small red text with confirmation dialog. Delete is UI-only — logs "Account deletion requested" to console. Real deletion deferred.

---

## 8. Global Improvements

### Page transitions
CSS `dash-page-enter` animation: `opacity 0→1`, `translateY(4px→0)` over 200ms. Applied on mount to main content wrapper.

### Loading states
Each page renders skeleton compositions using shared `Skeleton*` primitives. No spinners.

### Empty states
`EmptyState` component: Home activity, Send recent sends, Needs Attention ("All caught up").

### Toast notifications
`ToastProvider` in layout.tsx. `useToast()` hook for Send + Billing feedback. Bottom-right, 4s auto-dismiss.

### Button interactions
`transition-all duration-150`. Hover: `brightness-95`. Active: `scale-[0.98]`. Disabled: `opacity-60 cursor-not-allowed`.

### Mobile responsive
`sm:` breakpoint at 640px. Stat cards stack. Two-column → single. Tables → stacked cards. `sm:pl-[220px]` → full-width.

---

## File Structure (new/modified)

```
components/dashboard/
  stat-card.tsx          (new)
  status-pill.tsx        (new)
  skeleton.tsx           (new)
  toast.tsx              (new)
  empty-state.tsx        (new)

app/dashboard/
  layout.tsx             (rewrite — new nav, 4 tabs, warm styling)
  page.tsx               (rewrite — new Home layout)
  send/page.tsx          (major edit — remove CSV, restyle, add recent sends)
  billing/page.tsx       (new)
  settings/page.tsx      (major edit — remove billing, restyle, add account section)

app/globals.css          (add dashboard CSS variables + dash-page-enter animation)
```
