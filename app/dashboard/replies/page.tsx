"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { capture } from "@/lib/posthog";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardHelpHint } from "@/components/dashboard/help-hint";
import { DashboardRailSwitcher } from "@/components/dashboard/rail-switcher";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";

type ReplyItem = {
  sessionId: string;
  reviewLinkId: string;
  name: string;
  time: string;
  stars: number | null;
  snippet: string | null;
  repliedAt: string | null;
  replyText: string | null;
  employeeName: string | null;
  serviceType: string | null;
  topicsSelected: { label: string; follow_up_answer: string }[] | null;
};

type ReplyFilter = "needs_reply" | "replied";

const REPLIED_WINDOW_DAYS = 30;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function MiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((index) => (
        <svg key={index} width={14} height={14} viewBox="0 0 24 24" fill={index <= Math.round(rating) ? "#E05A3D" : "#D1D5DB"} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 4
      ? "text-[#059669] bg-[#ECFDF5]"
      : rating === 3
        ? "text-[#D97706] bg-[#FFFBEB]"
        : "text-[#DC2626] bg-[#FEF2F2]";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {rating}
      <span className="text-[10px]">★</span>
    </span>
  );
}

function ReplyStateBadge({ replied }: { replied: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        replied ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FFF7ED] text-[#B45309]"
      }`}
    >
      {replied ? "Replied" : "Needs reply"}
    </span>
  );
}

function RepliesMetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "amber" | "green" | "red";
}) {
  const toneClasses =
    tone === "green"
      ? "bg-[#ECFDF5] text-[#059669]"
      : tone === "red"
        ? "bg-[#FEF2F2] text-[#DC2626]"
        : "bg-[#FFF7ED] text-[#B45309]";

  return (
    <div className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
            {value}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses}`}>
          {label}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">{detail}</p>
    </div>
  );
}

function RepliesGuideCard() {
  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        Reply Rhythm
      </p>
      <h2 className="mt-2 text-[22px] font-semibold leading-tight text-[var(--dash-text)]">
        Draft fast, paste manually, keep it human.
      </h2>
      <div className="mt-4 space-y-3">
        {[
          "Open the copied review and generate a response that sounds like the owner.",
          "Copy the text, then paste it on Google yourself so the product stays truthful about what happened.",
          "Use lower-star reviews to show accountability, not defensiveness.",
        ].map((step, index) => (
          <div
            key={step}
            className="flex gap-3 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E05A3D]/10 text-[12px] font-semibold text-[var(--dash-primary)]">
              {index + 1}
            </span>
            <p className="text-[13px] leading-relaxed text-[var(--dash-text)]">{step}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[var(--dash-radius-sm)] border border-dashed border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--dash-muted)]">
          <span className="font-semibold text-[var(--dash-text)]">Copied</span> means the customer reached the Google handoff. It still does not confirm the review was posted, so this queue is best for public reviews we know they drafted and copied.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DashboardHelpHint text="Sets the tone for your drafted replies.">
          <Link
            href="/dashboard/more/review-flow/voice"
            className={dashboardButtonClassName({ size: "sm" })}
          >
            Adjust reply voice
          </Link>
        </DashboardHelpHint>
        <DashboardHelpHint text="Explains what copied does and does not confirm.">
          <Link
            href="/dashboard/support/what-copied-means"
            className={dashboardButtonClassName({ size: "sm" })}
          >
            Review copied status
          </Link>
        </DashboardHelpHint>
      </div>
    </div>
  );
}

export default function RepliesPage() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReplyFilter>("needs_reply");
  const [items, setItems] = useState<ReplyItem[]>([]);
  const [selected, setSelected] = useState<ReplyItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchReplies() {
      const repliedWindowStartIso = new Date(
        Date.now() - REPLIED_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      const selectFields =
        "id, review_link_id, star_rating, generated_review, replied_at, reply_text, topics_selected, updated_at, review_links!inner(business_id, customer_name, services(name), employees(name))";

      const [needsReplyResult, repliedResult] = await Promise.all([
        supabase
          .from("review_sessions")
          .select(selectFields)
          .eq("review_links.business_id", businessId)
          .eq("status", "copied")
          .neq("feedback_type", "private")
          .is("replied_at", null)
          .order("updated_at", { ascending: false }),
        supabase
          .from("review_sessions")
          .select(selectFields)
          .eq("review_links.business_id", businessId)
          .eq("status", "copied")
          .neq("feedback_type", "private")
          .not("replied_at", "is", null)
          .gte("replied_at", repliedWindowStartIso)
          .order("replied_at", { ascending: false }),
      ]);

      const nextItems = [...(needsReplyResult.data ?? []), ...(repliedResult.data ?? [])].map((session) => {
          const link = session.review_links as unknown as {
            customer_name: string;
            services: { name: string } | null;
            employees: { name: string } | null;
          };

          return {
            sessionId: session.id,
            reviewLinkId: session.review_link_id,
            name: link.customer_name,
            time: timeAgo(session.updated_at),
            stars: session.star_rating,
            snippet: session.generated_review,
            repliedAt: session.replied_at ?? null,
            replyText: session.reply_text ?? null,
            employeeName: link.employees?.name ?? null,
            serviceType: link.services?.name ?? null,
            topicsSelected: session.topics_selected as { label: string; follow_up_answer: string }[] | null,
          } satisfies ReplyItem;
        });

      setItems(nextItems);
      setLoading(false);
    }

    fetchReplies();
  }, [business]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        filter === "needs_reply" ? !item.repliedAt : !!item.repliedAt,
      ),
    [filter, items],
  );

  async function generateReplyForItem(item: ReplyItem) {
    setSelected(item);
    setReplyLoading(true);
    setReplyError("");
    setReplyCopied(false);
    setReplyText(item.replyText ?? "");

    try {
      const res = await fetchWithAuth("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: item.sessionId,
          businessName: business?.name ?? "",
          reviewText: item.snippet ?? "",
          starRating: item.stars ?? 5,
          employeeName: item.employeeName,
          serviceType: item.serviceType,
          topicsSelected: item.topicsSelected,
          replyVoiceId: (business as Record<string, unknown>)?.reply_voice_id ?? "warm",
          customReplyVoice: (business as Record<string, unknown>)?.custom_reply_voice ?? undefined,
          reviewSource: "smalltalk",
        }),
      });
      const data = await res.json();

      if (data.reply_text) {
        setReplyText(data.reply_text);
        capture("reply_generated", { session_id: item.sessionId, star_rating: item.stars });
      } else {
        setReplyError("Failed to generate reply. Please try again.");
      }
    } catch {
      setReplyError("Failed to generate reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  }

  async function copyReplyAndMark() {
    if (!selected || !replyText) return;

    try {
      await navigator.clipboard.writeText(replyText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = replyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    capture("reply_copied", { session_id: selected.sessionId, star_rating: selected.stars });

    await supabase
      .from("review_sessions")
      .update({ reply_text: replyText, replied_at: new Date().toISOString() })
      .eq("id", selected.sessionId);

    const repliedAt = new Date().toISOString();

    setItems((current) =>
      current.map((item) =>
        item.sessionId === selected.sessionId
          ? { ...item, replyText, repliedAt }
          : item,
      ),
    );

    setSelected((current) =>
      current ? { ...current, replyText, repliedAt } : current,
    );
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 3000);
  }

  const needsReplyCount = items.filter((item) => !item.repliedAt).length;
  const repliedCount = items.filter((item) => !!item.repliedAt).length;
  const lowRatingCount = items.filter((item) => (item.stars ?? 5) <= 3).length;

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Replies
            </p>
            <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
              Keep public replies timely, calm, and worth reading.
            </h1>
            <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              Draft fast, paste on Google yourself, and keep the response tone aligned with how you want the business to show up.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/support"
              className={dashboardButtonClassName({ size: "lg" })}
            >
              Help Center
            </Link>
            <div className="flex items-center gap-2">
              <DashboardHelpHint text="Sets the tone for your drafted replies." label="Reply voice help">
                <Link
                  href="/dashboard/more/review-flow/voice"
                  className={dashboardButtonClassName({ variant: "accent", size: "lg" })}
                >
                  Reply voice
                </Link>
              </DashboardHelpHint>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <RepliesMetricCard
              label="Needs Reply"
              value={needsReplyCount}
              detail={
                needsReplyCount > 0
                  ? `${needsReplyCount} public review${needsReplyCount === 1 ? "" : "s"} still needs an owner response.`
                  : "Nothing is waiting on a reply right now."
              }
              tone="amber"
            />
            <RepliesMetricCard
              label="Replied"
              value={repliedCount}
              detail={
                repliedCount > 0
                  ? `${repliedCount} response${repliedCount === 1 ? "" : "s"} drafted and copied in the last ${REPLIED_WINDOW_DAYS} days.`
                  : `Recent replies from the last ${REPLIED_WINDOW_DAYS} days will stay here as your clean record.`
              }
              tone="green"
            />
            <RepliesMetricCard
              label="Lower Star"
              value={lowRatingCount}
              detail={
                lowRatingCount > 0
                  ? `${lowRatingCount} copied review${lowRatingCount === 1 ? "" : "s"} came in at 3 stars or below and deserves extra care.`
                  : "No lower-star public reviews are sitting in this queue."
              }
              tone="red"
            />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_320px]">
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
            <div className="border-b border-[var(--dash-border)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    Public Reply Queue
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[var(--dash-muted)]">
                    These are copied public reviews that still need a thoughtful owner response or a saved record of one.
                  </p>
                </div>
                <DashboardRailSwitcher
                  ariaLabel="Reply queue filters"
                  value={filter}
                  onChange={(next) => setFilter(next as ReplyFilter)}
                  options={[
                    { key: "needs_reply", label: "Needs reply", count: needsReplyCount },
                    { key: "replied", label: "Replied", count: repliedCount },
                  ]}
                />
              </div>
            </div>

            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div
                  key={item.sessionId}
                  className={`px-4 py-4 ${
                    index < filteredItems.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                        <ReplyStateBadge replied={!!item.repliedAt} />
                        <StatusPill status="copied" />
                        {item.stars ? <RatingBadge rating={item.stars} /> : null}
                      </div>
                      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                        {item.snippet || "Star-only review — no text was included."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
                        {item.serviceType ? <span>{item.serviceType}</span> : null}
                        {item.employeeName ? <span>{item.employeeName}</span> : null}
                        <span>{item.time}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <DashboardHelpHint text="View the full request timeline and customer details.">
                        <Link
                          href={`/dashboard/requests/${item.reviewLinkId}`}
                          className={dashboardButtonClassName({ size: "sm" })}
                        >
                          Open request
                        </Link>
                      </DashboardHelpHint>
                      <DashboardHelpHint
                        text={
                          item.repliedAt
                            ? "Open the drafted reply again."
                            : "Generate a suggested public reply."
                        }
                      >
                        <button
                          type="button"
                          onClick={() => generateReplyForItem(item)}
                          className={dashboardButtonClassName({ variant: "accent", size: "sm" })}
                        >
                          {item.repliedAt ? "View reply" : "Draft reply"}
                        </button>
                      </DashboardHelpHint>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M8 9h8" />
                      <path d="M8 13h5" />
                    </svg>
                  }
                  title={filter === "needs_reply" ? "No reviews waiting on a reply" : "No replied reviews yet"}
                  description={
                    filter === "needs_reply"
                      ? "When a customer copies a public review, it will show up here if you haven’t replied yet."
                      : `Replies from the last ${REPLIED_WINDOW_DAYS} days will stay here as a clean record.`
                  }
                />
              </div>
            )}
          </div>

          <div className="lg:pt-0">
            <RepliesGuideCard />
          </div>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelected(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Reply detail"
            className="w-full max-w-[520px] rounded-t-[16px] bg-white p-6 shadow-xl sm:mx-4 sm:rounded-[var(--dash-radius)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--dash-text)]">
                  {selected.repliedAt ? "Reply ready" : "Draft reply"}
                </h2>
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                  Copy the response, then paste it on Google manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)]"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mb-4 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--dash-text)]">{selected.name}</span>
                {selected.stars ? <MiniStars rating={selected.stars} /> : null}
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--dash-muted)]">
                {selected.snippet || <em>Star-only review — no text</em>}
              </p>
            </div>

            {replyLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-[var(--dash-border)]" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--dash-border)]" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-[var(--dash-border)]" />
              </div>
            ) : replyError ? (
              <div className="rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">
                {replyError}
              </div>
            ) : (
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[var(--dash-text)] focus:border-[var(--dash-primary)] focus:outline-none"
              />
            )}

            <div className="mt-4 border-t border-[var(--dash-border)] pt-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  href={`/dashboard/requests/${selected.reviewLinkId}`}
                  className={dashboardButtonClassName()}
                >
                  Open request
                </Link>
                <button
                  type="button"
                  onClick={() => generateReplyForItem(selected)}
                  disabled={replyLoading}
                  className={dashboardButtonClassName()}
                >
                  {selected.replyText ? "Regenerate" : "Generate"}
                </button>
                <button
                  type="button"
                  onClick={copyReplyAndMark}
                  disabled={replyLoading || !replyText}
                  className={`${dashboardButtonClassName({ variant: "primary" })} ${
                    replyCopied ? "bg-[#059669]" : "bg-[var(--dash-primary)] hover:brightness-95"
                  }`}
                >
                  {replyCopied ? "Copied" : "Copy reply"}
                </button>
              </div>
            </div>

            {!replyCopied && !replyLoading ? (
              <p className="mt-3 text-center text-[11px] text-[var(--dash-muted)]">
                We help draft the response. You still paste it on Google yourself.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
