"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import { buildInitialSmsMessage } from "@/lib/review-request-messages";
import { getNextBatchSendAt } from "@/lib/quiet-hours";
import { supabase } from "@/lib/supabase";

type ReviewFlowSessionRow = {
  status: string;
  feedback_type: "public" | "private";
  optional_text: string | null;
  private_feedback_status: "new" | "handled" | null;
  replied_at: string | null;
  updated_at: string;
};

type ReviewFlowDeliveryRow = {
  kind: "initial" | "reminder_1" | "reminder_2";
  status: "pending" | "sent" | "failed" | "skipped";
  scheduled_for: string;
  sent_at: string | null;
};

type ReviewFlowLinkRow = {
  id: string;
  created_at: string;
  initial_sent_at: string | null;
  review_sessions: ReviewFlowSessionRow[] | null;
  review_message_deliveries: ReviewFlowDeliveryRow[] | null;
};

type FlowMetrics = {
  created: number;
  publicCount: number;
  publicAwaitingReply: number;
  privateCount: number;
  privateUnread: number;
  openedNoReply: number;
  quiet: number;
  queuedTexts: number;
  pendingReminders: number;
};

function formatHourLabel(hour: number) {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function getRelativeBatchLabel(
  timeZone: string,
  batchHour: number,
  quietStart: number,
  quietEnd: number,
) {
  const now = new Date();
  const next = getNextBatchSendAt(now, timeZone, batchHour, quietStart, quietEnd);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const nextText = formatter.format(next);
  const localToday = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const localNext = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(next);

  if (localToday === localNext) {
    return `Next batch today ${nextText.split(", ").slice(-1)[0]}`;
  }

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const localTomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  if (localTomorrow === localNext) {
    return `Next batch tomorrow ${nextText.split(", ").slice(-1)[0]}`;
  }

  return `Next batch ${nextText}`;
}

function getLatestSession(link: ReviewFlowLinkRow, feedbackType: "public" | "private") {
  return [...(link.review_sessions ?? [])]
    .filter((session) =>
      feedbackType === "private"
        ? session.feedback_type === "private" && !!session.optional_text?.trim()
        : session.feedback_type !== "private",
    )
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0];
}

function buildMetrics(links: ReviewFlowLinkRow[]) {
  return links.reduce<FlowMetrics>(
    (summary, link) => {
      summary.created += 1;

      const deliveries = link.review_message_deliveries ?? [];
      const initialDelivery = deliveries.find((delivery) => delivery.kind === "initial");
      const latestPublic = getLatestSession(link, "public");
      const latestPrivate = getLatestSession(link, "private");
      const hasStartedPublic =
        latestPublic?.status === "created" ||
        latestPublic?.status === "in_progress" ||
        latestPublic?.status === "drafted";

      if (initialDelivery?.status === "pending") {
        summary.queuedTexts += 1;
      }

      summary.pendingReminders += deliveries.filter(
        (delivery) => delivery.kind !== "initial" && delivery.status === "pending",
      ).length;

      if (latestPublic?.status === "copied" || latestPublic?.status === "posted") {
        summary.publicCount += 1;
        if (!latestPublic.replied_at) {
          summary.publicAwaitingReply += 1;
        }
        return summary;
      }

      if (latestPrivate) {
        summary.privateCount += 1;
        if (latestPrivate.private_feedback_status === "new") {
          summary.privateUnread += 1;
        }
        return summary;
      }

      if (hasStartedPublic) {
        summary.openedNoReply += 1;
        return summary;
      }

      summary.quiet += 1;
      return summary;
    },
    {
      created: 0,
      publicCount: 0,
      publicAwaitingReply: 0,
      privateCount: 0,
      privateUnread: 0,
      openedNoReply: 0,
      quiet: 0,
      queuedTexts: 0,
      pendingReminders: 0,
    },
  );
}

export default function ReviewFlowSetupPage() {
  const { business } = useAuth();
  const [links, setLinks] = useState<ReviewFlowLinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    const businessId = business.id;

    async function loadFlow() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("review_links")
        .select(
          "id, created_at, initial_sent_at, review_sessions(status, feedback_type, optional_text, private_feedback_status, replied_at, updated_at), review_message_deliveries(kind, status, scheduled_for, sent_at)",
        )
        .eq("business_id", businessId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(250);

      if (!cancelled) {
        setLinks((data as ReviewFlowLinkRow[] | null) ?? []);
        setLoading(false);
      }
    }

    void loadFlow();

    return () => {
      cancelled = true;
    };
  }, [business]);

  if (!business) return null;

  const metrics = useMemo(() => buildMetrics(links), [links]);
  const batchEnabled = business.batch_initial_sms_enabled ?? false;
  const batchHour = business.batch_initial_sms_hour ?? 18;
  const timeZone = business.business_timezone ?? "America/Chicago";
  const quietStart = business.quiet_hours_start ?? 21;
  const quietEnd = business.quiet_hours_end ?? 9;

  const previewMessage = buildInitialSmsMessage({
    customerName: "Sarah",
    businessName: business.name,
    reviewLinkUrl: "sml.tk/s7x",
    smsTemplate: business.review_request_sms_template,
  });

  const segments = [
    {
      key: "public",
      label: "Public",
      count: metrics.publicCount,
      detail:
        metrics.publicAwaitingReply > 0
          ? `${metrics.publicAwaitingReply} awaiting reply`
          : "No replies waiting",
      bg: "bg-[#D96443]",
      text: "text-white",
      sub: "text-white/80",
      bar: "bg-[#D96443]",
    },
    {
      key: "private",
      label: "Private feedback",
      count: metrics.privateCount,
      detail: metrics.privateUnread > 0 ? `${metrics.privateUnread} unread` : "Inbox caught up",
      bg: "bg-[#DDE5DF]",
      text: "text-[#1A2E25]",
      sub: "text-[#5E7268]",
      bar: "bg-[#95AA9C]",
    },
    {
      key: "opened",
      label: "Opened, no reply",
      count: metrics.openedNoReply,
      detail: metrics.pendingReminders > 0 ? `${metrics.pendingReminders} reminders queued` : "Still active",
      bg: "bg-[#F2ECE0]",
      text: "text-[#1A2E25]",
      sub: "text-[#5E7268]",
      bar: "bg-[#D8CCB7]",
    },
    {
      key: "quiet",
      label: "Quiet",
      count: metrics.quiet,
      detail: metrics.queuedTexts > 0 ? `${metrics.queuedTexts} queued for batch send` : "No activity yet",
      bg: "bg-[#F7F2E8]",
      text: "text-[#1A2E25]",
      sub: "text-[#5E7268]",
      bar: "bg-[#E4DACB]",
    },
  ];

  const nextBatchLabel = batchEnabled
    ? getRelativeBatchLabel(timeZone, batchHour, quietStart, quietEnd)
    : "New texts send right away";

  return (
    <SetupPageShell
      eyebrow="More / Review flow"
      title="Review requests"
      description="What goes out after each job, when, and how it’s landing."
      headerTone="detail"
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/more/review-flow/reminders" className={dashboardButtonClassName()}>
            Timing & delivery
          </Link>
          <Link
            href="/dashboard/more/review-flow/message"
            className={dashboardButtonClassName({ variant: "primary" })}
          >
            Edit message
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 xl:max-w-[260px]">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--dash-muted)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#9FB8A3]" />
                {business.reminder_sequence_enabled ?? true ? "Running" : "Reminders off"}
              </div>
              <div className="mt-3 text-[64px] font-heading font-semibold leading-none tracking-[-0.05em] text-[var(--dash-text)]">
                {loading ? "—" : metrics.created}
              </div>
              <p className="mt-2 text-[14px] text-[var(--dash-muted)]">requests created · last 30 days</p>

              <div className="mt-5 space-y-3">
                {segments.map((segment) => (
                  <div key={segment.key} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${segment.bar}`} />
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--dash-text)]">{segment.label}</p>
                        <p className="text-[12px] text-[var(--dash-muted)]">{segment.detail}</p>
                      </div>
                    </div>
                    <span className="text-[28px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                      {loading ? "—" : segment.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-[12px] text-[var(--dash-muted)]">
                <span className="rounded-full bg-[#F5F0E7] px-3 py-1 font-medium text-[var(--dash-text)]">
                  {nextBatchLabel}
                </span>
                <span>{enabledLabel(business.reminder_sequence_enabled ?? true)}</span>
              </div>

              <div className="overflow-hidden rounded-[20px] bg-[#FCFAF6] p-3">
                <div className="flex h-16 overflow-hidden rounded-[16px] bg-[#F2ECE0]">
                  {segments.map((segment) => {
                    const basis = metrics.created === 0 ? 1 : Math.max(segment.count, 1);

                    return (
                      <div
                        key={segment.key}
                        className={`flex min-w-0 flex-1 flex-col justify-center px-4 ${segment.bg} ${segment.text}`}
                        style={{ flex: basis }}
                      >
                        <div className="flex items-end gap-2">
                          <span className="text-[34px] font-heading font-semibold leading-none tracking-[-0.04em]">
                            {loading ? "—" : segment.count}
                          </span>
                          <span className={`pb-1 text-[13px] font-medium ${segment.sub}`}>
                            {segment.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-[var(--dash-border)] bg-[#FFF7F2] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#BC5A40]">
                    Replies waiting
                  </p>
                  <p className="mt-2 text-[30px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                    {loading ? "—" : metrics.publicAwaitingReply}
                  </p>
                </div>
                <div className="rounded-[16px] border border-[var(--dash-border)] bg-[#F5FAF6] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B8571]">
                    Private unread
                  </p>
                  <p className="mt-2 text-[30px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                    {loading ? "—" : metrics.privateUnread}
                  </p>
                </div>
                <div className="rounded-[16px] border border-[var(--dash-border)] bg-[#FBF7F0] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    Queued reminders
                  </p>
                  <p className="mt-2 text-[30px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                    {loading ? "—" : metrics.pendingReminders}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Message
                </p>
                <p className="mt-2 text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">
                  What customers get
                </p>
              </div>
              <span className="rounded-full border border-[var(--dash-border)] bg-[#FCFAF6] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-muted)]">
                SMS
              </span>
            </div>

            <div className="mt-4 rounded-[18px] bg-[#EEF0F5] px-4 py-3 text-[14px] leading-relaxed text-[var(--dash-text)]">
              {previewMessage}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--dash-muted)]">
              <span>{previewMessage.length} characters</span>
              <Link
                href="/dashboard/more/review-flow/message"
                className="font-medium text-[#E05A3D] underline decoration-[rgba(224,90,61,0.35)] underline-offset-4"
              >
                Edit message
              </Link>
            </div>
          </div>

          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Timing
                </p>
                <p className="mt-2 text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">
                  When requests go out
                </p>
              </div>
              <span className="rounded-full border border-[var(--dash-border)] bg-[#FCFAF6] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-muted)]">
                {(business.reminder_sequence_enabled ?? true) ? "Reminders on" : "Reminders off"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <TimingStep
                label="Day 0"
                title="Ask"
                subtitle={batchEnabled ? `today, ${formatHourLabel(batchHour)}` : "right away"}
                active
              />
              <TimingStep
                label="Day 2"
                title="Nudge"
                subtitle={(business.reminder_sequence_enabled ?? true) ? "10 AM" : "off"}
                muted={!(business.reminder_sequence_enabled ?? true)}
              />
              <TimingStep
                label="Day 5"
                title="Last note"
                subtitle={(business.reminder_sequence_enabled ?? true) ? "10 AM" : "off"}
                muted={!(business.reminder_sequence_enabled ?? true)}
              />
              <TimingStep label="Day 6" title="Stop" subtitle="No more texts" muted />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[var(--dash-muted)]">
              <span>Quiet hours {formatHourLabel(quietStart)} – {formatHourLabel(quietEnd)} local</span>
              <span>Timezone {timeZone}</span>
            </div>

            <div className="mt-4">
              <Link
                href="/dashboard/more/review-flow/reminders"
                className="font-medium text-[#E05A3D] underline decoration-[rgba(224,90,61,0.35)] underline-offset-4"
              >
                Edit timing & delivery
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SetupPageShell>
  );
}

function enabledLabel(remindersEnabled: boolean) {
  return remindersEnabled ? "Reminders on" : "Reminders off";
}

function TimingStep({
  label,
  title,
  subtitle,
  active = false,
  muted = false,
}: {
  label: string;
  title: string;
  subtitle: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[6px] top-[2px] h-[76px] w-px bg-[var(--dash-border)]" />
      <span
        className={`absolute left-0 top-0 h-3.5 w-3.5 rounded-full border-2 ${
          active
            ? "border-[#E05A3D] bg-[#E05A3D]"
            : muted
              ? "border-[#DDD2C3] bg-[#F7F2E8]"
              : "border-[#E05A3D] bg-white"
        }`}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[14px] font-semibold text-[var(--dash-text)]">{title}</p>
      <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{subtitle}</p>
    </div>
  );
}
