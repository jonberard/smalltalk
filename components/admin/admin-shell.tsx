"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAccess } from "@/components/admin/admin-access";
import { StatusPill } from "@/components/dashboard/status-pill";

const ADMIN_NAV = [
  { label: "Home", href: "/admin" },
  { label: "Businesses", href: "/admin/businesses" },
  { label: "Support", href: "/admin/support" },
  { label: "Revenue", href: "/admin/revenue" },
  { label: "System", href: "/admin/system" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

function AdminLoadingState() {
  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard">
      <div className="hidden h-full w-[248px] border-r border-[var(--dash-border)] bg-white px-5 py-6 sm:fixed sm:left-0 sm:top-0 sm:block">
        <div className="h-5 w-24 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-[var(--dash-radius-sm)] bg-[var(--dash-border)]/70"
            />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-8 sm:pl-[284px]">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-[var(--dash-radius)] bg-white shadow-[var(--dash-shadow)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminAccessDenied({
  email,
  error,
  onRetry,
}: {
  email: string | null;
  error: string | null;
  onRetry: () => Promise<void>;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--dash-bg)] px-4 font-dashboard">
      <div className="w-full max-w-[540px] rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-8 shadow-[var(--dash-shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--dash-muted)]">
          Founder Admin
        </p>
        <h1 className="mt-3 font-heading text-[34px] font-semibold leading-[0.98] text-[var(--dash-text)]">
          This account doesn&apos;t have founder access yet.
        </h1>
        <p className="mt-4 max-w-[50ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
          The founder dashboard is protected separately from the owner dashboard. If this is your
          account, add your email to <code className="rounded bg-[var(--dash-bg)] px-1.5 py-0.5">FOUNDER_ADMIN_EMAILS</code>
          {" "}or create a row for it in <code className="rounded bg-[var(--dash-bg)] px-1.5 py-0.5">admin_users</code>.
        </p>
        {(email || error) && (
          <div className="mt-5 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
            {email && (
              <p className="text-[13px] text-[var(--dash-text)]">
                Signed in as <span className="font-semibold">{email}</span>
              </p>
            )}
            {error && <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">{error}</p>}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98]"
          >
            Check again
          </button>
          <Link
            href="/dashboard/more"
            className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2.5 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
          >
            Back to owner dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, userEmail, counts, loading, error, refreshAdmin, signOut } =
    useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!admin) {
    return <AdminAccessDenied email={userEmail} error={error} onRetry={refreshAdmin} />;
  }

  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard text-[var(--dash-text)]">
      <aside className="fixed left-0 top-0 hidden h-full w-[248px] border-r border-[var(--dash-border)] bg-white sm:flex sm:flex-col">
        <div className="px-5 pt-7 pb-6">
          <p className="font-heading text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
            small Talk
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--dash-muted)]">
            Founder Admin
          </p>
        </div>

        <div className="flex-1 space-y-1 px-3">
          {ADMIN_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[#E05A3D]/[0.08] text-[#E05A3D]"
                    : "text-[var(--dash-muted)] hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
                }`}
              >
                <span>{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.href === "/admin/support" && counts.newSupportMessages > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#E05A3D] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                      {counts.newSupportMessages > 9 ? "9+" : counts.newSupportMessages}
                    </span>
                  )}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[#E05A3D]" />}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-[var(--dash-border)] px-3 py-3">
          <div className="rounded-[10px] bg-[var(--dash-bg)] px-3 py-3">
            <p className="text-[12px] font-semibold text-[var(--dash-text)]">{userEmail ?? "Founder"}</p>
            <div className="mt-2 flex items-center justify-between">
              <StatusPill status={admin.role === "founder" ? "active" : "sent"} className="capitalize" />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--dash-muted)]">
                {admin.role}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-2 w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-3 py-2 text-left text-[12px] font-semibold text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-[var(--dash-border)] bg-white/95 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-heading text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
              Founder Admin
            </p>
            <p className="text-[11px] text-[var(--dash-muted)]">{userEmail ?? "Founder"}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-[var(--dash-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--dash-text)]"
          >
            Sign out
          </button>
        </div>
        <div className="overflow-x-auto px-4 pb-3">
          <div className="flex min-w-max gap-2">
            {ADMIN_NAV.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                    active
                      ? "bg-[#E05A3D] text-white"
                      : "border border-[var(--dash-border)] bg-white text-[var(--dash-muted)]"
                  }`}
                >
                  {item.label}
                  {item.href === "/admin/support" && counts.newSupportMessages > 0 && (
                    <span
                      className={`inline-flex min-w-4 items-center justify-center rounded-full px-1 py-[1px] text-[10px] font-semibold leading-none ${
                        active ? "bg-white/20 text-white" : "bg-[#E05A3D] text-white"
                      }`}
                    >
                      {counts.newSupportMessages > 9 ? "9+" : counts.newSupportMessages}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main className="min-h-dvh pb-16 sm:pl-[248px]">
        <div className="dash-page-enter mx-auto max-w-[1280px] px-5 pt-6 pb-24 sm:pt-8 sm:pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
