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
    <div className="border-b border-[#FFEDD5] bg-[#FFF7ED] px-4 py-2.5 text-center sm:pl-[220px]">
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
    ? business.name.split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      {/* ─── Mobile Top Bar ─── */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-[var(--dash-border)] bg-white/95 px-4 py-2.5 backdrop-blur-md font-dashboard sm:hidden">
        <p className="font-heading text-[15px] font-bold tracking-tight text-[var(--dash-text)]">small Talk</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E05A3D] text-[10px] font-bold text-white transition-opacity hover:opacity-90"
          >
            {initials}
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-[200px] overflow-hidden rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
                <div className="border-b border-[var(--dash-border)] px-4 py-3">
                  <p className="text-[13px] font-semibold text-[var(--dash-text)]">{business?.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--dash-muted)]">{business?.subscription_status === "trialing" ? "Free trial" : business?.subscription_status === "active" ? "Active" : business?.subscription_status ?? ""}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await signOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Trial Banner (only when running low) ─── */}
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

      {/* ─── Bottom Tab Bar ─── */}
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
                {tab.icon(active)}
                <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-[#E05A3D]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ─── Desktop Sidebar Nav ─── */}
      <nav className="fixed left-0 top-0 z-40 hidden h-full w-[220px] flex-col border-r border-[var(--dash-border)] bg-white font-dashboard sm:flex">
        <div className="px-5 pt-7 pb-6">
          <p className="font-heading text-[15px] font-bold tracking-tight text-[var(--dash-text)]">small Talk</p>
          <p className="text-[11px] text-[var(--dash-muted)]">Dashboard</p>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#E05A3D]/[0.08] text-[#E05A3D]"
                    : "text-[var(--dash-muted)] hover:bg-[var(--dash-bg)]"
                }`}
              >
                {tab.icon(active)}
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Sidebar bottom — profile + sign out */}
        <div className="border-t border-[var(--dash-border)] px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E05A3D] text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[var(--dash-text)]">{business?.name}</p>
              {business?.subscription_status && (
                <StatusPill status={business.subscription_status} />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full px-3 py-2 text-left text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
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
