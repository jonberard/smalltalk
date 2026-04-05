# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard UI/UX with a warm coral design system, extract shared components, add a dedicated Billing page, and remove CSV bulk sends.

**Architecture:** Update CSS variables in globals.css for dashboard tokens. Extract 5 shared components into `components/dashboard/`. Rewrite the layout with 4-tab nav (Home, Send, Billing, Settings). Rewrite Home page with two-column layout. Simplify Send page (remove CSV). Create new Billing page. Clean up Settings (remove billing section, add Account section).

**Tech Stack:** Next.js 14+ App Router, React 19, Tailwind CSS 4, TypeScript, Supabase, Stripe

**Design spec:** `docs/superpowers/specs/2026-04-05-dashboard-redesign-design.md`

---

## File Structure

### New Files
- `components/dashboard/stat-card.tsx` — Reusable stat card with icon, value, label, optional trend
- `components/dashboard/status-pill.tsx` — Colored badge for session/subscription status
- `components/dashboard/skeleton.tsx` — Skeleton loading primitives (SkeletonLine, SkeletonCircle, SkeletonCard)
- `components/dashboard/toast.tsx` — ToastProvider + useToast hook, bottom-right auto-dismiss
- `components/dashboard/empty-state.tsx` — Friendly empty state with icon, title, description, optional action
- `app/dashboard/billing/page.tsx` — Dedicated billing management page

### Modified Files
- `app/globals.css` — Add dashboard CSS variables + page enter animation
- `app/dashboard/layout.tsx` — Rewrite: 4-tab nav, warm coral styling, 220px sidebar, ToastProvider
- `app/dashboard/page.tsx` — Rewrite: welcome header, stat cards, two-column activity/attention, collapsible funnel
- `app/dashboard/send/page.tsx` — Major edit: remove CSV, restyle form, add recent sends table
- `app/dashboard/settings/page.tsx` — Major edit: remove billing section, restyle, add Account section

---

## Task 1: Design Tokens & Page Animation

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add dashboard CSS variables to globals.css**

Add inside the existing `@theme` block, after the current shadow/animation variables:

```css
  /* Dashboard Design System */
  --dash-primary: #E05A3D;
  --dash-bg: #FAFAF8;
  --dash-surface: #FFFFFF;
  --dash-text: #1A1D20;
  --dash-muted: #6B7280;
  --dash-border: #E8E5E0;
  --dash-success: #059669;
  --dash-warning: #D97706;
  --dash-error: #DC2626;
  --dash-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
  --dash-radius: 12px;
  --dash-radius-sm: 8px;
```

- [ ] **Step 2: Add page enter animation**

Add after the existing `@keyframes` blocks:

```css
@keyframes dash-page-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dash-page-enter {
  animation: dash-page-enter 200ms ease-out;
}
```

- [ ] **Step 3: Update dashboard focus style**

Change the existing `.font-dashboard :focus-visible` rule from:
```css
.font-dashboard :focus-visible {
  outline-color: #0070EB;
}
```
To:
```css
.font-dashboard :focus-visible {
  outline-color: var(--dash-primary);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add dashboard design tokens and page enter animation"
```

---

## Task 2: Shared Components — StatusPill

**Files:**
- Create: `components/dashboard/status-pill.tsx`

- [ ] **Step 1: Create StatusPill component**

```tsx
type StatusPillProps = {
  status: string;
  className?: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  posted: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Posted" },
  copied: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Posted" },
  active: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Active" },
  drafted: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Drafted" },
  trialing: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Trialing" },
  in_progress: { bg: "bg-[#FEF2F2]", text: "text-[#E05A3D]", label: "In Progress" },
  past_due: { bg: "bg-[#FEF2F2]", text: "text-[#E05A3D]", label: "Past Due" },
  sent: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Sent" },
  created: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Opened" },
  none: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "No Plan" },
  canceled: { bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", label: "Canceled" },
  paused: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Paused" },
  incomplete: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Incomplete" },
};

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.none;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text} ${className}`}>
      {style.label}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/status-pill.tsx
git commit -m "feat: add StatusPill shared component"
```

---

## Task 3: Shared Components — StatCard

**Files:**
- Create: `components/dashboard/stat-card.tsx`

- [ ] **Step 1: Create StatCard component**

```tsx
import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail?: ReactNode;
  className?: string;
};

export function StatCard({ icon, label, value, detail, className = "" }: StatCardProps) {
  return (
    <div className={`rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)] ${className}`}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--dash-radius-sm)] bg-[#E05A3D]/8">
        {icon}
      </div>
      <p className="text-[24px] font-bold tracking-tight text-[var(--dash-text)]">{value}</p>
      <p className="mt-0.5 text-[13px] text-[var(--dash-muted)]">{label}</p>
      {detail && <div className="mt-2">{detail}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/stat-card.tsx
git commit -m "feat: add StatCard shared component"
```

---

## Task 4: Shared Components — Skeleton Primitives

**Files:**
- Create: `components/dashboard/skeleton.tsx`

- [ ] **Step 1: Create skeleton primitives**

```tsx
type SkeletonProps = { className?: string };

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return <div className={`h-4 animate-pulse rounded-[var(--dash-radius-sm)] bg-[var(--dash-border)] ${className}`} />;
}

export function SkeletonCircle({ className = "" }: SkeletonProps) {
  return <div className={`h-9 w-9 animate-pulse rounded-full bg-[var(--dash-border)] ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)] ${className}`}>
      <div className="mb-3 h-9 w-9 animate-pulse rounded-[var(--dash-radius-sm)] bg-[var(--dash-border)]" />
      <div className="h-7 w-16 animate-pulse rounded bg-[var(--dash-border)]" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded bg-[var(--dash-border)]" />
    </div>
  );
}

export function SkeletonRow({ className = "" }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${className}`}>
      <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--dash-border)]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="h-3 w-20 animate-pulse rounded bg-[var(--dash-border)]" />
      </div>
      <div className="h-3 w-12 animate-pulse rounded bg-[var(--dash-border)]" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/skeleton.tsx
git commit -m "feat: add skeleton loading primitives"
```

---

## Task 5: Shared Components — Toast System

**Files:**
- Create: `components/dashboard/toast.tsx`

- [ ] **Step 1: Create ToastProvider and useToast hook**

```tsx
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 font-dashboard">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-[#059669]/20 bg-[#ECFDF5] text-[#059669]",
  error: "border-[#DC2626]/20 bg-[#FEF2F2] text-[#DC2626]",
  info: "border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)]",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`animate-[dash-page-enter_200ms_ease-out] rounded-[var(--dash-radius)] border px-4 py-3 text-[13px] font-medium shadow-[var(--dash-shadow)] ${VARIANT_STYLES[toast.variant]}`}
    >
      {toast.message}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/toast.tsx
git commit -m "feat: add toast notification system"
```

---

## Task 6: Shared Components — EmptyState

**Files:**
- Create: `components/dashboard/empty-state.tsx`

- [ ] **Step 1: Create EmptyState component**

```tsx
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dash-border)]/50">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[var(--dash-text)]">{title}</p>
        <p className="mt-1 max-w-[320px] text-[13px] text-[var(--dash-muted)]">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/empty-state.tsx
git commit -m "feat: add EmptyState shared component"
```

---

## Task 7: Dashboard Layout Rewrite

**Files:**
- Modify: `app/dashboard/layout.tsx`

This is a full rewrite of the file. The new layout has 4 nav tabs, warm coral styling, 220px sidebar, ToastProvider wrapper, and restyled trial banner.

- [ ] **Step 1: Rewrite layout.tsx**

Replace the entire contents of `app/dashboard/layout.tsx` with the new layout. Key changes from the current file:

1. **Imports**: Add `fetchWithAuth` from `@/lib/supabase`, `StatusPill` from `@/components/dashboard/status-pill`, `ToastProvider` from `@/components/dashboard/toast`
2. **TABS**: 4 items — Home (`/dashboard`), Send (`/dashboard/send`), Billing (`/dashboard/billing`), Settings (`/dashboard/settings`). Each with an SVG icon function. Billing gets a credit card icon.
3. **TrialBanner**: Restyle from blue (`#EFF6FF`/`#1E40AF`) to warm amber (`#FFF7ED`/`#D97706`). Update `sm:pl-[200px]` → `sm:pl-[220px]`.
4. **DashboardNav**:
   - Desktop sidebar: `w-[220px]`, white bg, border-r `border-[var(--dash-border)]`. "small Talk" in `font-heading` (Fraunces). Nav items use coral active state: `bg-[#E05A3D]/[0.08] text-[#E05A3D]`. Inactive: `text-[var(--dash-muted)] hover:bg-[var(--dash-bg)]`.
   - Sidebar bottom: avatar with `bg-[#E05A3D]/10 text-[#E05A3D]`, business name, `<StatusPill status={business?.subscription_status} />`, "Sign out" as muted text link (not red button).
   - Mobile top bar: restyle borders/bg to use `var(--dash-border)`. Profile dropdown restyled.
   - Mobile bottom tab bar: 4 tabs, active coral `text-[#E05A3D]` with dot indicator, inactive `text-[var(--dash-muted)]`.
5. **DashboardLayout export**: Wrap children with `<ToastProvider>` inside `<AuthProvider>`.

Full replacement file:

```tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/supabase";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ToastProvider } from "@/components/dashboard/toast";

const TABS = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        {!active && <polyline points="9 22 9 12 15 12 15 22" />}
        {active && <rect x="9" y="12" width="6" height="10" fill="white" rx="0.5" />}
      </svg>
    ),
  },
  {
    label: "Send",
    href: "/dashboard/send",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" stroke={active ? "white" : "currentColor"} strokeWidth="1.75" fill="none" />
        <path d="M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" stroke={active ? "white" : "currentColor"} strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

function TrialBanner({ remaining }: { remaining: number }) {
  const [redirecting, setRedirecting] = useState(false);

  const handleSubscribe = useCallback(async () => {
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  }, []);

  return (
    <div className="border-b border-[#FED7AA] bg-[#FFF7ED] px-4 py-2.5 text-center sm:pl-[220px]">
      <p className="text-[13px] text-[#92400E]">
        <span className="font-semibold">{remaining}</span> review request{remaining !== 1 ? "s" : ""} left in your free trial.{" "}
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={redirecting}
          className="font-semibold text-[#E05A3D] underline underline-offset-2 hover:no-underline disabled:opacity-60"
        >
          {redirecting ? "Redirecting..." : "Subscribe now"}
        </button>
      </p>
    </div>
  );
}

function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { business, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const initials = business?.name
    ? business.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-[var(--dash-border)] bg-white/95 px-4 py-2.5 backdrop-blur-md font-dashboard sm:hidden">
        <p className="font-heading text-[15px] font-semibold text-[var(--dash-text)]">small Talk</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E05A3D]/10 text-[10px] font-bold text-[#E05A3D] transition-colors hover:bg-[#E05A3D]/15"
          >
            {initials}
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-[200px] overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
                <div className="border-b border-[var(--dash-border)] px-4 py-3">
                  <p className="text-[13px] font-semibold text-[var(--dash-text)]">{business?.name}</p>
                  <div className="mt-1">
                    <StatusPill status={business?.subscription_status ?? "none"} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await signOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trial Banner */}
      {business &&
        business.subscription_status === "trialing" &&
        business.trial_requests_remaining > 0 &&
        business.trial_requests_remaining <= 3 &&
        (!business.trial_ends_at || new Date(business.trial_ends_at) > new Date()) && (
          <div className="pt-[52px] sm:pt-0">
            <TrialBanner remaining={business.trial_requests_remaining} />
          </div>
        )}

      {children}

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--dash-border)] bg-white/95 backdrop-blur-md font-dashboard sm:hidden">
        <div className="mx-auto flex max-w-[600px] items-stretch">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-0.5 pb-[env(safe-area-inset-bottom,8px)] pt-2.5 transition-colors duration-200 ${
                  active ? "text-[#E05A3D]" : "text-[var(--dash-muted)]"
                }`}
              >
                {active && <div className="mb-0.5 h-[3px] w-[3px] rounded-full bg-[#E05A3D]" />}
                {tab.icon(active)}
                <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="fixed left-0 top-0 z-40 hidden h-full w-[220px] flex-col border-r border-[var(--dash-border)] bg-white font-dashboard sm:flex">
        <div className="px-5 pt-7 pb-6">
          <p className="font-heading text-[16px] font-semibold text-[var(--dash-text)]">small Talk</p>
          <p className="text-[11px] text-[var(--dash-muted)]">Dashboard</p>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-[var(--dash-radius)] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#E05A3D]/[0.08] text-[#E05A3D]"
                    : "text-[var(--dash-muted)] hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
                }`}
              >
                {tab.icon(active)}
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Sidebar bottom */}
        <div className="border-t border-[var(--dash-border)] px-3 py-3">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E05A3D]/10 text-[11px] font-bold text-[#E05A3D]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[var(--dash-text)]">{business?.name}</p>
              <StatusPill status={business?.subscription_status ?? "none"} />
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 w-full px-3 py-2 text-left text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
          >
            Sign out
          </button>
        </div>
      </nav>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardNav>{children}</DashboardNav>
      </ToastProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

Run: `npm run dev` and navigate to `/dashboard` — the new layout should render with 4 tabs and coral styling. Pages will still have old content but the nav should work.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: rewrite dashboard layout with 4-tab nav and warm coral design system"
```

---

## Task 8: Home Page Rewrite

**Files:**
- Modify: `app/dashboard/page.tsx`

This is a full rewrite. The page keeps all existing data fetching logic but gets an entirely new layout.

- [ ] **Step 1: Rewrite page.tsx**

The full rewrite preserves:
- All type definitions (`DashboardStats`, `FunnelData`, `AttentionItem`, `ActivityItem`)
- All helper functions (`timeAgo`, `statusToAction`, `statusToAttentionDetail`, `isAtOrBeyond`)
- The `fetchAll` data fetching logic and verify-subscription checkout=success effect
- The Supabase queries

Key changes:
1. **Imports**: Add `StatCard` from `@/components/dashboard/stat-card`, `StatusPill` from `@/components/dashboard/status-pill`, `EmptyState` from `@/components/dashboard/empty-state`, `SkeletonCard`, `SkeletonRow` from `@/components/dashboard/skeleton`.
2. **Container**: Change from `bg-[#F8F9FA]` + `sm:pl-[200px]` + `max-w-[600px]` to `bg-[var(--dash-bg)]` + `sm:pl-[220px]` + `max-w-[960px]`. Add `dash-page-enter` class.
3. **Welcome header**: Replace business name + month with time-of-day greeting in Fraunces: "Good morning, Crystal Clear Pools". Add helper function `getGreeting()` that returns "morning" (5-12), "afternoon" (12-17), or "evening" (17+).
4. **Stat cards**: Three `StatCard` components in `grid-cols-1 sm:grid-cols-3` grid. Icons are small SVGs in coral. "Average Rating" card includes 5 mini stars. "Completion Rate" card includes a small SVG progress ring.
5. **Two-column layout**: `grid-cols-1 sm:grid-cols-5` with left column (`sm:col-span-3`) for "Recent Activity" and right column (`sm:col-span-2`) for "Needs Attention".
6. **Activity list**: Unified list (no tab switcher). Each row: avatar circle with initial, name, `StatusPill`, star rating as small coral dots, time ago. Use subtle border-b dividers. If loading, show `SkeletonRow` x 5. If empty, show `EmptyState`.
7. **Needs Attention**: Count badge in coral circle. List of stuck sessions with "Nudge" outlined button (coral border). If empty, green check + "All caught up".
8. **Funnel**: Collapsible `<details>` at the bottom. Summary: "View conversion funnel" with chevron. Inside: 4 stages (Sent → Clicked → Drafted → Posted) as horizontal flex with arrow separators, each showing count and percentage of previous stage.
9. **Remove**: Google hero card, desktop FAB, tab switcher, `ReviewCard` component.

The full file should be approximately 450-500 lines (down from 654) since we're removing the tab switcher, ReviewCard, Google card, and FAB.

Write the complete file with all existing data fetching logic preserved but the JSX completely replaced with the new design. Use `var(--dash-*)` tokens throughout.

- [ ] **Step 2: Verify dev server renders the new Home page**

Navigate to `/dashboard`. Should see: warm greeting, 3 stat cards, two-column layout with activity and attention, collapsible funnel at bottom.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: rewrite Home page with stat cards, two-column layout, and collapsible funnel"
```

---

## Task 9: Send Page — Remove CSV, Restyle, Add Recent Sends

**Files:**
- Modify: `app/dashboard/send/page.tsx`

- [ ] **Step 1: Clean up imports and remove CSV-related code**

Remove these components entirely from the file:
- `BulkUpload` function (lines ~490-740)
- `BulkUpgradePrompt` function (lines ~888-925)
- `parseCsv` function and `CsvRow` type
- `sendSms` function (if only used by BulkUpload — check if SingleForm also uses it; if so, keep it)
- The `mode` state (`useState<"single" | "bulk">`)
- The mode toggle JSX in the main component

Add new imports: `StatusPill` from `@/components/dashboard/status-pill`, `EmptyState` from `@/components/dashboard/empty-state`, `SkeletonRow` from `@/components/dashboard/skeleton`.

- [ ] **Step 2: Restyle the main page wrapper and header**

Change the container from:
```tsx
<div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
  <div className="mx-auto max-w-[600px] px-5 pb-32 pt-8 sm:pb-16">
```
To:
```tsx
<div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard sm:pl-[220px]">
  <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
    <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">Send Review Link</h1>
    <p className="mt-1 text-[13px] text-[var(--dash-muted)]">Request a review from your customer</p>
```

- [ ] **Step 3: Restyle the form card and inputs**

Update the form card from `rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white p-5 shadow-[0_1px_3px...]` to `rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]`.

Update all input styling in `AutocompleteInput` and `SingleForm`:
- Border: `border-[var(--dash-border)]`
- Radius: `rounded-[var(--dash-radius-sm)]`
- Focus: `focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]` (replace blue)
- "Add new" text: change `text-[#0070EB]` to `text-[#E05A3D]`

Update the send button: change `bg-[#0070EB]` to `bg-[var(--dash-primary)]`, `shadow-[0_2px_12px_rgba(0,112,235,0.3)]` to `shadow-[0_2px_12px_rgba(224,90,61,0.3)]`.

Update the contact field label/placeholder from "Phone number" to "Phone or email" with placeholder "e.g. (555) 123-4567 or sarah@email.com".

- [ ] **Step 4: Restyle the trial badge**

Change from blue (`#EFF6FF`/`#0070EB`) to warm amber:
```tsx
<div className="mb-4 flex items-center gap-2 rounded-[var(--dash-radius-sm)] bg-[#FFF7ED] px-4 py-2.5">
  <svg ... stroke="#D97706" ...>
  <p className="text-[13px] text-[#92400E]">
```

- [ ] **Step 5: Restyle Paywall component**

Update `Paywall`:
- Icon circle: `bg-[#0070EB]/10` → `bg-[#E05A3D]/10`, stroke color → `#E05A3D`
- Button: `bg-[#0070EB]` → `bg-[var(--dash-primary)]`, shadow → coral shadow

- [ ] **Step 6: Restyle QRBlock**

Update border/radius to match new design system. Change any `#0070EB` references to `var(--dash-primary)`.

- [ ] **Step 7: Add Recent Sends table**

Add a new section below QRBlock in the main component. Add state:
```tsx
const [recentLinks, setRecentLinks] = useState<{ customer_name: string; customer_contact: string; service_name: string; status: string; created_at: string }[]>([]);
```

In the `fetchAll` effect (or create a new one), fetch recent review links:
```tsx
const { data: links } = await supabase
  .from("review_links")
  .select("customer_name, customer_contact, created_at, services(name), review_sessions(status)")
  .eq("business_id", businessId)
  .order("created_at", { ascending: false })
  .limit(10);
```

Render as a card with rows:
```tsx
<div className="mt-6">
  <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]">Recent sends</h2>
  <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)]">
    {recentLinks.map((link, i) => (
      <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < recentLinks.length - 1 ? "border-b border-[var(--dash-border)]" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[var(--dash-text)]">{link.customer_name}</p>
          <p className="text-[12px] text-[var(--dash-muted)]">{maskContact(link.customer_contact)} · {link.service_name}</p>
        </div>
        <StatusPill status={link.status} />
        <span className="text-[11px] text-[var(--dash-muted)]">{timeAgo(link.created_at)}</span>
      </div>
    ))}
  </div>
</div>
```

Add a `maskContact` helper that masks phone/email: `***-4567` or `s***@email.com`.

If no recent links, show `EmptyState` with "Your sent review links will appear here".

- [ ] **Step 8: Remove the mode toggle from the main component JSX**

Remove the Single/Bulk toggle buttons and the conditional rendering for `mode === "bulk"`. The form card should always render `SingleForm` (or `Paywall` if expired).

- [ ] **Step 9: Verify the Send page renders correctly**

Navigate to `/dashboard/send`. Should see: Fraunces heading, single send form with coral styling, share link section, recent sends table.

- [ ] **Step 10: Commit**

```bash
git add app/dashboard/send/page.tsx
git commit -m "feat: redesign Send page — remove CSV, restyle with coral, add recent sends"
```

---

## Task 10: Billing Page (New)

**Files:**
- Create: `app/dashboard/billing/page.tsx`

- [ ] **Step 1: Create the Billing page**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { StatusPill } from "@/components/dashboard/status-pill";
import { StatCard } from "@/components/dashboard/stat-card";
import { SkeletonCard } from "@/components/dashboard/skeleton";

export default function BillingPage() {
  const { business } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!business) return;
    async function fetchUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business!.id)
        .gte("created_at", monthStart);
      setUsageCount(count ?? 0);
      setLoading(false);
    }
    fetchUsage();
  }, [business]);

  async function handleCheckout() {
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setRedirecting(false);
    } catch {
      setRedirecting(false);
    }
  }

  async function handlePortal() {
    if (!business?.stripe_customer_id) return;
    setRedirecting(true);
    try {
      const res = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripe_customer_id: business.stripe_customer_id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setRedirecting(false);
    } catch {
      setRedirecting(false);
    }
  }

  const status = business?.subscription_status ?? "none";
  const trialEndsAt = business?.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">Billing</h1>
        <p className="mt-1 text-[13px] text-[var(--dash-muted)]">Manage your subscription and billing</p>

        {/* Current Plan Card */}
        <div className="mt-6 rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-[var(--dash-text)]">small Talk Pro</h2>
            <StatusPill status={status} />
          </div>

          <div className="mt-4">
            {status === "trialing" && trialEndsAt && (
              <div>
                <p className="text-[14px] text-[var(--dash-muted)]">
                  Your free trial ends on{" "}
                  <span className="font-medium text-[var(--dash-text)]">
                    {trialEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--dash-border)]">
                    <div
                      className="h-full rounded-full bg-[#D97706] transition-all"
                      style={{ width: `${Math.max(5, ((7 - daysRemaining) / 7) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-[#D97706]">{daysRemaining} days left</span>
                </div>
              </div>
            )}

            {status === "active" && (
              <p className="text-[14px] text-[var(--dash-muted)]">
                Your subscription is active. Manage billing details in the Stripe portal.
              </p>
            )}

            {status === "past_due" && (
              <div className="rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3">
                <p className="text-[14px] font-medium text-[#DC2626]">
                  Your payment failed. Update your payment method to keep your account active.
                </p>
              </div>
            )}

            {status === "canceled" && (
              <p className="text-[14px] text-[var(--dash-muted)]">
                Your subscription was canceled. Resubscribe to continue sending review links.
              </p>
            )}

            {status === "none" && (
              <p className="text-[14px] text-[var(--dash-muted)]">
                You&rsquo;re not subscribed yet. Start your free trial to begin sending review links.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            {(status === "none" || status === "canceled") && (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={redirecting}
                className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
              >
                {redirecting ? "Redirecting..." : status === "none" ? "Start Free Trial" : "Resubscribe"}
              </button>
            )}

            {status === "past_due" && (
              <button
                type="button"
                onClick={handlePortal}
                disabled={redirecting}
                className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
              >
                {redirecting ? "Redirecting..." : "Update Payment Method"}
              </button>
            )}

            {business?.stripe_customer_id && (
              <button
                type="button"
                onClick={handlePortal}
                disabled={redirecting}
                className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-[var(--dash-primary)] transition-all duration-150 hover:bg-[#E05A3D]/[0.04] active:scale-[0.98] disabled:opacity-60"
              >
                {redirecting ? "Redirecting..." : "Manage Billing"}
              </button>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]">This month&rsquo;s usage</h2>
          {loading ? (
            <SkeletonCard className="max-w-[300px]" />
          ) : (
            <StatCard
              className="max-w-[300px]"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              }
              label="Review requests sent"
              value={usageCount}
            />
          )}
        </div>

        {/* Invoice History */}
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]">Invoice history</h2>
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] px-5 py-4">
            {business?.stripe_customer_id ? (
              <p className="text-[13px] text-[var(--dash-muted)]">
                View and download invoices in the{" "}
                <button
                  type="button"
                  onClick={handlePortal}
                  className="font-medium text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
                >
                  billing portal
                </button>
                .
              </p>
            ) : (
              <p className="text-[13px] text-[var(--dash-muted)]">
                No invoices yet. Subscribe to start your billing history.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the Billing page renders**

Navigate to `/dashboard/billing`. Should see: plan card with status, usage stats, invoice history section.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/billing/page.tsx
git commit -m "feat: add dedicated Billing page"
```

---

## Task 11: Settings Page — Remove Billing, Restyle, Add Account Section

**Files:**
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Remove the BillingSection component**

Delete the entire `BillingSection` function (approximately lines 853-978) and its invocation in the main JSX (approximately line 1089). This removes the billing UI from Settings since it now lives at `/dashboard/billing`.

- [ ] **Step 2: Restyle the page wrapper and heading**

Change the container from:
```tsx
<div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
  <div className="mx-auto max-w-[600px] px-5 pb-32 pt-8 sm:pb-16">
```
To:
```tsx
<div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard sm:pl-[220px]">
  <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
    <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">Settings</h1>
    <p className="mt-1 mb-6 text-[13px] text-[var(--dash-muted)]">Manage your business profile and preferences</p>
```

- [ ] **Step 3: Restyle all section cards**

Update each section card (BusinessProfile, Services, Employees, Topics, Neighborhoods) from the old styling:
- Card wrapper: change to `rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]`
- Input borders: `border-[var(--dash-border)]`
- Input radius: `rounded-[var(--dash-radius-sm)]`
- Input focus: `focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]`
- Primary buttons: `bg-[var(--dash-primary)]` with coral shadow
- Section headings: `text-[var(--dash-text)]`
- Secondary text: `text-[var(--dash-muted)]`
- All `#0070EB` references → `var(--dash-primary)` or `#E05A3D`

Use find-and-replace within the file for systematic updates:
- `#0070EB` → `#E05A3D` (for inline color references)
- `border-[rgba(228,228,231,0.5)]` → `border-[var(--dash-border)]`
- `text-[#18181B]` → `text-[var(--dash-text)]`
- `text-[#A1A1AA]` or `text-[#71717A]` → `text-[var(--dash-muted)]`
- `bg-[#F8F9FA]` → `bg-[var(--dash-bg)]`
- `rounded-[16px]` on cards → `rounded-[var(--dash-radius)]`
- `rounded-[10px]` on inputs/buttons → `rounded-[var(--dash-radius-sm)]`

- [ ] **Step 4: Add Account section at the bottom**

Add a new card at the bottom of the settings page, after the Neighborhoods section:

```tsx
{/* Account */}
<div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
  <h2 className="mb-4 text-[16px] font-semibold text-[var(--dash-text)]">Account</h2>

  <div className="space-y-4">
    {/* Email */}
    <div>
      <label className="mb-1 block text-[13px] font-medium text-[var(--dash-muted)]">Email</label>
      <p className="text-[14px] text-[var(--dash-text)]">{business?.id ? session?.user?.email : "—"}</p>
    </div>

    {/* Change password */}
    <button
      type="button"
      onClick={async () => {
        const email = session?.user?.email;
        if (email) {
          await supabase.auth.resetPasswordForEmail(email);
          // Use toast if available, or alert
          alert("Password reset email sent to " + email);
        }
      }}
      className="text-[13px] font-medium text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
    >
      Change password
    </button>

    {/* Sign out */}
    <button
      type="button"
      onClick={signOut}
      className="block text-[13px] font-medium text-[var(--dash-muted)] underline underline-offset-2 hover:no-underline"
    >
      Sign out
    </button>

    {/* Delete account */}
    <div className="border-t border-[var(--dash-border)] pt-4">
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="text-[12px] font-medium text-[#DC2626] underline underline-offset-2 hover:no-underline"
      >
        Delete account
      </button>
    </div>
  </div>
</div>

{/* Delete confirmation dialog */}
{showDeleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-dashboard">
    <div className="mx-4 w-full max-w-[400px] rounded-[var(--dash-radius)] bg-white p-6 shadow-lg">
      <h3 className="text-[16px] font-bold text-[var(--dash-text)]">Delete your account?</h3>
      <p className="mt-2 text-[13px] text-[var(--dash-muted)]">
        This will permanently delete your business, all review links, and cancel your subscription. This action cannot be undone.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(false)}
          className="flex-1 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] py-2.5 text-[13px] font-semibold text-[var(--dash-muted)] transition-all hover:bg-[var(--dash-bg)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("Account deletion requested");
            setShowDeleteConfirm(false);
          }}
          className="flex-1 rounded-[var(--dash-radius-sm)] bg-[#DC2626] py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
)}
```

Add state: `const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);`

Access `session` and `signOut` from `useAuth()` — update the destructuring at the top of the component to include `session` and `signOut`.

- [ ] **Step 5: Verify Settings page renders**

Navigate to `/dashboard/settings`. Should see: restyled sections with coral accents, no billing section, Account section at bottom with delete confirmation dialog.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/settings/page.tsx
git commit -m "feat: redesign Settings — remove billing, restyle with coral, add Account section"
```

---

## Task 12: Final Polish & Verification

**Files:**
- All dashboard files

- [ ] **Step 1: Verify all 4 pages render without console errors**

Navigate to each page in order:
1. `/dashboard` — Home with greeting, stats, activity, attention, funnel
2. `/dashboard/send` — Form with coral styling, no CSV tab, recent sends
3. `/dashboard/billing` — Plan card, usage, invoices
4. `/dashboard/settings` — All sections restyled, Account at bottom

Check browser console for React errors, missing imports, or type issues.

- [ ] **Step 2: Verify mobile layout**

Use browser dev tools to test at 390px width:
- Bottom tab bar shows 4 tabs with coral active state
- Top bar shows "small Talk" and avatar
- All pages stack to single column
- Stat cards stack vertically
- Two-column layout on Home goes single-column

- [ ] **Step 3: Verify nav active states**

Click through each nav item and confirm:
- Active tab has coral background tint and coral text
- Inactive tabs have grey text
- URL matches the expected route

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: complete dashboard redesign — warm coral design system, component extraction, billing page, mobile responsive"
git push
```
