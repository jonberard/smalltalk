import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminBusinessFollowUpStatus } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * DAY_MS);
const FOURTEEN_DAYS_AGO = () => new Date(Date.now() - 14 * DAY_MS);
const THREE_DAYS_AGO = () => new Date(Date.now() - 3 * DAY_MS);

type RawReviewSession = {
  id: string;
  customer_contact: string | null;
  star_rating: number | null;
  optional_text: string | null;
  status: string;
  feedback_type: "public" | "private";
  private_feedback_status: "new" | "handled";
  updated_at: string;
  created_at: string;
};

type RawDelivery = {
  id: string;
  channel: "sms" | "email";
  kind: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  last_error: string | null;
  to_address: string | null;
};

type RawReviewLink = {
  id: string;
  customer_name: string;
  customer_contact: string;
  unique_code: string;
  source: string;
  is_generic: boolean;
  created_at: string;
  review_sessions?: RawReviewSession[] | null;
  review_message_deliveries?: RawDelivery[] | null;
};

type RawBusiness = {
  id: string;
  name: string;
  owner_email: string | null;
  subscription_status: string;
  onboarding_completed: boolean;
  trial_requests_remaining: number;
  trial_ends_at: string | null;
  created_at: string;
  review_links?: RawReviewLink[] | null;
  admin_business_notes?: RawAdminBusinessNote[] | RawAdminBusinessNote | null;
};

type RawAdminBusinessNote = {
  business_id: string;
  follow_up_status: AdminBusinessFollowUpStatus;
  note: string | null;
  reminder_due_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAttentionReasonKey =
  | "past_due"
  | "onboarding_stuck"
  | "new_private_feedback"
  | "failed_deliveries"
  | "inactive"
  | "reminder_due"
  | "founder_follow_up";

export type AdminAttentionReason = {
  key: AdminAttentionReasonKey;
  label: string;
  tone: "critical" | "warning" | "info";
};

export type AdminBusinessSummary = {
  id: string;
  name: string;
  ownerEmail: string | null;
  subscriptionStatus: string;
  onboardingCompleted: boolean;
  onboardingStuck: boolean;
  createdAt: string;
  createdLabel: string;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  requestCount30d: number;
  publicStarts30d: number;
  publicCopied30d: number;
  publicFlowCompletion30d: number;
  privateFeedbackNewCount: number;
  privateFeedback30d: number;
  failedDeliveries30d: number;
  failedReminders30d: number;
  inactive: boolean;
  trialRequestsRemaining: number;
  trialEndsAt: string | null;
  founderFollowUpStatus: AdminBusinessFollowUpStatus;
  founderNotePreview: string | null;
  founderNoteUpdatedAt: string | null;
  founderNoteUpdatedLabel: string | null;
  reminderDueAt: string | null;
  reminderDueLabel: string | null;
  reminderUrgency: "none" | "upcoming" | "today" | "tomorrow" | "overdue";
  attentionReasons: AdminAttentionReason[];
  attentionScore: number;
};

export type AdminOverviewData = {
  metrics: {
    activeBusinesses: number;
    trialingBusinesses: number;
    canceledBusinesses: number;
    pastDueBusinesses: number;
    newSignups30d: number;
    onboardingStuck: number;
    inactiveBusinesses: number;
    requestCount30d: number;
    publicFlowCompletion30d: number;
    privateFeedback30d: number;
    failedDeliveries30d: number;
    remindersDue: number;
    remindersOverdue: number;
  };
  attention: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    reasons: AdminAttentionReason[];
    lastActivityLabel: string;
  }>;
  newestBusinesses: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    createdLabel: string;
    onboardingCompleted: boolean;
  }>;
  inactiveBusinesses: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    lastActivityLabel: string;
    subscriptionStatus: string;
  }>;
  reminders: Array<{
    businessId: string;
    name: string;
    ownerEmail: string | null;
    subscriptionStatus: string;
    followUpStatus: AdminBusinessFollowUpStatus;
    reminderDueLabel: string;
    reminderUrgency: "upcoming" | "today" | "tomorrow" | "overdue";
    founderNotePreview: string | null;
  }>;
};

export type AdminBusinessDetail = {
  summary: AdminBusinessSummary;
  founderNote: {
    followUpStatus: AdminBusinessFollowUpStatus;
    note: string;
    reminderDueAt: string | null;
    reminderDueLabel: string | null;
    reminderUrgency: "none" | "upcoming" | "today" | "tomorrow" | "overdue";
    updatedAt: string | null;
    updatedLabel: string | null;
  };
  recentRequests: Array<{
    reviewLinkId: string;
    customerName: string;
    customerContact: string | null;
    createdAt: string;
    createdLabel: string;
    source: string;
    currentStateLabel: string;
  }>;
  recentPrivateFeedback: Array<{
    sessionId: string;
    customerName: string;
    stars: number | null;
    message: string | null;
    status: "new" | "handled";
    createdAt: string;
    createdLabel: string;
    customerContact: string | null;
  }>;
  failedDeliveries: Array<{
    deliveryId: string;
    kind: string;
    channel: "sms" | "email";
    createdLabel: string;
    lastError: string | null;
    toAddress: string | null;
  }>;
};

function isTrialStatus(status: string) {
  return status === "trialing" || status === "trial";
}

function formatRelative(dateString: string | null) {
  if (!dateString) {
    return "No activity yet";
  }

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function maxDate(values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatCalendarDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function getReminderMeta(reminderDueAt: string | null) {
  if (!reminderDueAt) {
    return {
      dueLabel: null,
      urgency: "none" as const,
      sortValue: null as number | null,
    };
  }

  const dueDate = new Date(reminderDueAt);
  const dueTime = dueDate.getTime();
  const today = startOfToday();
  const todayTime = today.getTime();
  const tomorrowTime = todayTime + DAY_MS;
  const dayAfterTomorrowTime = tomorrowTime + DAY_MS;

  if (dueTime < todayTime) {
    return {
      dueLabel: `Overdue · ${formatCalendarDate(reminderDueAt)}`,
      urgency: "overdue" as const,
      sortValue: dueTime,
    };
  }

  if (dueTime < tomorrowTime) {
    return {
      dueLabel: "Due today",
      urgency: "today" as const,
      sortValue: dueTime,
    };
  }

  if (dueTime < dayAfterTomorrowTime) {
    return {
      dueLabel: "Due tomorrow",
      urgency: "tomorrow" as const,
      sortValue: dueTime,
    };
  }

  return {
    dueLabel: `Due ${formatCalendarDate(reminderDueAt)}`,
    urgency: "upcoming" as const,
    sortValue: dueTime,
  };
}

function getAdminBusinessNote(raw: RawBusiness) {
  const note = raw.admin_business_notes;

  if (!note) {
    return null;
  }

  return (Array.isArray(note) ? note[0] : note) ?? null;
}

function trimFounderNote(note: string | null) {
  const trimmed = note?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function founderNotePreview(note: string | null) {
  const trimmed = trimFounderNote(note);

  if (!trimmed) {
    return null;
  }

  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

function getFounderFollowUpReason(
  status: AdminBusinessFollowUpStatus,
): AdminAttentionReason | null {
  switch (status) {
    case "watching":
      return {
        key: "founder_follow_up",
        label: "Founder is watching this account",
        tone: "info",
      };
    case "follow_up":
      return {
        key: "founder_follow_up",
        label: "Founder follow-up in progress",
        tone: "warning",
      };
    case "blocked":
      return {
        key: "founder_follow_up",
        label: "Founder follow-up is blocked",
        tone: "critical",
      };
    default:
      return null;
  }
}

function getAttentionReasons(summary: Omit<AdminBusinessSummary, "attentionReasons" | "attentionScore">) {
  const reasons: AdminAttentionReason[] = [];

  if (summary.subscriptionStatus === "past_due") {
    reasons.push({
      key: "past_due",
      label: "Payment needs attention",
      tone: "critical",
    });
  }

  if (summary.onboardingStuck) {
    reasons.push({
      key: "onboarding_stuck",
      label: "Onboarding looks stuck",
      tone: "warning",
    });
  }

  if (summary.privateFeedbackNewCount > 0) {
    reasons.push({
      key: "new_private_feedback",
      label:
        summary.privateFeedbackNewCount === 1
          ? "1 private feedback item needs review"
          : `${summary.privateFeedbackNewCount} private feedback items need review`,
      tone: "warning",
    });
  }

  if (summary.failedDeliveries30d > 0) {
    reasons.push({
      key: "failed_deliveries",
      label:
        summary.failedDeliveries30d === 1
          ? "1 delivery failed in the last 30 days"
          : `${summary.failedDeliveries30d} deliveries failed in the last 30 days`,
      tone: "warning",
    });
  }

  if (summary.inactive) {
    reasons.push({
      key: "inactive",
      label: "No recent activity",
      tone: "info",
    });
  }

  if (summary.reminderUrgency !== "none") {
    reasons.push({
      key: "reminder_due",
      label: summary.reminderDueLabel ?? "Founder reminder due",
      tone:
        summary.reminderUrgency === "overdue"
          ? "critical"
          : summary.reminderUrgency === "today"
            ? "warning"
            : "info",
    });
  }

  const followUpReason = getFounderFollowUpReason(summary.founderFollowUpStatus);

  if (followUpReason) {
    reasons.push(followUpReason);
  }

  return reasons;
}

function getAttentionScore(reasons: AdminAttentionReason[]) {
  const weight: Record<AdminAttentionReasonKey, number> = {
    past_due: 100,
    reminder_due: 90,
    onboarding_stuck: 80,
    new_private_feedback: 70,
    failed_deliveries: 60,
    inactive: 40,
    founder_follow_up: 75,
  };

  return reasons.reduce((total, reason) => total + weight[reason.key], 0);
}

function getCurrentStateLabel(link: RawReviewLink) {
  const sessions = [...(link.review_sessions ?? [])].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  const latest = sessions[0];

  if (!latest) {
    return "Link created";
  }

  if (latest.feedback_type === "private") {
    return latest.private_feedback_status === "handled"
      ? "Private feedback handled"
      : "Private feedback received";
  }

  switch (latest.status) {
    case "copied":
      return "Review copied";
    case "drafted":
      return "Review drafted";
    case "in_progress":
      return "Review started";
    case "created":
      return "Link opened";
    default:
      return "Activity recorded";
  }
}

function summarizeBusiness(raw: RawBusiness): AdminBusinessSummary {
  const links = raw.review_links ?? [];
  const note = getAdminBusinessNote(raw);
  const reminder = getReminderMeta(note?.reminder_due_at ?? null);
  const sessions = links.flatMap((link) => link.review_sessions ?? []);
  const publicSessions = sessions.filter((session) => session.feedback_type === "public");
  const privateSessions = sessions.filter((session) => session.feedback_type === "private");
  const deliveries = links.flatMap((link) => link.review_message_deliveries ?? []);

  const thirtyDaysAgo = THIRTY_DAYS_AGO().getTime();
  const fourteenDaysAgo = FOURTEEN_DAYS_AGO().getTime();
  const threeDaysAgo = THREE_DAYS_AGO().getTime();

  const requestCount30d = links.filter(
    (link) => new Date(link.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const publicStarts30d = publicSessions.filter(
    (session) => new Date(session.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const publicCopied30d = publicSessions.filter(
    (session) =>
      session.status === "copied" &&
      new Date(session.updated_at).getTime() >= thirtyDaysAgo,
  ).length;

  const privateFeedback30d = privateSessions.filter(
    (session) => new Date(session.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const privateFeedbackNewCount = privateSessions.filter(
    (session) => session.private_feedback_status === "new",
  ).length;

  const failedDeliveries30d = deliveries.filter(
    (delivery) =>
      delivery.status === "failed" &&
      new Date(delivery.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const failedReminders30d = deliveries.filter(
    (delivery) =>
      delivery.status === "failed" &&
      delivery.kind.startsWith("reminder") &&
      new Date(delivery.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const lastActivityAt = maxDate([
    ...links.map((link) => link.created_at),
    ...sessions.map((session) => session.updated_at),
    ...deliveries.map((delivery) => delivery.sent_at ?? delivery.created_at),
  ]);

  const inactiveThreshold = lastActivityAt
    ? new Date(lastActivityAt).getTime() < fourteenDaysAgo
    : new Date(raw.created_at).getTime() < fourteenDaysAgo;

  const onboardingStuck =
    !raw.onboarding_completed && new Date(raw.created_at).getTime() < threeDaysAgo;

  const baseSummary = {
    id: raw.id,
    name: raw.name,
    ownerEmail: raw.owner_email,
    subscriptionStatus: raw.subscription_status,
    onboardingCompleted: raw.onboarding_completed,
    onboardingStuck,
    createdAt: raw.created_at,
    createdLabel: formatRelative(raw.created_at),
    lastActivityAt,
    lastActivityLabel: formatRelative(lastActivityAt),
    requestCount30d,
    publicStarts30d,
    publicCopied30d,
    publicFlowCompletion30d:
      publicStarts30d > 0 ? Math.round((publicCopied30d / publicStarts30d) * 100) : 0,
    privateFeedbackNewCount,
    privateFeedback30d,
    failedDeliveries30d,
    failedReminders30d,
    inactive:
      inactiveThreshold && (raw.subscription_status === "active" || isTrialStatus(raw.subscription_status)),
    trialRequestsRemaining: raw.trial_requests_remaining,
    trialEndsAt: raw.trial_ends_at,
    founderFollowUpStatus: note?.follow_up_status ?? "none",
    founderNotePreview: founderNotePreview(note?.note ?? null),
    founderNoteUpdatedAt: note?.updated_at ?? null,
    founderNoteUpdatedLabel: note?.updated_at ? formatRelative(note.updated_at) : null,
    reminderDueAt: note?.reminder_due_at ?? null,
    reminderDueLabel: reminder.dueLabel,
    reminderUrgency: reminder.urgency,
  };

  const attentionReasons = getAttentionReasons(baseSummary);

  return {
    ...baseSummary,
    attentionReasons,
    attentionScore: getAttentionScore(attentionReasons),
  };
}

async function fetchBusinessesRaw(filterBusinessId?: string) {
  let query = supabaseAdmin
    .from("businesses")
    .select(
      "id, name, owner_email, subscription_status, onboarding_completed, trial_requests_remaining, trial_ends_at, created_at, admin_business_notes(business_id, follow_up_status, note, reminder_due_at, updated_by, created_at, updated_at), review_links(id, customer_name, customer_contact, unique_code, source, is_generic, created_at, review_sessions(id, customer_contact, star_rating, optional_text, status, feedback_type, private_feedback_status, updated_at, created_at), review_message_deliveries(id, channel, kind, status, created_at, sent_at, last_error, to_address))",
    )
    .order("created_at", { ascending: false });

  if (filterBusinessId) {
    query = query.eq("id", filterBusinessId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as RawBusiness[]) ?? [];
}

export async function listAdminBusinessSummaries() {
  const rows = await fetchBusinessesRaw();
  return rows.map(summarizeBusiness).sort((a, b) => b.attentionScore - a.attentionScore || a.name.localeCompare(b.name));
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const businesses = await listAdminBusinessSummaries();

  const metrics = {
    activeBusinesses: businesses.filter((business) => business.subscriptionStatus === "active").length,
    trialingBusinesses: businesses.filter((business) => isTrialStatus(business.subscriptionStatus)).length,
    canceledBusinesses: businesses.filter((business) => business.subscriptionStatus === "canceled").length,
    pastDueBusinesses: businesses.filter((business) => business.subscriptionStatus === "past_due").length,
    newSignups30d: businesses.filter(
      (business) => new Date(business.createdAt).getTime() >= THIRTY_DAYS_AGO().getTime(),
    ).length,
    onboardingStuck: businesses.filter((business) => business.onboardingStuck).length,
    inactiveBusinesses: businesses.filter((business) => business.inactive).length,
    requestCount30d: businesses.reduce((total, business) => total + business.requestCount30d, 0),
    publicFlowCompletion30d: (() => {
      const starts = businesses.reduce((total, business) => total + business.publicStarts30d, 0);
      const copied = businesses.reduce((total, business) => total + business.publicCopied30d, 0);
      return starts > 0 ? Math.round((copied / starts) * 100) : 0;
    })(),
    privateFeedback30d: businesses.reduce((total, business) => total + business.privateFeedback30d, 0),
    failedDeliveries30d: businesses.reduce((total, business) => total + business.failedDeliveries30d, 0),
    remindersDue: businesses.filter((business) => business.reminderUrgency !== "none").length,
    remindersOverdue: businesses.filter((business) => business.reminderUrgency === "overdue").length,
  };

  return {
    metrics,
    attention: businesses
      .filter((business) => business.attentionReasons.length > 0)
      .slice(0, 6)
      .map((business) => ({
        businessId: business.id,
        name: business.name,
        ownerEmail: business.ownerEmail,
        subscriptionStatus: business.subscriptionStatus,
        reasons: business.attentionReasons,
        lastActivityLabel: business.lastActivityLabel,
      })),
    newestBusinesses: [...businesses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((business) => ({
        businessId: business.id,
        name: business.name,
        ownerEmail: business.ownerEmail,
        subscriptionStatus: business.subscriptionStatus,
        createdLabel: business.createdLabel,
        onboardingCompleted: business.onboardingCompleted,
      })),
    inactiveBusinesses: businesses
      .filter((business) => business.inactive)
      .slice(0, 5)
      .map((business) => ({
        businessId: business.id,
        name: business.name,
        ownerEmail: business.ownerEmail,
        lastActivityLabel: business.lastActivityLabel,
        subscriptionStatus: business.subscriptionStatus,
      })),
    reminders: businesses
      .filter((business) => business.reminderUrgency !== "none" && business.reminderDueLabel)
      .sort((a, b) => new Date(a.reminderDueAt ?? 0).getTime() - new Date(b.reminderDueAt ?? 0).getTime())
      .slice(0, 6)
      .map((business) => ({
        businessId: business.id,
        name: business.name,
        ownerEmail: business.ownerEmail,
        subscriptionStatus: business.subscriptionStatus,
        followUpStatus: business.founderFollowUpStatus,
        reminderDueLabel: business.reminderDueLabel!,
        reminderUrgency: business.reminderUrgency as "upcoming" | "today" | "tomorrow" | "overdue",
        founderNotePreview: business.founderNotePreview,
      })),
  };
}

export async function getAdminBusinessDetail(
  businessId: string,
): Promise<AdminBusinessDetail | null> {
  const rows = await fetchBusinessesRaw(businessId);
  const raw = rows[0];

  if (!raw) {
    return null;
  }

  const summary = summarizeBusiness(raw);
  const note = getAdminBusinessNote(raw);
  const links = raw.review_links ?? [];
  const sessionsByLink = links.flatMap((link) =>
    (link.review_sessions ?? []).map((session) => ({ link, session })),
  );
  const deliveriesByLink = links.flatMap((link) =>
    (link.review_message_deliveries ?? []).map((delivery) => ({ link, delivery })),
  );

  const recentRequests = [...links]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map((link) => ({
      reviewLinkId: link.id,
      customerName: link.customer_name,
      customerContact: link.customer_contact || null,
      createdAt: link.created_at,
      createdLabel: formatRelative(link.created_at),
      source: link.is_generic ? "Generic link" : link.source || "Manual send",
      currentStateLabel: getCurrentStateLabel(link),
    }));

  const recentPrivateFeedback = sessionsByLink
    .filter(({ session }) => session.feedback_type === "private")
    .sort((a, b) => new Date(b.session.created_at).getTime() - new Date(a.session.created_at).getTime())
    .slice(0, 6)
    .map(({ link, session }) => ({
      sessionId: session.id,
      customerName: link.customer_name,
      stars: session.star_rating,
      message: session.optional_text,
      status: session.private_feedback_status,
      createdAt: session.created_at,
      createdLabel: formatRelative(session.created_at),
      customerContact: session.customer_contact || link.customer_contact || null,
    }));

  const failedDeliveries = deliveriesByLink
    .filter(({ delivery }) => delivery.status === "failed")
    .sort((a, b) => new Date(b.delivery.created_at).getTime() - new Date(a.delivery.created_at).getTime())
    .slice(0, 6)
    .map(({ delivery }) => ({
      deliveryId: delivery.id,
      kind: delivery.kind,
      channel: delivery.channel,
      createdLabel: formatRelative(delivery.created_at),
      lastError: delivery.last_error,
      toAddress: delivery.to_address,
    }));

  return {
    summary,
    founderNote: {
      followUpStatus: note?.follow_up_status ?? "none",
      note: trimFounderNote(note?.note ?? null) ?? "",
      reminderDueAt: note?.reminder_due_at ?? null,
      reminderDueLabel: getReminderMeta(note?.reminder_due_at ?? null).dueLabel,
      reminderUrgency: getReminderMeta(note?.reminder_due_at ?? null).urgency,
      updatedAt: note?.updated_at ?? null,
      updatedLabel: note?.updated_at ? formatRelative(note.updated_at) : null,
    },
    recentRequests,
    recentPrivateFeedback,
    failedDeliveries,
  };
}
