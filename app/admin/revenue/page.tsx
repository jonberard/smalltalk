"use client";

import Link from "next/link";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";

function TrendIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function FounderRevenuePage() {
  return (
    <>
      <div className="max-w-[58ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          Revenue
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          Money movement comes in only when the reporting is trustworthy.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
          This screen is reserved for MRR, churn, and conversion once Stripe rollups are normalized into app-owned reporting tables.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard icon={<TrendIcon />} label="MRR" value="Coming next" />
        <StatCard icon={<TrendIcon />} label="Net MRR change" value="Needs billing history" />
        <StatCard icon={<TrendIcon />} label="Churned MRR" value="Needs churn model" />
      </section>

      <section className="mt-8 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
        <EmptyState
          icon={<LockIcon />}
          title="Revenue stays hidden until the plumbing is real"
          description="We’re intentionally not surfacing MRR, churn, or trial-to-paid trends here yet. Those numbers need Stripe history snapshots and clear founder reporting definitions first."
        />
        <div className="mt-6 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
            Planned next
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
            <li>Normalize Stripe subscription snapshots into app-owned reporting tables</li>
            <li>Store historical billing state changes so net movement is based on real deltas</li>
            <li>Define churn and conversion consistently before those labels hit the founder UI</li>
          </ul>
        </div>
      </section>
    </>
  );
}
