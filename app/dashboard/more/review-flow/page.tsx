"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import { useToast } from "@/components/dashboard/toast";
import { REPLY_VOICES } from "@/lib/reply-generator";
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

type ReviewFlowTopicRow = {
  id: string;
  label: string;
  sort_order: number;
  business_id: string | null;
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
  failedDeliveries: number;
  initialSentCount: number;
  latestSentAt: string | null;
  nextReminderAt: string | null;
};

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatClockLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatUpcomingLabel(dateString: string, timeZone: string) {
  const target = new Date(dateString);
  const now = new Date();
  const currentLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const targetLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(target);
  const tomorrowLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  if (targetLocal === currentLocal) {
    return `Today · ${formatClockLabel(target, timeZone)}`;
  }

  if (targetLocal === tomorrowLocal) {
    return `Tomorrow · ${formatClockLabel(target, timeZone)}`;
  }

  return formatShortDateTime(target, timeZone);
}

function getRelativeBatchLabel(
  timeZone: string,
  batchHour: number,
  quietStart: number,
  quietEnd: number,
) {
  const next = getNextBatchSendAt(new Date(), timeZone, batchHour, quietStart, quietEnd);
  const nextText = formatClockLabel(next, timeZone);
  const localToday = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const localNext = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(next);

  if (localToday === localNext) {
    return `Next batch tonight · ${nextText}`;
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const localTomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  if (localTomorrow === localNext) {
    return `Next batch tomorrow · ${nextText}`;
  }

  return `Next batch ${formatShortDateTime(next, timeZone)}`;
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

      const sentTimestamps = deliveries
        .map((delivery) => delivery.sent_at)
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

      if (sentTimestamps[0] && (!summary.latestSentAt || new Date(sentTimestamps[0]).getTime() > new Date(summary.latestSentAt).getTime())) {
        summary.latestSentAt = sentTimestamps[0];
      }

      if (initialDelivery?.status === "pending") {
        summary.queuedTexts += 1;
      }

      if (initialDelivery?.status === "sent") {
        summary.initialSentCount += 1;
      }

      summary.failedDeliveries += deliveries.filter((delivery) => delivery.status === "failed").length;

      const pendingReminderDates = deliveries
        .filter((delivery) => delivery.kind !== "initial" && delivery.status === "pending")
        .map((delivery) => delivery.scheduled_for)
        .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

      summary.pendingReminders += pendingReminderDates.length;

      if (
        pendingReminderDates[0] &&
        (!summary.nextReminderAt ||
          new Date(pendingReminderDates[0]).getTime() < new Date(summary.nextReminderAt).getTime())
      ) {
        summary.nextReminderAt = pendingReminderDates[0];
      }

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
      failedDeliveries: 0,
      initialSentCount: 0,
      latestSentAt: null,
      nextReminderAt: null,
    },
  );
}

function percentOf(count: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function resolveReplyVoiceId(value: string | null | undefined) {
  if (!value || value === "warm") return "warm_owner";
  if (value === "professional") return "professional_owner";
  if (value === "casual") return "casual_owner";
  if (value === "empathetic") return "empathetic_owner";
  if (value === "brief") return "brief_owner";
  return value;
}

function getReplyVoiceName(voiceId: string, customReplyVoice: string | null | undefined) {
  if (voiceId === "custom" && customReplyVoice?.trim()) {
    return "Custom";
  }
  return REPLY_VOICES.find((voice) => voice.id === voiceId)?.name ?? "Warm Owner";
}

function getVoicePreview(voiceId: string, businessName: string, customReplyVoice: string | null | undefined) {
  if (voiceId === "custom" && customReplyVoice?.trim()) {
    return customReplyVoice.trim();
  }

  switch (voiceId) {
    case "professional_owner":
      return `Thank you for the review. We appreciate the specifics you shared about ${businessName}.`;
    case "casual_owner":
      return `Thanks for the note — really glad the visit landed well.`;
    case "empathetic_owner":
      return "Thanks for saying this plainly. We should have handled that better.";
    case "brief_owner":
      return "Thanks for the note — we appreciate it.";
    default:
      return "Thanks for the thoughtful review — really appreciate you taking the time.";
  }
}

export default function ReviewFlowSetupPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<ReviewFlowLinkRow[]>([]);
  const [topics, setTopics] = useState<ReviewFlowTopicRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    const businessId = business.id;

    async function loadFlow() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [linksRes, topicsRes] = await Promise.all([
        supabase
          .from("review_links")
          .select(
            "id, created_at, initial_sent_at, review_sessions(status, feedback_type, optional_text, private_feedback_status, replied_at, updated_at), review_message_deliveries(kind, status, scheduled_for, sent_at)",
          )
          .eq("business_id", businessId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(250),
        supabase
          .from("topics")
          .select("id, label, sort_order, business_id")
          .or(`business_id.eq.${businessId},business_id.is.null`)
          .order("sort_order"),
      ]);

      if (cancelled) return;

      const allTopics = (topicsRes.data as ReviewFlowTopicRow[] | null) ?? [];
      const customTopics = allTopics.filter((topic) => topic.business_id === businessId);

      setLinks((linksRes.data as ReviewFlowLinkRow[] | null) ?? []);
      setTopics(customTopics.length > 0 ? customTopics : allTopics.filter((topic) => topic.business_id === null));
      setLoading(false);
    }

    void loadFlow();

    return () => {
      cancelled = true;
    };
  }, [business]);

  const metrics = useMemo(() => buildMetrics(links), [links]);
  const initialVoiceId = resolveReplyVoiceId(
    (business as Record<string, unknown> | null)?.reply_voice_id as string | undefined,
  );
  const initialCustomVoice = (business as Record<string, unknown> | null)?.custom_reply_voice as
    | string
    | null
    | undefined;
  const [selectedVoiceId, setSelectedVoiceId] = useState(initialVoiceId);
  const [customVoice, setCustomVoice] = useState(initialCustomVoice ?? "");
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  useEffect(() => {
    setSelectedVoiceId(initialVoiceId);
    setCustomVoice(initialCustomVoice ?? "");
  }, [initialVoiceId, initialCustomVoice]);

  if (!business) return null;

  const batchEnabled = business.batch_initial_sms_enabled ?? false;
  const batchHour = business.batch_initial_sms_hour ?? 18;
  const timeZone = business.business_timezone ?? "America/Chicago";
  const quietStart = business.quiet_hours_start ?? 21;
  const quietEnd = business.quiet_hours_end ?? 9;
  const remindersEnabled = business.reminder_sequence_enabled ?? true;

  const previewMessage = buildInitialSmsMessage({
    customerName: "Sarah",
    businessName: business.name,
    reviewLinkUrl: "sml.tk/s7x",
    smsTemplate: business.review_request_sms_template,
  });

  const segments = [
    {
      key: "public",
      label: "Public review",
      count: metrics.publicCount,
      percent: percentOf(metrics.publicCount, metrics.created),
      bar: "bg-[#D96443]",
      dot: "bg-[#D96443]",
    },
    {
      key: "private",
      label: "Private feedback",
      count: metrics.privateCount,
      percent: percentOf(metrics.privateCount, metrics.created),
      bar: "bg-[#9CB3A1]",
      dot: "bg-[#9CB3A1]",
    },
    {
      key: "opened",
      label: "Opened, no reply",
      count: metrics.openedNoReply,
      percent: percentOf(metrics.openedNoReply, metrics.created),
      bar: "bg-[#E8DDCF]",
      dot: "bg-[#E8DDCF]",
    },
    {
      key: "quiet",
      label: "Quiet",
      count: metrics.quiet,
      percent: percentOf(metrics.quiet, metrics.created),
      bar: "bg-[#F3ECDF]",
      dot: "bg-[#F3ECDF]",
    },
  ];

  const nextBatchLabel = batchEnabled
    ? getRelativeBatchLabel(timeZone, batchHour, quietStart, quietEnd)
    : "New texts send right away";

  const lastTextLabel = metrics.latestSentAt ? `Last text ${formatRelativeTime(metrics.latestSentAt)}` : "No texts sent yet";

  const systemHealthRows = [
    {
      key: "delivery",
      label: "Delivery",
      value:
        metrics.failedDeliveries > 0
          ? `${metrics.failedDeliveries} send${metrics.failedDeliveries === 1 ? "" : "s"} need review`
          : metrics.initialSentCount > 0
            ? `${metrics.initialSentCount} of ${metrics.created} sent in the last 30 days`
            : metrics.queuedTexts > 0
              ? `${metrics.queuedTexts} text${metrics.queuedTexts === 1 ? "" : "s"} waiting for batch send`
              : "No request texts have gone out yet",
      detail:
        metrics.failedDeliveries > 0
          ? "Check Twilio delivery logs before the next batch."
          : metrics.queuedTexts > 0
            ? "Queued texts will go out in the next allowed send window."
            : "No failed sends in the recent window.",
      accent: "bg-[#9CB3A1]",
      status:
        metrics.failedDeliveries > 0
          ? { label: "Needs review", tone: "warn" as const }
          : { label: "OK", tone: "ok" as const },
    },
    {
      key: "reminders",
      label: "Reminders queued",
      value:
        metrics.pendingReminders > 0
          ? `${metrics.pendingReminders} upcoming nudge${metrics.pendingReminders === 1 ? "" : "s"}`
          : remindersEnabled
            ? "No nudges waiting right now"
            : "Reminder sequence is off",
      detail:
        metrics.nextReminderAt
          ? `Next: ${formatUpcomingLabel(metrics.nextReminderAt, timeZone)}`
          : remindersEnabled
            ? "Customers who stall will get the standard follow-up cadence."
            : "Only the initial request is active right now.",
      accent: "bg-[#D96443]",
      status:
        metrics.pendingReminders > 0
          ? { label: "Active", tone: "live" as const }
          : { label: remindersEnabled ? "Clear" : "Off", tone: remindersEnabled ? ("ok" as const) : ("muted" as const) },
      href: "/dashboard/more/review-flow/reminders",
      actionLabel: "Edit timing",
    },
    {
      key: "stalled",
      label: "Stalled",
      value:
        metrics.openedNoReply > 0
          ? `${metrics.openedNoReply} opened the link but didn't finish`
          : "No customers are mid-stream right now",
      detail:
        metrics.openedNoReply > 0
          ? "These customers are still in the flow and can still post publicly or send feedback."
          : "Recent requests either finished or never opened.",
      accent: "bg-[#C5A15B]",
      status:
        metrics.openedNoReply > 0
          ? { label: "Watching", tone: "soft" as const }
          : { label: "Clear", tone: "ok" as const },
      href: "/dashboard/send/jobs",
      actionLabel: "Open requests",
    },
  ];

  const voiceOptions = [...REPLY_VOICES, { id: "custom", name: "Custom", prompt: "" }];

  async function saveVoice(voiceId: string, custom?: string) {
    if (!business?.id) return;
    setVoiceSaving(true);
    const update: Record<string, unknown> = { reply_voice_id: voiceId };

    if (voiceId === "custom") {
      update.custom_reply_voice = custom ?? "";
    } else {
      update.custom_reply_voice = null;
    }

    const { error } = await supabase.from("businesses").update(update).eq("id", business.id);

    setVoiceSaving(false);

    if (error) {
      toast("Couldn't save that voice just yet. Please try again.", "error");
      return;
    }

    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 1800);
  }

  return (
    <SetupPageShell
      eyebrow="More / Review flow"
      title="Review flow"
      description="What goes out after each job, when, and how it’s landing."
      headerTone="detail"
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/support" className={dashboardButtonClassName()}>
            Help center
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute h-4 w-4 rounded-full bg-[#DDE5DF]" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-[#8FA393]" />
                </span>
                <h2 className="text-[22px] font-heading font-semibold tracking-[-0.03em] text-[var(--dash-text)] sm:text-[24px]">
                  The flow is running.
                </h2>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--dash-muted)]">
                <span>{nextBatchLabel}</span>
                <span className="hidden text-[var(--dash-border)] sm:inline">·</span>
                <span>{lastTextLabel}</span>
                <span className="hidden text-[var(--dash-border)] sm:inline">·</span>
                <span>{remindersEnabled ? "Reminders on" : "Reminders off"}</span>
              </div>
            </div>
            <Link href="/dashboard/more/review-flow/reminders" className={dashboardButtonClassName()}>
              Timing & delivery
            </Link>
          </div>
        </section>

        <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <span className="text-[48px] font-heading font-semibold leading-none tracking-[-0.05em] text-[var(--dash-text)] sm:text-[56px]">
                {loading ? "—" : metrics.created}
              </span>
              <div className="pb-1">
                <p className="text-[16px] font-medium tracking-tight text-[var(--dash-text)]">requests went out</p>
                <p className="text-[13px] text-[var(--dash-muted)]">last 30 days</p>
              </div>
            </div>
            <p className="text-[12px] font-medium text-[var(--dash-muted)]">Public · Private · Opened · Quiet</p>
          </div>

          <div className="mt-5 overflow-hidden rounded-full bg-[#F3EDE1]">
            <div className="flex h-4 w-full">
              {segments.map((segment) => {
                const width = metrics.created === 0 ? 25 : Math.max((segment.count / metrics.created) * 100, segment.count > 0 ? 6 : 0);
                return (
                  <div
                    key={segment.key}
                    className={segment.bar}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {segments.map((segment) => (
              <div key={segment.key} className="flex items-start gap-2.5">
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${segment.dot}`} />
                <div>
                  <p className="text-[13px] font-semibold text-[var(--dash-text)]">{segment.label}</p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-[30px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                      {loading ? "—" : segment.count}
                    </span>
                    <span className="pb-0.5 text-[12px] font-medium text-[var(--dash-muted)]">
                      {loading ? "" : `${segment.percent}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <FlowControlCard
            eyebrow="What goes out"
            title="Message"
            meta="SMS · 1 part"
            footer={`${previewMessage.length} characters · sender ${business.name}`}
            actionHref="/dashboard/more/review-flow/message"
            actionLabel="Edit message"
          >
            <div className="rounded-[18px] bg-[#EEF0F5] px-4 py-3 text-[14px] leading-relaxed text-[var(--dash-text)]">
              {previewMessage}
            </div>
          </FlowControlCard>

          <FlowControlCard
            eyebrow="When it goes"
            title="Timing"
            meta={remindersEnabled ? "Reminders on" : "Reminders off"}
            footer={`Quiet hours ${formatHourLabel(quietStart)} – ${formatHourLabel(quietEnd)} · ${timeZone}`}
            actionHref="/dashboard/more/review-flow/reminders"
            actionLabel="Edit timing"
          >
            <div className="rounded-[18px] border border-[var(--dash-border)] bg-[#FFFCF8] px-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <TimingRailStep
                  label="Day 0"
                  title="Ask"
                  subtitle={batchEnabled ? `today, ${formatHourLabel(batchHour)}` : "right away"}
                  state="active"
                />
                <TimingRailStep
                  label="Day 6"
                  title="Follow-up"
                  subtitle={remindersEnabled ? "10 AM" : "off"}
                  state={remindersEnabled ? "default" : "muted"}
                />
                <TimingRailStep
                  label="After that"
                  title="Stop"
                  subtitle="no more"
                  state="muted"
                />
              </div>
            </div>
          </FlowControlCard>

          <FlowControlCard
            eyebrow="What they tap through"
            title="Topics"
            meta={`${topics.length} question${topics.length === 1 ? "" : "s"}`}
            footer="What customers choose from before leaving a review."
            actionHref="/dashboard/more/review-flow/topics"
            actionLabel="Edit topics"
          >
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 8).map((topic) => (
                <span
                  key={topic.id}
                  className="rounded-full border border-[#E6D7C4] bg-[#FFF8F2] px-3 py-1.5 text-[12px] font-medium text-[#A75A3D]"
                >
                  {topic.label}
                </span>
              ))}
              {topics.length === 0 ? (
                <span className="text-[13px] text-[var(--dash-muted)]">Using the default topic set.</span>
              ) : null}
            </div>
          </FlowControlCard>

          <FlowControlCard
            eyebrow="Used in public replies"
            title="Voice"
            meta={voiceSaving ? "Saving..." : voiceSaved ? "Saved" : getReplyVoiceName(selectedVoiceId, customVoice)}
            footer="This only changes owner-written public replies."
          >
            <div className="flex flex-wrap gap-2">
              {voiceOptions.map((voice) => {
                const active = voice.id === selectedVoiceId;
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => {
                      setSelectedVoiceId(voice.id);
                      if (voice.id !== "custom") {
                        void saveVoice(voice.id);
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                      active
                        ? "border-[#173229] bg-[#173229] text-white"
                        : "border-[var(--dash-border)] bg-white text-[var(--dash-text)] hover:bg-[#FCFAF6]"
                    }`}
                  >
                    {voice.name}
                  </button>
                );
              })}
            </div>
            {selectedVoiceId === "custom" ? (
              <div className="mt-3 space-y-3 rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] p-3.5">
                <textarea
                  value={customVoice}
                  onChange={(event) => setCustomVoice(event.target.value)}
                  rows={3}
                  placeholder="Friendly, accountable, plainspoken. Mention the customer’s specifics and keep it human."
                  className="w-full resize-none rounded-[12px] border border-[var(--dash-border)] bg-white px-3.5 py-3 text-[13px] leading-relaxed text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void saveVoice("custom", customVoice)}
                    disabled={!customVoice.trim() || voiceSaving}
                    className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
                  >
                    Save voice
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mt-3 rounded-[14px] bg-[#F8F2E8] px-4 py-3 text-[13px] italic leading-relaxed text-[var(--dash-text)]">
              “{getVoicePreview(selectedVoiceId, business.name, customVoice)}”
            </div>
          </FlowControlCard>
        </section>

        <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
          <div className="border-b border-[var(--dash-border)] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              System health
            </p>
          </div>
          <div className="divide-y divide-[var(--dash-border)]">
            {systemHealthRows.map(({ key, ...row }) => (
              <HealthRow key={key} {...row} />
            ))}
          </div>
        </section>
      </div>
    </SetupPageShell>
  );
}

function FlowControlCard({
  eyebrow,
  title,
  meta,
  footer,
  actionHref,
  actionLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  footer?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">{eyebrow}</p>
          <p className="mt-2 text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">{title}</p>
        </div>
        {meta ? (
          <span className="rounded-full border border-[var(--dash-border)] bg-[#FCFAF6] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-muted)]">
            {meta}
          </span>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>

      {(footer || (actionHref && actionLabel)) ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--dash-muted)]">
          <span>{footer}</span>
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="font-medium text-[#E05A3D] underline decoration-[rgba(224,90,61,0.35)] underline-offset-4"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TimingRailStep({
  label,
  title,
  subtitle,
  state,
}: {
  label: string;
  title: string;
  subtitle: string;
  state: "active" | "default" | "muted";
}) {
  const dotClassName =
    state === "active"
      ? "border-[#E05A3D] bg-[#E05A3D]"
      : state === "muted"
        ? "border-[#D9CCBA] bg-[#F3EBDD]"
        : "border-[#E05A3D] bg-white";

  return (
    <div className="relative text-center">
      <div className="pointer-events-none absolute left-1/2 top-[6px] h-px w-[calc(100%+0.75rem)] -translate-x-1/2 bg-[var(--dash-border)] first:hidden" />
      <div className={`relative mx-auto h-3.5 w-3.5 rounded-full border-2 ${dotClassName}`} />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">{label}</p>
      <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">{title}</p>
      <p className="mt-1 text-[12px] leading-snug text-[var(--dash-muted)]">{subtitle}</p>
    </div>
  );
}

function HealthRow({
  label,
  value,
  detail,
  accent,
  status,
  href,
  actionLabel,
}: {
  label: string;
  value: string;
  detail: string;
  accent: string;
  status: { label: string; tone: "ok" | "warn" | "live" | "soft" | "muted" };
  href?: string;
  actionLabel?: string;
}) {
  const statusClassName =
    status.tone === "ok"
      ? "bg-[#EDF5EF] text-[#56745F]"
      : status.tone === "warn"
        ? "bg-[#FFF2E8] text-[#BC5A40]"
        : status.tone === "live"
          ? "bg-[#FFF7F2] text-[#BC5A40]"
          : status.tone === "soft"
            ? "bg-[#F8F2E8] text-[#8D6F39]"
            : "bg-[#F3F4F6] text-[#6B7280]";

  const body = (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className={`mt-1 h-8 w-1.5 shrink-0 rounded-full ${accent}`} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--dash-text)]">{label}</p>
          <p className="mt-1 text-[14px] font-medium leading-relaxed text-[var(--dash-text)]">{value}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">{detail}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-[1.75rem] sm:pl-0">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName}`}>
          {status.label}
        </span>
        {actionLabel ? (
          <span className="text-[12px] font-medium text-[#E05A3D] underline decoration-[rgba(224,90,61,0.35)] underline-offset-4">
            {actionLabel}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href && actionLabel) {
    return (
      <Link href={href} className="block transition-colors hover:bg-[#FCFAF6]">
        {body}
      </Link>
    );
  }

  return body;
}
