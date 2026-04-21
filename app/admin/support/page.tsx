"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/supabase";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useToast } from "@/components/dashboard/toast";
import { FounderFollowUpPill } from "@/components/admin/founder-follow-up-pill";
import { useAdminAccess } from "@/components/admin/admin-access";
import type {
  AdminBusinessFollowUpStatus,
  SupportMessageCategory,
  SupportMessageStatus,
} from "@/lib/types";

type AttentionReason = {
  key: string;
  label: string;
  tone: "critical" | "warning" | "info";
};

type BusinessSummary = {
  id: string;
  name: string;
  ownerEmail: string | null;
  subscriptionStatus: string;
  lastActivityLabel: string;
  founderFollowUpStatus: AdminBusinessFollowUpStatus;
  founderNotePreview: string | null;
  founderNoteUpdatedLabel: string | null;
  reminderDueLabel: string | null;
  reminderUrgency: "none" | "upcoming" | "today" | "tomorrow" | "overdue";
  attentionReasons: AttentionReason[];
};

type SupportMessageSummary = {
  id: string;
  businessId: string;
  businessName: string;
  ownerEmail: string | null;
  category: SupportMessageCategory;
  categoryLabel: string;
  message: string;
  status: SupportMessageStatus;
  createdAt: string;
  createdLabel: string;
  updatedLabel: string;
  founderEmailSent: boolean;
  founderEmailError: string | null;
  founderFollowUpStatus: AdminBusinessFollowUpStatus;
};

type MessageFilter = "all" | "new" | "reviewed" | "closed";

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

function MailIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function toneClasses(tone: AttentionReason["tone"]) {
  switch (tone) {
    case "critical":
      return "border-[#F3C4BE] bg-[#FFF4F1] text-[#A6452F]";
    case "warning":
      return "border-[#F6D9A8] bg-[#FFF8EA] text-[#9A6404]";
    default:
      return "border-[#D8E2F2] bg-[#F6F9FF] text-[#4161A6]";
  }
}

function supportMessageStatusClasses(status: SupportMessageStatus) {
  switch (status) {
    case "new":
      return "border-[#F3C4BE] bg-[#FFF4F1] text-[#A6452F]";
    case "reviewed":
      return "border-[#D8E2F2] bg-[#F6F9FF] text-[#4161A6]";
    case "closed":
      return "border-[#D9E8DC] bg-[#F4FBF6] text-[#2F7A47]";
    default:
      return "border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-muted)]";
  }
}

function supportMessageStatusLabel(status: SupportMessageStatus) {
  switch (status) {
    case "new":
      return "New";
    case "reviewed":
      return "Reviewed";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

export default function FounderSupportPage() {
  const { toast } = useToast();
  const { refreshAdmin } = useAdminAccess();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [messages, setMessages] = useState<SupportMessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      const [businessesRes, messagesRes] = await Promise.all([
        fetchWithAuth("/api/admin/businesses"),
        fetchWithAuth("/api/admin/support-messages"),
      ]);

      const businessBody = (await businessesRes.json().catch(() => ({}))) as {
        businesses?: BusinessSummary[];
        error?: string;
      };
      const messageBody = (await messagesRes.json().catch(() => ({}))) as {
        messages?: SupportMessageSummary[];
        error?: string;
      };

      if (!businessesRes.ok) {
        throw new Error(businessBody.error || "Could not load support queue.");
      }

      if (!messagesRes.ok) {
        throw new Error(messageBody.error || "Could not load owner messages.");
      }

      setBusinesses(businessBody.businesses ?? []);
      setMessages(messageBody.messages ?? []);
      setError(null);
      void refreshAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load support view.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const queue = useMemo(
    () => businesses.filter((business) => business.attentionReasons.length > 0),
    [businesses],
  );
  const reminders = useMemo(
    () =>
      businesses
        .filter(
          (business) => business.reminderUrgency !== "none" && business.reminderDueLabel,
        )
        .sort((a, b) => {
          const aDue =
            a.reminderUrgency === "overdue"
              ? 0
              : a.reminderUrgency === "today"
                ? 1
                : a.reminderUrgency === "tomorrow"
                  ? 2
                  : 3;
          const bDue =
            b.reminderUrgency === "overdue"
              ? 0
              : b.reminderUrgency === "today"
                ? 1
                : b.reminderUrgency === "tomorrow"
                  ? 2
                  : 3;
          if (aDue !== bDue) return aDue - bDue;
          return a.name.localeCompare(b.name);
        }),
    [businesses],
  );

  const filteredMessages = useMemo(() => {
    if (filter === "all") {
      return messages;
    }

    return messages.filter((message) => message.status === filter);
  }, [filter, messages]);

  const newMessageCount = useMemo(
    () => messages.filter((message) => message.status === "new").length,
    [messages],
  );

  async function updateMessageStatus(
    messageId: string,
    status: SupportMessageStatus,
  ) {
    try {
      setUpdatingMessageId(messageId);
      const res = await fetchWithAuth(`/api/admin/support-messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(body.error || "Could not update support message.");
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status,
                updatedLabel: "just now",
              }
            : message,
        ),
      );
      await refreshAdmin();
      toast(
        status === "closed"
          ? "Support message closed."
          : status === "reviewed"
            ? "Support message marked reviewed."
            : "Support message reopened.",
        "success",
      );
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not update support message.",
        "error",
      );
    } finally {
      setUpdatingMessageId(null);
    }
  }

  return (
    <>
      <div className="max-w-[58ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          Support / Risk
        </p>
        <h1 className="mt-2 text-balance font-heading text-[34px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)] sm:text-[42px]">
          One queue for owner messages, founder follow-ups, and quiet risk.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
          Owner messages now land here first and still send an email backup, so you can work from the admin panel without wondering whether anything got lost.
        </p>
      </div>

      <div className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[48ch]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Owner messages
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
              New support messages should never hide in your inbox.
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
              This is the founder-facing inbox for questions, bug reports, suggestions, and billing confusion sent from the owner support page.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { value: "all", label: "All", count: messages.length },
              { value: "new", label: "New", count: newMessageCount },
              {
                value: "reviewed",
                label: "Reviewed",
                count: messages.filter((message) => message.status === "reviewed").length,
              },
              {
                value: "closed",
                label: "Closed",
                count: messages.filter((message) => message.status === "closed").length,
              },
            ] as Array<{ value: MessageFilter; label: string; count: number }>).map((tab) => {
              const active = tab.value === filter;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                    active
                      ? "bg-[var(--dash-primary)] text-white"
                      : "border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"
                  }`}
                >
                  {tab.label}{" "}
                  <span className={active ? "text-white/80" : "text-[var(--dash-muted)]"}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[var(--dash-radius-sm)] border border-[#F3C4BE] bg-[#FFF4F1] p-4">
            <p className="text-[14px] font-semibold text-[#A6452F]">Couldn’t load the support inbox</p>
            <p className="mt-1 text-[13px] text-[var(--dash-muted)]">{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={<MailIcon />}
              title={
                filter === "all"
                  ? "No owner messages yet"
                  : `No ${filter} owner messages`
              }
              description="Messages sent from the owner support page will show up here, with email as a backup channel."
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-[var(--dash-radius-sm)] border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
                  message.status === "new"
                    ? "border-[#F3C4BE] bg-[#FFF9F7]"
                    : "border-[var(--dash-border)] bg-[#FCFAF6]"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/admin/businesses/${message.businessId}`}
                        className="text-[16px] font-semibold text-[var(--dash-text)] underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--dash-primary)] hover:decoration-[var(--dash-primary)]"
                      >
                        {message.businessName}
                      </Link>
                      <span className="rounded-full border border-[var(--dash-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--dash-muted)]">
                        {message.categoryLabel}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${supportMessageStatusClasses(
                          message.status,
                        )}`}
                      >
                        {supportMessageStatusLabel(message.status)}
                      </span>
                      <FounderFollowUpPill status={message.founderFollowUpStatus} />
                    </div>

                    <p className="mt-2 text-[12px] text-[var(--dash-muted)]">
                      {message.ownerEmail ?? "No owner email on file"} · Sent {message.createdLabel}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--dash-text)]">
                      {message.message}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {!message.founderEmailSent && (
                        <span className="rounded-full border border-[#F6D9A8] bg-[#FFF8EA] px-2.5 py-1 text-[11px] font-semibold text-[#9A6404]">
                          Email backup did not send
                        </span>
                      )}
                      {message.founderEmailSent && (
                        <span className="rounded-full border border-[#D9E8DC] bg-[#F4FBF6] px-2.5 py-1 text-[11px] font-semibold text-[#2F7A47]">
                          Email backup sent
                        </span>
                      )}
                      {message.founderEmailError && (
                        <span className="rounded-full border border-[#F3C4BE] bg-[#FFF4F1] px-2.5 py-1 text-[11px] font-semibold text-[#A6452F]">
                          {message.founderEmailError}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {message.ownerEmail && (
                      <a
                        href={`mailto:${message.ownerEmail}?subject=${encodeURIComponent(`small Talk support: ${message.categoryLabel}`)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--dash-border)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                      >
                        <MailIcon />
                        Reply by email
                      </a>
                    )}
                    <Link
                      href={`/admin/businesses/${message.businessId}`}
                      className="inline-flex items-center rounded-full border border-[var(--dash-border)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                    >
                      Open business
                    </Link>
                    {message.status === "new" && (
                      <button
                        type="button"
                        onClick={() => void updateMessageStatus(message.id, "reviewed")}
                        disabled={updatingMessageId === message.id}
                        className="inline-flex items-center rounded-full border border-[var(--dash-border)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark reviewed
                      </button>
                    )}
                    {message.status !== "closed" ? (
                      <button
                        type="button"
                        onClick={() => void updateMessageStatus(message.id, "closed")}
                        disabled={updatingMessageId === message.id}
                        className="inline-flex items-center rounded-full bg-[var(--dash-primary)] px-3.5 py-2 text-[12px] font-semibold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void updateMessageStatus(message.id, "new")}
                        disabled={updatingMessageId === message.id}
                        className="inline-flex items-center rounded-full border border-[var(--dash-border)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Follow-up reminders
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                In urgency order, not buried in your notes.
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<WarningIcon />}
                title="No founder reminders yet"
                description="Add a reminder date to any founder note and it will show up here in urgency order."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {reminders.map((business) => (
                <Link
                  key={`${business.id}-reminder`}
                  href={`/admin/businesses/${business.id}`}
                  className="block rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">
                        {business.name}
                      </p>
                      {business.ownerEmail && (
                        <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                          {business.ownerEmail}
                        </p>
                      )}
                    </div>
                    <FounderFollowUpPill status={business.founderFollowUpStatus} />
                  </div>
                  <p className="mt-3 text-[12px] font-semibold text-[var(--dash-text)]">
                    {business.reminderDueLabel}
                  </p>
                  {business.founderNotePreview && (
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                      {business.founderNotePreview}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-[14px] font-semibold text-[#A6452F]">
                Couldn’t load the support queue
              </p>
              <p className="mt-2 text-[13px] text-[var(--dash-muted)]">{error}</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<WarningIcon />}
                title="The founder queue is clear"
                description="When businesses hit billing trouble, go inactive, or start getting private feedback that needs follow-up, they’ll show here."
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--dash-border)]">
              {queue.map((business) => (
                <Link
                  key={business.id}
                  href={`/admin/businesses/${business.id}`}
                  className="block p-5 transition-colors hover:bg-[#FCFAF6]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-[16px] font-semibold text-[var(--dash-text)]">
                          {business.name}
                        </p>
                        <StatusPill status={business.subscriptionStatus} />
                        <FounderFollowUpPill status={business.founderFollowUpStatus} />
                      </div>
                      {business.ownerEmail && (
                        <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                          {business.ownerEmail}
                        </p>
                      )}
                      {business.founderNotePreview && (
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-text)]">
                          {business.founderNotePreview}
                          {business.founderNoteUpdatedLabel && (
                            <span className="ml-2 text-[12px] text-[var(--dash-muted)]">
                              Updated {business.founderNoteUpdatedLabel}
                            </span>
                          )}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {business.attentionReasons.map((reason) => (
                          <span
                            key={`${business.id}-${reason.key}`}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(
                              reason.tone,
                            )}`}
                          >
                            {reason.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[12px] text-[var(--dash-muted)]">
                      Last activity {business.lastActivityLabel}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
