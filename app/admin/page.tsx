"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/supabase";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonCard } from "@/components/dashboard/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { FounderFollowUpPill } from "@/components/admin/founder-follow-up-pill";
import type { AdminBusinessFollowUpStatus } from "@/lib/types";

type AttentionReason = {
  key: string;
  label: string;
  tone: "critical" | "warning" | "info";
};

type OverviewResponse = {
  metrics: {
    activeBusinesses: number;
    trialingBusinesses: number;
    canceledBusinesses: number;
    pastDueBusinesses: number;
    newSignups30d: number;
    onboardingStuck: number;
    inactiveBusinesses: number;
    requestCount30d: number;
    publicFlowCompletion30d: number;
    privateFeedback30d: number;
    failedDeliveries30d: number;
    remindersDue: number;
    remindersOverdue: number;
  };
  attention: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    reasons: AttentionReason[];
    lastActivityLabel: string;
  }>;
  newestBusinesses: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    createdLabel: string;
    onboardingCompleted: boolean;
  }>;
  inactiveBusinesses: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    lastActivityLabel: string;
    subscriptionStatus: string;
  }>;
  reminders: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    followUpStatus: AdminBusinessFollowUpStatus;
    reminderDueLabel: string;
    reminderUrgency: "upcoming" | "today" | "tomorrow" | "overdue";
    founderNotePreview: string | null;
  }>;
};

function DatabaseIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.9L19 10l-5.1 2.1L12 17l-1.9-4.9L5 10l5.1-2.1L12 3z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function toneClasses(tone: AttentionReason["tone"]) {
  switch (tone) {
    case "critical":
      return "border-[#F3C4BE] bg-[#FFF4F1] text-[#A6452F]";
    case "warning":
      return "border-[#F6D9A8] bg-[#FFF8EA] text-[#9A6404]";
    default:
      return "border-[#D8E2F2] bg-[#F6F9FF] text-[#4161A6]";
  }
}

function FounderHomeSkeleton() {
  return (
    <>
      <div className="h-8 w-60 animate-pulse rounded bg-[var(--dash-border)]" />
      <div className="mt-3 h-4 w-96 animate-pulse rounded bg-[var(--dash-border)]" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="h-[360px] animate-pulse rounded-[var(--dash-radius)] bg-white shadow-[var(--dash-shadow)]" />
        <div className="h-[360px] animate-pulse rounded-[var(--dash-radius)] bg-white shadow-[var(--dash-shadow)]" />
      </div>
    </>
  );
}

export default function FounderAdminHomePage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetchWithAuth("/api/admin/overview");
        const body = (await res.json().catch(() => ({}))) as OverviewResponse & { error?: string };

        if (!res.ok) {
          throw new Error(body.error || "Could not load founder overview.");
        }

        if (!cancelled) {
          setOverview(body);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load founder overview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="max-w-[62ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          Founder Home
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          Run the business from one calm screen.
        </h1>
        <p className="mt-3 max-w-[56ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
          Lead with what needs attention, keep the numbers honest, and use the heavier analytics only when the underlying reporting is ready.
        </p>
      </div>

      {loading ? (
        <div className="mt-8">
          <FounderHomeSkeleton />
        </div>
      ) : error || !overview ? (
        <div className="mt-10 rounded-[var(--dash-radius)] border border-[#F3C4BE] bg-[#FFF4F1] p-6 shadow-[var(--dash-shadow)]">
          <p className="text-[14px] font-semibold text-[#A6452F]">Couldn’t load founder overview</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8A5A50]">{error ?? "Please try again."}</p>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-[var(--dash-radius)] border border-[#F6D9A8] bg-[#FFF8EA] p-5 shadow-[var(--dash-shadow)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[42ch]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9A6404]">
                  Needs attention now
                </p>
                <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Focus on issues that can quietly erode trust.
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                  This queue stays operational on purpose: billing trouble, stuck onboarding, fresh private feedback, delivery failures, and businesses that have gone quiet.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/support"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--dash-primary)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(224,90,61,0.18)] transition-all hover:brightness-95 active:scale-[0.98]"
                >
                  Open support queue
                </Link>
                <Link
                  href="/admin/businesses"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--dash-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                >
                  Browse businesses
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[var(--dash-radius-sm)] border border-white/70 bg-white/85 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  Billing
                </p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
                  {overview.metrics.pastDueBusinesses}
                </p>
                <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                  business{overview.metrics.pastDueBusinesses === 1 ? "" : "es"} past due
                </p>
              </div>
              <div className="rounded-[var(--dash-radius-sm)] border border-white/70 bg-white/85 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  Onboarding
                </p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
                  {overview.metrics.onboardingStuck}
                </p>
                <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                  business{overview.metrics.onboardingStuck === 1 ? "" : "es"} look stuck
                </p>
              </div>
              <div className="rounded-[var(--dash-radius-sm)] border border-white/70 bg-white/85 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  Delivery issues
                </p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
                  {overview.metrics.failedDeliveries30d}
                </p>
                <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                  failed sends in the last 30 days
                </p>
              </div>
              <div className="rounded-[var(--dash-radius-sm)] border border-white/70 bg-white/85 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  Founder reminders
                </p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
                  {overview.metrics.remindersDue}
                </p>
                <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                  {overview.metrics.remindersOverdue} overdue
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<DatabaseIcon />} label="Active businesses" value={overview.metrics.activeBusinesses} />
            <StatCard icon={<SparkIcon />} label="Trialing" value={overview.metrics.trialingBusinesses} />
            <StatCard icon={<WarningIcon />} label="Canceled" value={overview.metrics.canceledBusinesses} />
            <StatCard icon={<TrendIcon />} label="New signups (30d)" value={overview.metrics.newSignups30d} />
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                    Support / Risk
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
                    What needs founder eyes this week
                  </h2>
                </div>
                <Link href="/admin/support" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                  See all
                </Link>
              </div>

              {overview.attention.length === 0 ? (
                <EmptyState
                  icon={<WarningIcon />}
                  title="No urgent founder queue right now"
                  description="The top issues list is clear. That’s exactly what this screen should make obvious."
                />
              ) : (
                <div className="mt-5 space-y-3">
                  {overview.attention.map((item) => (
                    <Link
                      key={item.businessId}
                      href={`/admin/businesses/${item.businessId}`}
                      className="block rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                          {item.ownerEmail && (
                            <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{item.ownerEmail}</p>
                          )}
                        </div>
                        <StatusPill status={item.subscriptionStatus} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.reasons.map((reason) => (
                          <span
                            key={`${item.businessId}-${reason.key}`}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(reason.tone)}`}
                          >
                            {reason.label}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-[12px] text-[var(--dash-muted)]">
                        Last activity {item.lastActivityLabel}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                      Follow-up reminders
                    </p>
                    <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
                      Due soon and overdue
                    </h2>
                  </div>
                  <Link href="/admin/support" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                    Open queue
                  </Link>
                </div>
                {overview.reminders.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon={<SparkIcon />}
                      title="No founder reminders right now"
                      description="Set a reminder date on any founder note and it will show up here in urgency order."
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {overview.reminders.map((item) => (
                      <Link
                        key={item.businessId}
                        href={`/admin/businesses/${item.businessId}`}
                        className="block rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--dash-muted)]">
                              {item.reminderDueLabel}
                            </p>
                          </div>
                          <FounderFollowUpPill status={item.followUpStatus} />
                        </div>
                        {item.founderNotePreview && (
                          <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                            {item.founderNotePreview}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Operating snapshot
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                      Requests sent (30d)
                    </p>
                    <p className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--dash-text)]">
                      {overview.metrics.requestCount30d}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                      Public flow completion
                    </p>
                    <p className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--dash-text)]">
                      {overview.metrics.publicFlowCompletion30d}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                      Private feedback (30d)
                    </p>
                    <p className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--dash-text)]">
                      {overview.metrics.privateFeedback30d}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                      Inactive businesses
                    </p>
                    <p className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--dash-text)]">
                      {overview.metrics.inactiveBusinesses}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                  These numbers only use states we own today. Revenue, churn, and AI cost move in once their reporting tables are in place.
                </p>
              </div>

              <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                      Newest businesses
                    </p>
                    <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
                      Fresh signups worth checking on
                    </h2>
                  </div>
                  <Link href="/admin/businesses" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                    Open list
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {overview.newestBusinesses.map((business) => (
                    <Link
                      key={business.businessId}
                      href={`/admin/businesses/${business.businessId}`}
                      className="block rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[var(--dash-text)]">{business.name}</p>
                          <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{business.createdLabel}</p>
                        </div>
                        <StatusPill status={business.subscriptionStatus} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Going quiet
                </p>
                <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Businesses with no recent activity
                </h2>
              </div>
              <Link href="/admin/support" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                Review queue
              </Link>
            </div>

            {overview.inactiveBusinesses.length === 0 ? (
              <EmptyState
                icon={<SparkIcon />}
                title="No inactive businesses right now"
                description="Once a business goes quiet long enough to matter, it will show up here."
              />
            ) : (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {overview.inactiveBusinesses.map((business) => (
                  <Link
                    key={business.businessId}
                    href={`/admin/businesses/${business.businessId}`}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--dash-text)]">{business.name}</p>
                        <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                          Last activity {business.lastActivityLabel}
                        </p>
                      </div>
                      <StatusPill status={business.subscriptionStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
