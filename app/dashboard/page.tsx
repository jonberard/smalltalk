"use client";

import { useState } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════
   DATA — Google-only for MVP
   ═══════════════════════════════════════════════════ */

const DATA = {
  businessName: "Crystal Clear Pools",
  google: {
    rating: 4.8,
    totalReviews: 47,
    reviewsThisMonth: 12,
    ratingLastMonth: 4.6,
  },
  funnel: {
    sent: 24,
    clicked: 18,
    drafted: 14,
    posted: 12,
  },
  needsAttention: [
    { name: "James R.", detail: "Drafted a review 5 hours ago but hasn't posted it", status: "drafted" },
    { name: "Linda P.", detail: "Started the flow 2 days ago but didn't finish", status: "abandoned" },
  ],
  recentReviews: [
    {
      name: "Maria G.",
      stars: 5,
      snippet: "Marcus was fantastic. He showed up right on time for our weekly pool cleaning and the pool looks crystal clear. Really impressed with the attention to detail — highly recommend Crystal Clear Pools.",
      time: "2 hours ago",
    },
    {
      name: "Dave M.",
      stars: 5,
      snippet: "Really impressed with the attention to detail. The pool area was spotless after the cleaning, and Marcus even pointed out a small crack in the tile that we hadn't noticed. Going above and beyond.",
      time: "3 days ago",
    },
    {
      name: "Rachel T.",
      stars: 4,
      snippet: "Good service overall. Quick and professional. Would recommend to neighbors. Only reason for 4 stars instead of 5 is that communication about arrival time could be a bit better.",
      time: "5 days ago",
    },
  ],
  activity: [
    { name: "Maria G.", action: "posted a 5-star review", time: "2 hours ago", status: "posted" },
    { name: "James R.", action: "drafted a review", time: "5 hours ago", status: "drafted" },
    { name: "Sarah K.", action: "opened the link", time: "yesterday", status: "clicked" },
    { name: "Tom W.", action: "review link sent", time: "yesterday", status: "sent" },
    { name: "Linda P.", action: "started but didn't finish", time: "2 days ago", status: "abandoned" },
    { name: "Dave M.", action: "posted a 5-star review", time: "3 days ago", status: "posted" },
  ],
};

const STATUS_DOT: Record<string, string> = {
  posted: "#10B981",
  drafted: "#F59E0B",
  abandoned: "#EF4444",
  sent: "#A1A1AA",
  clicked: "#3B82F6",
};

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

/* ─── Funnel ─── */
function Funnel({ funnel }: { funnel: { sent: number; clicked: number; drafted: number; posted: number } }) {
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
          <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-semibold text-[#10B981]">
            {rate}% conversion
          </span>
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
          {/* Bar visualization */}
          <div className="flex flex-col gap-2.5">
            {steps.map((step) => {
              const pct = funnel.sent > 0 ? (step.value / funnel.sent) * 100 : 0;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="w-[52px] text-right text-[12px] text-[#A1A1AA]">{step.label}</span>
                  <div className="relative h-[22px] flex-1 overflow-hidden rounded-full bg-[#F4F4F5]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: step.color }}
                    />
                  </div>
                  <span className="w-[24px] text-[13px] font-semibold text-[#18181B]">{step.value}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[#A1A1AA]">This month</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");
  const { google, funnel, needsAttention, recentReviews, activity } = DATA;

  const delta = google.rating - google.ratingLastMonth;
  const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta === 0 ? "—" : delta.toFixed(1);
  const isUp = delta > 0;

  return (
    <div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
      <div className="mx-auto max-w-[600px] px-5 pb-32 pt-8 sm:pb-16">

        {/* ─── Header ─── */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-[#18181B]">{DATA.businessName}</h1>
          <p className="mt-1 text-[13px] text-[#A1A1AA]">March 2026</p>
        </div>

        {/* ─── Google Hero Card — full width ─── */}
        <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-1.5 text-[12px] text-[#A1A1AA]">
            <GoogleLogo size={14} />
            Google Reviews
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[42px] font-bold leading-none tracking-tight text-[#18181B]">
              {google.rating}
            </span>
            <div className="mb-1 flex flex-col">
              <Stars count={Math.round(google.rating)} size={14} />
              <span className="mt-0.5 text-[12px] text-[#A1A1AA]">{google.totalReviews} reviews</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {delta !== 0 && (
              <div className={`flex items-center gap-0.5 text-[12px] font-semibold ${isUp ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isUp ? "rotate(0)" : "rotate(180deg)" }}>
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                {deltaStr} this month
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-[8px] bg-[#EFF6FF] px-2.5 py-1.5">
              <span className="text-[18px] font-bold text-[#4285F4]">{google.reviewsThisMonth}</span>
              <span className="text-[12px] text-[#5B9BD5]">new this month</span>
            </div>
          </div>
        </div>

        {/* ─── Funnel — collapsible ─── */}
        <div className="mt-4">
          <Funnel funnel={funnel} />
        </div>

        {/* ─── Needs Attention ─── */}
        {needsAttention.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#F59E0B]">
              Needs attention
            </h2>
            <div className="flex flex-col gap-2">
              {needsAttention.map((item, i) => (
                <div
                  key={i}
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
              {recentReviews.length > 0 ? (
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
            activity.length > 0 ? (
            <div className="mt-3 rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
              {activity.map((item, i) => {
                const initials = item.name.split(" ").map((n) => n[0]).join("");
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < activity.length - 1 ? "border-b border-[rgba(228,228,231,0.3)]" : ""
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
