"use client";

import { useState, useEffect } from "react";

const BORDER = "border border-[#D1C4B0]";

const REPLY_EXAMPLES = [
  {
    stars: 5,
    author: "Sarah M.",
    initial: "S",
    review: "Crystal Clear Pools was fantastic. Marcus showed up right on time and the pool looks crystal clear. Highly recommend.",
    reply: "Thanks so much \u2014 Marcus will love hearing this. Showing up on time and getting the water right is what we\u2019re all about. See you next month!",
  },
  {
    stars: 2,
    author: "Jason R.",
    initial: "J",
    review: "Waited over an hour past the scheduled window. Nobody called to let me know they\u2019d be late.",
    reply: "I\u2019m really sorry about the wait \u2014 that\u2019s not how we do things. I\u2019d like to make this right. Give me a call directly at (512) 555-0100 and I\u2019ll personally handle your next visit.",
  },
];

function ReviewCard({ stars, author, initial, text }: {
  stars: number;
  author: string;
  initial: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EAED]">
        <span className="text-[13px] font-bold text-[#5F6368]">{initial}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-text">{author}</p>
        <div className="mt-0.5 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= stars ? "#FBBC04" : "#D1D5DB"} stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-muted">2 weeks ago</p>
        <p className="mt-3 text-[15px] leading-relaxed text-text">{text}</p>
      </div>
    </div>
  );
}

export default function ReplyDemo() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [phase, setPhase] = useState<"empty" | "typing" | "done">("empty");
  const [visibleWords, setVisibleWords] = useState(0);
  const [fading, setFading] = useState(false);

  const example = REPLY_EXAMPLES[exampleIdx];
  const replyWords = example.reply.split(" ");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "empty") {
      setVisibleWords(0);
      timer = setTimeout(() => setPhase("typing"), 2000);
    } else if (phase === "done") {
      timer = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setExampleIdx((prev) => (prev + 1) % REPLY_EXAMPLES.length);
          setPhase("empty");
          setFading(false);
        }, 400);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (visibleWords >= replyWords.length) {
      setPhase("done");
      return;
    }
    const delay = 60 + Math.random() * 40;
    const timer = setTimeout(() => setVisibleWords((v) => v + 1), delay);
    return () => clearTimeout(timer);
  }, [phase, visibleWords, replyWords.length]);

  const showReply = phase === "typing" || phase === "done";
  const typedText = replyWords.slice(0, visibleWords).join(" ");

  return (
    <div className={`transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="grid gap-8 md:grid-cols-2">
        {/* LEFT — The problem */}
        <div>
          <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.15em] text-muted">The review</p>
          <div className={`rounded-card ${BORDER} bg-surface p-8`}>
            <ReviewCard
              stars={example.stars}
              author={example.author}
              initial={example.initial}
              text={example.review}
            />
            <div className="mt-6 border-t border-accent pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-[10px] font-bold text-primary">CCP</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-[12px] font-semibold text-text">Crystal Clear Pools</p>
                  <div className="relative rounded-[8px] border border-[#D1C4B0] bg-[#F9F6F0] p-3" style={{ minHeight: 80 }}>
                    {!showReply && (
                      <>
                        <div className="h-5 w-[2px] animate-[blink_1s_step-end_infinite] bg-primary" />
                        <span className="pointer-events-none absolute left-4 top-3 text-[13px] text-muted/40">
                          Write a reply...
                        </span>
                      </>
                    )}
                  </div>
                  {!showReply && (
                    <p className="mt-2 text-[12px] italic text-muted/50">You&rsquo;ve been staring at this for 4 minutes.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — The fix */}
        <div>
          <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.15em] text-primary">With small Talk</p>
          <div className="rounded-card border-2 border-primary bg-surface p-8">
            <ReviewCard
              stars={example.stars}
              author={example.author}
              initial={example.initial}
              text={example.review}
            />
            <div className="mt-6 border-t border-accent pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-[10px] font-bold text-primary">CCP</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-[12px] font-semibold text-text">Crystal Clear Pools</p>
                  <div className="rounded-[8px] border border-primary/30 bg-white p-3" style={{ minHeight: 80 }}>
                    {showReply ? (
                      <p className="text-[13px] leading-relaxed text-text">
                        {typedText}
                        {phase === "typing" && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] animate-[blink_1s_step-end_infinite] bg-primary align-text-bottom" />
                        )}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span className="text-[12px] font-medium text-primary">Drafting reply...</span>
                      </div>
                    )}
                  </div>
                  {phase === "done" && (
                    <button
                      type="button"
                      className="mt-3 rounded-pill bg-primary px-5 py-2 text-[12px] font-semibold text-white transition-all duration-300 hover:opacity-90 active:scale-[0.97]"
                    >
                      Copy Reply
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
