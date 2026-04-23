"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardRailSwitcher } from "@/components/dashboard/rail-switcher";
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

function InboxMetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "blue" | "green" | "amber";
}) {
  const toneClasses =
    tone === "blue"
      ? "bg-[#EFF6FF] text-[#2563EB]"
      : tone === "green"
        ? "bg-[#ECFDF5] text-[#059669]"
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

function InboxGuideCard() {
  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        What To Do Next
      </p>
      <h2 className="mt-2 text-[22px] font-semibold leading-tight text-[var(--dash-text)]">
        Work the note, then close the loop.
      </h2>
      <div className="mt-4 space-y-3">
        {[
          "Open the feedback and understand what actually went wrong.",
          "Reach out in your normal channel if they shared a phone number or email.",
          "Mark it handled only after the issue is truly addressed.",
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
          QR submissions can be anonymous. If no contact info is shown, use the feedback to coach the team and tighten follow-up rather than chasing the customer.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/support"
          className={dashboardButtonClassName({ size: "sm" })}
        >
          Open Help Center
        </Link>
        <Link
          href="/dashboard/send/qr"
          className={dashboardButtonClassName({ size: "sm" })}
        >
          Review QR flow
        </Link>
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
  const contactableCount = items.filter((item) => !!item.customerContact).length;

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Inbox
            </p>
            <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
              Hear unhappy customers first, then close the loop cleanly.
            </h1>
            <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              This is the owner-facing recovery queue. Open a note, follow up in your normal channel, and mark it handled once the issue is actually dealt with.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/support"
              className={dashboardButtonClassName({ size: "lg" })}
            >
              Help Center
            </Link>
            <Link
              href="/dashboard/send/jobs"
              className={dashboardButtonClassName({ variant: "primary", size: "lg" })}
            >
              Send request
            </Link>
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
            <InboxMetricCard
              label="New"
              value={newCount}
              detail={
                newCount > 0
                  ? `${newCount} private feedback item${newCount === 1 ? "" : "s"} still needs a human follow-up.`
                  : "Nothing new is waiting on you right now."
              }
              tone="blue"
            />
            <InboxMetricCard
              label="Handled"
              value={handledCount}
              detail={
                handledCount > 0
                  ? `${handledCount} note${handledCount === 1 ? "" : "s"} already closed out and kept on record.`
                  : "Handled items will stay here once you mark them complete."
              }
              tone="green"
            />
            <InboxMetricCard
              label="Contactable"
              value={contactableCount}
              detail={
                contactableCount > 0
                  ? `${contactableCount} item${contactableCount === 1 ? "" : "s"} includes a phone or email so you can reach out directly.`
                  : "QR submissions can be anonymous unless the customer chooses to share contact info."
              }
              tone="amber"
            />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_320px]">
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
            <div className="border-b border-[var(--dash-border)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    Private Feedback Queue
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[var(--dash-muted)]">
                    Open the note, follow up directly, then keep the record clean once it is resolved.
                  </p>
                </div>
                <DashboardRailSwitcher
                  ariaLabel="Private feedback filters"
                  value={filter}
                  onChange={(next) => setFilter(next as InboxFilter)}
                  options={[
                    { key: "new", label: "New", count: newCount },
                    { key: "handled", label: "Handled", count: handledCount },
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

          <div className="lg:pt-0">
            <InboxGuideCard />
          </div>
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
                  className={dashboardButtonClassName()}
                >
                  Open request
                </Link>
                {selected.customerContact ? (
                  <a
                    href={formatCustomerContact(selected.customerContact)?.href}
                    className={dashboardButtonClassName()}
                  >
                    {formatCustomerContact(selected.customerContact)?.actionLabel}
                  </a>
                ) : null}
                {selected.status !== "handled" ? (
                  <button
                    type="button"
                    onClick={() => markHandled(selected.sessionId)}
                    disabled={actionLoading}
                    className={dashboardButtonClassName({ variant: "primary" })}
                  >
                    {actionLoading ? "Saving..." : "Mark handled"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeDetail}
                    className={dashboardButtonClassName()}
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
