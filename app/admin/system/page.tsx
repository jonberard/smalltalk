"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";

function DeliveryIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h13v10H3z" />
      <path d="M16 10h3l2 3v4h-5z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="18.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

export default function FounderSystemPage() {
  return (
    <>
      <div className="max-w-[58ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          AI / System
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          Reliability first. Fancy system telemetry second.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
          This screen will eventually track provider failures, failover events, delivery health, and AI cost. For now, it stays honest about what we aren’t storing yet.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <StatCard icon={<DeliveryIcon />} label="Delivery failure monitoring" value="Available through founder home and support queue" />
        <StatCard icon={<CpuIcon />} label="AI provider telemetry" value="Needs tracking first" />
      </section>

      <section className="mt-8 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
        <EmptyState
          icon={<CpuIcon />}
          title="AI/system health lands after provider tracking is wired"
          description="We can already show message-delivery failures because those live in our database. AI provider failures, failover events, and cost need their own event logging before this page becomes real."
        />
        <div className="mt-6 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
            Planned next
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
            <li>Persist provider, model, latency, and estimated cost for every AI generation</li>
            <li>Log failover events so fallback behavior is visible instead of invisible</li>
            <li>Promote AI health onto this page only after the data is reliable enough to trust</li>
          </ul>
        </div>
      </section>
    </>
  );
}
