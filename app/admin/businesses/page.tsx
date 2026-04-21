"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/supabase";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";

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
  onboardingCompleted: boolean;
  onboardingStuck: boolean;
  createdAt: string;
  createdLabel: string;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  requestCount30d: number;
  publicFlowCompletion30d: number;
  privateFeedbackNewCount: number;
  privateFeedback30d: number;
  failedDeliveries30d: number;
  inactive: boolean;
  attentionReasons: AttentionReason[];
  attentionScore: number;
};

export default function FounderBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
          throw new Error(body.error || "Could not load businesses.");
        }

        if (!cancelled) {
          setBusinesses(body.businesses ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load businesses.");
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return businesses;
    }

    return businesses.filter((business) =>
      [business.name, business.ownerEmail ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [businesses, search]);

  return (
    <>
      <div className="max-w-[58ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          Businesses
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          Scan who&apos;s healthy, stuck, or quietly drifting.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
          The list defaults to urgency so the businesses that need founder attention rise first.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[var(--dash-text)]">
            {filtered.length} business{filtered.length === 1 ? "" : "es"}
          </p>
          <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
            Trial, active, past due, and canceled accounts in one founder view.
          </p>
        </div>
        <label className="block w-full max-w-[360px]">
          <span className="sr-only">Search businesses</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by business or owner email"
            className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-2.5 text-[13px] text-[var(--dash-text)] outline-none transition-colors placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
          />
        </label>
      </div>

      <div className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
        {loading ? (
          <div className="p-5">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-[14px] font-semibold text-[#A6452F]">Couldn’t load businesses</p>
            <p className="mt-2 text-[13px] text-[var(--dash-muted)]">{error}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--dash-border)]">
            {filtered.map((business) => (
              <Link
                key={business.id}
                href={`/admin/businesses/${business.id}`}
                className="block p-5 transition-colors hover:bg-[#FCFAF6]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-[16px] font-semibold text-[var(--dash-text)]">{business.name}</p>
                      <StatusPill status={business.subscriptionStatus} />
                      {business.onboardingStuck && <StatusPill status="in_progress" />}
                    </div>
                    {business.ownerEmail && (
                      <p className="mt-1 text-[13px] text-[var(--dash-muted)]">{business.ownerEmail}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {business.attentionReasons.length > 0 ? (
                        business.attentionReasons.map((reason) => (
                          <span
                            key={`${business.id}-${reason.key}`}
                            className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--dash-muted)]"
                          >
                            {reason.label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-[var(--dash-border)] bg-[#F6FBF8] px-2.5 py-1 text-[11px] font-semibold text-[#39715D]">
                          No immediate founder issues
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 text-left sm:grid-cols-2 lg:min-w-[360px] lg:text-right">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                        Last activity
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[var(--dash-text)]">{business.lastActivityLabel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                        Requests (30d)
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[var(--dash-text)]">{business.requestCount30d}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                        Flow completion
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[var(--dash-text)]">
                        {business.publicFlowCompletion30d}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                        Failed deliveries
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[var(--dash-text)]">
                        {business.failedDeliveries30d}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
