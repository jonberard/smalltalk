"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { dashboardButtonClassName } from "@/components/dashboard/button";
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
    return {
      href: `mailto:${contact}`,
      label: contact,
      actionLabel: "Email customer",
      quickLabel: "Email now",
    };
  }

  return {
    href: `tel:${contact}`,
    label: contact,
    actionLabel: "Call customer",
    quickLabel: "Call now",
  };
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

function InboxSummaryBand({
  newCount,
  handledCount,
  contactableCount,
}: {
  newCount: number;
  handledCount: number;
  contactableCount: number;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="grid gap-0 min-[980px]:grid-cols-[1.45fr_0.72fr_0.83fr]">
        <div className="px-5 py-5 min-[980px]:border-r min-[980px]:border-[var(--dash-border)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            This inbox
          </p>
          <p className="mt-2 max-w-[28ch] text-balance font-heading text-[26px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--dash-text)]">
            {newCount} note{newCount === 1 ? "" : "s"} waiting on you. Everything else is on the record.
          </p>
        </div>
        <div className="border-t border-[var(--dash-border)] px-5 py-5 min-[980px]:border-l-0 min-[980px]:border-r min-[980px]:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[40px] font-heading leading-none tracking-[-0.04em] text-[#E05A3D]">
                {newCount}
              </p>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-muted)]">
                New
              </p>
            </div>
            <span className="rounded-full bg-[#FFF4ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#BC4A2F]">
              Needs care
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
            Need a human follow-up before anything else.
          </p>
        </div>
        <div className="border-t border-[var(--dash-border)] px-5 py-5 min-[980px]:border-t-0">
          <div className="grid gap-4 sm:grid-cols-2 min-[980px]:grid-cols-1">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[34px] font-heading leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                  {contactableCount}
                </p>
                <span className="rounded-full bg-[#EEF5F0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4A6658]">
                  Contactable
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                Include phone or email so you can reach out directly.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[34px] font-heading leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                  {handledCount}
                </p>
                <span className="rounded-full bg-[#F4F1EB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-muted)]">
                  Handled
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                Already dealt with and kept on the record.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxFilterTabs({
  filter,
  onChange,
  newCount,
  handledCount,
}: {
  filter: InboxFilter;
  onChange: (next: InboxFilter) => void;
  newCount: number;
  handledCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { key: "new" as const, label: "New", count: newCount },
        { key: "handled" as const, label: "Handled", count: handledCount },
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

function FeedbackCard({
  item,
  selected,
  onSelect,
}: {
  item: PrivateFeedbackItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const contact = formatCustomerContact(item.customerContact);
  const accent =
    item.status === "new"
      ? "border-l-[3px] border-l-[#E05A3D]"
      : "border-l-[3px] border-l-[#E1DBD1]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[18px] border bg-white p-4 text-left shadow-[var(--dash-shadow)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[1px] ${
        selected
          ? "border-[#E7B3A2] shadow-[0_10px_24px_rgba(26,29,32,0.08)]"
          : "border-[var(--dash-border)]"
      } ${accent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7E4DB] text-[12px] font-semibold text-[#BC4A2F]">
              {item.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                <RatingStars rating={item.stars} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--dash-muted)]">
                {item.serviceType ? <span>{item.serviceType}</span> : null}
                {item.employeeName ? <span>{item.employeeName}</span> : null}
                <span>{item.time}</span>
              </div>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-text)]">
            “{item.message}”
          </p>
        </div>
        <div className="shrink-0 text-right">
          {contact ? (
            <p className="text-[12px] font-medium text-[#BC4A2F]">{contact.label}</p>
          ) : (
            <p className="text-[12px] text-[var(--dash-muted)]">Anonymous</p>
          )}
        </div>
      </div>
    </button>
  );
}

function RecoveryCoach({ item }: { item: PrivateFeedbackItem }) {
  const contact = formatCustomerContact(item.customerContact);
  const steps = [
    contact
      ? `Reach out in your normal channel — ${contact.label.includes("@") ? "email" : "text or call"} the customer directly.`
      : "No customer contact was shared, so use this note to coach the team and tighten the next visit.",
    item.employeeName
      ? `Loop in ${item.employeeName} so they understand what the customer experienced.`
      : "Capture what needs to change internally before the next request goes out.",
    item.serviceType
      ? `Once the ${item.serviceType.toLowerCase()} issue is actually dealt with, mark this note handled to keep the queue clean.`
      : "Once the issue is actually dealt with, mark this note handled to keep the queue clean.",
  ];

  return (
    <div className="rounded-[18px] border border-dashed border-[#E6D8C9] bg-[#FCFAF6] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
        Recovery
      </p>
      <div className="mt-3 space-y-2.5">
        {steps.map((step) => (
          <div key={step} className="flex gap-2.5">
            <span className="mt-[5px] inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#E05A3D]" />
            <p className="text-[13px] leading-relaxed text-[var(--dash-text)]">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackDetail({
  item,
  totalInFilter,
  indexInFilter,
  actionLoading,
  actionError,
  onMarkHandled,
}: {
  item: PrivateFeedbackItem | null;
  totalInFilter: number;
  indexInFilter: number;
  actionLoading: boolean;
  actionError: string;
  onMarkHandled: (sessionId: string) => void;
}) {
  if (!item) {
    return (
      <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
        <EmptyState
          icon={
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
              <path d="M3 8l7.2 5.4a3 3 0 0 0 3.6 0L21 8" />
            </svg>
          }
          title="Nothing selected"
          description="Choose a note on the left to see what they said and what to do next."
        />
      </div>
    );
  }

  const contact = formatCustomerContact(item.customerContact);

  return (
    <div className="rounded-[20px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="border-b border-[var(--dash-border)] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Selected note
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={item.status === "new" ? "private_feedback" : "handled"} />
              {item.stars ? <RatingStars rating={item.stars} /> : null}
              <span className="text-[12px] text-[var(--dash-muted)]">
                {totalInFilter > 0 ? `${indexInFilter + 1} of ${totalInFilter}` : item.time}
              </span>
            </div>
          </div>
          <span className="text-[12px] text-[var(--dash-muted)]">{item.time}</span>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
            {item.status === "new" ? "New" : "Handled"}
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
            {item.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
            {item.serviceType ? <span>{item.serviceType}</span> : null}
            {item.employeeName ? <span>{item.employeeName}</span> : null}
            {contact ? <span>{contact.label}</span> : <span>Anonymous feedback</span>}
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
            What they said
          </p>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--dash-text)]">
            “{item.message}”
          </p>
        </div>

        <div className="rounded-[18px] border border-[var(--dash-border)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
            Reach out
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/requests/${item.reviewLinkId}`}
              className={dashboardButtonClassName({ size: "sm" })}
            >
              Open request
            </Link>
            {contact ? (
              <a
                href={contact.href}
                className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
              >
                {contact.quickLabel}
              </a>
            ) : null}
          </div>
        </div>

        <RecoveryCoach item={item} />

        {actionError ? (
          <div className="rounded-[16px] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">
            {actionError}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dash-border)] pt-4">
          <p className="max-w-[32ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
            Follow up in your normal channel, then keep the record clean once the issue is actually dealt with.
          </p>
          {item.status !== "handled" ? (
            <button
              type="button"
              onClick={() => onMarkHandled(item.sessionId)}
              disabled={actionLoading}
              className={dashboardButtonClassName({ variant: "primary" })}
            >
              {actionLoading ? "Saving..." : "Mark handled"}
            </button>
          ) : (
            <span className="rounded-full bg-[#F4F1EB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-muted)]">
              On the record
            </span>
          )}
        </div>
      </div>
    </div>
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
  const feedbackParam = searchParams.get("feedback");

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchInbox() {
      const { data } = await supabase
        .from("review_sessions")
        .select(
          "id, review_link_id, star_rating, optional_text, customer_contact, private_feedback_status, private_feedback_handled_at, updated_at, review_links!inner(business_id, customer_name, customer_contact, services(name), employees(name))",
        )
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
            status: (session.private_feedback_status as "new" | "handled" | null) ?? "new",
            handledAt: session.private_feedback_handled_at ?? null,
          } satisfies PrivateFeedbackItem;
        }) ?? [];

      setItems(nextItems);

      if (feedbackParam) {
        const match = nextItems.find((item) => item.sessionId === feedbackParam);
        if (match) {
          setSelected(match);
          setFilter(match.status === "handled" ? "handled" : "new");
        } else {
          setSelected(nextItems[0] ?? null);
        }
      } else {
        setSelected(nextItems.find((item) => item.status === "new") ?? nextItems[0] ?? null);
      }

      setLoading(false);
    }

    void fetchInbox();
  }, [business, feedbackParam]);

  const newItems = useMemo(() => items.filter((item) => item.status === "new"), [items]);
  const handledItems = useMemo(() => items.filter((item) => item.status === "handled"), [items]);
  const primaryItems = filter === "new" ? newItems : handledItems;
  const secondaryItems = filter === "new" ? handledItems : newItems;

  useEffect(() => {
    if (loading) return;
    if (!selected) {
      setSelected(primaryItems[0] ?? secondaryItems[0] ?? null);
      return;
    }

    const selectedStillExists = items.some((item) => item.sessionId === selected.sessionId);
    if (!selectedStillExists) {
      setSelected(primaryItems[0] ?? secondaryItems[0] ?? null);
      return;
    }

    if (selected.status !== filter && primaryItems.length > 0) {
      setSelected(primaryItems[0]);
    }
  }, [filter, items, loading, primaryItems, secondaryItems, selected]);

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
          item.sessionId === sessionId ? { ...item, status: "handled", handledAt } : item,
        ),
      );

      setSelected((current) =>
        current && current.sessionId === sessionId
          ? { ...current, status: "handled", handledAt }
          : current,
      );
      setFilter("handled");
    } catch (error) {
      console.error("[inbox] Could not mark private feedback as handled:", error);
      setActionError("Couldn’t mark that feedback as handled. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  const selectedIndex = primaryItems.findIndex((item) => item.sessionId === selected?.sessionId);

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[1280px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Inbox
            </p>
            <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
              Private feedback
            </h1>
            <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              Notes that came in privately. Open one, follow up in your normal channel, and mark it handled when the issue is actually dealt with.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard/support" className={dashboardButtonClassName({ size: "lg" })}>
              Help center
            </Link>
            <Link
              href="/dashboard/send"
              className={dashboardButtonClassName({ variant: "primary", size: "lg" })}
            >
              + Send request
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-5">
            <SkeletonRow />
            <div className="grid gap-5 min-[1180px]:grid-cols-[1.02fr_0.98fr]">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <InboxSummaryBand
              newCount={newItems.length}
              handledCount={handledItems.length}
              contactableCount={items.filter((item) => !!item.customerContact).length}
            />

            <div className="grid gap-5 min-[1180px]:grid-cols-[0.96fr_1.04fr]">
              <div className="space-y-5">
                <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-4 shadow-[var(--dash-shadow)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <InboxFilterTabs
                      filter={filter}
                      onChange={(next) => {
                        setFilter(next);
                        setActionError("");
                      }}
                      newCount={newItems.length}
                      handledCount={handledItems.length}
                    />
                    <div className="flex items-center gap-3 text-[12px] text-[var(--dash-muted)]">
                      <span>Last 30 days</span>
                      <span>
                        {selectedIndex >= 0 && primaryItems.length > 0
                          ? `${selectedIndex + 1} of ${primaryItems.length}`
                          : `${primaryItems.length} total`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {primaryItems.length > 0 ? (
                      primaryItems.map((item) => (
                        <FeedbackCard
                          key={item.sessionId}
                          item={item}
                          selected={selected?.sessionId === item.sessionId}
                          onSelect={() => {
                            setSelected(item);
                            setActionError("");
                          }}
                        />
                      ))
                    ) : (
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
                            ? "When a customer sends feedback privately, it will show up here first."
                            : "Handled feedback stays here as a clean record once you close the loop."
                        }
                      />
                    )}
                  </div>
                </div>

                {secondaryItems.length > 0 ? (
                  <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-4 shadow-[var(--dash-shadow)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                      {filter === "new" ? "Handled · last 30 days" : "New · waiting on you"}
                    </p>
                    <div className="mt-4 space-y-3">
                      {secondaryItems.slice(0, 3).map((item) => (
                        <button
                          key={item.sessionId}
                          type="button"
                          onClick={() => {
                            setFilter(item.status);
                            setSelected(item);
                            setActionError("");
                          }}
                          className="flex w-full items-start justify-between gap-3 rounded-[16px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3 text-left transition-colors hover:bg-[#F9F3EB]"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                              <RatingStars rating={item.stars} />
                            </div>
                            <p className="mt-1 line-clamp-1 text-[12px] text-[var(--dash-muted)]">
                              {item.message}
                            </p>
                          </div>
                          <span className="text-[11px] text-[var(--dash-muted)]">{item.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <FeedbackDetail
                item={selected}
                totalInFilter={primaryItems.length}
                indexInFilter={selectedIndex}
                actionLoading={actionLoading}
                actionError={actionError}
                onMarkHandled={markHandled}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
