"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/supabase";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ToastProvider } from "@/components/dashboard/toast";

const NAV_ITEMS = [
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
    label: "Inbox",
    href: "/dashboard/inbox",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        <path d="M3 8l7.2 5.4a3 3 0 0 0 3.6 0L21 8" fill={active ? "currentColor" : "none"} />
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
    mobileAccent: true,
  },
  {
    label: "Replies",
    href: "/dashboard/replies",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    ),
  },
];

const MORE_ITEMS = [
  { label: "Overview", href: "/dashboard/more" },
  { label: "Profile", href: "/dashboard/more/profile" },
  { label: "Team & services", href: "/dashboard/more/team-services" },
  { label: "Review flow", href: "/dashboard/more/review-flow" },
  { label: "Account", href: "/dashboard/more/account" },
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
  const [moreOpen, setMoreOpen] = useState(pathname.startsWith("/dashboard/more"));
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/more")) {
      setMoreOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    setMobileMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const moreActive = pathname.startsWith("/dashboard/more");

  const initials = business?.name
    ? business.name.split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      {/* ─── Mobile Top Bar ─── */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-[var(--dash-border)] bg-white/95 px-4 py-2.5 backdrop-blur-md font-dashboard sm:hidden">
        <Link href="/dashboard" className="font-heading text-[15px] font-bold tracking-tight text-[var(--dash-text)]">small Talk</Link>
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
                  <p className="mt-0.5 text-[11px] text-[var(--dash-muted)]">
                    {business?.subscription_status === "trial" || business?.subscription_status === "trialing"
                      ? "Free trial"
                      : business?.subscription_status === "active"
                        ? "Active"
                        : business?.subscription_status ?? ""}
                  </p>
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
        business.subscription_status === "trial" &&
        business.trial_requests_remaining > 0 &&
        business.trial_requests_remaining <= 3 &&
        (!business.trial_ends_at || new Date(business.trial_ends_at) > new Date()) && (
          <div className="pt-[52px] sm:pt-0">
            <TrialBanner remaining={business.trial_requests_remaining} />
          </div>
        )}

      {children}

      {mobileMoreOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-[rgba(26,46,37,0.18)] sm:hidden"
            onClick={() => setMobileMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] z-50 px-3 sm:hidden">
            <div className="overflow-hidden rounded-[22px] border border-[#E6DDD0] bg-[#FCFAF6] shadow-[0_20px_44px_rgba(26,46,37,0.16)]">
              <div className="flex items-center justify-between border-b border-[var(--dash-border)] px-4 py-3.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    More
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                    Setup and quieter account pages
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMoreOpen(false)}
                  aria-label="Close more menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dash-border)] bg-white text-[var(--dash-muted)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1.5 p-3">
                {MORE_ITEMS.map((item) => {
                  const active =
                    item.href === "/dashboard/more"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMoreOpen(false)}
                      className={`relative flex min-h-[48px] items-center rounded-[16px] px-4 py-3 text-[14px] font-medium transition-all duration-200 ${
                        active
                          ? "border border-[#E6DDD0] bg-white text-[var(--dash-text)] shadow-[0_10px_24px_rgba(26,46,37,0.06)]"
                          : "border border-transparent bg-transparent text-[var(--dash-muted)] hover:bg-white hover:text-[var(--dash-text)]"
                      }`}
                    >
                      {active ? (
                        <span className="absolute inset-y-[8px] left-0 w-[3px] rounded-r-full bg-[var(--dash-primary)]" />
                      ) : null}
                      <span className="pl-2.5">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ─── Bottom Tab Bar ─── */}
      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--dash-border)] bg-white/95 backdrop-blur-md font-dashboard sm:hidden">
        <div className="mx-auto flex max-w-[600px] items-stretch">
          {NAV_ITEMS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-1 pb-[env(safe-area-inset-bottom,8px)] pt-2.5 transition-colors duration-200 ${
                  active ? "text-[#E05A3D]" : "text-[var(--dash-muted)]"
                } ${tab.mobileAccent ? "-mt-3" : ""}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                    tab.mobileAccent
                      ? active
                        ? "bg-[#C94D33] text-white shadow-[0_8px_24px_rgba(224,90,61,0.32)]"
                        : "bg-[#E05A3D] text-white shadow-[0_8px_24px_rgba(224,90,61,0.22)]"
                      : active
                        ? "bg-[#E05A3D]/10 text-[#E05A3D]"
                        : "bg-transparent"
                  }`}
                >
                  {tab.icon(active)}
                </span>
                <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
                {active && !tab.mobileAccent && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-[#E05A3D]" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen((current) => !current)}
            className={`flex flex-1 flex-col items-center gap-1 pb-[env(safe-area-inset-bottom,8px)] pt-2.5 transition-colors duration-200 ${
              moreActive || mobileMoreOpen ? "text-[#E05A3D]" : "text-[var(--dash-muted)]"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                moreActive || mobileMoreOpen
                  ? "bg-[#E05A3D]/10 text-[#E05A3D]"
                  : "bg-transparent"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className={`text-[10px] ${(moreActive || mobileMoreOpen) ? "font-semibold" : "font-medium"}`}>
              More
            </span>
            {(moreActive || mobileMoreOpen) && (
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[#E05A3D]" />
            )}
          </button>
        </div>
      </nav>

      {/* ─── Desktop Sidebar Nav ─── */}
      <nav aria-label="Main navigation" className="fixed left-0 top-0 z-40 hidden h-full w-[220px] flex-col border-r border-[var(--dash-border)] bg-[var(--dash-bg)] font-dashboard sm:flex">
        <div className="px-5 pt-7 pb-6">
          <Link href="/dashboard" className="font-heading text-[15px] font-bold tracking-tight text-[var(--dash-text)]">small Talk</Link>
          <p className="text-[11px] text-[var(--dash-muted)]">Dashboard</p>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-[14px] px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "border border-[#E6DDD0] bg-white text-[var(--dash-text)] shadow-[0_10px_24px_rgba(26,46,37,0.06)]"
                    : "text-[var(--dash-muted)] hover:bg-white/70 hover:text-[var(--dash-text)]"
                }`}
              >
                {tab.icon(active)}
                {tab.label}
              </Link>
            );
          })}

          <div className="my-3 h-px bg-[var(--dash-border)]" />

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMoreOpen((current) => !current)}
              className={`flex w-full items-center justify-between rounded-[14px] px-4 py-3 text-left text-[13px] font-medium transition-all duration-200 ${
                moreActive || moreOpen
                  ? "text-[var(--dash-text)]"
                  : "text-[var(--dash-muted)] hover:bg-white/70 hover:text-[var(--dash-text)]"
              }`}
            >
              <span>More</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {moreOpen ? (
              <div className="mt-1 space-y-1 pl-2">
                {MORE_ITEMS.map((item) => {
                  const active =
                    item.href === "/dashboard/more"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex min-h-[44px] items-center rounded-[14px] px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? "border border-[#E6DDD0] bg-white text-[var(--dash-text)] shadow-[0_10px_24px_rgba(26,46,37,0.06)]"
                          : "text-[var(--dash-muted)] hover:bg-white/70 hover:text-[var(--dash-text)]"
                      }`}
                    >
                      {active ? (
                        <span className="absolute inset-y-[7px] left-0 w-[3px] rounded-r-full bg-[var(--dash-primary)]" />
                      ) : null}
                      <span className={active ? "pl-2.5" : "pl-2.5"}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar bottom — profile + sign out */}
        <div className="border-t border-[var(--dash-border)] px-3 py-3">
          <div className="overflow-hidden rounded-[14px] border border-[#E6DDD0] bg-white shadow-[0_10px_24px_rgba(26,46,37,0.04)]">
            <div className="flex items-center gap-2.5 px-3 py-3">
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
            <div className="border-t border-[var(--dash-border)] bg-[#FCFAF6] px-3 py-2">
              <button
                type="button"
                onClick={signOut}
                className="inline-flex min-h-[32px] w-full items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-medium text-[#BC4A2F] transition-all duration-200 hover:bg-[var(--dash-primary)] hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
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
