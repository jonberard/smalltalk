"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { StatusPill } from "@/components/dashboard/status-pill";
import { fetchWithAuth } from "@/lib/supabase";

function ShortcutCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)] transition-all duration-200 hover:border-[#E05A3D]/30 hover:-translate-y-[1px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold text-[var(--dash-text)]">{title}</p>
          <p className="mt-1 max-w-[34ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-[#E05A3D]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E05A3D] transition-colors group-hover:bg-[#E05A3D] group-hover:text-white">
          Open
        </span>
      </div>
    </Link>
  );
}

export default function MorePage() {
  const { business, signOut } = useAuth();
  const [isFounderAdmin, setIsFounderAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkFounderAccess() {
      try {
        const res = await fetchWithAuth("/api/admin/me");

        if (!res.ok) {
          return;
        }

        const body = (await res.json().catch(() => ({}))) as {
          admin?: { user_id: string } | null;
        };

        if (!cancelled && body.admin) {
          setIsFounderAdmin(true);
        }
      } catch {
        // Founder admin is optional here — fail quietly.
      }
    }

    checkFounderAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            More
          </p>
          <h1 className="mt-2 text-balance font-heading text-[28px] font-semibold leading-[1.05] text-[var(--dash-text)]">
            Settings, billing, and account basics
          </h1>
          <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            This is the quieter side of the dashboard. Your daily work stays in Home, Inbox, Send, and Replies.
          </p>
        </div>

        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E05A3D] text-[13px] font-bold text-white">
              {business?.name
                ? business.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?"}
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

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {isFounderAdmin && (
              <ShortcutCard
                href="/admin"
                title="Founder Admin"
                description="Open the internal founder dashboard for business health, support issues, and operational visibility."
              />
            )}
            <ShortcutCard
              href="/dashboard/settings"
              title="Settings"
              description="Update your business profile, review topics, reminder settings, voices, and account preferences."
            />
            <ShortcutCard
              href="/dashboard/billing"
              title="Billing"
              description="Manage your plan, payment status, invoices, and subscription details."
            />
            <ShortcutCard
              href="/dashboard/support"
              title="Support"
              description="See how the product works, what statuses mean, and message the founder directly with questions or suggestions."
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--dash-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-[var(--dash-text)]">Need help?</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                Reach us at{" "}
                <a href="mailto:hello@usesmalltalk.com" className="font-medium text-[var(--dash-primary)] underline underline-offset-2">
                  hello@usesmalltalk.com
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2.5 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
