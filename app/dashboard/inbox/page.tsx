"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";

type PrivateFeedbackItem = {
  sessionId: string;
  reviewLinkId: string;
  name: string;
  time: string;
  stars: number | null;
  message: string;
  employeeName: string | null;
  serviceType: string | null;
  customerContact: string | null;
  status: "new" | "handled";
  handledAt: string | null;
};

type InboxFilter = "new" | "handled";

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

function formatCustomerContact(contact: string | null) {
  if (!contact) return null;

  if (contact.includes("@")) {
    return { href: `mailto:${contact}`, label: contact, actionLabel: "Email customer" };
  }

  return { href: `tel:${contact}`, label: contact, actionLabel: "Call customer" };
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
      {rating}
      <span className="text-[10px]">★</span>
    </span>
  );
}

export default function InboxPage() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InboxFilter>("new");
  const [items, setItems] = useState<PrivateFeedbackItem[]>([]);
  const [selected, setSelected] = useState<PrivateFeedbackItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const feedbackParam = searchParams.get("feedback");

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchInbox() {
      const { data } = await supabase
        .from("review_sessions")
        .select("id, review_link_id, star_rating, optional_text, customer_contact, private_feedback_status, private_feedback_handled_at, updated_at, review_links!inner(business_id, customer_name, customer_contact, services(name), employees(name))")
        .eq("review_links.business_id", businessId)
        .eq("feedback_type", "private")
        .not("optional_text", "is", null)
        .order("updated_at", { ascending: false });

      const nextItems =
        data?.map((session) => {
          const link = session.review_links as unknown as {
            customer_name: string;
            customer_contact: string | null;
            services: { name: string } | null;
            employees: { name: string } | null;
          };

          return {
            sessionId: session.id,
            reviewLinkId: session.review_link_id,
            name: link.customer_name,
            time: timeAgo(session.updated_at),
            stars: session.star_rating,
            message: session.optional_text ?? "",
            employeeName: link.employees?.name ?? null,
            serviceType: link.services?.name ?? null,
            customerContact: session.customer_contact ?? link.customer_contact ?? null,
            status:
              (session.private_feedback_status as "new" | "handled" | null) ?? "new",
            handledAt: session.private_feedback_handled_at ?? null,
          } satisfies PrivateFeedbackItem;
        }) ?? [];

      setItems(nextItems);

      if (feedbackParam) {
        const match = nextItems.find((item) => item.sessionId === feedbackParam);
        if (match) {
          setSelected(match);
          setFilter(match.status === "handled" ? "handled" : "new");
        }
      }

      setLoading(false);
    }

    fetchInbox();
  }, [business, feedbackParam]);

  const filteredItems = useMemo(
    () => items.filter((item) => item.status === filter),
    [items, filter],
  );

  async function markHandled(sessionId: string) {
    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetchWithAuth(`/api/private-feedback/${sessionId}/handled`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        error?: string;
        private_feedback_handled_at?: string;
      };

      if (!res.ok) {
        throw new Error(body.error || "Couldn’t mark feedback as handled.");
      }

      const handledAt = body.private_feedback_handled_at ?? new Date().toISOString();

      setItems((current) =>
        current.map((item) =>
          item.sessionId === sessionId
            ? { ...item, status: "handled", handledAt }
            : item,
        ),
      );

      setSelected((current) =>
        current && current.sessionId === sessionId
          ? { ...current, status: "handled", handledAt }
          : current,
      );
      setFilter("handled");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn’t mark feedback as handled.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function closeDetail() {
    setSelected(null);
    setActionError("");

    if (feedbackParam) {
      router.replace("/dashboard/inbox", { scroll: false });
    }
  }

  const newCount = items.filter((item) => item.status === "new").length;
  const handledCount = items.filter((item) => item.status === "handled").length;

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Inbox
          </p>
          <h1 className="mt-2 text-balance font-heading text-[28px] font-semibold leading-[1.05] text-[var(--dash-text)]">
            Private feedback that needs a human follow-up
          </h1>
          <p className="mt-2 max-w-[50ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            This is where unhappy customers land. Open a note, reach out in your normal channel, then mark it handled once you’ve dealt with it.
          </p>
        </div>

        <div className="mb-5 flex gap-2 rounded-full bg-[#EFEAE2] p-1">
          {[
            { key: "new" as const, label: "New", count: newCount },
            { key: "handled" as const, label: "Handled", count: handledCount },
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
              <button
                key={item.sessionId}
                type="button"
                onClick={() => {
                  setSelected(item);
                  setActionError("");
                }}
                className={`w-full px-4 py-4 text-left transition-colors hover:bg-[#FCFAF6] ${
                  index < filteredItems.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                      <StatusPill status={item.status === "new" ? "private_feedback" : "handled"} />
                      {item.stars ? <RatingBadge rating={item.stars} /> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                      {item.message}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
                      {item.serviceType ? <span>{item.serviceType}</span> : null}
                      {item.employeeName ? <span>{item.employeeName}</span> : null}
                      {item.customerContact ? <span>{item.customerContact}</span> : null}
                      <span>{item.time}</span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#E05A3D]/10 px-3 py-1 text-[11px] font-semibold text-[#E05A3D]">
                    View feedback
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-6">
              <EmptyState
                icon={
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                    <path d="M3 8l7.2 5.4a3 3 0 0 0 3.6 0L21 8" />
                  </svg>
                }
                title={filter === "new" ? "No new private feedback" : "Nothing handled yet"}
                description={
                  filter === "new"
                    ? "When an unhappy customer sends feedback privately, it will show up here first."
                    : "Handled feedback stays here so you can keep a clean record of what you addressed."
                }
              />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={closeDetail}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeDetail();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Private feedback detail"
            className="w-full max-w-[560px] rounded-t-[16px] bg-white p-6 shadow-xl sm:mx-4 sm:rounded-[var(--dash-radius)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-[var(--dash-text)]">{selected.name}</h2>
                  <StatusPill status={selected.status === "new" ? "private_feedback" : "handled"} />
                  {selected.stars ? <RatingBadge rating={selected.stars} /> : null}
                </div>
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{selected.time}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)]"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-3 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 text-[13px] text-[var(--dash-muted)] sm:grid-cols-2">
              {selected.serviceType ? (
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    Service
                  </span>
                  <span className="mt-1 block text-[13px] font-medium text-[var(--dash-text)]">{selected.serviceType}</span>
                </div>
              ) : null}
              {selected.employeeName ? (
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    Employee
                  </span>
                  <span className="mt-1 block text-[13px] font-medium text-[var(--dash-text)]">{selected.employeeName}</span>
                </div>
              ) : null}
              {selected.customerContact ? (
                <div className="sm:col-span-2">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    Customer contact
                  </span>
                  <a
                    href={formatCustomerContact(selected.customerContact)?.href}
                    className="mt-1 inline-block text-[13px] font-medium text-[var(--dash-primary)] underline underline-offset-2"
                  >
                    {selected.customerContact}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                What they said
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--dash-text)]">
                {selected.message}
              </p>
            </div>

            {actionError ? (
              <div className="mt-4 rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">
                {actionError}
              </div>
            ) : null}

            <div className="mt-5 border-t border-[var(--dash-border)] pt-4">
              <p className="max-w-[34ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
                Follow up in your normal channel, then mark this handled so your inbox stays clean.
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Link
                  href={`/dashboard/requests/${selected.reviewLinkId}`}
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                >
                  Open request
                </Link>
                {selected.customerContact ? (
                  <a
                    href={formatCustomerContact(selected.customerContact)?.href}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                  >
                    {formatCustomerContact(selected.customerContact)?.actionLabel}
                  </a>
                ) : null}
                {selected.status !== "handled" ? (
                  <button
                    type="button"
                    onClick={() => markHandled(selected.sessionId)}
                    disabled={actionLoading}
                    className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-60"
                  >
                    {actionLoading ? "Saving..." : "Mark handled"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
