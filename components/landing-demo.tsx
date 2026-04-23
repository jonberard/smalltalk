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
                    Copy &amp; Open Google
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
              Your review is copied.
            </p>
            <p className="mt-2 text-[11px] text-muted">
              Paste it in the Google tab we just opened.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-full bg-[#ECFDF5] px-4 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[11px] font-medium text-[#059669]">Review copied to clipboard</span>
            </div>

            <div className="mt-5 flex w-full gap-2">
              <span className="flex-1 rounded-full border border-[#D1C4B0] py-2.5 text-center text-[11px] font-bold text-muted">
                Copy again
              </span>
              <span className="flex-1 rounded-full bg-primary py-2.5 text-center text-[11px] font-bold text-white">
                Open Google again
              </span>
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
  const STATS = [
    { label: "Copied this month", value: "12", detail: "Detailed review handoffs" },
    { label: "Average rating", value: "4.7", detail: "Across copied reviews" },
    { label: "Completion rate", value: "67%", detail: "Copied from sent requests" },
  ];

  const ATTENTION_RAILS = [
    {
      eyebrow: "Inbox",
      title: "Private feedback",
      count: "2",
      summary: "Jon: The filter still wasn't fixed after the weekly visit.",
      action: "Open inbox",
      tone: "bg-[#EFF6FF] text-[#2563EB]",
    },
    {
      eyebrow: "Replies",
      title: "Public reviews",
      count: "2",
      summary: "Alex: Copied a 5-star review and is ready for a thoughtful reply.",
      action: "Open replies",
      tone: "bg-[#ECFDF5] text-[#059669]",
    },
    {
      eyebrow: "Send",
      title: "Stalled requests",
      count: "3",
      summary: "Sarah: Opened the request yesterday but never started the flow.",
      action: "Open send",
      tone: "bg-[#FFF7ED] text-[#B45309]",
    },
  ];

  const REQUESTS_IN_MOTION = [
    {
      name: "Jon",
      status: "Private feedback",
      statusClass: "bg-[#EFF6FF] text-[#2563EB]",
      stars: "2★",
      starsClass: "bg-[#FEF2F2] text-[#DC2626]",
      note: "Sent private feedback about weekly pool cleaning.",
      meta: "Weekly Pool Cleaning",
      time: "6m ago",
      primaryAction: "View feedback",
      primaryActionClass: "border border-[#D6E4FF] bg-[#F8FBFF] text-[#2563EB]",
    },
    {
      name: "Alex",
      status: "Copied",
      statusClass: "bg-[#FFF7ED] text-[#D97706]",
      stars: "5★",
      starsClass: "bg-[#ECFDF5] text-[#059669]",
      note: "Copied a public review and is ready for a reply.",
      meta: "Weekly Pool Cleaning",
      time: "24m ago",
      primaryAction: "Draft reply",
      secondaryAction: "Open request",
      primaryActionClass: "bg-[#FFF1EC] text-[#E05A3D] border border-[#F3CCBE]",
    },
    {
      name: "Customer",
      status: "Opened",
      statusClass: "bg-[#F3F4F6] text-[#5E7268]",
      note: "Opened the request but never made it into the guided flow.",
      meta: "Spring filter check",
      time: "1h ago",
      primaryAction: "Open request",
      primaryActionClass: "border border-[#E0D5C5] bg-white text-[#1A2E25]",
    },
  ];

  const RUN_NEXT = [
    {
      title: "Inbox",
      description: "Handle unhappy customers first and mark them handled once you’ve followed up.",
      badge: "2 new",
    },
    {
      title: "Replies",
      description: "Draft and copy public replies without pretending we posted them for you.",
      badge: "2 waiting",
    },
    {
      title: "Send from jobs",
      description: "Create personalized requests tied to a specific customer, service, and employee.",
    },
    {
      title: "QR / shared link",
      description: "Use one stable business-wide link on cards, receipts, counters, and signs.",
    },
  ];

  const REQUEST_FLOW = [
    { label: "Sent", value: "24", detail: "Requests sent this month" },
    { label: "Opened", value: "18", detail: "75% of sent" },
    { label: "Copied", value: "12", detail: "Last confirmed handoff" },
  ];

  return (
    <div
      className="overflow-hidden rounded-[28px] border border-[#E2E5E3] bg-[#FAFAF8]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="grid gap-0 lg:grid-cols-[180px,1fr]">
        <div className="border-b border-[#E2E5E3] bg-white p-5 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-[18px] font-semibold text-[#1A2E25]">small Talk</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#8A948E]">
              Owner dashboard
            </p>
          </div>

          <div className="mt-8 space-y-2">
            {([
              ["Home", true],
              ["Inbox", false],
              ["Send", false],
              ["Replies", false],
              ["More", false],
            ] as const).map(([label, active]) => (
              <div
                key={label}
                className={`flex items-center justify-between rounded-[14px] px-3 py-2.5 text-[13px] font-medium ${
                  active ? "bg-[#FFF1EC] text-[#E05A3D]" : "text-[#5E7268]"
                }`}
              >
                <span>{label}</span>
                {label === "Inbox" ? (
                  <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#4F46E5]">
                    2
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[18px] border border-[#E8E5E0] bg-[#FFFCF8] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A948E]">
              Current plan
            </p>
            <p className="mt-2 text-[14px] font-semibold text-[#1A2E25]">
              Growth
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#5E7268]">
              Private feedback, replies, and reminders are all running.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A948E]">
                Home
              </p>
              <h3 className="mt-2 font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[#1A2E25]">
                Good morning, Crystal Clear Pools
              </h3>
              <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-[#5E7268]">
                Start with what needs your attention, then check private feedback, replies, and recent request activity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center justify-center rounded-[14px] border border-[#C84F34] bg-[#E05A3D] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(128,52,34,0.65)]">
                Send request
              </span>
              <span className="inline-flex items-center gap-2 rounded-[14px] border border-[#E0D5C5] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1A2E25] shadow-[0_1px_0_rgba(217,206,191,0.9)]">
                Open inbox
                <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                  2
                </span>
              </span>
            </div>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[18px] border border-[#E2E5E3] bg-white p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A948E]">
                  {stat.label}
                </p>
                <p className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#1A2E25]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[12px] text-[#5E7268]">{stat.detail}</p>
              </div>
            ))}
          </div>

          <section className="mb-5 rounded-[22px] border border-[#F6D9A8] bg-[#FFF8EA] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A16207]">
                  Needs attention now
                </p>
                <h4 className="mt-2 text-[22px] font-semibold tracking-tight text-[#1A2E25]">
                  The work that actually needs you
                </h4>
                <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-[#5E7268]">
                  Home leads with unhappy customers, public reviews waiting on a response, and requests that stalled before they turned into usable reviews.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-medium text-[#5E7268]">
                <span className="h-2 w-2 rounded-full bg-[#E05A3D]" />
                7 open items
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {ATTENTION_RAILS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[16px] border border-white/70 bg-white/90 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A948E]">
                        {item.eyebrow}
                      </p>
                      <h5 className="mt-2 text-[18px] font-semibold tracking-tight text-[#1A2E25]">
                        {item.title}
                      </h5>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>
                      {item.count}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#5E7268]">
                    {item.summary}
                  </p>
                  <p className="mt-4 text-[12px] font-semibold text-[#1A2E25]">{item.action}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <section className="rounded-[22px] border border-[#E2E5E3] bg-white p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8A948E]">
                    Requests in motion
                  </p>
                  <h4 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#1A2E25]">
                    What customers are doing right now
                  </h4>
                </div>
                <span className="text-[12px] font-semibold text-[#5E7268]">Open send</span>
              </div>

              <div className="space-y-3">
                {REQUESTS_IN_MOTION.map((item) => (
                  <div
                    key={`${item.name}-${item.time}`}
                    className="rounded-[16px] border border-[#ECE8E1] bg-[#FFFCF8] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-semibold text-[#1A2E25]">
                            {item.name}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.statusClass}`}>
                            {item.status}
                          </span>
                          {item.stars ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.starsClass}`}>
                              {item.stars}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#1A2E25]">
                          {item.note}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#5E7268]">
                          <span>{item.meta}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {item.secondaryAction ? (
                          <span className="inline-flex items-center justify-center rounded-[13px] border border-[#E0D5C5] bg-white px-4 py-2 text-[12px] font-semibold text-[#1A2E25] shadow-[0_1px_0_rgba(217,206,191,0.9)]">
                            {item.secondaryAction}
                          </span>
                        ) : null}
                        <span className={`inline-flex items-center justify-center rounded-[13px] px-4 py-2 text-[12px] font-semibold shadow-[0_1px_0_rgba(217,206,191,0.55)] ${item.primaryActionClass}`}>
                          {item.primaryAction}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-[#5E7268]">
                This is the operational queue: private feedback, copied reviews ready for replies, and stalled requests that still might turn into usable reviews.
              </p>
            </section>

            <div className="space-y-4">
              <section className="rounded-[22px] border border-[#E2E5E3] bg-white p-5">
                <div className="mb-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8A948E]">
                    Run next
                  </p>
                  <h4 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#1A2E25]">
                    The rest of the owner workflow
                  </h4>
                </div>

                <div className="grid gap-3">
                  {RUN_NEXT.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[15px] border border-[#ECE8E1] bg-[#FFFCF8] px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[#1A2E25]">
                            {item.title}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[#5E7268]">
                            {item.description}
                          </p>
                        </div>
                        {item.badge ? (
                          <span className="rounded-full bg-[#F4EFE8] px-2 py-0.5 text-[10px] font-semibold text-[#1A2E25]">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[22px] border border-[#E2E5E3] bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8A948E]">
                      Request flow
                    </p>
                    <h4 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#1A2E25]">
                      How requests are moving
                    </h4>
                  </div>
                  <div className="flex gap-1 rounded-full bg-[#EFEAE2] p-1">
                    <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1A2E25] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                      Month
                    </span>
                    <span className="px-3 py-1.5 text-[11px] font-semibold text-[#8A948E]">
                      Week
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {REQUEST_FLOW.map((stage) => (
                    <div
                      key={stage.label}
                      className="rounded-[15px] border border-[#ECE8E1] bg-[#FFFCF8] p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A948E]">
                        {stage.label}
                      </p>
                      <p className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#1A2E25]">
                        {stage.value}
                      </p>
                      <p className="mt-1 text-[12px] text-[#5E7268]">{stage.detail}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-[#5E7268]">
                  Copied is the last confirmed handoff. It means the customer copied the review and opened Google. It does not mean we can prove they posted it.
                </p>
              </section>
            </div>
          </div>
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
    <div className="relative mx-auto h-[600px] w-[290px] rounded-[40px] border border-muted/20 bg-text p-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:h-[660px] sm:w-[320px]">
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
