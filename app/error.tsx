"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-[420px] text-center">
        <h1 className="font-heading text-[32px] font-bold text-text">
          Something went wrong.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          We hit a snag. Try refreshing the page, or head back to the homepage.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-pill bg-primary px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-95 active:scale-[0.98]"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-pill border border-accent px-6 py-2.5 text-[14px] font-semibold text-text transition-colors hover:bg-accent/50 active:scale-[0.98]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
