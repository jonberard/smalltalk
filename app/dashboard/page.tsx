"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, supabase } from "@/lib/supabase";
import { capture } from "@/lib/posthog";
import { dashboardButtonClassName, dashboardUtilityLinkClassName } from "@/components/dashboard/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonCard, SkeletonRow } from "@/components/dashboard/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPill } from "@/components/dashboard/status-pill";

type DashboardStats = {
  reviewsThisMonth: number;
  avgRating: number;
  completionRate: number;
  totalLinks: number;
  replyRate: number;
};

type FunnelData = {
  sent: number;
  opened: number;
  started: number;
  drafted: number;
  posted: number;
};

type FunnelFilter = "week" | "month" | "all";

type AttentionItem = {
  name: string;
  detail: string;
  status: string;
  sessionId: string;
};

type ActivityItem = {
  sessionId: string;
  reviewLinkId: string;
  name: string;
  action: string;
  time: string;
  status: string;
  feedbackType: "public" | "private";
  privateFeedbackStatus: "new" | "handled" | null;
  privateFeedbackHandledAt: string | null;
  stars: number | null;
  snippet: string | null;
  repliedAt: string | null;
  employeeName: string | null;
  serviceType: string | null;
  customerContact: string | null;
  topicsSelected: { label: string; follow_up_answer: string }[] | null;
  parentPrivateFeedbackSessionId: string | null;
};

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

function statusToAction(
  status: string,
  stars: number | null,
  feedbackType: "public" | "private",
  parentPrivateFeedbackSessionId: string | null,
): string {
  if (feedbackType === "private" && status === "drafted") {
    return "sent private feedback";
  }

  if (parentPrivateFeedbackSessionId) {
    switch (status) {
      case "copied":
        return stars
          ? `copied a ${stars}-star public review after private feedback`
          : "copied a public review after private feedback";
      case "drafted":
        return "drafted a public review after private feedback";
      case "in_progress":
        return "came back to post publicly";
      case "created":
        return "reopened the request to post publicly";
      default:
        return "activity recorded";
    }
  }

  switch (status) {
    case "copied":
      return stars ? `copied a ${stars}-star review` : "copied a review";
    case "drafted":
      return "drafted a review";
    case "in_progress":
      return "started the review flow";
    case "created":
      return "opened the link";
    default:
      return "activity recorded";
  }
}

function statusToAttentionDetail(status: string, updatedAt: string): string {
  const ago = timeAgo(updatedAt);

  switch (status) {
    case "drafted":
      return `Drafted a review ${ago} but has not copied it yet`;
    case "in_progress":
      return `Started the flow ${ago} but did not finish`;
    case "created":
      return `Opened the link ${ago} but did not start`;
    default:
      return `Last activity ${ago}`;
  }
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function CalendarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
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

function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={44} height={44} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="#E8E5E0" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#E05A3D"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
    </svg>
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

function HomeRailCard({
  eyebrow,
  title,
  count,
  tone,
  summary,
  href,
  linkLabel,
  onClick,
}: {
  eyebrow: string;
  title: string;
  count: number;
  tone: "blue" | "green" | "amber";
  summary: string;
  href: string;
  linkLabel: string;
  onClick?: () => void;
}) {
  const toneClasses =
    tone === "blue"
      ? "text-[#2563EB] bg-[#EFF6FF]"
      : tone === "green"
        ? "text-[#059669] bg-[#ECFDF5]"
        : "text-[#B45309] bg-[#FFF7ED]";

  const content = (
    <div className="rounded-[var(--dash-radius-sm)] border border-white/60 bg-white/85 p-4 transition-all duration-200 hover:-translate-y-[1px] hover:border-[#E05A3D]/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
            {title}
          </h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses}`}>
          {count}
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--dash-muted)]">{summary}</p>
      <div className="mt-4 text-[12px] font-semibold text-[var(--dash-text)]">{linkLabel}</div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}

function QuickActionCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 transition-all duration-200 hover:border-[#E05A3D]/25 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--dash-text)]">{title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">{description}</p>
        </div>
        {badge ? (
          <span className="rounded-full bg-[#F4EFE8] px-2 py-0.5 text-[11px] font-semibold text-[var(--dash-text)]">
            {badge}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

const STATUS_PROGRESSION = ["created", "in_progress", "drafted", "copied"];

function isAtOrBeyond(status: string, target: string): boolean {
  const statusIdx = STATUS_PROGRESSION.indexOf(status);
  const targetIdx = STATUS_PROGRESSION.indexOf(target);
  return statusIdx >= targetIdx;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    reviewsThisMonth: 0,
    avgRating: 0,
    completionRate: 0,
    totalLinks: 0,
    replyRate: 0,
  });
  const [funnel, setFunnel] = useState<FunnelData>({
    sent: 0,
    opened: 0,
    started: 0,
    drafted: 0,
    posted: 0,
  });
  const [funnelFilter, setFunnelFilter] = useState<FunnelFilter>("month");
  const [funnelLoading, setFunnelLoading] = useState(true);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [privateFeedbackItems, setPrivateFeedbackItems] = useState<PrivateFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyModal, setReplyModal] = useState<ActivityItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);
  const [privateFeedbackModal, setPrivateFeedbackModal] = useState<PrivateFeedbackItem | null>(null);
  const [privateFeedbackActionLoading, setPrivateFeedbackActionLoading] = useState(false);
  const [privateFeedbackActionError, setPrivateFeedbackActionError] = useState("");
  const [queuedInitialCount, setQueuedInitialCount] = useState(0);
  const { business } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const feedbackParam = searchParams.get("feedback");

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    if (!business) return;

    router.replace("/dashboard", { scroll: false });

    fetchWithAuth("/api/verify-subscription", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.updated) {
          window.location.href = "/dashboard";
        }
      })
      .catch((error) => {
        console.error("[dashboard] Failed to verify subscription:", error);
      });
  }, [searchParams, business, router]);

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchAll() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count: totalLinks } = await supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);

      const { count: queuedInitial } = await supabase
        .from("review_message_deliveries")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("channel", "sms")
        .eq("kind", "initial")
        .eq("status", "pending");

      const linkCount = totalLinks ?? 0;
      setQueuedInitialCount(queuedInitial ?? 0);

      const { data: allSessions } = await supabase
        .from("review_sessions")
        .select("id, review_link_id, star_rating, status, feedback_type, customer_contact, optional_text, generated_review, topics_selected, private_feedback_status, private_feedback_handled_at, parent_private_feedback_session_id, replied_at, created_at, updated_at, review_links!inner(business_id, customer_name, customer_contact, services(name), employees(name))")
        .eq("review_links.business_id", businessId)
        .order("updated_at", { ascending: false });

      const sessions = allSessions || [];

      const completedSessions = sessions.filter((session) => session.status === "copied");
      const reviewsThisMonth = completedSessions.filter((session) => session.created_at >= monthStart).length;
      const ratings = completedSessions
        .map((session) => session.star_rating)
        .filter((rating): rating is number => rating !== null);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;
      const completionRate = linkCount > 0
        ? Math.round((completedSessions.length / linkCount) * 100)
        : 0;
      const publicReviews = completedSessions.filter((session) => session.feedback_type !== "private");
      const repliedPublic = publicReviews.filter((session) => !!session.replied_at).length;
      const replyRate = publicReviews.length > 0 ? Math.round((repliedPublic / publicReviews.length) * 100) : 0;

      setStats({ reviewsThisMonth, avgRating, completionRate, totalLinks: linkCount, replyRate });

      const privateFeedback = sessions
        .filter(
          (session) =>
            session.feedback_type === "private" &&
            typeof session.optional_text === "string" &&
            session.optional_text.trim().length > 0,
        )
        .map((session) => {
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
            message: session.optional_text,
            employeeName: link.employees?.name ?? null,
            serviceType: link.services?.name ?? null,
            customerContact: session.customer_contact ?? link.customer_contact ?? null,
            status:
              (session.private_feedback_status as "new" | "handled" | null) ?? "new",
            handledAt: session.private_feedback_handled_at ?? null,
          } satisfies PrivateFeedbackItem;
        })
        .sort((left, right) => {
          if (left.status === right.status) return 0;
          return left.status === "new" ? -1 : 1;
        });

      setPrivateFeedbackItems(privateFeedback);

      const attentionSessions = sessions.filter(
        (session) =>
          session.feedback_type !== "private" &&
          (session.status === "drafted" ||
            session.status === "in_progress" ||
            session.status === "created"),
      ).slice(0, 5);

      setAttention(
        attentionSessions.map((session) => {
          const link = session.review_links as unknown as { customer_name: string };
          return {
            name: link.customer_name,
            detail: statusToAttentionDetail(session.status, session.updated_at),
            status: session.status,
            sessionId: session.id,
          };
        }),
      );

      const recentActivity = sessions.slice(0, 15);
      setActivityItems(
        recentActivity.map((session) => {
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
            action: statusToAction(
              session.status,
              session.star_rating,
              session.feedback_type ?? "public",
              session.parent_private_feedback_session_id ?? null,
            ),
            time: timeAgo(session.updated_at),
            status:
              session.feedback_type === "private" && session.status === "drafted"
                ? "private_feedback"
                : session.status,
            feedbackType: session.feedback_type ?? "public",
            privateFeedbackStatus:
              (session.private_feedback_status as "new" | "handled" | null) ?? null,
            privateFeedbackHandledAt: session.private_feedback_handled_at ?? null,
            stars: session.star_rating,
            snippet:
              session.feedback_type === "private"
                ? session.optional_text
                : session.generated_review,
            repliedAt: session.replied_at ?? null,
            employeeName: link.employees?.name ?? null,
            serviceType: link.services?.name ?? null,
            customerContact: session.customer_contact ?? link.customer_contact ?? null,
            topicsSelected: session.topics_selected as { label: string; follow_up_answer: string }[] | null,
            parentPrivateFeedbackSessionId: session.parent_private_feedback_session_id ?? null,
          };
        }),
      );

      if (feedbackParam) {
        const matchingFeedback = privateFeedback.find((item) => item.sessionId === feedbackParam);

        if (matchingFeedback) {
          setPrivateFeedbackModal(matchingFeedback);
          setPrivateFeedbackActionError("");
        }
      }

      setLoading(false);
    }

    fetchAll();
  }, [business, feedbackParam]);

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchFunnel() {
      setFunnelLoading(true);

      let dateFrom: string | null = null;
      const now = new Date();

      if (funnelFilter === "month") {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (funnelFilter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateFrom = startOfWeek.toISOString();
      }

      let linksQuery = supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);

      if (dateFrom) {
        linksQuery = linksQuery.gte("created_at", dateFrom);
      }

      const { count: sentCount } = await linksQuery;
      const sent = sentCount ?? 0;

      let sessionsQuery = supabase
        .from("review_sessions")
        .select("status, review_links!inner(business_id)")
        .eq("review_links.business_id", businessId);

      if (dateFrom) {
        sessionsQuery = sessionsQuery.gte("created_at", dateFrom);
      }

      const { data: funnelSessions } = await sessionsQuery;
      const sessions = funnelSessions || [];

      const opened = sessions.filter((session) => isAtOrBeyond(session.status, "created")).length;
      const started = sessions.filter((session) => isAtOrBeyond(session.status, "in_progress")).length;
      const drafted = sessions.filter((session) => isAtOrBeyond(session.status, "drafted")).length;
      const posted = sessions.filter((session) => session.status === "copied").length;

      setFunnel({ sent, opened, started, drafted, posted });
      setFunnelLoading(false);
    }

    fetchFunnel();
  }, [business, funnelFilter]);

  async function generateReplyForItem(item: ActivityItem) {
    setReplyModal(item);
    setReplyText("");
    setReplyError("");
    setReplyLoading(true);
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
          replyVoiceId: (business as Record<string, unknown>)?.reply_voice_id ?? "warm",
          customReplyVoice: (business as Record<string, unknown>)?.custom_reply_voice ?? undefined,
          reviewSource: "smalltalk",
        }),
      });
      const data = await res.json();

      if (data.reply_text) {
        setReplyText(data.reply_text);
        setReplyError("");
        capture("reply_generated", { session_id: item.sessionId, star_rating: item.stars });
      } else {
        setReplyError("Failed to generate reply. Please try again.");
      }
    } catch {
      setReplyError("Failed to generate reply. Please try again.");
    }

    setReplyLoading(false);
  }

  async function copyReplyAndMark() {
    if (!replyText || !replyModal) return;

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

    setReplyCopied(true);
    capture("reply_copied", { session_id: replyModal.sessionId, star_rating: replyModal.stars });

    await supabase
      .from("review_sessions")
      .update({ reply_text: replyText, replied_at: new Date().toISOString() })
      .eq("id", replyModal.sessionId);

    setActivityItems((current) =>
      current.map((item) =>
        item.sessionId === replyModal.sessionId
          ? { ...item, repliedAt: new Date().toISOString() }
          : item,
      ),
    );

    setTimeout(() => setReplyCopied(false), 3000);
  }

  function closePrivateFeedbackModal() {
    setPrivateFeedbackModal(null);
    setPrivateFeedbackActionError("");

    if (feedbackParam) {
      router.replace("/dashboard", { scroll: false });
    }
  }

  async function markPrivateFeedbackHandled(sessionId: string) {
    setPrivateFeedbackActionLoading(true);
    setPrivateFeedbackActionError("");

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

      setPrivateFeedbackItems((current) =>
        current.map((item) =>
          item.sessionId === sessionId
            ? { ...item, status: "handled", handledAt }
            : item,
        ),
      );

      setActivityItems((current) =>
        current.map((item) =>
          item.sessionId === sessionId
            ? {
                ...item,
                privateFeedbackStatus: "handled",
                privateFeedbackHandledAt: handledAt,
              }
            : item,
        ),
      );

      setPrivateFeedbackModal((current) =>
        current && current.sessionId === sessionId
          ? { ...current, status: "handled", handledAt }
          : current,
      );
    } catch (error) {
      setPrivateFeedbackActionError(
        error instanceof Error ? error.message : "Couldn’t mark feedback as handled.",
      );
    } finally {
      setPrivateFeedbackActionLoading(false);
    }
  }

  const newPrivateFeedback = privateFeedbackItems.filter((item) => item.status === "new").slice(0, 3);
  const replyQueue = activityItems.filter(
    (item) =>
      item.feedbackType !== "private" &&
      item.status === "copied" &&
      !item.repliedAt,
  ).slice(0, 3);
  const stalledRequests = attention.slice(0, 3);
  const openedRate = funnel.sent > 0 ? Math.round((funnel.opened / funnel.sent) * 100) : 0;
  const responseRate = funnel.sent > 0 ? Math.round((funnel.started / funnel.sent) * 100) : 0;
  const attentionBuckets = [
    newPrivateFeedback.length > 0,
    replyQueue.length > 0,
    queuedInitialCount > 0 || stalledRequests.length > 0,
  ].filter(Boolean).length;
  const batchWindowLabel =
    business?.batch_initial_sms_enabled
      ? `Next batch ${((hour: number) => {
          if (hour === 0) return "12:00 AM";
          if (hour < 12) return `${hour}:00 AM`;
          if (hour === 12) return "12:00 PM";
          return `${hour - 12}:00 PM`;
        })(business.batch_initial_sms_hour ?? 18)}`
      : "Requests send right away";
  const bannerText = (() => {
    if (newPrivateFeedback.length > 0 && replyQueue.length > 0) {
      return `${newPrivateFeedback.length} private-feedback note${newPrivateFeedback.length === 1 ? "" : "s"} came in, and ${replyQueue.length === 1 ? "a public review is waiting on your reply." : `${replyQueue.length} public reviews are waiting on your reply.`}`;
    }

    if (newPrivateFeedback.length > 0) {
      return `${newPrivateFeedback.length} private-feedback note${newPrivateFeedback.length === 1 ? "" : "s"} came in and need a follow-up.`;
    }

    if (replyQueue.length > 0) {
      return `${replyQueue.length === 1 ? "A public review is" : `${replyQueue.length} public reviews are`} waiting on your reply.`;
    }

    if (queuedInitialCount > 0) {
      return `${queuedInitialCount} request${queuedInitialCount === 1 ? "" : "s"} are queued for the next send window.`;
    }

    if (stalledRequests.length > 0) {
      return `${stalledRequests.length} request${stalledRequests.length === 1 ? "" : "s"} stalled before the customer finished.`;
    }

    return "Everything urgent is quiet right now. New feedback and reply work will show up here first.";
  })();
  const feedbackPreviewItems = (newPrivateFeedback.length > 0 ? newPrivateFeedback : privateFeedbackItems.slice(0, 2)).slice(0, 2);
  const todayItems = [
    business?.batch_initial_sms_enabled
      ? {
          key: "batch",
          title: queuedInitialCount > 0 ? `${queuedInitialCount} request${queuedInitialCount === 1 ? "" : "s"} queued` : "Batch window ready",
          detail:
            queuedInitialCount > 0
              ? `Automatic texts go out at ${((hour: number) => {
                  if (hour === 0) return "12:00 AM";
                  if (hour < 12) return `${hour}:00 AM`;
                  if (hour === 12) return "12:00 PM";
                  return `${hour - 12}:00 PM`;
                })(business.batch_initial_sms_hour ?? 18)}.`
              : "New SMS requests will hold for the next send window.",
          tone: "coral" as const,
        }
      : {
          key: "batch",
          title: "Requests send right away",
          detail: "Batch texting is off — new SMS requests go out as soon as you send them.",
          tone: "coral" as const,
        },
    {
      key: "reply",
      title: replyQueue.length > 0 ? `${replyQueue.length} review${replyQueue.length === 1 ? "" : "s"} ready` : "No reply backlog",
      detail:
        replyQueue.length > 0
          ? "Draft reply — tap to open the next one."
          : "Public replies are caught up right now.",
      tone: "sage" as const,
    },
    {
      key: "stalled",
      title: stalledRequests.length > 0 ? `${stalledRequests.length} stalled request${stalledRequests.length === 1 ? "" : "s"}` : "Request flow is moving",
      detail:
        stalledRequests.length > 0
          ? stalledRequests[0].detail
          : "Nothing is stuck between send and customer action.",
      tone: "forest" as const,
    },
  ];

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[1120px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">Home</p>
            <h1 className="mt-2 text-balance font-heading text-[32px] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--dash-text)] sm:text-[38px]">
              {getGreeting()}.
            </h1>
            <p className="mt-2 max-w-[50ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              Three things want your attention. Everything else is moving on its own.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/send/jobs"
              className={dashboardButtonClassName({ variant: "primary", size: "lg" })}
            >
              + New request
            </Link>
          </div>
        </div>

        <section className="rounded-[18px] bg-[var(--dash-primary)] px-6 py-6 text-white shadow-[0_18px_42px_rgba(224,90,61,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                Needs you · {attentionBuckets}
              </p>
              <h2 className="mt-3 max-w-[18ch] text-balance font-heading text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[34px]">
                {bannerText}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/inbox"
                className="inline-flex min-h-[42px] items-center rounded-[10px] bg-white px-4 py-2 text-[13px] font-semibold text-[#A33A21] transition-transform hover:-translate-y-[1px]"
              >
                Open inbox
              </Link>
              {replyQueue[0] ? (
                <button
                  type="button"
                  onClick={() => generateReplyForItem(replyQueue[0])}
                  className="inline-flex min-h-[42px] items-center rounded-[10px] border border-white/30 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/16"
                >
                  Draft replies
                </button>
              ) : (
                <Link
                  href="/dashboard/send/jobs"
                  className="inline-flex min-h-[42px] items-center rounded-[10px] border border-white/30 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/16"
                >
                  Open send
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[16px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
          <div className="grid gap-0 md:grid-cols-4">
            {loading || funnelLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border-b border-[var(--dash-border)] px-5 py-5 md:border-b-0 md:border-r last:border-r-0">
                  <SkeletonCard />
                </div>
              ))
            ) : (
              [
                {
                  label: "Google rating",
                  value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
                  detail: stats.avgRating > 0 ? `${stats.reviewsThisMonth} new this month` : "Waiting on your first posted review",
                  progress: stats.avgRating > 0 ? Math.min(100, (stats.avgRating / 5) * 100) : 8,
                },
                {
                  label: "New reviews · month",
                  value: `+${stats.reviewsThisMonth}`,
                  detail: stats.reviewsThisMonth > 0 ? "Copied and handed off" : "Nothing new yet",
                  progress: Math.min(100, stats.reviewsThisMonth * 10),
                },
                {
                  label: "Response rate",
                  value: `${responseRate}%`,
                  detail: funnel.sent > 0 ? `${funnel.started} people responded to ${funnel.sent} requests` : "No sends yet",
                  progress: responseRate,
                },
                {
                  label: "Reply rate",
                  value: `${stats.replyRate}%`,
                  detail: replyQueue.length > 0 ? `${replyQueue.length} still waiting on you` : "Public replies are caught up",
                  progress: stats.replyRate || 8,
                },
              ].map((metric, index) => (
                <div
                  key={metric.label}
                  className={`px-5 py-5 ${index < 3 ? "border-b border-[var(--dash-border)] md:border-b-0 md:border-r" : ""}`}
                >
                  <p className="text-[12px] text-[var(--dash-muted)]">{metric.label}</p>
                  <p className="mt-3 font-heading text-[42px] font-semibold leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">{metric.detail}</p>
                  <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-[#EFE8DA]">
                    <div
                      className="h-full rounded-full bg-[var(--dash-primary)]"
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[12px] font-medium text-[var(--dash-muted)]">
                Private feedback · {newPrivateFeedback.length} new
              </p>
              <Link href="/dashboard/inbox" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                Open all →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : feedbackPreviewItems.length > 0 ? (
              <div className="overflow-hidden rounded-[16px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
                {feedbackPreviewItems.map((item, index) => (
                  <button
                    key={item.sessionId}
                    type="button"
                    onClick={() => {
                      setPrivateFeedbackModal(item);
                      setPrivateFeedbackActionError("");
                    }}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FCFAF6] ${
                      index < feedbackPreviewItems.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5E3D8] text-[13px] font-semibold text-[#9A462E]">
                      {item.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--dash-muted)]">
                            {item.serviceType ? <span>{item.serviceType}</span> : null}
                            {item.employeeName ? <span>· {item.employeeName}</span> : null}
                            {item.stars ? <MiniStars rating={item.stars} /> : null}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-[var(--dash-muted)]">{item.time}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-text)]">
                        "{item.message}"
                      </p>
                      <div className="mt-3 flex gap-3 text-[12px]">
                        <span className="font-semibold text-[var(--dash-primary)]">Reply privately</span>
                        <span className="text-[var(--dash-muted)]">
                          {item.status === "handled" ? "Marked resolved" : "Mark resolved"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-8 shadow-[var(--dash-shadow)]">
                <p className="text-[14px] font-medium text-[var(--dash-text)]">No private feedback is waiting right now</p>
                <p className="mt-2 max-w-[40ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
                  New direct feedback will land here first, so you can handle it before it goes stale.
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[12px] font-medium text-[var(--dash-muted)]">Today</p>
              <span className="text-[12px] text-[var(--dash-muted)]">{batchWindowLabel}</span>
            </div>
            <div className="rounded-[16px] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <div className="space-y-0">
                {todayItems.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.key === "reply" && replyQueue[0]) {
                        void generateReplyForItem(replyQueue[0]);
                        return;
                      }
                      if (item.key === "batch") {
                        router.push("/dashboard/more/review-flow/reminders");
                        return;
                      }
                      if (item.key === "stalled") {
                        router.push("/dashboard/send");
                      }
                    }}
                    className={`flex w-full items-start gap-4 py-4 text-left ${index < todayItems.length - 1 ? "border-b border-[var(--dash-border)]" : ""}`}
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.tone === "coral"
                          ? "bg-[var(--dash-primary)]"
                          : item.tone === "sage"
                            ? "bg-[#9FB8A3]"
                            : "bg-[var(--dash-text)]"
                      }`}
                    />
                    <div>
                      <p className="font-heading text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--dash-text)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--dash-muted)]">{item.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Link
                href="/dashboard/send/jobs"
                className="mt-5 inline-flex w-full items-center justify-center rounded-[12px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-white"
              >
                Send a request now →
              </Link>
            </div>
          </section>
        </div>
      </div>

      {privateFeedbackModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={closePrivateFeedbackModal}
          onKeyDown={(event) => {
            if (event.key === "Escape") closePrivateFeedbackModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Private feedback"
            className="w-full max-w-[560px] rounded-t-[16px] bg-white p-6 shadow-xl sm:mx-4 sm:rounded-[var(--dash-radius)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[18px] font-bold text-[var(--dash-text)]">
                    {privateFeedbackModal.name}
                  </h3>
                  <StatusPill status={privateFeedbackModal.status === "new" ? "private_feedback" : "handled"} />
                  {privateFeedbackModal.stars ? <RatingBadge rating={privateFeedbackModal.stars} /> : null}
                </div>
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                  {privateFeedbackModal.time}
                </p>
              </div>
              <button
                type="button"
                onClick={closePrivateFeedbackModal}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)]"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-[13px] text-[var(--dash-muted)]">
              {(privateFeedbackModal.serviceType || privateFeedbackModal.employeeName) ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {privateFeedbackModal.serviceType ? (
                    <span>
                      <strong className="text-[var(--dash-text)]">Service:</strong>{" "}
                      {privateFeedbackModal.serviceType}
                    </span>
                  ) : null}
                  {privateFeedbackModal.employeeName ? (
                    <span>
                      <strong className="text-[var(--dash-text)]">Employee:</strong>{" "}
                      {privateFeedbackModal.employeeName}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {privateFeedbackModal.customerContact ? (() => {
                const contact = formatCustomerContact(privateFeedbackModal.customerContact);
                return contact ? (
                  <div>
                    <strong className="text-[var(--dash-text)]">Customer contact:</strong>{" "}
                    <a href={contact.href} className="font-medium text-[var(--dash-primary)] underline underline-offset-2">
                      {contact.label}
                    </a>
                  </div>
                ) : null;
              })() : null}
            </div>

            <div className="mt-5 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
                Message
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--dash-text)]">
                {privateFeedbackModal.message}
              </p>
            </div>

            {privateFeedbackActionError ? (
              <div className="mt-4 rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">
                {privateFeedbackActionError}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[12px] text-[var(--dash-muted)]">
                {privateFeedbackModal.status === "handled" && privateFeedbackModal.handledAt
                  ? `Marked handled ${timeAgo(privateFeedbackModal.handledAt)}`
                  : "Handle the follow-up in your normal channel, then keep the record clean here."}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/requests/${privateFeedbackModal.reviewLinkId}`}
                  className={dashboardButtonClassName()}
                >
                  Open request
                </Link>
                <button
                  type="button"
                  onClick={closePrivateFeedbackModal}
                  className={dashboardButtonClassName()}
                >
                  Close
                </button>
                {privateFeedbackModal.status !== "handled" ? (
                  <button
                    type="button"
                    onClick={() => markPrivateFeedbackHandled(privateFeedbackModal.sessionId)}
                    disabled={privateFeedbackActionLoading}
                    className={dashboardButtonClassName({ variant: "primary" })}
                  >
                    {privateFeedbackActionLoading ? "Saving..." : "Mark handled"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {replyModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setReplyModal(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setReplyModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Draft reply"
            className="w-full max-w-[520px] rounded-t-[16px] bg-white p-6 shadow-xl sm:mx-4 sm:rounded-[var(--dash-radius)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--dash-text)]">Draft reply</h3>
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                  We help with the wording. You still paste the reply on Google yourself.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyModal(null)}
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
                <span className="text-[13px] font-semibold text-[var(--dash-text)]">{replyModal.name}</span>
                {replyModal.stars ? <MiniStars rating={replyModal.stars} /> : null}
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--dash-muted)]">
                {replyModal.snippet || <em>Star-only review — no text</em>}
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
                onClick={() => generateReplyForItem(replyModal)}
                disabled={replyLoading}
                className={`${dashboardUtilityLinkClassName()} disabled:opacity-50`}
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={copyReplyAndMark}
                disabled={replyLoading || !replyText}
                className={`${dashboardButtonClassName({ variant: "primary" })} ${
                  replyCopied ? "bg-[#059669]" : "bg-[var(--dash-primary)] hover:brightness-95"
                }`}
              >
                {replyCopied ? "Copied" : "Copy reply"}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href={`/dashboard/requests/${replyModal.reviewLinkId}`}
                className={dashboardUtilityLinkClassName()}
              >
                Open request detail
              </Link>
            </div>

            {!replyCopied && !replyLoading ? (
              <p className="mt-3 text-center text-[11px] text-[var(--dash-muted)]">
                Paste this reply on your Google Business page manually.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
