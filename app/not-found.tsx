import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Giant background 404 — the hero moment */}
      <div
        className="pointer-events-none absolute select-none font-heading font-bold leading-none text-primary/[0.04]"
        style={{ fontSize: "min(50vw, 400px)" }}
        aria-hidden="true"
      >
        404
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[440px] text-center">
        {/* Disconnected chat bubbles — on brand metaphor */}
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
          Lost the <em className="text-primary">conversation</em>
        </h1>

        <p className="mx-auto mt-5 max-w-[340px] text-[16px] leading-[1.7] text-muted">
          This page wandered off. If someone sent you a review link, ask them for a fresh one — it takes two seconds.
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
