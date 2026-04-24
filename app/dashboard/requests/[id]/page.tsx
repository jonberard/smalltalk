"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useAuth } from "@/lib/auth-context";
import {
  getReminderBadgeState,
  type ReminderBadgeState,
  type ReminderDeliverySummary,
} from "@/lib/reminder-status";
import { fetchWithAuth, supabase } from "@/lib/supabase";

type RequestDelivery = ReminderDeliverySummary & {
  id: string;
  channel: "sms" | "email";
  scheduled_for: string;
  sent_at: string | null;
  last_error: string | null;
  to_address: string;
  created_at: string;
};

type RequestSession = {
  id: string;
  review_link_id: string;
  customer_contact: string | null;
  star_rating: number | null;
  topics_selected: { label: string; follow_up_answer: string }[] | null;
  optional_text: string | null;
  generated_review: string | null;
  status: string;
  feedback_type: "public" | "private";
  private_feedback_status: "new" | "handled";
  private_feedback_handled_at: string | null;
  parent_private_feedback_session_id: string | null;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

type RequestRow = {
  id: string;
  customer_name: string;
  customer_contact: string;
  unique_code: string;
  source: string;
  is_generic: boolean;
  sequence_completed: boolean;
  initial_sent_at: string | null;
  created_at: string;
  services: { name: string } | null;
  employees: { name: string } | null;
  review_message_deliveries: RequestDelivery[] | null;
  review_sessions: RequestSession[] | null;
};

type TimelineEvent = {
  id: string;
  timestamp: string;
  order: number;
  title: string;
  body: string;
  tone: "neutral" | "info" | "success" | "warning";
};

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
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatCustomerContact(contact: string | null) {
  if (!contact) return null;

  if (contact.includes("@")) {
    return {
      href: `mailto:${contact}`,
      label: contact,
      actionLabel: "Email customer",
    };
  }

  return {
    href: `tel:${contact}`,
    label: contact,
    actionLabel: "Call customer",
  };
}

function getRequestContact(request: RequestRow): string | null {
  const sessionContact = (request.review_sessions ?? []).find(
    (session) => session.customer_contact && session.customer_contact.trim().length > 0,
  )?.customer_contact;
  const linkContact = request.customer_contact?.trim()
    ? request.customer_contact.trim()
    : null;

  return sessionContact ?? linkContact;
}

function getPrimaryRequestStatus(request: RequestRow) {
  const deliveries = request.review_message_deliveries ?? [];
  const sessions = request.review_sessions ?? [];
  const initialDelivery = deliveries.find((delivery) => delivery.kind === "initial");
  const latestPublic = [...sessions]
    .filter((session) => session.feedback_type !== "private")
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )[0];
  const latestPrivate = [...sessions]
    .filter(
      (session) =>
        session.feedback_type === "private" &&
        typeof session.optional_text === "string" &&
        session.optional_text.trim().length > 0,
    )
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )[0];

  if (initialDelivery?.status === "failed") {
    return "delivery_failed";
  }

  if (initialDelivery?.status === "skipped" && initialDelivery.skipped_reason === "opted_out") {
    return "opted_out";
  }

  if (initialDelivery?.status === "pending") {
    return "queued";
  }

  if (latestPublic?.status === "copied") {
    return "copied";
  }

  if (latestPublic?.status === "drafted") {
    return "drafted";
  }

  if (latestPrivate?.private_feedback_status === "new") {
    return "private_feedback";
  }

  if (latestPrivate?.private_feedback_status === "handled") {
    return "handled";
  }

  if (latestPublic?.status === "in_progress") {
    return "in_progress";
  }

  if (latestPublic?.status === "created") {
    return "created";
  }

  return "sent";
}

function getStatusSummary(status: string) {
  switch (status) {
    case "copied":
      return "The customer copied the review and opened the Google handoff. That is the last confirmed public step until Google review sync is live.";
    case "drafted":
      return "A review draft exists, but it has not been copied into the Google handoff yet.";
    case "private_feedback":
      return "The customer chose the private path and sent feedback directly instead of posting publicly.";
    case "handled":
      return "Private feedback was marked handled. If the customer comes back later, they can still choose the public path.";
    case "in_progress":
      return "The customer started the guided flow but has not reached the review draft yet.";
    case "created":
      return "The customer opened the link, but they have not started answering the guided questions yet.";
    case "delivery_failed":
      return "The first delivery attempt failed, so the customer may never have seen this request.";
    case "opted_out":
      return "The customer opted out of follow-up messages, so the reminder sequence stopped.";
    case "queued":
      return "The request is queued for the next send window. The link exists, but the first SMS has not gone out yet.";
    default:
      return "The request exists, but there is no confirmed customer activity on it yet.";
  }
}

function getToneStyles(tone: TimelineEvent["tone"]) {
  switch (tone) {
    case "success":
      return {
        dot: "bg-[#059669]",
        bg: "bg-[#ECFDF5]",
        text: "text-[#065F46]",
      };
    case "warning":
      return {
        dot: "bg-[#D97706]",
        bg: "bg-[#FFF7ED]",
        text: "text-[#9A3412]",
      };
    case "info":
      return {
        dot: "bg-[#2563EB]",
        bg: "bg-[#EFF6FF]",
        text: "text-[#1D4ED8]",
      };
    default:
      return {
        dot: "bg-[#6B7280]",
        bg: "bg-[#F3F4F6]",
        text: "text-[#4B5563]",
      };
  }
}

function buildDeliveryEvent(delivery: RequestDelivery, index: number): TimelineEvent {
  const label =
    delivery.kind === "initial"
      ? "Initial request"
      : delivery.kind === "reminder_1"
        ? "Reminder 1"
        : "Reminder 2";

  if (delivery.status === "sent") {
    return {
      id: delivery.id,
      timestamp: delivery.sent_at ?? delivery.created_at,
      order: 20 + index,
      title: `${label} sent`,
      body: `Delivered by ${delivery.channel.toUpperCase()} to the customer contact on file.`,
      tone: "success",
    };
  }

  if (delivery.status === "failed") {
    return {
      id: delivery.id,
      timestamp: delivery.scheduled_for,
      order: 20 + index,
      title: `${label} failed`,
      body: delivery.last_error || "We couldn’t send this message successfully.",
      tone: "warning",
    };
  }

  if (delivery.status === "skipped") {
    const body =
      delivery.skipped_reason === "opted_out"
        ? "Skipped because the customer opted out of future messages."
        : "Skipped because the request no longer qualified for this reminder.";

    return {
      id: delivery.id,
      timestamp: delivery.scheduled_for,
      order: 20 + index,
      title: `${label} skipped`,
      body,
      tone: "neutral",
    };
  }

  if (delivery.status === "pending" && delivery.kind === "initial") {
    return {
      id: delivery.id,
      timestamp: delivery.scheduled_for,
      order: 20 + index,
      title: "Initial request queued",
      body: "Waiting for the next send window before the first text goes out.",
      tone: "neutral",
    };
  }

  return {
    id: delivery.id,
    timestamp: delivery.scheduled_for,
    order: 20 + index,
    title: `${label} scheduled`,
    body: "Queued to send if the customer still hasn’t finished before that time.",
    tone: "neutral",
  };
}

function buildPublicSessionEvents(session: RequestSession, index: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const followUp = !!session.parent_private_feedback_session_id;

  events.push({
    id: `${session.id}-opened`,
    timestamp: session.created_at,
    order: 100 + index * 10,
    title: followUp ? "Customer came back to post publicly" : "Customer opened the request",
    body: followUp
      ? "They returned after private feedback and chose the public review path."
      : "They opened the guided review link and started a session.",
    tone: "info",
  });

  if (session.status === "created") {
    return events;
  }

  const statusEvent: TimelineEvent =
    session.status === "copied"
      ? {
          id: `${session.id}-status`,
          timestamp: session.updated_at,
          order: 101 + index * 10,
          title: followUp
            ? "Public review copied after private feedback"
            : "Review copied for Google handoff",
          body: "This is the last confirmed public step. It means the review was copied and the Google handoff opened, not that Google confirmed a post.",
          tone: "success",
        }
      : session.status === "drafted"
        ? {
            id: `${session.id}-status`,
            timestamp: session.updated_at,
            order: 101 + index * 10,
            title: followUp
              ? "Public review drafted after private feedback"
              : "Review drafted",
            body: "A draft exists, but it has not been copied into the Google handoff yet.",
            tone: "warning",
          }
        : {
            id: `${session.id}-status`,
            timestamp: session.updated_at,
            order: 101 + index * 10,
            title: followUp
              ? "Public flow started after private feedback"
              : "Review flow started",
            body: "The customer moved into the guided questions but hasn’t reached a draft yet.",
            tone: "warning",
          };

  events.push(statusEvent);

  if (session.replied_at) {
    events.push({
      id: `${session.id}-reply`,
      timestamp: session.replied_at,
      order: 102 + index * 10,
      title: "Reply copied by owner",
      body: "A response was drafted and copied for manual paste on Google.",
      tone: "success",
    });
  }

  return events;
}

function buildPrivateSessionEvents(session: RequestSession, index: number): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `${session.id}-opened`,
      timestamp: session.created_at,
      order: 100 + index * 10,
      title: "Customer opened the request",
      body: "They opened the guided review link and chose the private path.",
      tone: "info",
    },
  ];

  if (session.optional_text?.trim()) {
    events.push({
      id: `${session.id}-feedback`,
      timestamp: session.updated_at,
      order: 101 + index * 10,
      title: "Private feedback sent",
      body: "They sent a private note directly to the business instead of posting publicly.",
      tone: "info",
    });
  }

  if (session.private_feedback_handled_at) {
    events.push({
      id: `${session.id}-handled`,
      timestamp: session.private_feedback_handled_at,
      order: 102 + index * 10,
      title: "Private feedback marked handled",
      body: "The owner marked the follow-up as handled in the dashboard.",
      tone: "success",
    });
  }

  return events;
}

function buildTimelineEvents(request: RequestRow) {
  const deliveries = [...(request.review_message_deliveries ?? [])].sort(
    (left, right) =>
      new Date(left.scheduled_for).getTime() - new Date(right.scheduled_for).getTime(),
  );
  const sessions = [...(request.review_sessions ?? [])].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  );

  const events: TimelineEvent[] = [
    {
      id: "request-created",
      timestamp: request.created_at,
      order: 10,
      title: request.is_generic ? "Reusable request created" : "Request created",
      body: request.is_generic
        ? "This reusable QR/shared request is ready for any customer to open."
        : "This personalized review request was created for the customer.",
      tone: "neutral",
    },
    ...deliveries.map((delivery, index) => buildDeliveryEvent(delivery, index)),
  ];

  sessions.forEach((session, index) => {
    if (session.feedback_type === "private") {
      events.push(...buildPrivateSessionEvents(session, index));
      return;
    }

    events.push(...buildPublicSessionEvents(session, index));
  });

  return events.sort((left, right) => {
    const timeDiff =
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();

    if (timeDiff !== 0) return timeDiff;
    return left.order - right.order;
  });
}

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 4
      ? "text-[#059669] bg-[#ECFDF5]"
      : rating === 3
        ? "text-[#D97706] bg-[#FFFBEB]"
        : "text-[#DC2626] bg-[#FEF2F2]";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}
    >
      {rating}
      <span className="text-[10px]">★</span>
    </span>
  );
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!business || !requestId) return;
    const businessId = business.id;

    async function fetchRequestDetail() {
      setLoading(true);
      setActionError("");

      const { data } = await supabase
        .from("review_links")
        .select(
          "id, customer_name, customer_contact, unique_code, source, is_generic, sequence_completed, initial_sent_at, created_at, services(name), employees(name), review_message_deliveries(id, channel, kind, status, scheduled_for, sent_at, skipped_reason, last_error, to_address, created_at), review_sessions(id, review_link_id, customer_contact, star_rating, topics_selected, optional_text, generated_review, status, feedback_type, private_feedback_status, private_feedback_handled_at, parent_private_feedback_session_id, reply_text, replied_at, created_at, updated_at)",
        )
        .eq("business_id", businessId)
        .eq("id", requestId)
        .single();

      if (!data) {
        setRequest(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const normalized = data as unknown as {
        id: string;
        customer_name: string;
        customer_contact: string;
        unique_code: string;
        source: string;
        is_generic: boolean;
        sequence_completed: boolean;
        initial_sent_at: string | null;
        created_at: string;
        services: { name: string }[] | { name: string } | null;
        employees: { name: string }[] | { name: string } | null;
        review_message_deliveries: RequestDelivery[] | null;
        review_sessions: RequestSession[] | null;
      };

      setRequest({
        ...normalized,
        services: Array.isArray(normalized.services)
          ? (normalized.services[0] ?? null)
          : normalized.services,
        employees: Array.isArray(normalized.employees)
          ? (normalized.employees[0] ?? null)
          : normalized.employees,
        review_message_deliveries: normalized.review_message_deliveries ?? [],
        review_sessions: normalized.review_sessions ?? [],
      });
      setNotFound(false);
      setLoading(false);
    }

    fetchRequestDetail();
  }, [business, requestId]);

  const privateFeedbackSession = useMemo(
    () =>
      [...(request?.review_sessions ?? [])]
        .filter(
          (session) =>
            session.feedback_type === "private" &&
            typeof session.optional_text === "string" &&
            session.optional_text.trim().length > 0,
        )
        .sort(
          (left, right) =>
            new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
        )[0] ?? null,
    [request],
  );

  const publicReviewSession = useMemo(
    () =>
      [...(request?.review_sessions ?? [])]
        .filter((session) => session.feedback_type !== "private")
        .sort(
          (left, right) =>
            new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
        )[0] ?? null,
    [request],
  );

  const reminderBadge = useMemo<ReminderBadgeState | null>(
    () =>
      request
        ? getReminderBadgeState(
            (request.review_message_deliveries ?? []).map((delivery) => ({
              kind: delivery.kind,
              status: delivery.status,
              skipped_reason: delivery.skipped_reason,
            })),
            request.sequence_completed,
          )
        : null,
    [request],
  );

  const timelineEvents = useMemo(
    () => (request ? buildTimelineEvents(request) : []),
    [request],
  );

  const primaryStatus = request ? getPrimaryRequestStatus(request) : "sent";
  const requestContact = request ? getRequestContact(request) : null;
  const requestContactAction = formatCustomerContact(requestContact);

  async function markHandledFromDetail() {
    if (!privateFeedbackSession || privateFeedbackSession.private_feedback_status === "handled") {
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetchWithAuth(
        `/api/private-feedback/${privateFeedbackSession.id}/handled`,
        {
          method: "POST",
        },
      );
      const body = (await res.json()) as {
        error?: string;
        private_feedback_handled_at?: string;
      };

      if (!res.ok) {
        throw new Error(body.error || "Couldn’t mark feedback as handled.");
      }

      const handledAt = body.private_feedback_handled_at ?? new Date().toISOString();

      setRequest((current) =>
        current
          ? {
              ...current,
              review_sessions: (current.review_sessions ?? []).map((session) =>
                session.id === privateFeedbackSession.id
                  ? {
                      ...session,
                      private_feedback_status: "handled",
                      private_feedback_handled_at: handledAt,
                    }
                  : session,
              ),
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn’t mark feedback as handled.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
        <div className="dash-page-enter mx-auto max-w-[980px] px-5 pb-32 pt-8 sm:pb-16">
          <div className="h-4 w-24 animate-pulse rounded bg-[#E8E5E0]" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded bg-[#E8E5E0]" />
          <div className="mt-3 h-4 w-full max-w-[540px] animate-pulse rounded bg-[#E8E5E0]" />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
          <div className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !request) {
    return (
      <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
        <div className="dash-page-enter mx-auto max-w-[760px] px-5 pb-32 pt-8 sm:pb-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
          >
            <span aria-hidden="true">←</span>
            Back to home
          </Link>
          <div className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
            <EmptyState
              icon={
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              title="We couldn’t find that request"
              description="It may belong to another business, or it may have been deleted."
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[980px] px-5 pb-32 pt-8 sm:pb-16">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
        >
          <span aria-hidden="true">←</span>
          Back to home
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Request detail
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
                {request.customer_name}
              </h1>
              <StatusPill status={primaryStatus} />
              {privateFeedbackSession?.star_rating ? (
                <RatingBadge rating={privateFeedbackSession.star_rating} />
              ) : null}
              {!privateFeedbackSession?.star_rating && publicReviewSession?.star_rating ? (
                <RatingBadge rating={publicReviewSession.star_rating} />
              ) : null}
            </div>
            <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              One clean place to see the messages that went out, the customer’s path through the request, and what the owner has done since.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {requestContactAction ? (
              <a
                href={requestContactAction.href}
                className={dashboardButtonClassName({ size: "sm" })}
              >
                {requestContactAction.actionLabel}
              </a>
            ) : null}
            {privateFeedbackSession ? (
              <Link
                href="/dashboard/inbox"
                className={dashboardButtonClassName({ size: "sm" })}
              >
                Open inbox
              </Link>
            ) : null}
            {publicReviewSession?.status === "copied" ? (
              <Link
                href="/dashboard/replies"
                className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
              >
                Open replies
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Request overview
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  Request type
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                  {request.is_generic ? "Reusable QR / shared link" : "Personalized request"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                  {request.is_generic
                    ? "This request can be used by multiple customers, so session-level contact may vary."
                    : "This request was created for one specific customer."}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  Created
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                  {formatDateTime(request.created_at)}
                </p>
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                  {timeAgo(request.created_at)}
                </p>
              </div>
              {request.services?.name ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                    Service
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                    {request.services.name}
                  </p>
                </div>
              ) : null}
              {request.employees?.name ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                    Employee
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                    {request.employees.name}
                  </p>
                </div>
              ) : null}
              {requestContact ? (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                    Customer contact
                  </p>
                  {requestContactAction ? (
                    <a
                      href={requestContactAction.href}
                      className="mt-1 inline-block text-[14px] font-semibold text-[var(--dash-primary)] underline underline-offset-2"
                    >
                      {requestContact}
                    </a>
                  ) : (
                    <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                      {requestContact}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Current state
                </p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                  What we know right now
                </h2>
              </div>
              {reminderBadge ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    reminderBadge.tone === "warning"
                      ? "bg-[#FFF7ED] text-[#C2410C]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  {reminderBadge.label}
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-[var(--dash-muted)]">
              {getStatusSummary(primaryStatus)}
            </p>

            <div className="mt-4 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                    Last confirmed step
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                    {timelineEvents[timelineEvents.length - 1]?.title ?? "Request created"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                    Reminder sequence
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">
                    {request.is_generic
                      ? "Off for generic links"
                      : reminderBadge?.label ?? (request.sequence_completed ? "Completed" : "No reminders pending")}
                  </p>
                </div>
              </div>
            </div>

            {actionError ? (
              <div className="mt-4 rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">
                {actionError}
              </div>
            ) : null}

            {privateFeedbackSession &&
            privateFeedbackSession.private_feedback_status !== "handled" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={markHandledFromDetail}
                  disabled={actionLoading}
                  className={dashboardButtonClassName({ variant: "primary" })}
                >
                  {actionLoading ? "Saving..." : "Mark private feedback handled"}
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {privateFeedbackSession ? (
            <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Private feedback
                </p>
                <StatusPill
                  status={
                    privateFeedbackSession.private_feedback_status === "handled"
                      ? "handled"
                      : "private_feedback"
                  }
                />
                {privateFeedbackSession.star_rating ? (
                  <RatingBadge rating={privateFeedbackSession.star_rating} />
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--dash-text)]">
                {privateFeedbackSession.optional_text}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                {privateFeedbackSession.private_feedback_status === "handled" &&
                privateFeedbackSession.private_feedback_handled_at
                  ? `Marked handled ${timeAgo(privateFeedbackSession.private_feedback_handled_at)}.`
                  : "This was sent privately instead of being posted publicly."}
              </p>
            </section>
          ) : null}

          {publicReviewSession ? (
            <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Public review path
                </p>
                <StatusPill status={publicReviewSession.status} />
                {publicReviewSession.star_rating ? (
                  <RatingBadge rating={publicReviewSession.star_rating} />
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--dash-text)]">
                {publicReviewSession.generated_review ||
                  "This session has public-review activity, but no generated review text was saved."}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                {publicReviewSession.status === "copied"
                  ? "Copied means the review text was copied and the Google handoff opened. It does not confirm Google received a final post."
                  : publicReviewSession.status === "drafted"
                    ? "There is a draft saved, but it has not reached the copy handoff yet."
                    : "The customer is somewhere in the guided review flow, but not at the final copy step yet."}
              </p>
            </section>
          ) : null}
        </div>

        <section className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Timeline
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                Confirmed request history
              </h2>
            </div>
            <p className="max-w-[34ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
              This timeline only uses confirmed system events. We will only show “review detected on Google” here after real Google review sync is live.
            </p>
          </div>

          <div className="mt-6">
            {timelineEvents.map((event, index) => {
              const tone = getToneStyles(event.tone);

              return (
                <div
                  key={event.id}
                  className={`relative pl-8 ${
                    index < timelineEvents.length - 1 ? "pb-6" : ""
                  }`}
                >
                  {index < timelineEvents.length - 1 ? (
                    <span className="absolute left-[5px] top-5 bottom-0 w-px bg-[var(--dash-border)]" />
                  ) : null}
                  <span
                    className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${tone.dot}`}
                  />
                  <div className={`rounded-[var(--dash-radius-sm)] px-4 py-3 ${tone.bg}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className={`text-[14px] font-semibold ${tone.text}`}>
                          {event.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--dash-text)]">
                          {event.body}
                        </p>
                      </div>
                      <div className="shrink-0 text-[12px] font-medium text-[var(--dash-muted)]">
                        {formatDateTime(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
