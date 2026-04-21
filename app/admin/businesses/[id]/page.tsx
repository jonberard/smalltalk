"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/supabase";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonCard } from "@/components/dashboard/skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useToast } from "@/components/dashboard/toast";
import { FounderFollowUpPill } from "@/components/admin/founder-follow-up-pill";
import type { AdminBusinessFollowUpStatus } from "@/lib/types";

type AttentionReason = {
  key: string;
  label: string;
  tone: "critical" | "warning" | "info";
};

type BusinessDetail = {
  summary: {
    id: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    onboardingCompleted: boolean;
    onboardingStuck: boolean;
    createdLabel: string;
    lastActivityLabel: string;
    requestCount30d: number;
    publicFlowCompletion30d: number;
    privateFeedbackNewCount: number;
    privateFeedback30d: number;
    failedDeliveries30d: number;
    failedReminders30d: number;
    attentionReasons: AttentionReason[];
    trialRequestsRemaining: number;
    trialEndsAt: string | null;
    founderFollowUpStatus: AdminBusinessFollowUpStatus;
    founderNotePreview: string | null;
    founderNoteUpdatedAt: string | null;
    founderNoteUpdatedLabel: string | null;
  };
  founderNote: {
    followUpStatus: AdminBusinessFollowUpStatus;
    note: string;
    updatedAt: string | null;
    updatedLabel: string | null;
  };
  recentRequests: Array<{
    reviewLinkId: string;
    customerName: string;
    customerContact: string | null;
    createdLabel: string;
    source: string;
    currentStateLabel: string;
  }>;
  recentPrivateFeedback: Array<{
    sessionId: string;
    customerName: string;
    stars: number | null;
    message: string | null;
    status: "new" | "handled";
    createdLabel: string;
    customerContact: string | null;
  }>;
  failedDeliveries: Array<{
    deliveryId: string;
    kind: string;
    channel: "sms" | "email";
    createdLabel: string;
    lastError: string | null;
    toAddress: string | null;
  }>;
};

const FOLLOW_UP_OPTIONS: Array<{
  value: AdminBusinessFollowUpStatus;
  label: string;
}> = [
  { value: "none", label: "No founder follow-up" },
  { value: "watching", label: "Watching" },
  { value: "follow_up", label: "Follow up in progress" },
  { value: "blocked", label: "Blocked" },
  { value: "resolved", label: "Resolved" },
];

function PersonIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
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

export default function FounderBusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [followUpStatus, setFollowUpStatus] =
    useState<AdminBusinessFollowUpStatus>("none");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`/api/admin/businesses/${params.id}`);
        const body = (await res.json().catch(() => ({}))) as BusinessDetail & { error?: string };

        if (!res.ok) {
          throw new Error(body.error || "Could not load business detail.");
        }

        if (!cancelled) {
          setDetail(body);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load business detail.");
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
  }, [params.id]);

  useEffect(() => {
    if (!detail) {
      return;
    }

    setNoteDraft(detail.founderNote.note);
    setFollowUpStatus(detail.founderNote.followUpStatus);
  }, [detail]);

  if (loading) {
    return (
      <>
        <div className="h-8 w-52 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="mt-8 h-[420px] animate-pulse rounded-[var(--dash-radius)] bg-white shadow-[var(--dash-shadow)]" />
      </>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-[var(--dash-radius)] border border-[#F3C4BE] bg-[#FFF4F1] p-6 shadow-[var(--dash-shadow)]">
        <p className="text-[14px] font-semibold text-[#A6452F]">Couldn’t load business detail</p>
        <p className="mt-2 text-[13px] text-[var(--dash-muted)]">{error ?? "Please try again."}</p>
      </div>
    );
  }

  const { summary } = detail;
  const hasNoteChanges =
    noteDraft !== detail.founderNote.note ||
    followUpStatus !== detail.founderNote.followUpStatus;
  const noteUpdatedCopy = useMemo(() => {
    if (!detail.founderNote.updatedLabel) {
      return "Founder notes help you remember context before you step back into a business.";
    }

    return `Last updated ${detail.founderNote.updatedLabel}.`;
  }, [detail.founderNote.updatedLabel]);

  async function saveFounderNote() {
    try {
      setSavingNote(true);
      const res = await fetchWithAuth(`/api/admin/businesses/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: noteDraft,
          followUpStatus,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as BusinessDetail & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(body.error || "Could not save founder notes.");
      }

      setDetail(body);
      toast("Founder notes saved.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not save founder notes.",
        "error",
      );
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <>
      <Link
        href="/admin/businesses"
        className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to businesses
      </Link>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[58ch]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Business Detail
          </p>
          <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
            {summary.name}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
            A founder view of subscription state, request activity, private feedback, and delivery issues.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status={summary.subscriptionStatus} />
          {summary.onboardingStuck && <StatusPill status="in_progress" />}
          <FounderFollowUpPill status={summary.founderFollowUpStatus} />
        </div>
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Profile
          </p>
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--dash-radius-sm)] bg-[#E05A3D]/10">
                <PersonIcon />
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  Owner
                </p>
                <p className="mt-1 text-[14px] font-medium text-[var(--dash-text)]">
                  {summary.ownerEmail ?? "No owner email on file"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--dash-radius-sm)] bg-[#E05A3D]/10">
                <MailIcon />
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  Timing
                </p>
                <p className="mt-1 text-[14px] font-medium text-[var(--dash-text)]">
                  Created {summary.createdLabel}
                </p>
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                  Last activity {summary.lastActivityLabel}
                </p>
              </div>
            </div>
          </div>

          {summary.attentionReasons.length > 0 && (
            <div className="mt-6 rounded-[var(--dash-radius-sm)] border border-[#F6D9A8] bg-[#FFF8EA] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9A6404]">
                Founder watchlist
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.attentionReasons.map((reason) => (
                  <span
                    key={reason.key}
                    className="rounded-full border border-[#F1D4A0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#8E5E09]"
                  >
                    {reason.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                Founder follow-up
              </p>
              <FounderFollowUpPill status={summary.founderFollowUpStatus} />
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
              {summary.founderNotePreview ??
                "No founder note yet. Use notes below to track follow-up, edge cases, or support context."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              label: "Requests (30d)",
              value: summary.requestCount30d,
            },
            {
              label: "Public flow completion",
              value: `${summary.publicFlowCompletion30d}%`,
            },
            {
              label: "Private feedback (30d)",
              value: summary.privateFeedback30d,
            },
            {
              label: "Failed deliveries (30d)",
              value: summary.failedDeliveries30d,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                {card.label}
              </p>
              <p className="mt-3 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Recent requests
              </p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
                What customers have done lately
              </h2>
            </div>
          </div>

          {detail.recentRequests.length === 0 ? (
            <EmptyState
              icon={<MailIcon />}
              title="No request history yet"
              description="Once this business starts sending requests, the latest request activity will appear here."
            />
          ) : (
            <div className="mt-5 space-y-3">
              {detail.recentRequests.map((request) => (
                <div
                  key={request.reviewLinkId}
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">
                        {request.customerName}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                        {request.source} · {request.createdLabel}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--dash-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--dash-muted)]">
                      {request.currentStateLabel}
                    </span>
                  </div>
                  {request.customerContact && (
                    <p className="mt-3 text-[12px] text-[var(--dash-muted)]">{request.customerContact}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Founder notes
                </p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Keep your support context attached to the business.
                </h2>
              </div>
              <FounderFollowUpPill status={followUpStatus} />
            </div>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  Follow-up state
                </span>
                <select
                  value={followUpStatus}
                  onChange={(event) =>
                    setFollowUpStatus(
                      event.target.value as AdminBusinessFollowUpStatus,
                    )
                  }
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[13px] text-[var(--dash-text)] outline-none transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                >
                  {FOLLOW_UP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  Notes
                </span>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={7}
                  placeholder="Write what happened, what you promised, or what to check next."
                  className="min-h-[180px] rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--dash-text)] outline-none transition-colors placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-[var(--dash-muted)]">
                {noteUpdatedCopy}
              </p>
              <button
                type="button"
                onClick={() => void saveFounderNote()}
                disabled={!hasNoteChanges || savingNote}
                className="inline-flex items-center justify-center rounded-full bg-[var(--dash-primary)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(224,90,61,0.18)] transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingNote ? "Saving..." : "Save founder note"}
              </button>
            </div>
          </div>

          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Private feedback
            </p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
              Recent unhappy-customer signals
            </h2>

            {detail.recentPrivateFeedback.length === 0 ? (
              <EmptyState
                icon={<WarningIcon />}
                title="No private feedback yet"
                description="If this business starts receiving low-rating private feedback, the latest items will show here."
              />
            ) : (
              <div className="mt-4 space-y-3">
                {detail.recentPrivateFeedback.map((item) => (
                  <div
                    key={item.sessionId}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.customerName}</p>
                      <StatusPill status={item.status === "handled" ? "handled" : "private_feedback"} />
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{item.createdLabel}</p>
                    {item.message && (
                      <p className="mt-3 text-[13px] leading-relaxed text-[var(--dash-text)]">{item.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Delivery issues
            </p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
              The latest failed sends
            </h2>

            {detail.failedDeliveries.length === 0 ? (
              <EmptyState
                icon={<MailIcon />}
                title="No failed deliveries right now"
                description="Recent send failures will show here when a business starts hitting delivery problems."
              />
            ) : (
              <div className="mt-4 space-y-3">
                {detail.failedDeliveries.map((item) => (
                  <div
                    key={item.deliveryId}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-text)]">
                        {item.kind.replace("_", " ")} · {item.channel}
                      </p>
                      <p className="text-[12px] text-[var(--dash-muted)]">{item.createdLabel}</p>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[var(--dash-text)]">
                      {item.lastError || "We couldn’t complete this delivery."}
                    </p>
                    {item.toAddress && (
                      <p className="mt-2 text-[12px] text-[var(--dash-muted)]">To: {item.toAddress}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
