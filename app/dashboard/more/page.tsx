"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/supabase";
import { StatusPill } from "@/components/dashboard/status-pill";
import { SetupCardLink, SetupPageShell } from "@/components/dashboard/setup-shell";

export default function MorePage() {
  const { business, signOut } = useAuth();
  const [isFounderAdmin, setIsFounderAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkFounderAccess() {
      try {
        const res = await fetchWithAuth("/api/admin/me");
        if (!res.ok) return;

        const body = (await res.json().catch(() => ({}))) as {
          admin?: { user_id: string } | null;
        };

        if (!cancelled && body.admin) {
          setIsFounderAdmin(true);
        }
      } catch {
        // Founder access is optional here.
      }
    }

    void checkFounderAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  const initials = business?.name
    ? business.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <SetupPageShell
      eyebrow="Setup"
      title="Keep the business side calm and intentional."
      description="Daily work lives in Home, Inbox, Send, and Replies. This side is where you shape how small Talk looks, sounds, and runs."
      backHref="/dashboard"
      backLabel="Back to dashboard"
      actions={
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white px-4 py-3 shadow-[var(--dash-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E05A3D] text-[13px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[var(--dash-text)]">
                {business?.name ?? "Your business"}
              </p>
              <div className="mt-1">
                <StatusPill status={business?.subscription_status ?? "none"} />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <SetupCardLink
          href="/dashboard/more/profile"
          eyebrow="Profile"
          title="How your business shows up"
          description="Business name, logo, Google Business Profile, and the details customers already know about you."
        />
        <SetupCardLink
          href="/dashboard/more/team-services"
          eyebrow="Team & Services"
          title="Who you send from and what you do"
          description="Manage services, team members, and the areas you serve so Send stays clean and relevant."
        />
        <SetupCardLink
          href="/dashboard/more/review-flow"
          eyebrow="Review Flow"
          title="How the review experience behaves"
          description="Topics, reminder timing, request message copy, and reply voice all live together here now."
        />
        <SetupCardLink
          href="/dashboard/more/account"
          eyebrow="Account"
          title="Plan, billing, and sign-in basics"
          description="Subscription status, invoices, password changes, and account controls without the old split between Settings and Billing."
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Support
          </p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
            Help stays close to setup.
          </h2>
          <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
            If you&apos;re changing something and want context first, the Help Center and founder contact form are one tap away.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/support"
              className="rounded-[10px] bg-[var(--dash-primary)] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:brightness-95"
            >
              Open Help Center
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-[10px] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {isFounderAdmin ? (
            <SetupCardLink
              href="/admin"
              eyebrow="Founder Admin"
              title="Internal operations view"
              description="Jump into the founder dashboard for support, business health, and system controls."
            />
          ) : null}
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Why this changed
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
              Setup is now split by job instead of piling everything into one long Settings page. That means less hunting, fewer mixed mental models, and cleaner daily use.
            </p>
          </div>
        </div>
      </div>
    </SetupPageShell>
  );
}
