"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/supabase";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonCard } from "@/components/dashboard/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/components/dashboard/toast";
import type { AiProvider, AiRoutingMode } from "@/lib/types";

type ProviderSummary = {
  provider: AiProvider;
  label: string;
  isConfigured: boolean;
  isPrimary: boolean;
  status: "ready" | "configured" | "degraded" | "missing_key";
  statusLabel: string;
  statusNote: string;
  modelFast: string;
  modelNuanced: string;
  successes24h: number;
  failures24h: number;
  fallbackSuccesses24h: number;
  lastAttemptLabel: string;
  lastError: string | null;
};

type EventSummary = {
  id: string;
  feature: "review" | "reply";
  provider: AiProvider;
  providerLabel: string;
  model: string;
  success: boolean;
  latencyLabel: string;
  fallbackLabel: string;
  createdLabel: string;
  errorMessage: string | null;
};

type SystemResponse = {
  settings: {
    routingMode: AiRoutingMode;
    primaryProvider: AiProvider;
    updatedLabel: string;
  };
  summary: {
    attempts24h: number;
    failures24h: number;
    fallbacks24h: number;
    lastFailureLabel: string | null;
  };
  providers: ProviderSummary[];
  recentEvents: EventSummary[];
  error?: string;
};

function CpuIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E05A3D"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E05A3D"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E05A3D"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function toneClasses(status: ProviderSummary["status"]) {
  switch (status) {
    case "ready":
      return "border-[#D9E8DC] bg-[#F4FBF6] text-[#2F7A47]";
    case "configured":
      return "border-[#D8E2F2] bg-[#F6F9FF] text-[#4161A6]";
    case "degraded":
      return "border-[#F6D9A8] bg-[#FFF8EA] text-[#9A6404]";
    case "missing_key":
      return "border-[#F3C4BE] bg-[#FFF4F1] text-[#A6452F]";
    default:
      return "border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-muted)]";
  }
}

function eventTone(success: boolean) {
  return success
    ? "border-[#D9E8DC] bg-[#F4FBF6] text-[#2F7A47]"
    : "border-[#F3C4BE] bg-[#FFF4F1] text-[#A6452F]";
}

function SystemSkeleton() {
  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[360px] animate-pulse rounded-[var(--dash-radius)] bg-white shadow-[var(--dash-shadow)]" />
        <div className="h-[360px] animate-pulse rounded-[var(--dash-radius)] bg-white shadow-[var(--dash-shadow)]" />
      </div>
    </>
  );
}

export default function FounderSystemPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SystemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [routingMode, setRoutingMode] = useState<AiRoutingMode>("auto");
  const [primaryProvider, setPrimaryProvider] = useState<AiProvider>("anthropic");

  async function load() {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/admin/system");
      const body = (await res.json().catch(() => ({}))) as SystemResponse;

      if (!res.ok) {
        throw new Error(body.error || "Could not load system health.");
      }

      setData(body);
      setRoutingMode(body.settings.routingMode);
      setPrimaryProvider(body.settings.primaryProvider);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load system health.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (!data) {
      return false;
    }

    return (
      data.settings.routingMode !== routingMode ||
      data.settings.primaryProvider !== primaryProvider
    );
  }, [data, primaryProvider, routingMode]);

  async function saveSettings() {
    try {
      setSaving(true);
      const res = await fetchWithAuth("/api/admin/system", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routingMode,
          primaryProvider,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as SystemResponse;

      if (!res.ok) {
        throw new Error(body.error || "Could not save AI routing.");
      }

      setData(body);
      setRoutingMode(body.settings.routingMode);
      setPrimaryProvider(body.settings.primaryProvider);
      toast("AI routing updated.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not save AI routing.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="max-w-[62ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          AI / System
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          See which model path is healthy, and switch before the app goes dark.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
          Reviews and replies now run through one shared router. This screen shows what&apos;s configured, what actually worked recently, and whether fallbacks had to step in.
        </p>
      </div>

      {loading ? (
        <SystemSkeleton />
      ) : error || !data ? (
        <div className="mt-10 rounded-[var(--dash-radius)] border border-[#F3C4BE] bg-[#FFF4F1] p-6 shadow-[var(--dash-shadow)]">
          <p className="text-[14px] font-semibold text-[#A6452F]">Couldn’t load system health</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8A5A50]">
            {error ?? "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-full bg-[var(--dash-primary)] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<CpuIcon />}
              label="Attempts (24h)"
              value={data.summary.attempts24h}
              detail={
                <p className="text-[12px] text-[var(--dash-muted)]">
                  Across review drafting and reply drafting.
                </p>
              }
            />
            <StatCard
              icon={<WarningIcon />}
              label="Failures (24h)"
              value={data.summary.failures24h}
              detail={
                <p className="text-[12px] text-[var(--dash-muted)]">
                  Last failure {data.summary.lastFailureLabel ?? "hasn’t happened yet"}.
                </p>
              }
            />
            <StatCard
              icon={<RefreshIcon />}
              label="Fallback wins (24h)"
              value={data.summary.fallbacks24h}
              detail={
                <p className="text-[12px] text-[var(--dash-muted)]">
                  Successful generations that needed a backup provider.
                </p>
              }
            />
            <StatCard
              icon={<CpuIcon />}
              label="Current mode"
              value={data.settings.routingMode === "auto" ? "Auto fallback" : "Force selected"}
              detail={
                <p className="text-[12px] text-[var(--dash-muted)]">
                  Primary: {data.providers.find((provider) => provider.isPrimary)?.label ?? "Unknown"} · Updated {data.settings.updatedLabel}
                </p>
              }
            />
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-[42ch]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                    Routing control
                  </p>
                  <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
                    Pick the default path, but keep fallback honest.
                  </h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                    Auto fallback keeps the product alive if the primary model hiccups. Force selected is useful for testing or temporarily steering all traffic to one provider.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-2.5 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-white"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  Routing mode
                </p>
                <div className="mt-3 inline-flex rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] p-1">
                  {(["auto", "force"] as AiRoutingMode[]).map((mode) => {
                    const active = routingMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRoutingMode(mode)}
                        className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                          active
                            ? "bg-white text-[var(--dash-text)] shadow-[0_8px_20px_rgba(26,46,37,0.08)]"
                            : "text-[var(--dash-muted)]"
                        }`}
                      >
                        {mode === "auto" ? "Auto fallback" : "Force selected"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  Primary provider
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {data.providers.map((provider) => {
                    const selected = primaryProvider === provider.provider;

                    return (
                      <button
                        key={provider.provider}
                        type="button"
                        onClick={() => setPrimaryProvider(provider.provider)}
                        className={`rounded-[var(--dash-radius-sm)] border p-4 text-left transition-colors ${
                          selected
                            ? "border-[#E05A3D]/30 bg-[#FFF7F3]"
                            : "border-[var(--dash-border)] bg-[var(--dash-bg)] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[15px] font-semibold text-[var(--dash-text)]">
                            {provider.label}
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(provider.status)}`}
                          >
                            {provider.statusLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                          {provider.statusNote}
                        </p>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                          Fast
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--dash-text)]">{provider.modelFast}</p>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                          Nuanced
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--dash-text)]">{provider.modelNuanced}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={!hasUnsavedChanges || saving}
                  className="rounded-full bg-[var(--dash-primary)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save AI routing"}
                </button>
                <p className="text-[12px] leading-relaxed text-[var(--dash-muted)]">
                  Force mode only makes sense when the selected provider actually has a key. Auto mode will skip missing keys and keep moving.
                </p>
              </div>
            </div>

            <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Provider status
              </p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
                Know what is merely configured versus what actually worked.
              </h2>
              <div className="mt-6 space-y-4">
                {data.providers.map((provider) => (
                  <div
                    key={provider.provider}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-semibold text-[var(--dash-text)]">
                            {provider.label}
                          </p>
                          {provider.isPrimary && (
                            <span className="rounded-full border border-[#F6D9A8] bg-[#FFF8EA] px-2.5 py-1 text-[11px] font-semibold text-[#9A6404]">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                          Last attempt {provider.lastAttemptLabel}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(provider.status)}`}
                      >
                        {provider.statusLabel}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                          Successes (24h)
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                          {provider.successes24h}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                          Failures (24h)
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                          {provider.failures24h}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                          Fallback wins
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                          {provider.fallbackSuccesses24h}
                        </p>
                      </div>
                    </div>
                    {provider.lastError && (
                      <p className="mt-4 rounded-[12px] border border-[#F3C4BE] bg-[#FFF4F1] px-3 py-2 text-[12px] leading-relaxed text-[#A6452F]">
                        Latest issue: {provider.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Recent AI events
                </p>
                <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Look at the last few attempts before guessing.
                </h2>
              </div>
              <p className="max-w-[34ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
                This feed only shows confirmed app-side attempts. It helps separate provider trouble from broader flow issues.
              </p>
            </div>

            {data.recentEvents.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={<CpuIcon />}
                  title="No AI events yet"
                  description="Once owners generate review drafts or reply drafts, the attempts will show up here with provider, latency, and fallback context."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {data.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-semibold text-[var(--dash-text)]">
                            {event.providerLabel}
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${eventTone(event.success)}`}
                          >
                            {event.success ? "Success" : "Failed"}
                          </span>
                          <span className="rounded-full border border-[var(--dash-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--dash-muted)]">
                            {event.feature === "review" ? "Review draft" : "Reply draft"}
                          </span>
                          <span className="rounded-full border border-[var(--dash-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--dash-muted)]">
                            {event.fallbackLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] text-[var(--dash-muted)]">
                          {event.model}
                        </p>
                        {event.errorMessage && (
                          <p className="mt-3 rounded-[12px] border border-[#F3C4BE] bg-[#FFF4F1] px-3 py-2 text-[12px] leading-relaxed text-[#A6452F]">
                            {event.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-3 text-left sm:grid-cols-2 lg:min-w-[220px] lg:text-right">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                            When
                          </p>
                          <p className="mt-1 text-[13px] font-medium text-[var(--dash-text)]">
                            {event.createdLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                            Latency
                          </p>
                          <p className="mt-1 text-[13px] font-medium text-[var(--dash-text)]">
                            {event.latencyLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
