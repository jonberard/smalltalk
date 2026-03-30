"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

type DashboardStats = {
  reviewsThisMonth: number;
  avgRating: number;
  completionRate: number;
  totalLinks: number;
};

type FunnelData = {
  sent: number;
  clicked: number;
  drafted: number;
  posted: number;
};

type AttentionItem = {
  name: string;
  detail: string;
  status: string;
  sessionId: string;
};

type ActivityItem = {
  name: string;
  action: string;
  time: string;
  status: string;
  stars: number | null;
  snippet: string | null;
};

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

const STATUS_DOT: Record<string, string> = {
  copied: "#10B981",
  drafted: "#F59E0B",
  in_progress: "#3B82F6",
  created: "#A1A1AA",
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

function statusToAction(status: string, stars: number | null): string {
  switch (status) {
    case "copied":
      return stars ? `posted a ${stars}-star review` : "posted a review";
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
      return `Drafted a review ${ago} but hasn't posted it`;
    case "in_progress":
      return `Started the flow ${ago} but didn't finish`;
    case "created":
      return `Opened the link ${ago} but didn't start`;
    default:
      return `Last activity ${ago}`;
  }
}

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ─── Google Logo ─── */
function GoogleLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Stars ─── */
function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= count ? "#FFB300" : "#E0E0E0"} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Expandable Review Card ─── */
const AVATAR_COLORS = [
  { bg: "#EFF6FF", text: "#3B82F6" },
  { bg: "#E8F5E9", text: "#10B981" },
  { bg: "#FEF3C7", text: "#D97706" },
  { bg: "#F3E8FF", text: "#8B5CF6" },
  { bg: "#FFE4E6", text: "#E11D48" },
  { bg: "#E0F2FE", text: "#0284C7" },
];

function ReviewCard({ review, index = 0 }: { review: { name: string; stars: number; snippet: string; time: string }; index?: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.snippet.length > 120;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: avatarColor.bg }}>
            <span className="text-[12px] font-semibold" style={{ color: avatarColor.text }}>
              {review.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#18181B]">{review.name}</p>
            <Stars count={review.stars} size={12} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <GoogleLogo size={12} />
          <span className="text-[11px] text-[#A1A1AA]">{review.time}</span>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-[#71717A]">
        &ldquo;{expanded || !isLong ? review.snippet : `${review.snippet.slice(0, 120)}...`}&rdquo;
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 py-0.5 text-[13px] font-medium text-[#0070EB] transition-colors hover:text-[#0058BB]"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* ─── Stats Cards ─── */
function StatsCards({ stats, loading }: { stats: DashboardStats; loading: boolean }) {
  const cards = [
    {
      label: "Reviews this month",
      value: stats.reviewsThisMonth.toString(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      bg: "#E8F5E9",
    },
    {
      label: "Avg rating",
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      bg: "#FEF3C7",
    },
    {
      label: "Completion rate",
      value: stats.totalLinks > 0 ? `${stats.completionRate}%` : "—",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      bg: "#EFF6FF",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: card.bg }}>
            {card.icon}
          </div>
          {loading ? (
            <div className="mt-3 h-[28px] w-12 animate-pulse rounded-[6px] bg-[#F4F4F5]" />
          ) : (
            <p className="mt-3 text-[24px] font-bold leading-none text-[#18181B]">{card.value}</p>
          )}
          <p className="mt-1.5 text-[11px] text-[#A1A1AA]">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Funnel ─── */
function Funnel({ funnel, loading }: { funnel: FunnelData; loading: boolean }) {
  const [open, setOpen] = useState(true);
  const rate = funnel.sent > 0 ? Math.round((funnel.posted / funnel.sent) * 100) : 0;

  const steps = [
    { label: "Sent", value: funnel.sent, color: "#A1A1AA" },
    { label: "Clicked", value: funnel.clicked, color: "#3B82F6" },
    { label: "Drafted", value: funnel.drafted, color: "#F59E0B" },
    { label: "Posted", value: funnel.posted, color: "#10B981" },
  ];

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#18181B]">Review Funnel</span>
          {!loading && (
            <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-semibold text-[#10B981]">
              {rate}% conversion
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[rgba(228,228,231,0.3)] px-4 pb-4 pt-3">
          <div className="flex flex-col gap-2.5">
            {steps.map((step) => {
              const pct = funnel.sent > 0 ? (step.value / funnel.sent) * 100 : 0;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="w-[52px] text-right text-[12px] text-[#A1A1AA]">{step.label}</span>
                  <div className="relative h-[22px] flex-1 overflow-hidden rounded-full bg-[#F4F4F5]">
                    {loading ? (
                      <div className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-[#E4E4E7]" />
                    ) : (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: step.color }}
                      />
                    )}
                  </div>
                  {loading ? (
                    <div className="h-[16px] w-[24px] animate-pulse rounded bg-[#F4F4F5]" />
                  ) : (
                    <span className="w-[24px] text-[13px] font-semibold text-[#18181B]">{step.value}</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[#A1A1AA]">All time</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

// Status progression order for "at or beyond" funnel logic
const STATUS_PROGRESSION = ["created", "in_progress", "drafted", "copied"];

function isAtOrBeyond(status: string, target: string): boolean {
  const statusIdx = STATUS_PROGRESSION.indexOf(status);
  const targetIdx = STATUS_PROGRESSION.indexOf(target);
  return statusIdx >= targetIdx;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");
  const [stats, setStats] = useState<DashboardStats>({
    reviewsThisMonth: 0,
    avgRating: 0,
    completionRate: 0,
    totalLinks: 0,
  });
  const [funnel, setFunnel] = useState<FunnelData>({ sent: 0, clicked: 0, drafted: 0, posted: 0 });
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [recentReviews, setRecentReviews] = useState<{ name: string; stars: number; snippet: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { business } = useAuth();

  useEffect(() => {
    if (!business) return;

    async function fetchAll() {
      const businessId = business!.id;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 1. Total review links (= "sent")
      const { count: totalLinks } = await supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);

      const linkCount = totalLinks ?? 0;

      // 2. All sessions for this business
      const { data: allSessions } = await supabase
        .from("review_sessions")
        .select("id, star_rating, status, generated_review, created_at, updated_at, review_links!inner(business_id, customer_name)")
        .eq("review_links.business_id", businessId)
        .order("updated_at", { ascending: false });

      const sessions = allSessions || [];

      // ── Stats ──
      const completedSessions = sessions.filter((s) => s.status === "copied");
      const reviewsThisMonth = completedSessions.filter(
        (s) => s.created_at >= monthStart
      ).length;
      const ratings = completedSessions
        .map((s) => s.star_rating)
        .filter((r): r is number => r !== null);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;
      const completionRate = linkCount > 0
        ? Math.round((completedSessions.length / linkCount) * 100)
        : 0;

      setStats({ reviewsThisMonth, avgRating, completionRate, totalLinks: linkCount });

      // ── Funnel ──
      // "Clicked" = any session was created (meaning the link was opened)
      // "Drafted" = session reached drafted or beyond
      // "Posted" = session status is "copied"
      const clicked = sessions.filter((s) => isAtOrBeyond(s.status, "created")).length;
      const drafted = sessions.filter((s) => isAtOrBeyond(s.status, "drafted")).length;
      const posted = completedSessions.length;

      setFunnel({ sent: linkCount, clicked, drafted, posted });

      // ── Needs Attention ──
      // Sessions that are stalled: drafted but not posted, or in_progress/created but not finished
      const attentionSessions = sessions.filter(
        (s) => s.status === "drafted" || s.status === "in_progress" || s.status === "created"
      ).slice(0, 5);

      setAttention(
        attentionSessions.map((s) => {
          const link = s.review_links as unknown as { customer_name: string };
          return {
            name: link.customer_name,
            detail: statusToAttentionDetail(s.status, s.updated_at),
            status: s.status,
            sessionId: s.id,
          };
        })
      );

      // ── Recent Reviews (completed with review text) ──
      const reviewsWithText = completedSessions
        .filter((s) => s.generated_review && s.star_rating)
        .slice(0, 5);

      setRecentReviews(
        reviewsWithText.map((s) => {
          const link = s.review_links as unknown as { customer_name: string };
          return {
            name: link.customer_name,
            stars: s.star_rating!,
            snippet: s.generated_review!,
            time: timeAgo(s.updated_at),
          };
        })
      );

      // ── Activity Feed ──
      const recentActivity = sessions.slice(0, 20);
      setActivityItems(
        recentActivity.map((s) => {
          const link = s.review_links as unknown as { customer_name: string };
          return {
            name: link.customer_name,
            action: statusToAction(s.status, s.star_rating),
            time: timeAgo(s.updated_at),
            status: s.status,
            stars: s.star_rating,
            snippet: s.generated_review,
          };
        })
      );

      setLoading(false);
    }

    fetchAll();
  }, [business]);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
      <div className="mx-auto max-w-[600px] px-5 pb-32 pt-8 sm:pb-16">

        {/* ─── Header ─── */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-[#18181B]">{business?.name || "Dashboard"}</h1>
          <p className="mt-1 text-[13px] text-[#A1A1AA]">{monthName}</p>
        </div>

        {/* ─── Google Hero Card — coming soon ─── */}
        <div className="rounded-[16px] border border-dashed border-[#E4E4E7] bg-white p-5">
          <div className="flex items-center gap-1.5 text-[12px] text-[#A1A1AA]">
            <GoogleLogo size={14} />
            Google Reviews
            <span className="ml-1 rounded-[6px] bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Coming soon</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[#A1A1AA]">
            Connect your Google Business Profile to see your live rating, review count, and trends here.
          </p>
        </div>

        {/* ─── Stats ─── */}
        <div className="mt-4">
          <StatsCards stats={stats} loading={loading} />
        </div>

        {/* ─── Funnel ─── */}
        <div className="mt-4">
          <Funnel funnel={funnel} loading={loading} />
        </div>

        {/* ─── Needs Attention ─── */}
        {attention.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#F59E0B]">
              Needs attention
            </h2>
            <div className="flex flex-col gap-2">
              {attention.map((item) => (
                <div
                  key={item.sessionId}
                  className="flex items-center gap-3 rounded-[16px] border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                    <span className="text-[12px] font-semibold text-[#D97706]">
                      {item.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#18181B]">{item.name}</p>
                    <p className="text-[13px] text-[#A1A1AA]">{item.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-[#F59E0B] px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-200 hover:bg-[#E58E09] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2"
                  >
                    Nudge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tabs: Reviews / Activity ─── */}
        <div className="mt-8">
          <div className="flex gap-1 rounded-[10px] bg-[#EEEFF1] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition-all duration-200 ${
                activeTab === "reviews"
                  ? "bg-white text-[#18181B] shadow-sm"
                  : "text-[#A1A1AA]"
              }`}
            >
              Recent Reviews
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition-all duration-200 ${
                activeTab === "activity"
                  ? "bg-white text-[#18181B] shadow-sm"
                  : "text-[#A1A1AA]"
              }`}
            >
              All Activity
            </button>
          </div>

          {/* Reviews tab */}
          {activeTab === "reviews" && (
            <div className="mt-3 flex flex-col gap-2.5">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-[120px] animate-pulse rounded-[16px] bg-[#F4F4F5]" />
                ))
              ) : recentReviews.length > 0 ? (
                recentReviews.map((review, i) => (
                  <ReviewCard key={i} review={review} index={i} />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white py-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F5]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-[#A1A1AA]">No reviews yet. Send your first review link to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === "activity" && (
            loading ? (
              <div className="mt-3 flex flex-col gap-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[52px] animate-pulse border-b border-[rgba(228,228,231,0.3)] bg-[#F4F4F5] first:rounded-t-[16px] last:rounded-b-[16px] last:border-b-0" />
                ))}
              </div>
            ) : activityItems.length > 0 ? (
            <div className="mt-3 rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
              {activityItems.map((item, i) => {
                const initials = item.name.split(" ").map((n) => n[0]).join("");
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < activityItems.length - 1 ? "border-b border-[rgba(228,228,231,0.3)]" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F2F5]">
                        <span className="text-[11px] font-semibold text-[#18181B]">{initials}</span>
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: STATUS_DOT[item.status] || "#A1A1AA" }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-[#18181B]">
                        <span className="font-semibold">{item.name}</span>{" "}
                        <span className="text-[#71717A]">{item.action}</span>
                      </p>
                      {item.snippet && (
                        <p className="mt-0.5 truncate text-[12px] text-[#A1A1AA]">
                          &ldquo;{item.snippet.slice(0, 80)}{item.snippet.length > 80 ? "..." : ""}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-[#A1A1AA]">{item.time}</span>
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-2 rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white py-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F5]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <p className="text-[13px] text-[#A1A1AA]">No activity yet. It&rsquo;ll show up here once you start sending links.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ─── FAB — hidden on mobile (tab bar has Send), visible on desktop ─── */}
      <Link
        href="/dashboard/send"
        className="fixed bottom-8 right-8 z-30 hidden items-center gap-2 rounded-full bg-[#0070EB] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_20px_rgba(0,112,235,0.4)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(0,112,235,0.5)] active:scale-95 sm:flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Send Review Link
      </Link>
    </div>
  );
}
