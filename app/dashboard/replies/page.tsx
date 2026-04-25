"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { capture } from "@/lib/posthog";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";
import { REPLY_VOICES } from "@/lib/reply-generator";

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
  sortAt: string;
};

type ReplyFilter = "needs_reply" | "replied";

const REPLIED_WINDOW_DAYS = 30;

const REPLY_STUDIO_TONES = [
  { id: "warm_owner", label: "Warmer" },
  { id: "brief_owner", label: "Shorter" },
  { id: "empathetic_owner", label: "More accountable" },
  { id: "casual_owner", label: "Less formal" },
] as const;

function resolveReplyVoiceId(value: string | null | undefined) {
  if (!value || value === "warm") return "warm_owner";
  if (value === "professional") return "professional_owner";
  if (value === "casual") return "casual_owner";
  if (value === "empathetic") return "empathetic_owner";
  if (value === "brief") return "brief_owner";
  return value;
}

function getReplyVoiceLabel(voiceId: string) {
  return REPLY_VOICES.find((voice) => voice.id === voiceId)?.name ?? "Warm Owner";
}

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

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;

  return (
    <div className="flex gap-0.5 text-[#E05A3D]">
      {[1, 2, 3, 4, 5].map((index) => (
        <span key={index} className={index <= Math.round(rating) ? "opacity-100" : "opacity-20"}>
          ★
        </span>
      ))}
    </div>
  );
}

function RepliesSummaryBand({
  needsReplyCount,
  repliedCount,
  lowRatingCount,
}: {
  needsReplyCount: number;
  repliedCount: number;
  lowRatingCount: number;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="grid gap-0 min-[980px]:grid-cols-[1.45fr_0.72fr_0.83fr]">
        <div className="px-5 py-5 min-[980px]:border-r min-[980px]:border-[var(--dash-border)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            This queue
          </p>
          <p className="mt-2 max-w-[30ch] text-balance font-heading text-[26px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--dash-text)]">
            {needsReplyCount} repl{needsReplyCount === 1 ? "y" : "ies"} waiting. {lowRatingCount} came in low — those need a calmer voice.
          </p>
        </div>
        <div className="border-t border-[var(--dash-border)] px-5 py-5 min-[980px]:border-l-0 min-[980px]:border-r min-[980px]:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[40px] font-heading leading-none tracking-[-0.04em] text-[#E05A3D]">
                {needsReplyCount}
              </p>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-muted)]">
                Needs reply
              </p>
            </div>
            <span className="rounded-full bg-[#FFF4ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#BC4A2F]">
              Owner response
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
            Public reviews still waiting on an owner response.
          </p>
        </div>
        <div className="border-t border-[var(--dash-border)] px-5 py-5 min-[980px]:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[40px] font-heading leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                {repliedCount}
              </p>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-muted)]">
                Replied
              </p>
            </div>
            <span className="rounded-full bg-[#EEF5F0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4A6658]">
              Copied
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
            Drafted and copied in the last {REPLIED_WINDOW_DAYS} days.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReplyFilterTabs({
  filter,
  onChange,
  needsReplyCount,
  repliedCount,
}: {
  filter: ReplyFilter;
  onChange: (next: ReplyFilter) => void;
  needsReplyCount: number;
  repliedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { key: "needs_reply" as const, label: "Needs reply", count: needsReplyCount },
        { key: "replied" as const, label: "Replied", count: repliedCount },
      ].map((tab) => {
        const active = filter === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-[12px] border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              active
                ? "border-[#E7B3A2] bg-[#FFF4ED] text-[#BC4A2F]"
                : "border-[var(--dash-border)] bg-white text-[var(--dash-muted)] hover:bg-[#FCFAF6] hover:text-[var(--dash-text)]"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                active
                  ? "bg-[#F7D7CA] text-[#BC4A2F]"
                  : "bg-[#F4F1EB] text-[var(--dash-muted)]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReplyQueueCard({
  item,
  selected,
  onSelect,
}: {
  item: ReplyItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const lowerStar = (item.stars ?? 5) <= 3;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[18px] border bg-white p-4 text-left shadow-[var(--dash-shadow)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[1px] ${
        selected
          ? "border-[#E7B3A2] shadow-[0_10px_24px_rgba(26,29,32,0.08)]"
          : "border-[var(--dash-border)]"
      } ${lowerStar ? "border-l-[3px] border-l-[#E05A3D]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
            <RatingStars rating={item.stars} />
            {lowerStar ? (
              <span className="rounded-full bg-[#FFF1E8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#BC4A2F]">
                Lower star
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-text)]">
            {item.snippet || "Star-only review — no text was included."}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
            {item.serviceType ? <span>{item.serviceType}</span> : null}
            {item.employeeName ? <span>{item.employeeName}</span> : null}
            <span>{item.time}</span>
          </div>
        </div>
        <span className="shrink-0 text-[12px] font-medium text-[#BC4A2F]">
          {item.repliedAt ? "Open →" : "Draft reply →"}
        </span>
      </div>
    </button>
  );
}

function ReplyStudio({
  item,
  selectedVoiceId,
  onSelectVoice,
  replyText,
  onReplyTextChange,
  onGenerate,
  onCopy,
  replyLoading,
  replyCopied,
  replyError,
}: {
  item: ReplyItem | null;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  replyText: string;
  onReplyTextChange: (next: string) => void;
  onGenerate: () => void;
  onCopy: () => void;
  replyLoading: boolean;
  replyCopied: boolean;
  replyError: string;
}) {
  if (!item) {
    return (
      <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
        <EmptyState
          icon={
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 9h8" />
              <path d="M8 13h5" />
            </svg>
          }
          title="Nothing selected"
          description="Choose a review on the left to draft or refine a reply."
        />
      </div>
    );
  }

  const wordCount = replyText.trim() ? replyText.trim().split(/\s+/).length : 0;
  const charCount = replyText.length;

  return (
    <div className="rounded-[20px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="border-b border-[var(--dash-border)] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Drafting
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={item.repliedAt ? "copied" : "drafted"} />
              {item.stars ? <RatingStars rating={item.stars} /> : null}
              <span className="text-[12px] text-[var(--dash-muted)]">
                Reply voice · {getReplyVoiceLabel(selectedVoiceId)}
              </span>
            </div>
          </div>
          <Link href={`/dashboard/requests/${item.reviewLinkId}`} className={dashboardButtonClassName({ size: "sm" })}>
            Open request
          </Link>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="rounded-[18px] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                <RatingStars rating={item.stars} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
                {item.serviceType ? <span>{item.serviceType}</span> : null}
                {item.employeeName ? <span>{item.employeeName}</span> : null}
                <span>{item.time}</span>
              </div>
            </div>
            <span className="text-[12px] text-[var(--dash-muted)]">{item.repliedAt ? "Copied" : "Awaiting reply"}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--dash-text)]">
            {item.snippet || "Star-only review — no text was included."}
          </p>
        </div>

        <div className="rounded-[18px] border border-[var(--dash-border)] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
              Your reply
            </p>
            <p className="text-[12px] text-[var(--dash-muted)]">
              {charCount} chars · ~{wordCount} words
            </p>
          </div>

          {replyLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[var(--dash-border)]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--dash-border)]" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-[var(--dash-border)]" />
            </div>
          ) : replyError ? (
            <div className="mt-4 rounded-[16px] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">
              {replyError}
            </div>
          ) : (
            <textarea
              value={replyText}
              onChange={(event) => onReplyTextChange(event.target.value)}
              rows={7}
              className="mt-4 w-full resize-none rounded-[16px] border border-[var(--dash-border)] bg-white px-4 py-3 text-[14px] leading-relaxed text-[var(--dash-text)] focus:border-[var(--dash-primary)] focus:outline-none"
            />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="mr-1 text-[12px] font-medium text-[var(--dash-muted)]">Adjust tone</p>
            {REPLY_STUDIO_TONES.map((tone) => {
              const active = selectedVoiceId === tone.id;
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => onSelectVoice(tone.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active
                      ? "bg-[#E05A3D] text-white"
                      : "bg-[#F4F1EB] text-[var(--dash-text)] hover:bg-[#EFE7DB]"
                  }`}
                >
                  {tone.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dash-border)] pt-4">
            <p className="max-w-[28ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
              We help draft the response. You still paste it on Google yourself.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={replyLoading}
                className={dashboardButtonClassName({ size: "sm" })}
              >
                {replyText ? "Regenerate" : "Draft reply"}
              </button>
              <button
                type="button"
                onClick={onCopy}
                disabled={replyLoading || !replyText}
                className={`${dashboardButtonClassName({ variant: "primary", size: "sm" })} ${
                  replyCopied ? "bg-[#3B5B4C] border-[#365347]" : ""
                }`}
              >
                {replyCopied ? "Copied" : "Copy reply"}
              </button>
            </div>
          </div>
        </div>
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
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    resolveReplyVoiceId((business as Record<string, unknown> | null)?.reply_voice_id as string | undefined),
  );

  useEffect(() => {
    if (!business) return;
    setSelectedVoiceId(
      resolveReplyVoiceId((business as Record<string, unknown>).reply_voice_id as string | undefined),
    );
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
          sortAt: session.replied_at ?? session.updated_at,
        } satisfies ReplyItem;
      });

      setItems(nextItems);
      setSelected(nextItems.find((item) => !item.repliedAt) ?? nextItems[0] ?? null);
      setLoading(false);
    }

    void fetchReplies();
  }, [business]);

  const needsReplyItems = useMemo(
    () =>
      items
        .filter((item) => !item.repliedAt)
        .sort((left, right) => {
          const leftStars = left.stars ?? 5;
          const rightStars = right.stars ?? 5;
          if (leftStars !== rightStars) return leftStars - rightStars;
          return new Date(right.sortAt).getTime() - new Date(left.sortAt).getTime();
        }),
    [items],
  );

  const repliedItems = useMemo(
    () =>
      items
        .filter((item) => !!item.repliedAt)
        .sort(
          (left, right) =>
            new Date(right.sortAt).getTime() - new Date(left.sortAt).getTime(),
        ),
    [items],
  );

  const filteredItems = filter === "needs_reply" ? needsReplyItems : repliedItems;

  useEffect(() => {
    if (loading) return;
    if (!selected) {
      setSelected(filteredItems[0] ?? null);
      return;
    }

    const selectedStillExists = items.some((item) => item.sessionId === selected.sessionId);
    if (!selectedStillExists) {
      setSelected(filteredItems[0] ?? null);
      return;
    }

    if (filter === "needs_reply" && selected.repliedAt && filteredItems[0]) {
      setSelected(filteredItems[0]);
      return;
    }

    if (filter === "replied" && !selected.repliedAt && filteredItems[0]) {
      setSelected(filteredItems[0]);
    }
  }, [filter, filteredItems, items, loading, selected]);

  useEffect(() => {
    setReplyText(selected?.replyText ?? "");
    setReplyCopied(false);
    setReplyError("");
  }, [selected]);

  async function generateReplyForItem(item: ReplyItem, voiceId = selectedVoiceId) {
    setSelected(item);
    setReplyLoading(true);
    setReplyError("");
    setReplyCopied(false);

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
          replyVoiceId: voiceId,
          customReplyVoice: (business as Record<string, unknown>)?.custom_reply_voice ?? undefined,
          reviewSource: "smalltalk",
        }),
      });
      const data = await res.json();

      if (data.reply_text) {
        setReplyText(data.reply_text);
        setSelectedVoiceId(voiceId);
        capture("reply_generated", { session_id: item.sessionId, star_rating: item.stars, voice_id: voiceId });
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
        item.sessionId === selected.sessionId ? { ...item, replyText, repliedAt } : item,
      ),
    );

    setSelected((current) => (current ? { ...current, replyText, repliedAt } : current));
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 3000);
    setFilter("replied");
  }

  const lowRatingCount = items.filter((item) => (item.stars ?? 5) <= 3).length;

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[1280px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Replies
            </p>
            <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
              Reply studio
            </h1>
            <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              Draft a public response that sounds like you, then paste it on Google. Lower-star reviews are a chance to show accountability — not defensiveness.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/more/review-flow/voice"
              className={dashboardButtonClassName({ size: "lg" })}
            >
              Reply voice
            </Link>
            <Link
              href="/dashboard/support"
              className={dashboardButtonClassName({ variant: "primary", size: "lg" })}
            >
              Help center
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-5">
            <SkeletonRow />
            <div className="grid gap-5 min-[1180px]:grid-cols-[0.92fr_1.08fr]">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <RepliesSummaryBand
              needsReplyCount={needsReplyItems.length}
              repliedCount={repliedItems.length}
              lowRatingCount={lowRatingCount}
            />

            <div className="grid gap-5 min-[1180px]:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-4 shadow-[var(--dash-shadow)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <ReplyFilterTabs
                    filter={filter}
                    onChange={(next) => setFilter(next)}
                    needsReplyCount={needsReplyItems.length}
                    repliedCount={repliedItems.length}
                  />
                  <div className="flex items-center gap-3 text-[12px] text-[var(--dash-muted)]">
                    <span>{filter === "needs_reply" ? "By star · lowest first" : "Recently replied"}</span>
                    <span>Reply voice · {getReplyVoiceLabel(selectedVoiceId)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <ReplyQueueCard
                        key={item.sessionId}
                        item={item}
                        selected={selected?.sessionId === item.sessionId}
                        onSelect={() => {
                          setSelected(item);
                          setReplyError("");
                        }}
                      />
                    ))
                  ) : (
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
                          : `Replies from the last ${REPLIED_WINDOW_DAYS} days stay here as a clean record.`
                      }
                    />
                  )}
                </div>
              </div>

              <ReplyStudio
                item={selected}
                selectedVoiceId={selectedVoiceId}
                onSelectVoice={(voiceId) => {
                  setSelectedVoiceId(voiceId);
                }}
                replyText={replyText}
                onReplyTextChange={setReplyText}
                onGenerate={() => {
                  if (selected) void generateReplyForItem(selected, selectedVoiceId);
                }}
                onCopy={() => void copyReplyAndMark()}
                replyLoading={replyLoading}
                replyCopied={replyCopied}
                replyError={replyError}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
