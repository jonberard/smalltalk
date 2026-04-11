"use client";

import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════
   AUTO-PLAYING DEMO — Landing Page
   Tab 1: Looping animation of the review journey
   Tab 2: Dashboard screenshot replica (static)
   ═══════════════════════════════════════════════════ */

/* ─── ANIMATION DATA ─── */

const DEMO_TOPICS = ["Timeliness", "Work Quality", "Communication", "Pricing", "Professionalism"];
const TAPPED_TOPICS = ["Timeliness", "Work Quality", "Communication"];
const FOLLOWUP_OPTION = "Right on time";
const TYPING_TEXT = "He wore booties to protect the deck";
const DEMO_REVIEW =
  "Crystal Clear Pools knocked it out of the park. Marcus showed up right on time and even wore booties to protect the deck — that kind of detail goes a long way. The pool looks crystal clear, best it's looked in months. Communication was great too, got a heads-up text before he arrived. Highly recommend.";

/* ─── ANIMATION PHASES ─── */

type Phase =
  | "welcome"        // Show greeting + empty stars
  | "star-tap"       // Cursor taps 5th star, all fill
  | "topics"         // Show topic chips
  | "topic-tap-0"    // Cursor taps first chip
  | "topic-tap-1"    // Cursor taps second chip
  | "topic-tap-2"    // Cursor taps third chip
  | "topics-continue"// Continue button highlights
  | "followup"       // Show follow-up question
  | "followup-tap"   // Cursor taps answer
  | "detail"         // Show detail textarea
  | "detail-typing"  // Text types into textarea
  | "review-shimmer" // Shimmer loading
  | "review-done"    // Show generated review
  | "review-tap"     // Cursor taps Copy & post
  | "interstitial"   // Brief interstitial flash
  | "success";       // Checkmark celebration

const PHASE_SEQUENCE: { phase: Phase; duration: number }[] = [
  { phase: "welcome", duration: 1200 },
  { phase: "star-tap", duration: 1000 },
  { phase: "topics", duration: 800 },
  { phase: "topic-tap-0", duration: 500 },
  { phase: "topic-tap-1", duration: 500 },
  { phase: "topic-tap-2", duration: 500 },
  { phase: "topics-continue", duration: 800 },
  { phase: "followup", duration: 800 },
  { phase: "followup-tap", duration: 800 },
  { phase: "detail", duration: 600 },
  { phase: "detail-typing", duration: 2000 },
  { phase: "review-shimmer", duration: 2000 },
  { phase: "review-done", duration: 2000 },
  { phase: "review-tap", duration: 800 },
  { phase: "interstitial", duration: 1800 },
  { phase: "success", duration: 2000 },
];

/* ─── SCREEN GROUPING — which screen is showing ─── */

function getScreen(phase: Phase): string {
  if (phase === "welcome" || phase === "star-tap") return "stars";
  if (phase.startsWith("topic")) return "topics";
  if (phase.startsWith("followup")) return "followup";
  if (phase.startsWith("detail")) return "detail";
  if (phase.startsWith("review")) return "review";
  if (phase === "interstitial") return "interstitial";
  return "success";
}

/* ═══════════════════════════════════════════════════
   TAB 1: AUTO-PLAYING CONSUMER FLOW ANIMATION
   ═══════════════════════════════════════════════════ */

function DemoFlow() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPhase = PHASE_SEQUENCE[phaseIndex].phase;
  const currentScreen = getScreen(currentPhase);

  // Advance phases
  useEffect(() => {
    const { duration } = PHASE_SEQUENCE[phaseIndex];

    timerRef.current = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % PHASE_SEQUENCE.length;
      const nextScreen = getScreen(PHASE_SEQUENCE[nextIndex].phase);

      // Fade transition between screens
      if (nextScreen !== currentScreen) {
        setTransitioning(true);
        setTimeout(() => {
          setPhaseIndex(nextIndex);
          if (nextIndex === 0) setTypedChars(0);
          setTransitioning(false);
        }, 300);
      } else {
        setPhaseIndex(nextIndex);
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phaseIndex, currentScreen]);

  // Typing animation
  useEffect(() => {
    if (currentPhase !== "detail-typing") return;
    setTypedChars(0);
    const interval = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= TYPING_TEXT.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / TYPING_TEXT.length);
    return () => clearInterval(interval);
  }, [currentPhase]);

  // Which topics are "tapped" so far
  const tappedCount =
    currentPhase === "topic-tap-0" ? 1 :
    currentPhase === "topic-tap-1" ? 2 :
    (currentPhase === "topic-tap-2" || currentPhase === "topics-continue") ? 3 : 0;

  const filledStars = currentPhase === "star-tap" ? 5 : (currentScreen === "stars" ? 0 : 5);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="flex flex-1 flex-col items-center justify-center px-6"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        {/* ─── WELCOME / STARS ─── */}
        {currentScreen === "stars" && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-[13px] font-bold text-white">CCP</span>
            </div>
            <p className="font-heading text-[16px] font-semibold leading-tight text-text">
              Hey Alex, how was<br />your service?
            </p>
            <p className="mt-2 text-[12px] text-muted">Weekly Pool Cleaning with Marcus</p>
            <div className="relative mt-6 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded p-0.5">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill={i <= filledStars ? "var(--color-primary)" : "none"}
                    stroke={i <= filledStars ? "var(--color-primary)" : "#C8CCC9"}
                    strokeWidth="1"
                    style={{
                      transition: "fill 150ms ease, stroke 150ms ease",
                      transitionDelay: currentPhase === "star-tap" ? `${(i - 1) * 80}ms` : "0ms",
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              ))}
              {/* Cursor dot on 5th star */}
              {currentPhase === "star-tap" && <CursorDot style={{ top: "50%", right: "-2px", transform: "translate(0, -50%)" }} />}
            </div>
            {currentPhase === "star-tap" && (
              <p className="mt-3 text-[12px] text-muted" style={{ animation: "demo-fade 400ms ease-out" }}>
                Wonderful!
              </p>
            )}
          </div>
        )}

        {/* ─── TOPICS ─── */}
        {currentScreen === "topics" && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-[13px] font-bold text-white">CCP</span>
            </div>
            <p className="font-heading text-[16px] font-semibold text-text">What stood out?</p>
            <p className="mt-1.5 text-[12px] text-muted">Tap the topics that matter</p>
            <div className="relative mt-5 flex flex-wrap justify-center gap-2">
              {DEMO_TOPICS.map((label, idx) => {
                const tappedIdx = TAPPED_TOPICS.indexOf(label);
                const isTapped = tappedIdx !== -1 && tappedIdx < tappedCount;
                const isBeingTapped =
                  (currentPhase === "topic-tap-0" && tappedIdx === 0) ||
                  (currentPhase === "topic-tap-1" && tappedIdx === 1) ||
                  (currentPhase === "topic-tap-2" && tappedIdx === 2);

                return (
                  <div key={label} className="relative">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium transition-all duration-200 ${
                        isTapped ? "bg-primary text-white" : "border border-[#D1C4B0] bg-surface text-text"
                      }`}
                    >
                      {isTapped && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {label}
                    </div>
                    {isBeingTapped && <CursorDot style={{ bottom: "-4px", right: "-4px" }} />}
                  </div>
                );
              })}
            </div>
            <div
              className={`mt-6 w-full rounded-full py-3 text-center text-[13px] font-bold text-white transition-all duration-300 ${
                tappedCount > 0 ? "bg-primary" : "bg-primary/40"
              }`}
            >
              Continue
              {currentPhase === "topics-continue" && <CursorDot style={{ position: "absolute", bottom: "-4px", right: "30%", transform: "translateX(50%)" }} />}
            </div>
          </div>
        )}

        {/* ─── FOLLOW-UP ─── */}
        {currentScreen === "followup" && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-[13px] font-bold text-white">CCP</span>
            </div>
            <p className="font-heading text-[16px] font-semibold text-text">How was the timing?</p>
            <p className="mt-1.5 text-[12px] text-muted">Timeliness</p>
            <div className="mt-5 flex w-full flex-col gap-2">
              {["Early", "Right on time", "A bit late", "Very late"].map((opt) => {
                const isSelected = currentPhase === "followup-tap" && opt === FOLLOWUP_OPTION;
                return (
                  <div
                    key={opt}
                    className={`relative w-full rounded-[12px] border px-4 py-3 text-left text-[13px] font-medium transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-[#D1C4B0] bg-surface text-text"
                    }`}
                  >
                    {opt}
                    {isSelected && <CursorDot style={{ bottom: "-4px", right: "-4px" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── DETAIL (Optional) ─── */}
        {currentScreen === "detail" && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-[13px] font-bold text-white">CCP</span>
            </div>
            <p className="font-heading text-[16px] font-semibold text-text">Anything else?</p>
            <p className="mt-1.5 text-[12px] text-muted">Optional — add a personal touch</p>
            <div className="relative mt-5 w-full rounded-[12px] border border-[#D1C4B0] bg-surface p-4">
              <p className="min-h-[56px] text-left text-[12px] leading-[1.6] text-text">
                {currentPhase === "detail-typing" ? (
                  <>
                    {TYPING_TEXT.slice(0, typedChars)}
                    <span className="inline-block h-[13px] w-[1px] animate-pulse bg-text align-middle" />
                  </>
                ) : (
                  <span className="text-muted">Add any details you&rsquo;d like to share...</span>
                )}
              </p>
            </div>
            <div className="mt-6 w-full rounded-full bg-primary py-3 text-center text-[13px] font-bold text-white">
              Continue
            </div>
          </div>
        )}

        {/* ─── REVIEW DRAFT ─── */}
        {currentScreen === "review" && (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-[13px] font-bold text-white">CCP</span>
            </div>
            <p className="font-heading text-[16px] font-semibold text-text text-center">
              {currentPhase === "review-shimmer" ? "Crafting your review" : "Your review is ready"}
            </p>
            {currentPhase !== "review-shimmer" && (
              <p className="mt-1.5 text-[12px] text-muted">Edit anything, or post as-is</p>
            )}
            <div className="mt-5 w-full">
              {currentPhase === "review-shimmer" ? (
                <div className="rounded-[12px] border border-[#D1C4B0] bg-surface p-4">
                  <div className="space-y-2.5">
                    {[100, 92, 80, 55].map((w, i) => (
                      <div
                        key={i}
                        className="h-[12px] rounded-full bg-accent/60"
                        style={{
                          width: `${w}%`,
                          animation: `demo-shimmer 1.8s ease-in-out ${i * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-center text-[11px] text-muted">Writing your review...</p>
                </div>
              ) : (
                <div className="rounded-[12px] border border-[#D1C4B0] bg-surface p-4" style={{ animation: "demo-fade 400ms ease-out" }}>
                  <p className="text-[11px] leading-[1.6] text-text">
                    {DEMO_REVIEW}
                  </p>
                </div>
              )}
            </div>
            {(currentPhase === "review-done" || currentPhase === "review-tap") && (
              <div className="relative mt-4 flex w-full gap-2" style={{ animation: "demo-fade 400ms ease-out" }}>
                <span className="flex-1 rounded-full border border-[#D1C4B0] py-2.5 text-center text-[11px] font-bold text-muted">
                  Try another
                </span>
                <div className="relative flex-1">
                  <div className="rounded-full bg-primary py-2.5 text-center text-[11px] font-bold text-white">
                    Copy &amp; post
                  </div>
                  {currentPhase === "review-tap" && <CursorDot style={{ bottom: "-4px", right: "-4px" }} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── INTERSTITIAL ─── */}
        {currentScreen === "interstitial" && (
          <div className="flex flex-col items-center text-center -mt-2">
            <p className="font-heading text-[18px] font-bold leading-tight text-text">
              You&rsquo;re almost there.
            </p>
            <p className="mt-2 text-[11px] text-muted">
              We copied your review — here&rsquo;s how to post it.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-full bg-[#ECFDF5] px-4 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[11px] font-medium text-[#059669]">Review copied to clipboard</span>
            </div>

            <div className="mt-5 w-full rounded-full bg-primary py-3 text-center text-[13px] font-bold text-white">
              Take me to Google &rarr;
            </div>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {currentScreen === "success" && (
          <div className="flex flex-col items-center text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5]"
              style={{ animation: "demo-scale-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-heading text-[18px] font-bold text-text">You&rsquo;re all set!</p>
            <p className="mt-2 text-[12px] text-muted">
              Thanks for helping Crystal Clear Pools
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes demo-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes demo-shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes demo-scale-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes demo-cursor-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

/* ─── CURSOR DOT ─── */

function CursorDot({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="absolute z-10 h-[18px] w-[18px] rounded-full"
      style={{
        background: "rgba(0, 0, 0, 0.3)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        animation: "demo-cursor-pulse 800ms ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2: STATIC DASHBOARD REPLICA
   ═══════════════════════════════════════════════════ */

function DashboardPreview() {
  const FUNNEL = [
    { label: "Sent", value: 65, pct: 100 },
    { label: "Opened", value: 52, pct: 80 },
    { label: "Started", value: 48, pct: 74 },
    { label: "Drafted", value: 42, pct: 65 },
    { label: "Posted", value: 38, pct: 58 },
  ];

  const ACTIVITIES = [
    { name: "Sarah M.", action: "posted a 5-star review", time: "12m ago", stars: 5, status: "posted" },
    { name: "James T.", action: "started the review flow", time: "34m ago", stars: null, status: "in_progress" },
    { name: "Maria L.", action: "posted a 4-star review", time: "1h ago", stars: 4, status: "posted" },
    { name: "David K.", action: "drafted a review", time: "2h ago", stars: 5, status: "drafted" },
    { name: "Lisa P.", action: "posted a 5-star review", time: "3h ago", stars: 5, status: "posted" },
    { name: "Robert C.", action: "opened the link", time: "5h ago", stars: null, status: "created" },
  ];

  return (
    <div className="rounded-2xl border border-[#E2E5E3] bg-[#F8F9FA] p-5 sm:p-8" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-[20px] font-semibold text-[#1A2E25]">Crystal Clear Pools</h3>
          <p className="mt-0.5 text-[13px] text-[#5E7268]">Dashboard &middot; This month</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E05A3D]">
          <span className="text-[12px] font-bold text-white">CCP</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Reviews this month", value: "47", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
          { label: "Average rating", value: "4.8", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
          { label: "Completion rate", value: "72%", icon: "M22 11.08V12a10 10 0 11-5.93-9.14" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#E2E5E3] bg-white p-4 sm:p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#E05A3D]/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <p className="text-[24px] font-bold leading-none text-[#1A2E25] sm:text-[28px]">{s.value}</p>
            <p className="mt-1 text-[12px] text-[#5E7268]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="mb-6 rounded-xl border border-[#E2E5E3] bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-[#1A2E25]">Conversion Funnel</p>
          <div className="flex rounded-full border border-[#E2E5E3] p-0.5">
            {["This week", "This month"].map((label, i) => (
              <span
                key={label}
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                  i === 1
                    ? "bg-[#E05A3D] text-white"
                    : "text-[#5E7268]"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {FUNNEL.map((stage, i) => {
            const isLast = i === FUNNEL.length - 1;
            const prevValue = i > 0 ? FUNNEL[i - 1].value : null;
            const dropoff = prevValue ? prevValue - stage.value : null;
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-[60px] text-right text-[12px] font-medium text-[#5E7268]">{stage.label}</span>
                <div className="h-[20px] flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="flex h-full items-center justify-end rounded-full px-2.5 transition-all"
                    style={{
                      width: `${stage.pct}%`,
                      background: isLast
                        ? "#E05A3D"
                        : `rgba(224, 90, 61, ${0.12 + i * 0.14})`,
                    }}
                  >
                    <span className={`text-[11px] font-bold ${isLast ? "text-white" : "text-[#E05A3D]"}`}>
                      {stage.value}
                    </span>
                  </div>
                </div>
                {dropoff !== null && dropoff > 0 && (
                  <span className="w-[40px] text-[10px] font-medium text-[#DC2626]">-{dropoff}</span>
                )}
                {dropoff === null && <span className="w-[40px]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border border-[#E2E5E3] bg-white p-4 sm:p-5">
        <p className="mb-3 text-[14px] font-semibold text-[#1A2E25]">Recent Activity</p>
        <div className="space-y-3">
          {ACTIVITIES.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[10px] font-bold text-[#5E7268]">
                {a.name.split(" ").map((w) => w[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[#1A2E25]">
                  <span className="font-semibold">{a.name}</span>{" "}
                  <span className="text-[#5E7268]">{a.action}</span>
                </p>
              </div>
              {a.stars ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  a.stars >= 4 ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FFFBEB] text-[#D97706]"
                }`}>
                  {a.stars}★
                </span>
              ) : (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  a.status === "in_progress"
                    ? "bg-[#FFF7ED] text-[#EA580C]"
                    : "bg-[#F3F4F6] text-[#5E7268]"
                }`}>
                  {a.status === "in_progress" ? "In Progress" : "Opened"}
                </span>
              )}
              <span className="shrink-0 text-[11px] text-[#5E7268]">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PHONE FRAME — matches "How It Works" style
   ═══════════════════════════════════════════════════ */

function PhoneFrame({ children, bg = "bg-white" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="relative mx-auto h-[600px] w-[290px] rounded-[40px] border border-[#D5D5D5] bg-[#F0F0F0] p-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:h-[660px] sm:w-[320px]">
      <div className="absolute inset-x-0 top-[5px] z-20 flex justify-center">
        <div className="h-[13px] w-[44px] rounded-full bg-black" />
      </div>
      <div className={`relative flex h-full flex-col overflow-hidden rounded-[37px] ${bg}`}>
        {/* Status bar spacer */}
        <div className="h-[36px] shrink-0" />
        {children}
      </div>
      <div className="mx-auto mt-[2px] h-[3px] w-[70px] rounded-full bg-black/15" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT — Demo Section
   ═══════════════════════════════════════════════════ */

export default function LandingDemo() {
  const [tab, setTab] = useState<"customer" | "dashboard">("customer");

  return (
    <div className="text-center">
      {/* Tabs */}
      <div className="mb-10 inline-flex rounded-full border border-[#E8E5E0] bg-surface p-1">
        {(
          [
            { key: "customer" as const, label: "What your customer sees" },
            { key: "dashboard" as const, label: "Your dashboard" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-200 sm:px-6 ${
              tab === t.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex justify-center">
        {tab === "customer" ? (
          <PhoneFrame>
            <DemoFlow />
          </PhoneFrame>
        ) : (
          <div className="w-full max-w-[900px]">
            <DashboardPreview />
          </div>
        )}
      </div>
    </div>
  );
}
