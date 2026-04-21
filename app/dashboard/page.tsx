"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, supabase } from "@/lib/supabase";
import { capture } from "@/lib/posthog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonCard, SkeletonRow } from "@/components/dashboard/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPill } from "@/components/dashboard/status-pill";

type DashboardStats = {
  reviewsThisMonth: number;
  avgRating: number;
  completionRate: number;
  totalLinks: number;
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

      const linkCount = totalLinks ?? 0;

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

      setStats({ reviewsThisMonth, avgRating, completionRate, totalLinks: linkCount });

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

  const FILTER_OPTIONS: { key: FunnelFilter; label: string }[] = [
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "all", label: "All time" },
  ];

  const newPrivateFeedback = privateFeedbackItems.filter((item) => item.status === "new").slice(0, 3);
  const replyQueue = activityItems.filter(
    (item) =>
      item.feedbackType !== "private" &&
      item.status === "copied" &&
      !item.repliedAt,
  ).slice(0, 3);
  const stalledRequests = attention.slice(0, 3);
  const recentActivityPreview = activityItems.slice(0, 8);
  const openedRate = funnel.sent > 0 ? Math.round((funnel.opened / funnel.sent) * 100) : 0;
  const copiedRate = funnel.opened > 0 ? Math.round((funnel.posted / funnel.opened) * 100) : 0;
  const dashboardHighlights = [
    {
      label: "Sent",
      value: funnel.sent,
      detail: funnelFilter === "week" ? "This week" : funnelFilter === "month" ? "This month" : "All time",
    },
    {
      label: "Opened",
      value: funnel.opened,
      detail: funnel.sent > 0 ? `${openedRate}% of sent` : "No sends yet",
    },
    {
      label: "Copied",
      value: funnel.posted,
      detail: funnel.opened > 0 ? `${copiedRate}% of opened` : "No handoffs yet",
    },
  ];

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Home
            </p>
            <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
              {getGreeting()}
              {business?.name ? `, ${business.name}` : ""}
            </h1>
            <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              Start with what needs your attention, then check private feedback, replies, and recent request activity.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/send"
              className="inline-flex items-center justify-center rounded-full bg-[var(--dash-primary)] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(224,90,61,0.18)] transition-all hover:brightness-95 active:scale-[0.98]"
            >
              Send request
            </Link>
            <Link
              href="/dashboard/inbox"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--dash-border)] bg-white px-5 py-3 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
            >
              Open inbox
              {newPrivateFeedback.length > 0 ? (
                <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#2563EB]">
                  {newPrivateFeedback.length}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={<CalendarIcon />} label="Copied this month" value={stats.reviewsThisMonth} />
            <StatCard
              icon={<StarIcon />}
              label="Average rating"
              value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "\u2014"}
              detail={stats.avgRating > 0 ? <MiniStars rating={stats.avgRating} /> : undefined}
            />
            <StatCard
              icon={<ChartIcon />}
              label="Completion rate"
              value={stats.totalLinks > 0 ? `${stats.completionRate}%` : "\u2014"}
              detail={stats.totalLinks > 0 ? <ProgressRing percentage={stats.completionRate} /> : undefined}
            />
          </div>
        )}

        <section className="mt-6 rounded-[var(--dash-radius)] border border-[#F6D9A8] bg-[#FFF8EA] p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A16207]">
                Needs attention
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                What needs a real response today
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-medium text-[var(--dash-muted)]">
              <span className="h-2 w-2 rounded-full bg-[#E05A3D]" />
              {newPrivateFeedback.length + replyQueue.length + stalledRequests.length} open items
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[var(--dash-radius-sm)] border border-white/60 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
                    Private feedback
                  </p>
                  <p className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
                    {newPrivateFeedback.length}
                  </p>
                </div>
                <Link href="/dashboard/inbox" className="text-[12px] font-semibold text-[#2563EB]">
                  Open inbox
                </Link>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                {newPrivateFeedback[0]
                  ? `${newPrivateFeedback[0].name}: ${newPrivateFeedback[0].message}`
                  : "No new private feedback waiting on you right now."}
              </p>
            </div>

            <div className="rounded-[var(--dash-radius-sm)] border border-white/60 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#059669]">
                    Reply queue
                  </p>
                  <p className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
                    {replyQueue.length}
                  </p>
                </div>
                <Link href="/dashboard/replies" className="text-[12px] font-semibold text-[#059669]">
                  Open replies
                </Link>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                {replyQueue[0]
                  ? `${replyQueue[0].name}: ${replyQueue[0].snippet ?? "Star-only review waiting on a reply."}`
                  : "Nothing is waiting on a public reply right now."}
              </p>
            </div>

            <div className="rounded-[var(--dash-radius-sm)] border border-white/60 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#D97706]">
                    Stalled requests
                  </p>
                  <p className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
                    {stalledRequests.length}
                  </p>
                </div>
                <Link href="/dashboard/send" className="text-[12px] font-semibold text-[#D97706]">
                  Open send
                </Link>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                {stalledRequests[0]
                  ? `${stalledRequests[0].name}: ${stalledRequests[0].detail}`
                  : "No stalled requests are crowding the queue."}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  New private feedback
                </p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Hear it first
                </h2>
              </div>
              <Link href="/dashboard/inbox" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : newPrivateFeedback.length > 0 ? (
              <div className="space-y-3">
                {newPrivateFeedback.map((item) => (
                  <button
                    key={item.sessionId}
                    type="button"
                    onClick={() => {
                      setPrivateFeedbackModal(item);
                      setPrivateFeedbackActionError("");
                    }}
                    className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4 text-left transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                      <StatusPill status="private_feedback" />
                      {item.stars ? <RatingBadge rating={item.stars} /> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                      {item.message}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
                      {item.serviceType ? <span>{item.serviceType}</span> : null}
                      {item.employeeName ? <span>{item.employeeName}</span> : null}
                      <span>{item.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                    <path d="M3 8l7.2 5.4a3 3 0 0 0 3.6 0L21 8" />
                  </svg>
                }
                title="No fresh complaints"
                description="If someone chooses the private path, it will land here first."
              />
            )}
          </section>

          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Reply queue
                </p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Public reviews waiting on you
                </h2>
              </div>
              <Link href="/dashboard/replies" className="text-[12px] font-semibold text-[var(--dash-primary)]">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : replyQueue.length > 0 ? (
              <div className="space-y-3">
                {replyQueue.map((item) => (
                  <div key={item.sessionId} className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                      <StatusPill status="copied" />
                      {item.stars ? <RatingBadge rating={item.stars} /> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                      {item.snippet ?? "Star-only review copied to the Google handoff."}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-[12px] text-[var(--dash-muted)]">{item.time}</span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/requests/${item.reviewLinkId}`}
                          className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-white"
                        >
                          Open request
                        </Link>
                        <button
                          type="button"
                          onClick={() => generateReplyForItem(item)}
                          className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-primary)] px-3 py-1.5 text-[12px] font-semibold text-[var(--dash-primary)] transition-colors hover:bg-[var(--dash-primary)]/5"
                        >
                          Draft reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M8 9h8" />
                    <path d="M8 13h5" />
                  </svg>
                }
                title="No replies waiting"
                description="Copied public reviews that still need a reply will show up here."
              />
            )}
          </section>
        </div>

        <section className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Recent activity
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                The latest customer movement
              </h2>
            </div>
            <Link href="/dashboard/send" className="text-[12px] font-semibold text-[var(--dash-primary)]">
              Open send
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : recentActivityPreview.length > 0 ? (
            <div className="space-y-3">
              {recentActivityPreview.map((item) => {
                const isPrivateFeedback = item.feedbackType === "private";
                const isCopied = item.status === "copied" && item.feedbackType !== "private";
                const isReplied = !!item.repliedAt;

                return (
                  <div key={item.sessionId} className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-semibold text-[var(--dash-text)]">{item.name}</p>
                          <StatusPill status={item.status} />
                          {item.stars ? <RatingBadge rating={item.stars} /> : null}
                          {isReplied ? (
                            <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#059669]">
                              Replied
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-text)]">
                          {item.action}
                        </p>
                        {item.snippet ? (
                          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                            {item.snippet}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--dash-muted)]">
                          {item.serviceType ? <span>{item.serviceType}</span> : null}
                          {item.employeeName ? <span>{item.employeeName}</span> : null}
                          <span>{item.time}</span>
                        </div>
                      </div>
                      {isPrivateFeedback ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPrivateFeedbackModal({
                              sessionId: item.sessionId,
                              reviewLinkId: item.reviewLinkId,
                              name: item.name,
                              time: item.time,
                              stars: item.stars,
                              message: item.snippet ?? "",
                              employeeName: item.employeeName,
                              serviceType: item.serviceType,
                              customerContact: item.customerContact,
                              status: item.privateFeedbackStatus ?? "new",
                              handledAt: item.privateFeedbackHandledAt,
                            });
                            setPrivateFeedbackActionError("");
                          }}
                          className="shrink-0 rounded-[var(--dash-radius-sm)] border border-[#2563EB] px-3 py-2 text-[12px] font-semibold text-[#2563EB] transition-colors hover:bg-[#2563EB]/5"
                        >
                          View
                        </button>
                      ) : isCopied && !isReplied ? (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/dashboard/requests/${item.reviewLinkId}`}
                            className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-3 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-white"
                          >
                            Open request
                          </Link>
                          <button
                            type="button"
                            onClick={() => generateReplyForItem(item)}
                            className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-primary)] px-3 py-2 text-[12px] font-semibold text-[var(--dash-primary)] transition-colors hover:bg-[var(--dash-primary)]/5"
                          >
                            Draft reply
                          </button>
                        </div>
                      ) : (
                        <Link
                          href={`/dashboard/requests/${item.reviewLinkId}`}
                          className="shrink-0 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-3 py-2 text-[12px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-white"
                        >
                          Open request
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="No activity yet"
              description="Send your first review request to start filling this in."
            />
          )}
        </section>

        <section className="mt-6 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Request flow
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                How requests are moving
              </h2>
            </div>
            <div className="flex gap-1 rounded-full bg-[#EFEAE2] p-1">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFunnelFilter(option.key)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    funnelFilter === option.key
                      ? "bg-white text-[var(--dash-text)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                      : "text-[var(--dash-muted)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {funnelLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : funnel.sent > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {dashboardHighlights.map((highlight) => (
                <div key={highlight.label} className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                    {highlight.label}
                  </p>
                  <p className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
                    {highlight.value}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{highlight.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              }
              title="No request data yet"
              description="Once you send requests, this strip will show sent, opened, and copied counts."
            />
          )}

          <p className="mt-4 text-[12px] leading-relaxed text-[var(--dash-muted)]">
            Until Google review sync is live, <span className="font-semibold text-[var(--dash-text)]">Copied</span> is the last confirmed step. It means the customer copied the review and opened the Google handoff. It does not mean we can confirm they posted it.
          </p>
        </section>
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
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                >
                  Open request
                </Link>
                <button
                  type="button"
                  onClick={closePrivateFeedbackModal}
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
                >
                  Close
                </button>
                {privateFeedbackModal.status !== "handled" ? (
                  <button
                    type="button"
                    onClick={() => markPrivateFeedbackHandled(privateFeedbackModal.sessionId)}
                    disabled={privateFeedbackActionLoading}
                    className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-60"
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
                className="text-[12px] font-medium text-[var(--dash-muted)] underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={copyReplyAndMark}
                disabled={replyLoading || !replyText}
                className={`rounded-[var(--dash-radius-sm)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-50 ${
                  replyCopied ? "bg-[#059669]" : "bg-[var(--dash-primary)] hover:brightness-95"
                }`}
              >
                {replyCopied ? "Copied" : "Copy reply"}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href={`/dashboard/requests/${replyModal.reviewLinkId}`}
                className="text-[12px] font-semibold text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
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
