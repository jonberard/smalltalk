"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonCard, SkeletonRow } from "@/components/dashboard/skeleton";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ═══════════════════════════════════════════════════
   INLINE SVG ICONS
   ═══════════════════════════════════════════════════ */

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
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={14} height={14} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#E05A3D" : "#D1D5DB"} stroke="none">
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
        cx="22" cy="22" r={radius} fill="none"
        stroke="#E05A3D" strokeWidth="3"
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
    rating >= 4 ? "text-[#059669] bg-[#ECFDF5]" :
    rating === 3 ? "text-[#D97706] bg-[#FFFBEB]" :
    "text-[#DC2626] bg-[#FEF2F2]";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {rating}<span className="text-[10px]">★</span>
    </span>
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
  const [stats, setStats] = useState<DashboardStats>({
    reviewsThisMonth: 0,
    avgRating: 0,
    completionRate: 0,
    totalLinks: 0,
  });
  const [funnel, setFunnel] = useState<FunnelData>({ sent: 0, opened: 0, started: 0, drafted: 0, posted: 0 });
  const [funnelFilter, setFunnelFilter] = useState<FunnelFilter>("month");
  const [funnelLoading, setFunnelLoading] = useState(true);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { business } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Safety net: verify subscription with Stripe after checkout redirect
  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    if (!business) return;

    // Remove ?checkout=success from URL so it doesn't re-fire
    router.replace("/dashboard", { scroll: false });

    fetchWithAuth("/api/verify-subscription", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.updated) {
          console.log("[dashboard] Subscription verified via Stripe:", data.subscription_status);
          // Reload to pick up the updated business record
          window.location.href = "/dashboard";
        }
      })
      .catch((err) => {
        console.error("[dashboard] Failed to verify subscription:", err);
      });
  }, [searchParams, business, router]);

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

      // ── Activity Feed ──
      const recentActivity = sessions.slice(0, 15);
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

  // ── Funnel (separate effect so time filter can re-trigger) ──
  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchFunnel() {
      setFunnelLoading(true);

      // Determine date filter
      let dateFrom: string | null = null;
      const now = new Date();
      if (funnelFilter === "month") {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (funnelFilter === "week") {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay()); // start of week (Sunday)
        d.setHours(0, 0, 0, 0);
        dateFrom = d.toISOString();
      }

      // Count sent links
      let linksQuery = supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      if (dateFrom) linksQuery = linksQuery.gte("created_at", dateFrom);
      const { count: sentCount } = await linksQuery;
      const sent = sentCount ?? 0;

      // Get sessions
      let sessionsQuery = supabase
        .from("review_sessions")
        .select("status, review_links!inner(business_id)")
        .eq("review_links.business_id", businessId);
      if (dateFrom) sessionsQuery = sessionsQuery.gte("created_at", dateFrom);
      const { data: funnelSessions } = await sessionsQuery;
      const ss = funnelSessions || [];

      const opened = ss.filter((s) => isAtOrBeyond(s.status, "created")).length;
      const started = ss.filter((s) => isAtOrBeyond(s.status, "in_progress")).length;
      const drafted = ss.filter((s) => isAtOrBeyond(s.status, "drafted")).length;
      const posted = ss.filter((s) => s.status === "copied").length;

      setFunnel({ sent, opened, started, drafted, posted });
      setFunnelLoading(false);
    }

    fetchFunnel();
  }, [business, funnelFilter]);

  const FUNNEL_STAGES: { key: keyof FunnelData; label: string }[] = [
    { key: "sent", label: "Sent" },
    { key: "opened", label: "Opened" },
    { key: "started", label: "Started" },
    { key: "drafted", label: "Drafted" },
    { key: "posted", label: "Posted" },
  ];

  const FILTER_OPTIONS: { key: FunnelFilter; label: string }[] = [
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "all", label: "All time" },
  ];

  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">

        {/* ─── Welcome Header ─── */}
        <div className="mb-6">
          <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">
            {getGreeting()}, {business?.name || "there"}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
            Here&rsquo;s how your reviews are doing
          </p>
        </div>

        {/* ─── Stat Cards ─── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<CalendarIcon />}
              label="Reviews This Month"
              value={stats.reviewsThisMonth}
            />
            <StatCard
              icon={<StarIcon />}
              label="Average Rating"
              value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "\u2014"}
              detail={stats.avgRating > 0 ? <MiniStars rating={stats.avgRating} /> : undefined}
            />
            <StatCard
              icon={<ChartIcon />}
              label="Completion Rate"
              value={stats.totalLinks > 0 ? `${stats.completionRate}%` : "\u2014"}
              detail={stats.totalLinks > 0 ? <ProgressRing percentage={stats.completionRate} /> : undefined}
            />
          </div>
        )}

        {/* ─── Conversion Funnel ─── */}
        <div className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--dash-text)]">Conversion Funnel</h2>
            <div className="flex gap-1 rounded-[var(--dash-radius-sm)] bg-[var(--dash-border)]/40 p-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFunnelFilter(opt.key)}
                  className={`rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-all duration-150 ${
                    funnelFilter === opt.key
                      ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-sm"
                      : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)] sm:p-6">
            {(() => {
              const hasData = !funnelLoading && funnel.sent > 0;
              const isEmpty = !funnelLoading && funnel.sent === 0;

              // Coral gradient: lightest at Sent → full coral at Posted
              const STAGE_FILLS = [
                "bg-[#E05A3D]/[0.06]",
                "bg-[#E05A3D]/[0.12]",
                "bg-[#E05A3D]/[0.20]",
                "bg-[#E05A3D]/[0.35]",
                "bg-[#E05A3D] text-white shadow-[0_0_20px_rgba(224,90,61,0.25)]",
              ];
              const STAGE_TEXT_COLORS = [
                "text-[var(--dash-text)]",
                "text-[var(--dash-text)]",
                "text-[var(--dash-text)]",
                "text-[var(--dash-text)]",
                "text-white",
              ];
              const STAGE_LABEL_COLORS = [
                "text-[var(--dash-muted)]",
                "text-[var(--dash-muted)]",
                "text-[var(--dash-muted)]",
                "text-[var(--dash-muted)]",
                "text-white/70",
              ];

              return (
                <>
                  {/* Desktop: horizontal */}
                  <div className="hidden sm:block">
                    <div className="flex items-start">
                      {FUNNEL_STAGES.map((stage, i) => {
                        const value = funnel[stage.key];
                        const prevValue = i > 0 ? funnel[FUNNEL_STAGES[i - 1].key] : null;
                        const pct = prevValue && prevValue > 0 ? Math.round((value / prevValue) * 100) : null;
                        const dropOff = prevValue !== null ? prevValue - value : null;
                        const isLast = i === FUNNEL_STAGES.length - 1;

                        return (
                          <div key={stage.key} className="flex flex-1 items-start">
                            {/* Arrow + conversion between stages */}
                            {i > 0 && (
                              <div className="flex flex-col items-center justify-center pt-5" style={{ width: 48 }}>
                                <span className="text-[11px] font-semibold text-[var(--dash-muted)]">
                                  {funnelLoading ? "\u2014" : pct !== null ? `${pct}%` : ""}
                                </span>
                                <svg width={24} height={14} viewBox="0 0 24 14" fill="none" className="my-0.5">
                                  <path d="M0 7h20M16 3l4 4-4 4" stroke="var(--dash-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {hasData && dropOff !== null && dropOff > 0 && (
                                  <span className="text-[10px] font-medium text-[#DC2626]">
                                    {dropOff} lost
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Stage card */}
                            <div
                              className={`flex flex-1 flex-col items-center rounded-[var(--dash-radius)] px-3 py-5 transition-all duration-200 ${
                                funnelLoading ? "bg-[var(--dash-border)]/30 animate-pulse" : STAGE_FILLS[i]
                              }`}
                            >
                              <span className={`text-[11px] font-medium uppercase tracking-wide ${funnelLoading ? "text-transparent" : STAGE_LABEL_COLORS[i]}`}>
                                {stage.label}
                              </span>
                              <span className={`mt-1 text-[24px] font-bold leading-none ${funnelLoading ? "text-transparent" : STAGE_TEXT_COLORS[i]}`}>
                                {funnelLoading ? "0" : value}
                              </span>
                              {isLast && hasData && (
                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile: vertical */}
                  <div className="sm:hidden">
                    <div className="flex flex-col">
                      {FUNNEL_STAGES.map((stage, i) => {
                        const value = funnel[stage.key];
                        const prevValue = i > 0 ? funnel[FUNNEL_STAGES[i - 1].key] : null;
                        const pct = prevValue && prevValue > 0 ? Math.round((value / prevValue) * 100) : null;
                        const dropOff = prevValue !== null ? prevValue - value : null;
                        const isLast = i === FUNNEL_STAGES.length - 1;

                        return (
                          <div key={stage.key}>
                            {/* Arrow + stats between stages */}
                            {i > 0 && (
                              <div className="flex items-center gap-3 py-2 pl-6">
                                <svg width={14} height={20} viewBox="0 0 14 20" fill="none">
                                  <path d="M7 0v16M3 12l4 4 4-4" stroke="var(--dash-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[11px] font-semibold text-[var(--dash-muted)]">
                                  {funnelLoading ? "" : pct !== null ? `${pct}%` : ""}
                                </span>
                                {hasData && dropOff !== null && dropOff > 0 && (
                                  <span className="text-[10px] font-medium text-[#DC2626]">
                                    {dropOff} lost
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Stage bar */}
                            <div
                              className={`flex items-center justify-between rounded-[var(--dash-radius)] px-5 py-4 transition-all duration-200 ${
                                funnelLoading ? "bg-[var(--dash-border)]/30 animate-pulse" : STAGE_FILLS[i]
                              }`}
                            >
                              <span className={`text-[12px] font-medium uppercase tracking-wide ${funnelLoading ? "text-transparent" : STAGE_LABEL_COLORS[i]}`}>
                                {stage.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[22px] font-bold leading-none ${funnelLoading ? "text-transparent" : STAGE_TEXT_COLORS[i]}`}>
                                  {funnelLoading ? "0" : value}
                                </span>
                                {isLast && hasData && (
                                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Empty state message */}
                  {isEmpty && (
                    <p className="mt-4 text-center text-[13px] text-[var(--dash-muted)]">
                      Send your first review link to start tracking conversions.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* ─── Two-Column Layout ─── */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-5">

          {/* ─── Left Column: Recent Activity ─── */}
          <div className="sm:col-span-3">
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]" style={{ fontFamily: "Inter, sans-serif" }}>
              Recent Activity
            </h2>
            <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : activityItems.length > 0 ? (
                activityItems.map((item, i) => {
                  const initial = item.name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3.5 ${
                        i < activityItems.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dash-border)]/60">
                        <span className="text-[12px] font-semibold text-[var(--dash-muted)]">{initial}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[var(--dash-text)]">{item.name}</span>
                          <StatusPill status={item.status} />
                        </div>
                      </div>
                      {item.stars && <RatingBadge rating={item.stars} />}
                      <span className="shrink-0 text-[11px] text-[var(--dash-muted)]">{item.time}</span>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  }
                  title="No activity yet"
                  description="Send your first review link to see activity here"
                />
              )}
            </div>
          </div>

          {/* ─── Right Column: Needs Attention ─── */}
          <div className="sm:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--dash-text)]" style={{ fontFamily: "Inter, sans-serif" }}>
                Needs Attention
              </h2>
              {attention.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E05A3D] text-[10px] font-semibold text-white">
                  {attention.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : attention.length > 0 ? (
              <div className="flex flex-col gap-3">
                {attention.map((item) => {
                  const initial = item.name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={item.sessionId}
                      className="rounded-[var(--dash-radius)] border border-[#FEF3C7] bg-[#FFFBEB] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                          <span className="text-[12px] font-semibold text-[#D97706]">{initial}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-[var(--dash-text)]">{item.name}</p>
                          <p className="mt-0.5 text-[12px] text-[var(--dash-muted)]">{item.detail}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-[var(--dash-radius-sm)] border border-[#E05A3D] px-3 py-1 text-[11px] font-semibold text-[#E05A3D] transition-colors hover:bg-[#E05A3D]/5 active:scale-[0.97]"
                        >
                          Nudge
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
                <div className="flex flex-col items-center gap-2 text-center">
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="text-[13px] font-medium text-[#059669]">All caught up</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
