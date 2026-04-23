"use client";

import { useEffect, useRef, useState } from "react";

export function DashboardHelpHint({
  text,
  label = "More info",
  children,
  delayMs = 350,
}: {
  text: string;
  label?: string;
  children?: React.ReactNode;
  delayMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  function clearOpenTimeout() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function scheduleOpen() {
    clearOpenTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setOpen(true);
    }, delayMs);
  }

  function handleClose() {
    clearOpenTimeout();
    setOpen(false);
  }

  useEffect(() => {
    return () => clearOpenTimeout();
  }, []);

  return (
    <div
      className="group relative inline-flex items-center"
      onMouseEnter={scheduleOpen}
      onMouseLeave={handleClose}
      onFocus={scheduleOpen}
      onBlur={handleClose}
    >
      {children ? (
        <div aria-label={label} className="inline-flex">
          {children}
        </div>
      ) : (
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--dash-border)] bg-white text-[10px] font-semibold text-[var(--dash-muted)] transition-colors hover:border-[#D9CCBC] hover:text-[var(--dash-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E05A3D]/12"
        >
          ?
        </button>
      )}
      <div
        className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-[220px] -translate-x-1/2 rounded-[12px] border border-[var(--dash-border)] bg-white px-3 py-2 text-[12px] leading-relaxed text-[var(--dash-text)] shadow-[0_12px_26px_rgba(26,29,32,0.08)] transition-all duration-150 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
