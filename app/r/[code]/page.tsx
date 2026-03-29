"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════ */

const TEST_DATA = {
  businessName: "Crystal Clear Pools",
  businessInitials: "CCP",
  employeeName: "Marcus",
  serviceType: "Weekly Pool Cleaning",
  customerName: "Alex",
  googleReviewUrl:
    "https://search.google.com/local/writereview?placeid=PLACEHOLDER",
  hardcodedReviews: {
    positive: [
      "Marcus was fantastic. He showed up right on time for our weekly pool cleaning and the pool looks crystal clear. Really impressed with the attention to detail — highly recommend Crystal Clear Pools.",
      "Can't say enough good things about Crystal Clear Pools. Marcus was professional, thorough, and left everything spotless. The pool has never looked better. Will definitely keep using them.",
      "Great experience with Crystal Clear Pools. Marcus arrived on schedule, was super friendly, and did an excellent job on the weekly cleaning. You can tell he takes pride in his work.",
    ],
    mixed: [
      "Crystal Clear Pools does solid work — the pool always looks great after Marcus visits. Communication could be a little better though; I wasn't sure exactly when he'd arrive. Overall still a good experience and fair pricing.",
      "The actual pool cleaning from Crystal Clear Pools is good — Marcus knows what he's doing. I'd just appreciate a heads up on arrival time. Service itself is reliable, just wish the communication matched.",
      "Marcus does a nice job with the cleaning and the pool looks good after each visit. Scheduling has been a bit inconsistent though. The work quality keeps me coming back, but there's room to improve on the logistics side.",
    ],
    negative: [
      "Had some issues with my recent service. The tech arrived later than expected and I had trouble getting updates on the schedule. The pool cleaning itself was fine but the overall experience was frustrating.",
      "Disappointed with Crystal Clear Pools lately. Communication has been poor — missed the scheduled window and no heads up. The cleaning was okay but the lack of professionalism is concerning.",
      "Not a great experience. Waited around for a while past the scheduled time with no update. When Marcus did arrive the work was adequate, but the service as a whole needs improvement.",
    ],
  },
};

type TopicDef = {
  label: string;
  followUp: string;
  options: string[];
};

const SHARED_TOPICS: TopicDef[] = [
  { label: "Timeliness", followUp: "How was the timing?", options: ["Early", "Right on time", "A bit late", "Very late"] },
  { label: "Work Quality", followUp: "How was the quality of work?", options: ["Exceptional", "Solid", "Acceptable", "Needs improvement"] },
  { label: "Communication", followUp: "How was communication?", options: ["Excellent", "Good", "Could improve", "Poor"] },
  { label: "Pricing", followUp: "How was the pricing?", options: ["Great value", "Fair", "A bit high", "Overpriced"] },
  { label: "Professionalism", followUp: "How professional was the service?", options: ["Outstanding", "Professional", "Adequate", "Unprofessional"] },
  { label: "Cleanliness", followUp: "How clean was the work area after?", options: ["Spotless", "Clean", "Mostly clean", "Left a mess"] },
];

const TIER_TOPICS: Record<string, TopicDef[]> = {
  positive: [
    ...SHARED_TOPICS,
    { label: "Went Above & Beyond", followUp: "In what way did they go above and beyond?", options: ["Truly exceptional", "Went the extra mile", "A nice touch", "Not really"] },
    { label: "Would Recommend", followUp: "Would you recommend them?", options: ["Absolutely", "Yes", "Maybe", "Probably not"] },
  ],
  neutral: [
    ...SHARED_TOPICS,
    { label: "What Went Well", followUp: "What went well?", options: ["Outstanding", "Good", "Decent", "Nothing stood out"] },
    { label: "What Could Improve", followUp: "What could improve?", options: ["Minor things", "Several things", "Significant issues", "Major changes needed"] },
  ],
  negative: [
    ...SHARED_TOPICS,
    { label: "Responsiveness", followUp: "How responsive were they?", options: ["Very responsive", "Responsive", "Slow", "Unresponsive"] },
    { label: "Follow-Through", followUp: "Did they follow through?", options: ["Completely", "Mostly", "Partially", "Not at all"] },
    { label: "Didn't Fix the Problem", followUp: "Was the issue resolved?", options: ["Fully resolved", "Partially fixed", "Not fixed", "Made it worse"] },
  ],
};

const OTHER_TOPIC: TopicDef = {
  label: "Other",
  followUp: "How was this aspect?",
  options: ["Great", "Good", "Fair", "Poor"],
};

function getTier(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

function getSentiment(
  rating: number,
  answers: Record<string, { option: string }>
): "positive" | "mixed" | "negative" {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "mixed";
}

/* ═══════════════════════════════════════════════════
   FLOW STATE
   ═══════════════════════════════════════════════════ */

type Step =
  | "stars"
  | "low-rating-choice"
  | "topics"
  | "followup"
  | "detail"
  | "review"
  | "success"
  | "private-feedback"
  | "private-success";

type TopicAnswer = { option: string; detail: string };

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */

function Avatar() {
  return (
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
      <span className="font-heading text-[20px] font-bold text-white">
        {TEST_DATA.businessInitials}
      </span>
    </div>
  );
}

function ScreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-[24px] font-semibold leading-tight text-text sm:text-[28px]">
      {children}
    </h2>
  );
}

function ScreenSub({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14px] text-muted">{children}</p>;
}

function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex w-full gap-3">{children}</div>;
}

function SkipButton({ onClick, label = "Skip" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-pill border border-accent px-6 py-2.5 text-[14px] font-bold text-muted transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {label}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-primary px-6 py-2.5 text-[14px] font-bold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {children}
    </button>
  );
}

function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  if (total <= 1) return null;
  return (
    <div className="mb-6 flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-primary" : "bg-accent"}`}
          style={{
            width: i === current ? 24 : 8,
          }}
        />
      ))}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex items-center gap-1 self-start rounded-lg px-2 py-1 text-[13px] font-medium text-muted transition-all duration-200 hover:text-text active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label="Go back"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN 1: WELCOME + STARS
   ═══════════════════════════════════════════════════ */

function Star({
  filled,
  onClick,
  onHover,
  index,
  animatingIndex,
}: {
  filled: boolean;
  onClick: () => void;
  onHover: () => void;
  index: number;
  animatingIndex: number | null;
}) {
  const isAnimating = animatingIndex === index;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      className="relative rounded-lg p-1 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{
        transform: isAnimating ? "scale(1.25)" : "scale(1)",
        transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      aria-label={`Rate ${index + 1} star${index === 0 ? "" : "s"}`}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill={filled ? "var(--color-primary)" : "none"}
        stroke={filled ? "var(--color-primary)" : "var(--color-muted)"}
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
        style={{
          filter: filled
            ? "drop-shadow(0 2px 8px rgba(224, 90, 61, 0.3))"
            : "none",
        }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

function StarsScreen({ onRate }: { onRate: (r: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(
    (i: number) => {
      const r = i + 1;
      setSelected(r);
      setAnimatingIndex(i);
      setTimeout(() => setAnimatingIndex(null), 350);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onRate(r), 1200);
    },
    [onRate]
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const display = hovered ?? selected ?? 0;

  return (
    <div className="flex flex-col items-center text-center">
      <Avatar />
      <h1 className="font-heading text-[24px] font-semibold leading-tight text-text sm:text-[28px]">
        Hey {TEST_DATA.customerName}, how
        <br />
        was your service?
      </h1>
      <p className="mt-3 text-[14px] text-muted">
        {TEST_DATA.serviceType} with {TEST_DATA.employeeName}
      </p>
      <div className="mt-8 flex gap-1" onMouseLeave={() => setHovered(null)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            index={i}
            filled={i < display}
            animatingIndex={animatingIndex}
            onClick={() => handleClick(i)}
            onHover={() => setHovered(i + 1)}
          />
        ))}
      </div>
      <div className="mt-4 h-6">
        {selected && (
          <p className="animate-fade-in text-sm text-muted">
            {selected <= 2
              ? "We appreciate your honesty"
              : selected <= 4
                ? "Great to hear!"
                : "Wonderful!"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: LOW RATING CHOICE (1-2 stars)
   ═══════════════════════════════════════════════════ */

function LowRatingChoiceScreen({
  onPublic,
  onPrivate,
  onBack,
}: {
  onPublic: () => void;
  onPrivate: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <BackButton onClick={onBack} />
      <Avatar />
      <ScreenHeading>We&rsquo;re sorry it wasn&rsquo;t great</ScreenHeading>
      <ScreenSub>
        Your feedback matters. How would you like to share it?
      </ScreenSub>

      <div className="mt-8 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onPublic}
          className="w-full rounded-card border border-accent bg-surface p-5 text-left transition-all duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <p className="text-[15px] font-semibold text-text">
            Share your experience publicly
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Write an honest review on Google so others know what to expect.
          </p>
        </button>

        <button
          type="button"
          onClick={onPrivate}
          className="w-full rounded-card border border-accent bg-surface p-5 text-left transition-all duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <p className="text-[15px] font-semibold text-text">
            Send private feedback to {TEST_DATA.businessName}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Give them a chance to make it right — just between you and them.
          </p>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: TOPIC SELECTION
   ═══════════════════════════════════════════════════ */

function TopicsScreen({
  tier,
  onContinue,
  onSkip,
  onBack,
}: {
  tier: "positive" | "neutral" | "negative";
  onContinue: (topics: string[], customTopic: string | null) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");

  const topics = TIER_TOPICS[tier];

  const toggle = useCallback((label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleOther = useCallback(() => {
    if (showCustom) {
      setShowCustom(false);
      setCustomText("");
      setSelected((prev) => { const n = new Set(prev); n.delete("Other"); return n; });
    } else {
      setShowCustom(true);
      setSelected((prev) => new Set(prev).add("Other"));
    }
  }, [showCustom]);

  const heading =
    tier === "positive"
      ? "What stood out to you?"
      : tier === "neutral"
        ? "What would you like to mention?"
        : "What should they know about?";

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar />
      <ScreenHeading>{heading}</ScreenHeading>
      <ScreenSub>Tap the topics that are relevant</ScreenSub>

      <div className="mt-8 flex flex-wrap gap-2.5">
        {topics.map((t) => {
          const isSelected = selected.has(t.label);
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => toggle(t.label)}
              className={`flex items-center gap-1.5 rounded-pill px-4 py-3 text-[14px] font-medium transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isSelected ? "bg-primary text-white" : "bg-accent text-text"}`}
            >
              {isSelected && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.label}
            </button>
          );
        })}

        {/* Other chip */}
        <button
          type="button"
          onClick={handleOther}
          className={`flex items-center gap-1.5 rounded-pill border border-dashed px-4 py-3 text-[14px] font-medium transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${showCustom ? "border-primary bg-primary text-white" : "border-muted bg-transparent text-muted"}`}
        >
          + Other
        </button>
      </div>

      {showCustom && (
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="What topic?"
          className="mt-3 w-full rounded-card border border-accent bg-background px-4 py-3 text-[14px] text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
          autoFocus
        />
      )}

      <ButtonRow>
        <SkipButton onClick={onSkip} label="Skip to details" />
        <PrimaryButton
          onClick={() => {
            const custom = showCustom && customText.trim() ? customText.trim() : null;
            onContinue(Array.from(selected).filter((s) => s !== "Other"), custom);
          }}
          disabled={selected.size === 0 || (showCustom && selected.size === 1 && !customText.trim())}
        >
          Continue
        </PrimaryButton>
      </ButtonRow>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: FOLLOW-UP (one per topic)
   ═══════════════════════════════════════════════════ */

function FollowUpScreen({
  topic,
  topicIndex,
  totalTopics,
  onAnswer,
  onBack,
}: {
  topic: TopicDef;
  topicIndex: number;
  totalTopics: number;
  onAnswer: (option: string, detail: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback(
    (option: string) => {
      setSelected(option);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onAnswer(option, detail), 800);
    },
    [onAnswer, detail]
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // If they type a detail after selecting, cancel auto-advance
  const handleDetailChange = useCallback(
    (val: string) => {
      setDetail(val);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    []
  );

  return (
    <div className="flex flex-col items-center text-center">
      <BackButton onClick={onBack} />
      <ProgressDots total={totalTopics} current={topicIndex} />
      <Avatar />
      <ScreenHeading>{topic.followUp}</ScreenHeading>
      <ScreenSub>{topic.label}</ScreenSub>

      <div className="mt-8 flex w-full flex-col gap-2.5">
        {topic.options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`w-full rounded-card border px-5 py-3.5 text-left text-[15px] font-medium transition-all duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-accent bg-surface text-text"}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={detail}
        onChange={(e) => handleDetailChange(e.target.value)}
        placeholder="Add a detail..."
        className="mt-4 w-full rounded-card border border-accent bg-background px-4 py-3 text-[14px] text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
      />

      {/* Manual advance if they typed a detail */}
      {selected && detail.trim() && (
        <button
          type="button"
          onClick={() => onAnswer(selected, detail)}
          className="mt-4 self-end rounded-pill bg-primary px-5 py-2 text-[13px] font-bold text-white transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Next
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: OPTIONAL DETAIL
   ═══════════════════════════════════════════════════ */

function DetailScreen({
  onContinue,
  onBack,
}: {
  onContinue: (detail: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar />
      <ScreenHeading>Anything else?</ScreenHeading>
      <ScreenSub>
        Totally optional — but specifics make a review shine.
      </ScreenSub>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`e.g. "${TEST_DATA.employeeName} noticed the filter was cracking and told me before it became a problem."`}
        rows={4}
        className="mt-8 w-full resize-none rounded-card border border-accent bg-background p-4 text-[15px] text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
      />
      <p className="mt-1.5 text-right text-[12px] text-muted/60">
        {text.length > 0 ? `${text.length} characters` : ""}
      </p>

      <ButtonRow>
        <SkipButton onClick={() => onContinue("")} />
        <PrimaryButton
          onClick={() => onContinue(text)}
          disabled={text.trim().length === 0}
        >
          Continue
        </PrimaryButton>
      </ButtonRow>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: REVIEW DRAFT
   ═══════════════════════════════════════════════════ */

function ReviewScreen({
  sentiment,
  onPost,
  onBack,
}: {
  sentiment: "positive" | "mixed" | "negative";
  onPost: (finalReview: string) => void;
  onBack: () => void;
}) {
  const variants = TEST_DATA.hardcodedReviews[sentiment];
  const [variantIdx, setVariantIdx] = useState(0);
  const [reviewText, setReviewText] = useState(variants[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleTryAnother = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      const nextIdx = (variantIdx + 1) % variants.length;
      setVariantIdx(nextIdx);
      setReviewText(variants[nextIdx]);
      setRefreshing(false);
    }, 500);
  }, [sentiment, variantIdx, variants]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reviewText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = reviewText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => onPost(reviewText), 800);
  }, [reviewText, onPost]);

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar />
      <ScreenHeading>Your review is ready</ScreenHeading>
      <ScreenSub>Edit anything, or post as-is.</ScreenSub>

      <div className="mt-8 w-full">
        {isEditing ? (
          <>
            <textarea
              ref={textareaRef}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              onBlur={() => setIsEditing(false)}
              rows={6}
              className="w-full resize-none rounded-card border border-accent bg-background p-5 font-heading text-[17px] font-semibold leading-relaxed text-text focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
            />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="mt-2 self-end rounded-pill bg-primary/10 px-4 py-1.5 text-[13px] font-medium text-primary transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Done editing
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleEdit}
            className="group w-full cursor-text text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-card"
          >
            <div
              className="relative rounded-card border border-accent/50 bg-background p-6 transition-all duration-300"
              style={{ opacity: refreshing ? 0.3 : 1 }}
            >
              <span className="absolute -top-3 left-5 font-heading text-[48px] leading-none text-primary/20">
                &ldquo;
              </span>
              <p className="font-heading text-[17px] font-semibold leading-[1.7] text-text sm:text-[18px]">
                {reviewText}
              </p>
              <span className="mt-3 block text-[12px] text-muted opacity-60 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                Tap to edit
              </span>
            </div>
          </button>
        )}
      </div>

      <ButtonRow>
        <button
          type="button"
          onClick={handleTryAnother}
          disabled={refreshing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-accent px-6 py-2.5 text-[14px] font-bold text-muted transition-all duration-200 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Generate another version"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform duration-500"
            style={{ transform: refreshing ? "rotate(360deg)" : "rotate(0)" }}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Try another
        </button>
        <PrimaryButton onClick={handleCopy} disabled={copied}>
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            "Copy & post"
          )}
        </PrimaryButton>
      </ButtonRow>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: SUCCESS
   ═══════════════════════════════════════════════════ */

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 2,
      size: 6 + Math.random() * 6,
      color: ["#E05A3D", "#DDE5DF", "#8A9B93", "#FFB347", "#7EC8A0"][
        Math.floor(Math.random() * 5)
      ],
      shape: Math.random() > 0.5 ? "circle" : "rect",
    }))
  ).current;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.shape === "circle" ? p.size : p.size * 0.6,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function SuccessScreen({ reviewText }: { reviewText: string }) {
  const [recopied, setRecopied] = useState(false);

  const handleRecopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reviewText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = reviewText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setRecopied(true);
    setTimeout(() => setRecopied(false), 2000);
  }, [reviewText]);

  return (
    <>
      <Confetti />
      <div className="animate-fade-in flex flex-col items-center text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l1.09 3.26L16 6l-2.91.74L12 10l-1.09-3.26L8 6l2.91-.74L12 2z" />
            <path d="M5 12l.55 1.63L7 14.18l-1.45.37L5 16.18l-.55-1.63L3 14.18l1.45-.37L5 12z" />
            <path d="M19 12l.55 1.63L21 14.18l-1.45.37L19 16.18l-.55-1.63L17 14.18l1.45-.37L19 12z" />
          </svg>
        </div>

        <ScreenHeading>
          You&rsquo;re the best, {TEST_DATA.customerName}
        </ScreenHeading>

        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Your review is copied and ready to paste.
          <br />
          Just switch to the Google tab and hit paste.
        </p>

        <div className="mt-8 w-full rounded-card bg-background p-5">
          <div className="flex flex-col gap-4 text-left">
            {[
              "Switch to the Google Reviews tab",
              "Tap the review box and paste",
              "Hit submit — that's it!",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-[14px] text-text">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <ButtonRow>
          <button
            type="button"
            onClick={handleRecopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-accent px-6 py-2.5 text-[14px] font-bold text-muted transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Copy review to clipboard"
          >
            {recopied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              "Copy again"
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(TEST_DATA.googleReviewUrl, "_blank")
            }
            className="flex flex-1 items-center justify-center rounded-pill bg-primary px-6 py-2.5 text-[14px] font-bold text-white transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Open Google
          </button>
        </ButtonRow>

        <p className="mt-6 text-[13px] text-muted">
          Thank you for supporting {TEST_DATA.businessName}.
        </p>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: PRIVATE FEEDBACK
   ═══════════════════════════════════════════════════ */

function PrivateFeedbackScreen({
  topicAnswers,
  onSubmit,
  onBack,
}: {
  topicAnswers: Record<string, TopicAnswer>;
  onSubmit: (feedback: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");

  // Pre-fill summary from topic answers if any
  const hasPriorAnswers = Object.keys(topicAnswers).length > 0;

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar />
      <ScreenHeading>Send your feedback</ScreenHeading>
      <ScreenSub>
        This goes directly to {TEST_DATA.businessName} — not posted publicly.
      </ScreenSub>

      {hasPriorAnswers && (
        <div className="mt-6 w-full rounded-card bg-background p-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
            Your feedback so far
          </p>
          {Object.entries(topicAnswers).map(([topic, answer]) => (
            <p key={topic} className="text-[13px] text-text">
              <span className="font-medium">{topic}:</span>{" "}
              <span className="text-muted">{answer.option}</span>
              {answer.detail && (
                <span className="text-muted"> — {answer.detail}</span>
              )}
            </p>
          ))}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell them what happened and how they can make it right..."
        rows={5}
        className="mt-6 w-full resize-none rounded-card border border-accent bg-background p-4 text-[15px] text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
      />
      <p className="mt-1.5 text-right text-[12px] text-muted/60">
        {text.length > 0 ? `${text.length} characters` : ""}
      </p>

      <ButtonRow>
        <PrimaryButton
          onClick={() => onSubmit(text)}
          disabled={text.trim().length === 0 && !hasPriorAnswers}
        >
          Send feedback
        </PrimaryButton>
      </ButtonRow>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: PRIVATE SUCCESS
   ═══════════════════════════════════════════════════ */

function PrivateSuccessScreen() {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <ScreenHeading>Feedback sent</ScreenHeading>

      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Your feedback has been sent to {TEST_DATA.businessName}.
        <br />
        Thank you for giving them a chance to make it right.
      </p>

      <p className="mt-8 text-[13px] text-muted">
        They&rsquo;ll receive it right away and can reach out to you directly.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN FLOW
   ═══════════════════════════════════════════════════ */

export default function ReviewFlow() {
  const [step, setStep] = useState<Step>("stars");
  const [rating, setRating] = useState(0);
  const [path, setPath] = useState<"public" | "private" | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<TopicDef[]>([]);
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [topicAnswers, setTopicAnswers] = useState<
    Record<string, TopicAnswer>
  >({});
  const [optionalDetail, setOptionalDetail] = useState("");
  const [finalReview, setFinalReview] = useState("");

  const tier = getTier(rating);

  // Resolve which topics the user selected into TopicDef objects
  const resolveTopics = useCallback(
    (labels: string[], customTopic: string | null) => {
      const tierTopics = TIER_TOPICS[tier];
      const resolved: TopicDef[] = [];
      for (const label of labels) {
        const found = tierTopics.find((t) => t.label === label);
        if (found) resolved.push(found);
      }
      if (customTopic) {
        resolved.push({
          ...OTHER_TOPIC,
          label: customTopic,
        });
      }
      return resolved;
    },
    [tier]
  );

  // Star rating handler
  const handleRate = useCallback((r: number) => {
    setRating(r);
    if (r <= 2) {
      setStep("low-rating-choice");
    } else {
      setStep("topics");
    }
  }, []);

  // Low rating choice
  const handlePublic = useCallback(() => {
    setPath("public");
    setStep("topics");
  }, []);

  const handlePrivate = useCallback(() => {
    setPath("private");
    setStep("topics");
  }, []);

  // Topic selection
  const handleTopics = useCallback(
    (labels: string[], customTopic: string | null) => {
      const resolved = resolveTopics(labels, customTopic);
      setSelectedTopics(resolved);
      setCurrentTopicIdx(0);
      if (resolved.length > 0) {
        setStep("followup");
      } else {
        setStep("detail");
      }
    },
    [resolveTopics]
  );

  const handleSkipTopics = useCallback(() => {
    setSelectedTopics([]);
    setStep("detail");
  }, []);

  // Follow-up answer
  const handleFollowUpAnswer = useCallback(
    (option: string, detail: string) => {
      const topic = selectedTopics[currentTopicIdx];
      setTopicAnswers((prev) => ({
        ...prev,
        [topic.label]: { option, detail },
      }));

      const nextIdx = currentTopicIdx + 1;
      if (nextIdx < selectedTopics.length) {
        setCurrentTopicIdx(nextIdx);
        // Force re-render by updating step key
        setStep("followup");
      } else {
        setStep("detail");
      }
    },
    [selectedTopics, currentTopicIdx]
  );

  // Detail
  const handleDetail = useCallback(
    (text: string) => {
      setOptionalDetail(text);
      if (path === "private") {
        setStep("private-feedback");
      } else {
        setStep("review");
      }
    },
    [path]
  );

  // Review
  const handlePost = useCallback((text: string) => {
    setFinalReview(text);
    setStep("success");
  }, []);

  // Private feedback
  const handlePrivateSubmit = useCallback(() => {
    setStep("private-success");
  }, []);

  // Back handlers
  const handleBackToStars = useCallback(() => {
    setRating(0);
    setStep("stars");
  }, []);

  const handleBackFromTopics = useCallback(() => {
    if (rating <= 2) {
      setStep("low-rating-choice");
    } else {
      setRating(0);
      setStep("stars");
    }
  }, [rating]);

  const handleBackFromFollowup = useCallback(() => {
    if (currentTopicIdx > 0) {
      setCurrentTopicIdx(currentTopicIdx - 1);
    } else {
      setStep("topics");
    }
  }, [currentTopicIdx]);

  const handleBackFromDetail = useCallback(() => {
    if (selectedTopics.length > 0) {
      setCurrentTopicIdx(selectedTopics.length - 1);
      setStep("followup");
    } else {
      setStep("topics");
    }
  }, [selectedTopics]);

  const handleBackFromReview = useCallback(() => {
    setStep("detail");
  }, []);

  const handleBackFromPrivateFeedback = useCallback(() => {
    setStep("detail");
  }, []);

  const sentiment = getSentiment(rating, topicAnswers);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] rounded-card bg-surface px-6 py-10 shadow-card transition-all duration-300 sm:px-10 sm:py-12">
        <div key={`${step}-${currentTopicIdx}`} className="animate-fade-in">
          {step === "stars" && <StarsScreen onRate={handleRate} />}

          {step === "low-rating-choice" && (
            <LowRatingChoiceScreen
              onPublic={handlePublic}
              onPrivate={handlePrivate}
              onBack={handleBackToStars}
            />
          )}

          {step === "topics" && (
            <TopicsScreen
              tier={tier}
              onContinue={handleTopics}
              onSkip={handleSkipTopics}
              onBack={handleBackFromTopics}
            />
          )}

          {step === "followup" && selectedTopics[currentTopicIdx] && (
            <FollowUpScreen
              key={`followup-${currentTopicIdx}`}
              topic={selectedTopics[currentTopicIdx]}
              topicIndex={currentTopicIdx}
              totalTopics={selectedTopics.length}
              onAnswer={handleFollowUpAnswer}
              onBack={handleBackFromFollowup}
            />
          )}

          {step === "detail" && (
            <DetailScreen
              onContinue={handleDetail}
              onBack={handleBackFromDetail}
            />
          )}

          {step === "review" && (
            <ReviewScreen
              sentiment={sentiment}
              onPost={handlePost}
              onBack={handleBackFromReview}
            />
          )}

          {step === "success" && <SuccessScreen reviewText={finalReview} />}

          {step === "private-feedback" && (
            <PrivateFeedbackScreen
              topicAnswers={topicAnswers}
              onSubmit={handlePrivateSubmit}
              onBack={handleBackFromPrivateFeedback}
            />
          )}

          {step === "private-success" && <PrivateSuccessScreen />}
        </div>
      </div>
    </main>
  );
}
