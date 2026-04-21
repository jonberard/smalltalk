"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { capture } from "@/lib/posthog";
import { EmptyState } from "@/components/dashboard/empty-state";
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
      const { data } = await supabase
        .from("review_sessions")
        .select("id, review_link_id, star_rating, generated_review, replied_at, reply_text, topics_selected, updated_at, review_links!inner(business_id, customer_name, services(name), employees(name))")
        .eq("review_links.business_id", businessId)
        .eq("status", "copied")
        .neq("feedback_type", "private")
        .order("updated_at", { ascending: false });

      const nextItems =
        data?.map((session) => {
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
        }) ?? [];

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

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Replies
          </p>
          <h1 className="mt-2 text-balance font-heading text-[28px] font-semibold leading-[1.05] text-[var(--dash-text)]">
            Stay on top of every public review
          </h1>
          <p className="mt-2 max-w-[50ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            Keep this simple: draft, copy, paste on Google, then mark it done. We should never imply we posted the reply for them.
          </p>
        </div>

        <div className="mb-5 flex gap-2 rounded-full bg-[#EFEAE2] p-1">
          {[
            { key: "needs_reply" as const, label: "Needs reply", count: needsReplyCount },
            { key: "replied" as const, label: "Replied", count: repliedCount },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                filter === option.key
                  ? "bg-white text-[var(--dash-text)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                  : "text-[var(--dash-muted)]"
              }`}
            >
              {option.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  filter === option.key
                    ? "bg-[#F4EFE8] text-[var(--dash-text)]"
                    : "bg-white/70 text-[var(--dash-muted)]"
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
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
                      <StatusPill status={item.repliedAt ? "handled" : "copied"} />
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
                    <Link
                      href={`/dashboard/requests/${item.reviewLinkId}`}
                      className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-3 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                    >
                      Open request
                    </Link>
                    <button
                      type="button"
                      onClick={() => generateReplyForItem(item)}
                      className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-primary)] px-3 py-2 text-[12px] font-semibold text-[var(--dash-primary)] transition-colors hover:bg-[var(--dash-primary)]/5"
                    >
                      {item.repliedAt ? "View reply" : "Draft reply"}
                    </button>
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
                    : "Once you draft and copy a reply, it will stay here as a clean record."
                }
              />
            </div>
          )}
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

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => generateReplyForItem(selected)}
                disabled={replyLoading}
                className="text-[12px] font-medium text-[var(--dash-muted)] underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                {selected.replyText ? "Regenerate" : "Generate"}
              </button>
              <button
                type="button"
                onClick={copyReplyAndMark}
                disabled={replyLoading || !replyText}
                className={`rounded-[var(--dash-radius-sm)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-50 ${
                  replyCopied ? "bg-[#059669]" : "bg-[var(--dash-primary)] hover:brightness-95"
                }`}
              >
                {replyCopied ? "Copied" : "Copy reply"}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href={`/dashboard/requests/${selected.reviewLinkId}`}
                className="text-[12px] font-semibold text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
              >
                Open request detail
              </Link>
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
