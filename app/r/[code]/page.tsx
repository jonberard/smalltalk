"use client";

// Web Speech API types (not available in all TS libs)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventMap {
  result: { results: SpeechRecognitionResultList };
  error: { error: string };
  end: Event;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEventMap["result"]) => void) | null;
  onerror: ((ev: SpeechRecognitionEventMap["error"]) => void) | null;
  onend: (() => void) | null;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { capture } from "@/lib/posthog";

/* ═══════════════════════════════════════════════════
   DATA TYPES
   ═══════════════════════════════════════════════════ */

type ReviewData = {
  businessName: string;
  businessInitials: string;
  employeeName: string | null;
  serviceType: string;
  customerName: string;
  googleReviewUrl: string;
  googlePlaceId: string | null;
  businessCity: string | null;
  neighborhoods: string[];
};

type TopicDef = {
  id: string;
  label: string;
  followUp: string;
  options: string[];
};

const OTHER_TOPIC: TopicDef = {
  id: "other",
  label: "Other",
  followUp: "How was this aspect?",
  options: ["Great", "Good", "Fair", "Poor"],
};

function getTier(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}


/* ═══════════════════════════════════════════════════
   FLOW STATE
   ═══════════════════════════════════════════════════ */

type Step =
  | "stars"
  | "low-rating-choice"
  | "topics"
  | "voice"
  | "followup"
  | "detail"
  | "review"
  | "interstitial"
  | "success"
  | "private-feedback"
  | "private-revisit"
  | "private-success";

type TopicAnswer = { option: string; detail: string };

type StoredTopicAnswer = {
  topic_id?: string;
  label: string;
  follow_up_answer: string;
  detail_text?: string;
};

type PublicFlowSessionState = {
  sessionId: string;
  status: string;
  starRating: number | null;
  feedbackType: "public" | "private";
  topicsSelected: StoredTopicAnswer[];
  optionalText: string;
  generatedReview: string;
  voiceId: string | null;
  parentPrivateFeedbackSessionId: string | null;
};

type BootstrapResponse = {
  review: ReviewData;
  topics: Record<"positive" | "neutral" | "negative", TopicDef[]>;
  session: PublicFlowSessionState;
  isNewSession: boolean;
  revisitSourceSessionId: string | null;
};

type RestoredFlowState = {
  step: Step;
  rating: number;
  path: "public" | "private" | null;
  selectedTopics: TopicDef[];
  currentTopicIdx: number;
  topicAnswers: Record<string, TopicAnswer>;
  optionalDetail: string;
  finalReview: string;
};

async function fetchPublicFlow<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        `Request failed with status ${res.status}`,
    );
  }

  return body as T;
}

function restoreSelectedTopics(
  storedTopics: StoredTopicAnswer[],
  allTopics: Record<string, TopicDef[]>,
) {
  const topicLookup = new Map<string, TopicDef>();

  for (const tierTopics of Object.values(allTopics)) {
    for (const topic of tierTopics) {
      topicLookup.set(topic.id, topic);
      topicLookup.set(topic.label, topic);
    }
  }

  return storedTopics.map((storedTopic) => {
    const existing =
      (storedTopic.topic_id && topicLookup.get(storedTopic.topic_id)) ||
      topicLookup.get(storedTopic.label);

    if (existing) {
      return existing;
    }

    return {
      ...OTHER_TOPIC,
      id: storedTopic.topic_id || "other",
      label: storedTopic.label,
    };
  });
}

function restoreFlowState(
  session: PublicFlowSessionState,
  allTopics: Record<string, TopicDef[]>,
  revisitSourceSessionId: string | null,
): RestoredFlowState {
  const selectedTopics = restoreSelectedTopics(session.topicsSelected, allTopics);
  const topicAnswers: Record<string, TopicAnswer> = {};
  let currentTopicIdx = 0;
  let firstUnansweredIdx = -1;

  selectedTopics.forEach((topic, index) => {
    const stored = session.topicsSelected[index];
    const option = stored?.follow_up_answer || "";
    const detail = stored?.detail_text || "";

    if (option || detail) {
      topicAnswers[topic.label] = { option, detail };
    }

    if (!option && firstUnansweredIdx === -1) {
      firstUnansweredIdx = index;
    }
  });

  const rating = session.starRating ?? 0;
  const optionalDetail = session.optionalText || "";
  const finalReview = session.generatedReview || "";
  const hasAdvancedPastChoice =
    selectedTopics.length > 0 || !!optionalDetail.trim() || !!finalReview.trim();
  const path =
    session.feedbackType === "private"
      ? "private"
      : session.parentPrivateFeedbackSessionId
        ? "public"
      : rating > 0 && rating <= 2 && hasAdvancedPastChoice
        ? "public"
        : null;
  let step: Step = "stars";

  if (session.status === "copied" && finalReview) {
    step = "success";
  } else if (revisitSourceSessionId) {
    step = "private-revisit";
  } else if (
    session.feedbackType === "private" &&
    session.status === "drafted" &&
    optionalDetail.trim()
  ) {
    step = "private-success";
  } else if (finalReview) {
    step = "review";
  } else if (session.feedbackType === "private" && optionalDetail.trim()) {
    step = "private-feedback";
  } else if (path !== "private" && optionalDetail.trim()) {
    step = "review";
  } else if (selectedTopics.length > 0) {
    if (firstUnansweredIdx !== -1) {
      step = "followup";
      currentTopicIdx = firstUnansweredIdx;
    } else {
      step = "detail";
    }
  } else if (rating > 0) {
    if (rating <= 2) {
      step = path ? "topics" : "low-rating-choice";
    } else {
      step = "topics";
    }
  }

  return {
    step,
    rating,
    path,
    selectedTopics,
    currentTopicIdx,
    topicAnswers,
    optionalDetail,
    finalReview,
  };
}

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
      <span className="font-heading text-[20px] font-bold text-white">
        {initials}
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

function StarsScreen({ onRate, data }: { onRate: (r: number) => void; data: ReviewData }) {
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
      <Avatar initials={data.businessInitials} />
      <h1 className="font-heading text-[24px] font-semibold leading-tight text-text sm:text-[28px]">
        Hey {data.customerName}, how
        <br />
        was your service?
      </h1>
      <p className="mt-3 text-[14px] text-muted">
        {data.serviceType}{data.employeeName ? ` with ${data.employeeName}` : ""}
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
  data,
}: {
  onPublic: () => void;
  onPrivate: () => void;
  onBack: () => void;
  data: ReviewData;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <BackButton onClick={onBack} />
      <Avatar initials={data.businessInitials} />
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
            Send private feedback to {data.businessName}
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
  tierTopics,
  tier,
  onContinue,
  onSkip,
  onVoice,
  onBack,
  data,
}: {
  tierTopics: TopicDef[];
  tier: "positive" | "neutral" | "negative";
  onContinue: (topics: string[], customTopic: string | null) => void;
  onSkip: () => void;
  onVoice?: () => void;
  onBack: () => void;
  data: ReviewData;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");

  const topics = tierTopics;

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
      <Avatar initials={data.businessInitials} />
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

      {onVoice && (
        <button
          type="button"
          onClick={onVoice}
          className="mt-6 flex items-center gap-2 self-center rounded-pill border border-accent bg-surface px-5 py-2.5 text-[13px] font-medium text-muted transition-all duration-200 hover:border-primary hover:text-primary active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Or just tell us — tap to speak
        </button>
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
   SCREEN: VOICE INPUT
   ═══════════════════════════════════════════════════ */

function VoiceInputScreen({
  onDone,
  onCancel,
  data,
}: {
  onDone: (transcript: string) => void;
  onCancel: () => void;
  data: ReviewData;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setInterimText("");
  }, []);

  const startListening = useCallback(() => {
    setError("");
    setTranscript("");
    setInterimText("");

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final);
      setInterimText(interim);

      // Reset silence timer on any speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
      }, 30000);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone access was denied. Please allow microphone access and try again.");
      } else if (event.error !== "aborted") {
        setError("Something went wrong with speech recognition. Please try again.");
      }
      stopListening();
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };

    recognition.start();
    setListening(true);

    // Auto-stop after 30s of silence
    silenceTimerRef.current = setTimeout(() => {
      stopListening();
    }, 30000);
  }, [stopListening]);

  // Start listening on mount
  useEffect(() => {
    startListening();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = useCallback(() => {
    stopListening();
    const finalText = (transcript + " " + interimText).trim();
    if (finalText) {
      onDone(finalText);
    }
  }, [transcript, interimText, stopListening, onDone]);

  const handleCancel = useCallback(() => {
    stopListening();
    onCancel();
  }, [stopListening, onCancel]);

  const displayText = (transcript + " " + interimText).trim();

  return (
    <div className="flex flex-col items-center text-center">
      <BackButton onClick={handleCancel} />
      <Avatar initials={data.businessInitials} />
      <ScreenHeading>Tell us about your experience</ScreenHeading>
      <ScreenSub>Speak naturally — we&rsquo;ll turn it into a review</ScreenSub>

      {/* Pulsing mic indicator */}
      <div className="mt-8 flex flex-col items-center">
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          aria-label={listening ? "Stop recording" : "Start recording"}
          className="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300"
          style={{
            backgroundColor: listening ? "rgba(224, 90, 61, 0.1)" : "var(--color-accent)",
          }}
        >
          {listening && (
            <>
              <span className="absolute inset-0 animate-[voice-pulse_2s_ease-in-out_infinite] rounded-full bg-primary/20" />
              <span className="absolute inset-[-8px] animate-[voice-pulse_2s_ease-in-out_0.5s_infinite] rounded-full bg-primary/10" />
            </>
          )}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={listening ? "var(--color-primary)" : "var(--color-muted)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10 transition-colors duration-300"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
        <p className="mt-3 text-[13px] font-medium text-muted">
          {listening ? "Listening..." : error ? "" : "Tap to start again"}
        </p>
      </div>

      {/* Transcript display */}
      <div className="mt-6 w-full min-h-[100px] rounded-card border border-accent bg-background p-5 text-left">
        {displayText ? (
          <p className="text-[15px] leading-relaxed text-text">
            {transcript}
            {interimText && (
              <span className="text-muted">{transcript ? " " : ""}{interimText}</span>
            )}
          </p>
        ) : error ? (
          <p className="text-[14px] text-center text-red-500">{error}</p>
        ) : (
          <p className="text-[14px] text-center text-muted/60">
            {listening ? "Start speaking..." : "No speech detected"}
          </p>
        )}
      </div>

      <ButtonRow>
        <SkipButton onClick={handleCancel} label="Cancel" />
        <PrimaryButton
          onClick={handleDone}
          disabled={!displayText}
        >
          Done
        </PrimaryButton>
      </ButtonRow>

      <style jsx>{`
        @keyframes voice-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
      `}</style>
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
  data,
}: {
  topic: TopicDef;
  topicIndex: number;
  totalTopics: number;
  onAnswer: (option: string, detail: string) => void;
  onBack: () => void;
  data: ReviewData;
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
      <Avatar initials={data.businessInitials} />
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
  data,
  hasSpeechSupport,
}: {
  onContinue: (detail: string) => void;
  onBack: () => void;
  data: ReviewData;
  hasSpeechSupport?: boolean;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeholderName = data.employeeName || "They";

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setInterimText("");
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setText((prev) => {
        // If text was empty or entirely from a previous voice session, replace with new final
        // Otherwise append to existing text
        const base = prev && !listening ? prev + " " : "";
        return (base + final).trim();
      });
      setInterimText(interim);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
      }, 30000);
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };

    recognition.start();
    setListening(true);

    silenceTimerRef.current = setTimeout(() => {
      stopListening();
    }, 30000);
  }, [stopListening, listening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar initials={data.businessInitials} />
      <ScreenHeading>Anything else?</ScreenHeading>
      <ScreenSub>
        Totally optional — but specifics make a review shine.
      </ScreenSub>

      <div className="mt-8 w-full">
        <textarea
          value={listening ? text + (interimText ? (text ? " " : "") + interimText : "") : text}
          onChange={(e) => { if (!listening) setText(e.target.value); }}
          placeholder={`e.g. "${placeholderName} noticed the filter was cracking and told me before it became a problem."`}
          rows={4}
          readOnly={listening}
          className={`w-full resize-none rounded-card border bg-background p-4 text-[15px] text-text placeholder:text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200 ${listening ? "border-primary" : "border-accent focus:border-primary"}`}
        />
        <p className="mt-1.5 text-right text-[12px] text-muted/60">
          {text.length > 0 ? `${text.length} characters` : ""}
        </p>
      </div>

      {hasSpeechSupport && (
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          aria-label={listening ? "Stop recording" : "Start voice input"}
          className={`flex items-center gap-2 self-center rounded-pill border px-5 py-2.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${listening ? "border-primary bg-primary/10 text-primary" : "border-accent bg-surface text-muted hover:border-primary hover:text-primary"}`}
        >
          {listening ? (
            <>
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </span>
              Listening — tap to stop
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Or just tell us — tap to speak
            </>
          )}
        </button>
      )}

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

function ReviewShimmer() {
  return (
    <div className="w-full rounded-card border border-accent/50 bg-background p-6">
      <span className="absolute -top-3 left-5 font-heading text-[48px] leading-none text-primary/20">
        &ldquo;
      </span>
      <div className="space-y-3">
        {[100, 92, 85, 60].map((w, i) => (
          <div
            key={i}
            className="h-[18px] rounded-full bg-accent/60"
            style={{
              width: `${w}%`,
              animation: `shimmer 1.8s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <p className="mt-5 text-center text-[13px] text-muted">Writing your review...</p>
    </div>
  );
}

function ReviewScreen({
  code,
  rating,
  topicAnswers,
  selectedTopics,
  optionalDetail,
  initialReviewText,
  initialVoiceId,
  onPost,
  onBack,
  data,
}: {
  code: string;
  rating: number;
  topicAnswers: Record<string, TopicAnswer>;
  selectedTopics: TopicDef[];
  optionalDetail: string;
  initialReviewText: string;
  initialVoiceId: string | null;
  onPost: (finalReview: string, voiceId: string, copyFailed: boolean) => void;
  onBack: () => void;
  data: ReviewData;
}) {
  const [reviewText, setReviewText] = useState(initialReviewText);
  const [voiceId, setVoiceId] = useState<string | null>(initialVoiceId);
  const [generating, setGenerating] = useState(!initialReviewText);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasGenerated = useRef(false);

  const buildPayload = useCallback(
    (excludeVoice?: string) => ({
      star_rating: rating,
      topics_selected: selectedTopics.map((t) => ({
        label: t.label,
        follow_up_answer: topicAnswers[t.label]?.option || "",
        detail_text: topicAnswers[t.label]?.detail || undefined,
      })),
      optional_text: optionalDetail || undefined,
      exclude_voice_id: excludeVoice,
    }),
    [rating, data, selectedTopics, topicAnswers, optionalDetail]
  );

  const callApi = useCallback(
    async (excludeVoice?: string) => {
      setGenerating(true);
      setError("");
      try {
        const result = await fetchPublicFlow<{
          review_text: string;
          voice_id: string;
        }>(`/api/public/review-flow/${code}/generate`, {
          method: "POST",
          body: JSON.stringify(buildPayload(excludeVoice)),
        });
        setReviewText(result.review_text);
        setVoiceId(result.voice_id);
        capture("review_generated", {
          star_rating: rating,
          word_count: result.review_text.split(/\s+/).length,
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong — tap to try again",
        );
      } finally {
        setGenerating(false);
      }
    },
    [buildPayload, code, rating]
  );

  // Generate on mount
  useEffect(() => {
    if (!hasGenerated.current && !initialReviewText) {
      hasGenerated.current = true;
      callApi();
    }
  }, [callApi, initialReviewText]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleTryAnother = useCallback(() => {
    callApi(voiceId || undefined);
  }, [callApi, voiceId]);

  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopyAndOpen = useCallback(() => {
    // Step 1: Try clipboard API
    let didCopy = false;
    try {
      // Use the synchronous approach first for speed
      const ta = document.createElement("textarea");
      ta.value = reviewText;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      didCopy = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      didCopy = false;
    }

    if (!didCopy) {
      // Try async clipboard API as second attempt (but can't block on it)
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(reviewText).catch(() => {});
        // Optimistically assume it worked — we already tried execCommand
      } else {
        // Both methods unavailable — show manual copy fallback
        setCopyFailed(true);
        onPost(reviewText, voiceId || "", true);
        return;
      }
    }

    setCopied(true);
    capture("review_copied", {
      copy_method: "auto",
      word_count: reviewText.split(/\s+/).length,
    });
    onPost(reviewText, voiceId || "", false);
  }, [reviewText, voiceId, onPost]);

  const handleManualCopyDone = useCallback(() => {
    capture("review_copied", {
      copy_method: "manual",
      word_count: reviewText.split(/\s+/).length,
    });
    onPost(reviewText, voiceId || "", false);
  }, [reviewText, voiceId, onPost]);

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar initials={data.businessInitials} />
      <ScreenHeading>
        {generating ? "Crafting your review" : error ? "Let\u2019s try that again" : "Your review is ready"}
      </ScreenHeading>
      {!generating && !error && (
        <ScreenSub>Edit anything, or post as-is.</ScreenSub>
      )}

      <div className="mt-8 w-full">
        {generating ? (
          <ReviewShimmer />
        ) : error ? (
          <div className="w-full rounded-card border border-accent bg-background p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-[14px] text-muted">{error}</p>
            <button
              type="button"
              onClick={() => callApi()}
              className="mt-4 rounded-pill bg-primary px-6 py-2.5 text-[14px] font-bold text-white transition-all duration-200 active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        ) : isEditing ? (
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
            <div className="relative rounded-card border border-accent/50 bg-background p-6 transition-all duration-300">
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

      {!generating && !error && !copyFailed && (
        <ButtonRow>
          <button
            type="button"
            onClick={handleTryAnother}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-accent px-6 py-2.5 text-[14px] font-bold text-muted transition-all duration-200 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Generate another version"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try another
          </button>
          <PrimaryButton onClick={handleCopyAndOpen} disabled={copied}>
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              "Copy & Open Google"
            )}
          </PrimaryButton>
        </ButtonRow>
      )}

      {/* Manual copy fallback — shown when clipboard API fails */}
      {copyFailed && (
        <div className="mt-6 w-full animate-fade-in">
          <p className="mb-3 text-center text-[14px] font-medium text-text">
            Couldn&rsquo;t copy automatically &mdash; select the text below and copy it manually.
          </p>
          <textarea
            readOnly
            value={reviewText}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-[12px] border border-accent bg-background p-4 text-[14px] leading-relaxed text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={6}
          />
          <div className="mt-4">
            <PrimaryButton onClick={handleManualCopyDone}>
              I&rsquo;ve copied it &mdash; open Google
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCREEN: INTERSTITIAL HANDOFF
   ═══════════════════════════════════════════════════ */

/* Animation phases for the interstitial Google card */
type InterstitialPhase =
  | "empty"        // blank card, grey stars, placeholder text
  | "cursor-text"  // cursor slides to text box
  | "paste"        // paste tooltip appears
  | "paste-tap"    // cursor clicks paste, tooltip highlighted
  | "text-fill"    // review text fades in
  | "cursor-stars" // cursor slides to stars
  | "stars-fill"   // stars cascade gold
  | "cursor-post"  // cursor slides to Post button
  | "post-tap"     // Post lights up blue, cursor gone
  | "fade-out";    // card fades, then resets

const PHASE_DURATIONS: Record<InterstitialPhase, number> = {
  empty: 800,
  "cursor-text": 600,
  paste: 1000,
  "paste-tap": 300,
  "text-fill": 1000,
  "cursor-stars": 600,
  "stars-fill": 1000,
  "cursor-post": 600,
  "post-tap": 1200,
  "fade-out": 1000,
};

const PHASE_ORDER: InterstitialPhase[] = [
  "empty", "cursor-text", "paste", "paste-tap", "text-fill",
  "cursor-stars", "stars-fill",
  "cursor-post", "post-tap", "fade-out",
];

function InterstitialScreen({
  reviewText,
  rating,
  data,
  onContinue,
}: {
  reviewText: string;
  rating: number;
  data: ReviewData;
  onContinue: () => void;
}) {
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const [phase, setPhase] = useState<InterstitialPhase>("empty");
  const [filledStars, setFilledStars] = useState(0);
  const [justCopied, setJustCopied] = useState(false);

  // Animation uses the customer's actual star rating
  const animStars = rating;
  const animText = reviewText.length > 120 ? reviewText.slice(0, 117) + "..." : reviewText;

  // Phase machine — advance through phases on a timer loop
  useEffect(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    const duration = PHASE_DURATIONS[phase];

    // Stars cascade during stars-fill phase
    if (phase === "stars-fill" && filledStars < animStars) {
      const starTimer = setTimeout(() => {
        setFilledStars((s) => s + 1);
      }, 150);
      return () => clearTimeout(starTimer);
    }

    const timer = setTimeout(() => {
      if (phase === "fade-out") {
        // Reset everything for next loop
        setFilledStars(0);
        setPhase("empty");
      } else {
        setPhase(PHASE_ORDER[idx + 1]);
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [phase, filledStars, animStars]);

  function handleOpenGoogle() {
    let url: string;
    if (data.googlePlaceId) {
      const base = isMobile
        ? "https://search.google.com/local/writereview/mobile"
        : "https://search.google.com/local/writereview";
      url = `${base}?placeid=${data.googlePlaceId}`;
    } else if (data.googleReviewUrl) {
      url = data.googleReviewUrl;
    } else {
      url = "https://www.google.com/maps";
    }
    window.open(url, "_blank");
    onContinue();
  }

  async function handleCopyAgain() {
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
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  }

  // truncated is kept for any non-animation uses; animation uses animText
  const truncated = reviewText.length > 80
    ? reviewText.slice(0, 77) + "..."
    : reviewText;

  // Derived animation state from phase
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const showCursor = phase === "cursor-text" || phase === "paste" || phase === "paste-tap" || phase === "cursor-stars" || phase === "cursor-post";
  const showPaste = phase === "paste" || phase === "paste-tap";
  const pasteTapped = phase === "paste-tap";
  const showText = phaseIdx >= PHASE_ORDER.indexOf("text-fill") && phase !== "fade-out";
  const showStars = phaseIdx >= PHASE_ORDER.indexOf("stars-fill") && phase !== "fade-out";
  const photoPulse = phase !== "empty" && phase !== "cursor-text" && phase !== "fade-out";
  const postActive = phaseIdx >= PHASE_ORDER.indexOf("cursor-post") && phase !== "fade-out";
  const cardFaded = phase === "fade-out";

  // Cursor position per phase
  let cursorX = "50%";
  let cursorY = "50%";
  if (phase === "cursor-text" || phase === "paste") { cursorX = "25%"; cursorY = "60%"; }
  if (phase === "paste-tap") { cursorX = "25%"; cursorY = "60%"; }
  if (phase === "cursor-stars") { cursorX = "42%"; cursorY = "26%"; }
  if (phase === "cursor-post") { cursorX = "88%"; cursorY = "10%"; }

  return (
    <div className="animate-fade-in mx-auto flex max-w-[360px] flex-col items-center text-center">
      <style>{`
        @keyframes photos-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
      {/* Heading */}
      <h2 className="font-heading text-[24px] font-bold text-text">
        Your review is copied.
      </h2>
      <p className="mt-2 text-[14px] text-muted">
        Paste it in the Google tab we just opened.
      </p>

      {/* Animated dark-mode Google review card */}
      <div
        className="relative mt-6 w-full overflow-hidden rounded-[16px] p-5"
        style={{
          backgroundColor: "#2D2D2D",
          fontFamily: '"Google Sans", "Roboto", -apple-system, sans-serif',
          opacity: cardFaded ? 0 : 1,
          transition: "opacity 0.5s",
        }}
      >
        {/* Header row: business name + Post button */}
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium text-[#E8EAED]">{data.businessName}</p>
          <span
            className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300"
            style={{
              backgroundColor: postActive ? "#8AB4F8" : "#303134",
              color: postActive ? "#202124" : "#8E8E8E",
            }}
          >
            Post
          </span>
        </div>

        {/* Stars row */}
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width="28" height="28" viewBox="0 0 24 24">
              <path
                d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l7.1-1.01L12 2z"
                fill={showStars && i <= filledStars ? "#FBBC04" : "#5F6368"}
                stroke="none"
                style={{ transition: `fill 0.15s ${i * 0.08}s` }}
              />
            </svg>
          ))}
        </div>

        {/* Text area */}
        <div className="relative mt-4 rounded-[8px] border border-[#5F6368] px-3 py-3" style={{ minHeight: 60 }}>
          {/* Paste tooltip — inside the text box */}
          <div
            className="pointer-events-none absolute left-3 top-2.5 z-10 rounded-md px-3 py-1 text-[11px] font-medium transition-all duration-150"
            style={{
              opacity: showPaste ? 1 : 0,
              backgroundColor: pasteTapped ? "#8AB4F8" : "#E8EAED",
              color: "#202124",
              transform: pasteTapped ? "scale(0.95)" : "scale(1)",
            }}
          >
            Paste
          </div>

          {/* Placeholder text */}
          <p
            className="text-[13px] text-[#9AA0A6] transition-opacity duration-300"
            style={{ opacity: showText ? 0 : 1, position: showText ? "absolute" : "relative" }}
          >
            Share details of your own experience at this place
          </p>

          {/* Filled review text */}
          <p
            className="text-[13px] leading-relaxed text-[#E8EAED] transition-opacity duration-400"
            style={{ opacity: showText ? 1 : 0 }}
          >
            {animText}
          </p>
        </div>

        {/* Add photos — pulses throughout animation */}
        <div
          className="mt-3 flex items-center gap-2 text-[#8AB4F8]"
          style={{
            animation: photoPulse ? "photos-breathe 1.5s ease-in-out infinite" : "none",
            transform: "scale(1)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="text-[12px]">Add photos</span>
        </div>

        {/* Animated cursor */}
        <div
          className="pointer-events-none absolute h-5 w-5"
          style={{
            left: cursorX,
            top: cursorY,
            opacity: showCursor ? 1 : 0,
            transition: "left 0.5s ease-out, top 0.5s ease-out, opacity 0.2s",
            transform: "translate(-50%, -50%)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
            <path d="M4 1l16 11.5-6.5 1.5 4 8-3 1.5-4-8L4 20V1z" />
          </svg>
        </div>

      </div>

      {/* Fallback buttons */}
      <div className="mt-8 flex w-full gap-3">
        <button
          type="button"
          onClick={handleCopyAgain}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-accent px-4 py-3 text-[14px] font-bold text-muted transition-all duration-200 active:scale-[0.98]"
        >
          {justCopied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          onClick={handleOpenGoogle}
          className="flex-1 rounded-full bg-primary px-4 py-3 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(224,90,61,0.25)] transition-all duration-200 active:scale-[0.98]"
        >
          Open Google again
        </button>
      </div>
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

function SuccessScreen({ reviewText, data, cameFromInterstitial }: { reviewText: string; data: ReviewData; cameFromInterstitial: boolean }) {
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
          You&rsquo;re the best, {data.customerName}
        </ScreenHeading>

        {cameFromInterstitial ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Your review is copied and ready to paste.
            <br />
            Just switch to the Google tab and hit paste.
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Your review is copied! Search for{" "}
            <span className="font-semibold text-text">{data.businessName}</span>{" "}
            on Google Maps to post it.
          </p>
        )}

        <div className="mt-8 w-full rounded-card bg-background p-5">
          <div className="flex flex-col gap-4 text-left">
            {(cameFromInterstitial
              ? [
                  "Switch to the Google Reviews tab",
                  "Tap the review box and paste",
                  "Hit submit — that\u2019s it!",
                ]
              : [
                  "Open Google Maps and find " + data.businessName,
                  "Tap \"Write a review\" and paste",
                  "Hit submit — that\u2019s it!",
                ]
            ).map((text, i) => (
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
          {data.googleReviewUrl ? (
            <button
              type="button"
              onClick={() => window.open(data.googleReviewUrl, "_blank")}
              className="flex flex-1 items-center justify-center rounded-pill bg-primary px-6 py-2.5 text-[14px] font-bold text-white transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Open Google
            </button>
          ) : (
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center rounded-pill bg-primary px-6 py-2.5 text-[14px] font-bold text-white transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Open Google Maps
            </a>
          )}
        </ButtonRow>

        {cameFromInterstitial && (
          <p className="mt-6 rounded-[12px] bg-background px-4 py-3 text-[13px] leading-relaxed text-muted">
            Google didn&rsquo;t open? No worries — search for{" "}
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {data.businessName} on Google Maps
            </a>{" "}
            and paste your review there.
          </p>
        )}

        <p className="mt-6 text-[13px] text-muted">
          Thank you for supporting {data.businessName}.
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
  initialText,
  onSubmit,
  onBack,
  data,
}: {
  topicAnswers: Record<string, TopicAnswer>;
  initialText: string;
  onSubmit: (feedback: string) => void;
  onBack: () => void;
  data: ReviewData;
}) {
  const [text, setText] = useState(initialText);

  // Pre-fill summary from topic answers if any
  const hasPriorAnswers = Object.keys(topicAnswers).length > 0;

  return (
    <div className="flex flex-col items-center">
      <BackButton onClick={onBack} />
      <Avatar initials={data.businessInitials} />
      <ScreenHeading>Send your feedback</ScreenHeading>
      <ScreenSub>
        This goes directly to {data.businessName} — not posted publicly.
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
        placeholder="Tell them what happened..."
        rows={5}
        className="mt-6 w-full resize-none rounded-card border border-accent bg-background p-4 text-[15px] text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
      />
      <p className="mt-1.5 text-right text-[12px] text-muted/60">
        {text.length > 0 ? `${text.length} characters` : ""}
      </p>

      <ButtonRow>
        <PrimaryButton
          onClick={() => onSubmit(text || Object.entries(topicAnswers).map(([t, a]) => `${t}: ${a.option}`).join(", "))}
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

function PrivateSuccessScreen({
  data,
  onPostPublicly,
  showPublicOption,
}: {
  data: ReviewData;
  onPostPublicly: () => void;
  showPublicOption: boolean;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <ScreenHeading>Feedback sent</ScreenHeading>

      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Your feedback has been sent to {data.businessName}.
        <br />
        You chose to send this privately first.
      </p>

      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        You can still post a public review later if you decide to.
      </p>

      {showPublicOption && (
        <button
          type="button"
          onClick={onPostPublicly}
          className="mt-6 rounded-pill border border-accent px-5 py-2.5 text-[14px] font-semibold text-text transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Write a public review
        </button>
      )}

      <p className="mt-8 text-[13px] text-muted">
        They&rsquo;ll receive it right away and can follow up directly if they choose.
      </p>
    </div>
  );
}

function PrivateRevisitScreen({
  onPostPublicly,
  onDone,
}: {
  onPostPublicly: () => void;
  onDone: () => void;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <ScreenHeading>You already sent private feedback</ScreenHeading>

      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        If you&rsquo;d still like to share your experience publicly, you can.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onPostPublicly}
          className="w-full rounded-pill border border-accent px-5 py-3 text-[14px] font-semibold text-text transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Write a public review
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-[13px] font-medium text-muted underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] rounded-card bg-surface px-6 py-10 shadow-card sm:px-10 sm:py-12">
        <div className="flex flex-col items-center">
          <div className="mb-5 h-14 w-14 animate-pulse rounded-full bg-accent" />
          <div className="h-7 w-3/4 animate-pulse rounded-lg bg-accent" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-lg bg-accent/60" />
          <div className="mt-8 flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-11 w-11 animate-pulse rounded-lg bg-accent/40" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   NOT FOUND
   ═══════════════════════════════════════════════════ */

function NotFoundScreen({
  title = (
    <>
      Lost the <em className="text-primary">conversation</em>
    </>
  ),
  message = "This link wandered off. Ask the business to send you a fresh one — it takes two seconds.",
}: {
  title?: ReactNode;
  message?: string;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Giant background 404 */}
      <div
        className="pointer-events-none absolute select-none font-heading font-bold leading-none text-primary/[0.04]"
        style={{ fontSize: "min(50vw, 400px)" }}
        aria-hidden="true"
      >
        404
      </div>

      <div className="relative z-10 max-w-[440px] text-center">
        {/* Disconnected chat bubbles */}
        <div className="mb-10 flex items-end justify-center gap-3">
          <div className="animate-[float_3s_ease-in-out_infinite] rounded-[20px] rounded-bl-[4px] bg-primary/10 px-5 py-3">
            <div className="flex gap-[5px]">
              <div className="h-[7px] w-[7px] animate-[blink_1.4s_ease-in-out_infinite] rounded-full bg-primary/40" />
              <div className="h-[7px] w-[7px] animate-[blink_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-primary/40" />
              <div className="h-[7px] w-[7px] animate-[blink_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-primary/40" />
            </div>
          </div>
          <div className="animate-[float_3s_ease-in-out_0.5s_infinite] rounded-[20px] rounded-br-[4px] bg-accent px-5 py-3">
            <div className="flex gap-[5px]">
              <div className="h-[7px] w-[7px] animate-[blink_1.4s_ease-in-out_0.6s_infinite] rounded-full bg-muted/40" />
              <div className="h-[7px] w-[7px] animate-[blink_1.4s_ease-in-out_0.8s_infinite] rounded-full bg-muted/40" />
              <div className="h-[7px] w-[7px] animate-[blink_1.4s_ease-in-out_1s_infinite] rounded-full bg-muted/40" />
            </div>
          </div>
        </div>

        <h1 className="font-heading text-[36px] font-bold leading-[1.1] tracking-tight text-text sm:text-[44px]">
          {title}
        </h1>

        <p className="mx-auto mt-5 max-w-[340px] text-[16px] leading-[1.7] text-muted">
          {message}
        </p>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 rounded-pill border border-accent bg-surface px-7 py-3 text-[14px] font-semibold text-text shadow-sm transition-all duration-300 hover:border-primary hover:text-primary active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to small Talk
        </Link>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN FLOW
   ═══════════════════════════════════════════════════ */

function ReviewFlowInner({
  code,
  data,
  allTopics,
  session,
  isNewSession,
  revisitSourceSessionId,
  onStartPublicFollowup,
}: {
  code: string;
  data: ReviewData;
  allTopics: Record<string, TopicDef[]>;
  session: PublicFlowSessionState;
  isNewSession: boolean;
  revisitSourceSessionId: string | null;
  onStartPublicFollowup: (sourceSessionId?: string | null) => Promise<void>;
}) {
  const restoredState = useMemo(
    () => restoreFlowState(session, allTopics, revisitSourceSessionId),
    [session, allTopics, revisitSourceSessionId],
  );
  const [step, setStep] = useState<Step>(restoredState.step);
  const [rating, setRating] = useState(restoredState.rating);
  const [path, setPath] = useState<"public" | "private" | null>(restoredState.path);
  const [selectedTopics, setSelectedTopics] = useState<TopicDef[]>(restoredState.selectedTopics);
  const [currentTopicIdx, setCurrentTopicIdx] = useState(restoredState.currentTopicIdx);
  const [topicAnswers, setTopicAnswers] = useState<
    Record<string, TopicAnswer>
  >(restoredState.topicAnswers);
  const [optionalDetail, setOptionalDetail] = useState(restoredState.optionalDetail);
  const [finalReview, setFinalReview] = useState(restoredState.finalReview);
  const [showPrivateSuccessPublicOption, setShowPrivateSuccessPublicOption] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const saveProgress = useCallback(
    async (payload: Record<string, unknown>) => {
      await fetchPublicFlow<{ success: boolean }>(
        `/api/public/review-flow/${code}/progress`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    [code],
  );

  // Track link opened — only on first visit (new session), not refreshes/revisits
  useEffect(() => {
    if (isNewSession) {
      capture("review_link_opened", { has_service: !!data.serviceType });
    }
  }, [data.serviceType, isNewSession]);

  // Check if browser supports Web Speech API
  const hasSpeechSupport = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const tier = getTier(rating);

  // Resolve which topics the user selected into TopicDef objects
  const resolveTopics = useCallback(
    (labels: string[], customTopic: string | null) => {
      const tierTopics = allTopics[tier] || [];
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
    [tier, allTopics]
  );

  // Star rating handler
  const handleRate = useCallback(async (r: number) => {
    setRating(r);
    capture("stars_selected", { star_rating: r });

    try {
      await saveProgress({ star_rating: r, status: "in_progress" });
    } catch {
      setToastMsg("Couldn\u2019t save your progress \u2014 please try again.");
      setRating(0);
      return;
    }
    if (r <= 2) {
      setStep("low-rating-choice");
    } else {
      setStep("topics");
    }
  }, [saveProgress]);

  // Low rating choice
  const handlePublic = useCallback(async () => {
    setPath("public");
    try {
      await saveProgress({ feedback_type: "public" });
    } catch {
      setToastMsg("Couldn\u2019t save your choice \u2014 please try again.");
      return;
    }
    setStep("topics");
  }, [saveProgress]);

  const handlePrivate = useCallback(async () => {
    setPath("private");
    try {
      await saveProgress({ feedback_type: "private" });
    } catch {
      setToastMsg("Couldn\u2019t save your choice \u2014 please try again.");
      return;
    }
    setStep("topics");
  }, [saveProgress]);

  // Topic selection
  const handleTopics = useCallback(
    async (labels: string[], customTopic: string | null) => {
      const resolved = resolveTopics(labels, customTopic);
      setSelectedTopics(resolved);
      setCurrentTopicIdx(0);
      capture("topics_selected", {
        topic_count: resolved.length,
        has_custom_topic: !!customTopic,
      });
      try {
        await saveProgress({
          topics_selected: resolved.map((topic) => ({
            topic_id: topic.id,
            label: topic.label,
            follow_up_answer: "",
            detail_text: undefined,
          })),
        });
      } catch {
        setToastMsg("Couldn\u2019t save your progress \u2014 please try again.");
        return;
      }
      if (resolved.length > 0) {
        setStep("followup");
      } else {
        setStep("detail");
      }
    },
    [resolveTopics, saveProgress]
  );

  const handleSkipTopics = useCallback(async () => {
    setSelectedTopics([]);
    try {
      await saveProgress({ topics_selected: [] });
    } catch {
      setToastMsg("Couldn\u2019t save your progress \u2014 please try again.");
      return;
    }
    setStep("detail");
  }, [saveProgress]);

  // Voice input — skip topics/followups, go straight to review
  const handleVoice = useCallback(() => {
    setStep("voice");
  }, []);

  const handleVoiceDone = useCallback(async (transcript: string) => {
    setOptionalDetail(transcript);
    setSelectedTopics([]);
    setTopicAnswers({});
    if (path !== "private") {
      try {
        await saveProgress({ optional_text: transcript });
      } catch {
        setToastMsg("Couldn\u2019t save your progress \u2014 please try again.");
        return;
      }
    }
    if (path === "private") {
      setStep("private-feedback");
    } else {
      setStep("review");
    }
  }, [path, saveProgress]);

  const handleVoiceCancel = useCallback(() => {
    setStep("topics");
  }, []);

  // Follow-up answer
  const handleFollowUpAnswer = useCallback(
    async (option: string, detail: string) => {
      const topic = selectedTopics[currentTopicIdx];
      const newAnswers = {
        ...topicAnswers,
        [topic.label]: { option, detail },
      };
      setTopicAnswers(newAnswers);

      // Save topics to session
      const topicsSelected = Object.entries(newAnswers).map(([label, ans]) => ({
        topic_id: selectedTopics.find((t) => t.label === label)?.id || "custom",
        label,
        follow_up_answer: ans.option,
        detail_text: ans.detail || undefined,
      }));
      for (const remainingTopic of selectedTopics.slice(topicsSelected.length)) {
        topicsSelected.push({
          topic_id: remainingTopic.id,
          label: remainingTopic.label,
          follow_up_answer: "",
          detail_text: undefined,
        });
      }

      try {
        await saveProgress({ topics_selected: topicsSelected });
      } catch {
        setToastMsg("Couldn\u2019t save your progress \u2014 please try again.");
        return;
      }

      const nextIdx = currentTopicIdx + 1;
      if (nextIdx < selectedTopics.length) {
        setCurrentTopicIdx(nextIdx);
        setStep("followup");
      } else {
        setStep("detail");
      }
    },
    [selectedTopics, currentTopicIdx, topicAnswers, saveProgress]
  );

  // Detail
  const handleDetail = useCallback(
    async (text: string) => {
      setOptionalDetail(text);
      capture("detail_provided", {
        had_detail: !!text,
        word_count: text ? text.trim().split(/\s+/).length : 0,
      });

      if (path !== "private") {
        try {
          await saveProgress({ optional_text: text || null });
        } catch {
          setToastMsg("Couldn\u2019t save your progress \u2014 please try again.");
          return;
        }
      }
      if (path === "private") {
        setStep("private-feedback");
      } else {
        setStep("review");
      }
    },
    [path, saveProgress]
  );

  // Review — open Google, copy to clipboard, then save to Supabase in background
  // IMPORTANT: window.open must be synchronous from click — no awaits before it
  const handlePost = useCallback((text: string, _voiceId: string, copyFailed: boolean) => {
    setFinalReview(text);

    // Step 1 (sync): Open Google — must happen before any await to avoid popup blocker
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (data.googlePlaceId) {
      const base = isMobile
        ? "https://search.google.com/local/writereview/mobile"
        : "https://search.google.com/local/writereview";
      window.open(`${base}?placeid=${data.googlePlaceId}`, "_blank");
    } else if (data.googleReviewUrl) {
      window.open(data.googleReviewUrl, "_blank");
    } else {
      window.open("https://www.google.com/maps", "_blank");
    }

    // If copy failed, don't advance — ReviewScreen handles the manual copy fallback
    if (copyFailed) return;

    setStep("interstitial");

    fetch(`/api/public/review-flow/${code}/complete-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        star_rating: rating,
        generated_review: text,
      }),
    }).catch(() => {});
  }, [code, data.googlePlaceId, data.googleReviewUrl, rating]);

  // Private feedback
  const handlePrivateSubmit = useCallback(async (feedback: string) => {
    try {
      await fetchPublicFlow<{ success: boolean }>(
        `/api/public/review-flow/${code}/private-feedback`,
        {
          method: "POST",
          body: JSON.stringify({
            feedback,
            star_rating: rating,
          }),
        },
      );
    } catch {
      setToastMsg("Couldn\u2019t save your feedback \u2014 please try again.");
      return;
    }

    capture("private_feedback_submitted", { star_rating: rating });
    capture("review_completed", { star_rating: rating, feedback_type: "private" });
    setShowPrivateSuccessPublicOption(true);
    setStep("private-success");
  }, [code, rating]);

  const handleStartPublicReview = useCallback(async () => {
    try {
      await onStartPublicFollowup(revisitSourceSessionId || session.sessionId);
    } catch {
      setToastMsg(
        "Couldn’t reopen this request for public posting — please try again.",
      );
    }
  }, [onStartPublicFollowup, revisitSourceSessionId, session.sessionId]);

  // Back handlers
  const handleBackToStars = useCallback(() => {
    setRating(0);
    setStep("stars");
  }, []);

  const handleBackFromTopics = useCallback(() => {
    if (session.parentPrivateFeedbackSessionId) {
      setStep("private-revisit");
      return;
    }

    if (rating <= 2) {
      setStep("low-rating-choice");
    } else {
      setRating(0);
      setStep("stars");
    }
  }, [rating, session.parentPrivateFeedbackSessionId]);

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

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] rounded-card bg-surface px-6 py-10 shadow-card transition-all duration-300 sm:px-10 sm:py-12">
        <div key={`${step}-${currentTopicIdx}`} className="animate-fade-in">
          {step === "stars" && <StarsScreen onRate={handleRate} data={data} />}

          {step === "low-rating-choice" && (
            <LowRatingChoiceScreen
              onPublic={handlePublic}
              onPrivate={handlePrivate}
              onBack={handleBackToStars}
              data={data}
            />
          )}

          {step === "topics" && (
            <TopicsScreen
              tierTopics={allTopics[tier] || []}
              tier={tier}
              onContinue={handleTopics}
              onSkip={handleSkipTopics}
              onVoice={hasSpeechSupport ? handleVoice : undefined}
              onBack={handleBackFromTopics}
              data={data}
            />
          )}

          {step === "voice" && (
            <VoiceInputScreen
              onDone={handleVoiceDone}
              onCancel={handleVoiceCancel}
              data={data}
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
              data={data}
            />
          )}

          {step === "detail" && (
            <DetailScreen
              onContinue={handleDetail}
              onBack={handleBackFromDetail}
              data={data}
              hasSpeechSupport={hasSpeechSupport}
            />
          )}

          {step === "review" && (
            <ReviewScreen
              rating={rating}
              topicAnswers={topicAnswers}
              selectedTopics={selectedTopics}
              optionalDetail={optionalDetail}
              initialReviewText={finalReview}
              initialVoiceId={session.voiceId}
              code={code}
              onPost={handlePost}
              onBack={handleBackFromReview}
              data={data}
            />
          )}

          {step === "interstitial" && (
            <InterstitialScreen
              reviewText={finalReview}
              rating={rating}
              data={data}
              onContinue={() => {
                capture("review_completed", { star_rating: rating, feedback_type: "public" });
                setStep("success");
              }}
            />
          )}

          {step === "success" && <SuccessScreen reviewText={finalReview} data={data} cameFromInterstitial />}

          {step === "private-feedback" && (
            <PrivateFeedbackScreen
              topicAnswers={topicAnswers}
              initialText={path === "private" ? optionalDetail : ""}
              onSubmit={handlePrivateSubmit}
              onBack={handleBackFromPrivateFeedback}
              data={data}
            />
          )}

          {step === "private-revisit" && (
            <PrivateRevisitScreen
              onPostPublicly={handleStartPublicReview}
              onDone={() => {
                setShowPrivateSuccessPublicOption(false);
                setStep("private-success");
              }}
            />
          )}

          {step === "private-success" && (
            <PrivateSuccessScreen
              data={data}
              onPostPublicly={handleStartPublicReview}
              showPublicOption={showPrivateSuccessPublicOption}
            />
          )}
        </div>
      </div>

      {/* Toast for save errors */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#1A2E25] px-5 py-3 text-[14px] font-medium text-white shadow-lg animate-fade-in"
          onAnimationEnd={() => setTimeout(() => setToastMsg(null), 3000)}
        >
          {toastMsg}
        </div>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE — data fetching wrapper
   ═══════════════════════════════════════════════════ */

export default function ReviewFlow() {
  const params = useParams();
  const code = params.code as string;

  const [bootstrapData, setBootstrapData] = useState<BootstrapResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchPublicFlow<BootstrapResponse>(
          `/api/public/review-flow/${code}/bootstrap`,
        );
        setBootstrapData(result);
        setLoading(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load review link";

        if (message.toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          setLoadError(message);
        }
        setLoading(false);
      }
    }

    load();
  }, [code]);

  const handleStartPublicFollowup = useCallback(
    async (sourceSessionId?: string | null) => {
      const result = await fetchPublicFlow<BootstrapResponse>(
        `/api/public/review-flow/${code}/start-public-followup`,
        {
          method: "POST",
          body: JSON.stringify(
            sourceSessionId
              ? { source_session_id: sourceSessionId }
              : {},
          ),
        },
      );

      setBootstrapData(result);
    },
    [code],
  );

  if (loading) return <LoadingSkeleton />;
  if (loadError) {
    return (
      <NotFoundScreen
        title="Please try again in a bit"
        message={loadError}
      />
    );
  }
  if (notFound || !bootstrapData) return <NotFoundScreen />;
  return (
    <ReviewFlowInner
      key={`${bootstrapData.revisitSourceSessionId ?? "flow"}-${bootstrapData.session.sessionId}`}
      code={code}
      data={bootstrapData.review}
      allTopics={bootstrapData.topics}
      session={bootstrapData.session}
      isNewSession={bootstrapData.isNewSession}
      revisitSourceSessionId={bootstrapData.revisitSourceSessionId}
      onStartPublicFollowup={handleStartPublicFollowup}
    />
  );
}
