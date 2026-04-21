"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/supabase";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { FounderFollowUpPill } from "@/components/admin/founder-follow-up-pill";
import type { AdminBusinessFollowUpStatus } from "@/lib/types";

type AttentionReason = {
  key: string;
  label: string;
  tone: "critical" | "warning" | "info";
};

type BusinessSummary = {
  id: string;
  name: string;
  ownerEmail: string | null;
  subscriptionStatus: string;
  lastActivityLabel: string;
  founderFollowUpStatus: AdminBusinessFollowUpStatus;
  founderNotePreview: string | null;
  founderNoteUpdatedLabel: string | null;
  reminderDueLabel: string | null;
  reminderUrgency: "none" | "upcoming" | "today" | "tomorrow" | "overdue";
  attentionReasons: AttentionReason[];
};

function WarningIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

export default function FounderSupportPage() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetchWithAuth("/api/admin/businesses");
        const body = (await res.json().catch(() => ({}))) as {
          businesses?: BusinessSummary[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error || "Could not load support queue.");
        }

        if (!cancelled) {
          setBusinesses(body.businesses ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load support queue.");
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

  const queue = useMemo(
    () => businesses.filter((business) => business.attentionReasons.length > 0),
    [businesses],
  );
  const reminders = useMemo(
    () =>
      businesses
        .filter((business) => business.reminderUrgency !== "none" && business.reminderDueLabel)
        .sort((a, b) => {
          const aDue = a.reminderUrgency === "overdue" ? 0 : a.reminderUrgency === "today" ? 1 : a.reminderUrgency === "tomorrow" ? 2 : 3;
          const bDue = b.reminderUrgency === "overdue" ? 0 : b.reminderUrgency === "today" ? 1 : b.reminderUrgency === "tomorrow" ? 2 : 3;
          if (aDue !== bDue) return aDue - bDue;
          return a.name.localeCompare(b.name);
        }),
    [businesses],
  );

  return (
    <>
      <div className="max-w-[58ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          Support / Risk
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          One queue for the founder problems that can’t stay buried.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
          Billing issues, stuck onboarding, failed deliveries, and fresh private feedback all land here so nothing important hides in a random tool.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Follow-up reminders
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                In urgency order, not buried in your notes.
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<WarningIcon />}
                title="No founder reminders yet"
                description="Add a reminder date to any founder note and it will show up here in urgency order."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {reminders.map((business) => (
                <Link
                  key={`${business.id}-reminder`}
                  href={`/admin/businesses/${business.id}`}
                  className="block rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-colors hover:bg-white hover:border-[#E05A3D]/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">{business.name}</p>
                      {business.ownerEmail && (
                        <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{business.ownerEmail}</p>
                      )}
                    </div>
                    <FounderFollowUpPill status={business.founderFollowUpStatus} />
                  </div>
                  <p className="mt-3 text-[12px] font-semibold text-[var(--dash-text)]">
                    {business.reminderDueLabel}
                  </p>
                  {business.founderNotePreview && (
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                      {business.founderNotePreview}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-[14px] font-semibold text-[#A6452F]">Couldn’t load the support queue</p>
            <p className="mt-2 text-[13px] text-[var(--dash-muted)]">{error}</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<WarningIcon />}
              title="The founder queue is clear"
              description="When businesses hit billing trouble, go inactive, or start getting private feedback that needs follow-up, they’ll show here."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--dash-border)]">
            {queue.map((business) => (
              <Link
                key={business.id}
                href={`/admin/businesses/${business.id}`}
                className="block p-5 transition-colors hover:bg-[#FCFAF6]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-[16px] font-semibold text-[var(--dash-text)]">{business.name}</p>
                      <StatusPill status={business.subscriptionStatus} />
                      <FounderFollowUpPill status={business.founderFollowUpStatus} />
                    </div>
                    {business.ownerEmail && (
                      <p className="mt-1 text-[13px] text-[var(--dash-muted)]">{business.ownerEmail}</p>
                    )}
                    {business.founderNotePreview && (
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-text)]">
                        {business.founderNotePreview}
                        {business.founderNoteUpdatedLabel && (
                          <span className="ml-2 text-[12px] text-[var(--dash-muted)]">
                            Updated {business.founderNoteUpdatedLabel}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {business.attentionReasons.map((reason) => (
                        <span
                          key={`${business.id}-${reason.key}`}
                          className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--dash-muted)]"
                        >
                          {reason.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[12px] text-[var(--dash-muted)]">Last activity {business.lastActivityLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
