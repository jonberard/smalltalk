"use client";

import Link from "next/link";

export function SetupPageShell({
  eyebrow,
  title,
  description,
  backHref = "/dashboard/more",
  backLabel = "Back to setup",
  actions,
  headerTone = "hero",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  headerTone?: "hero" | "detail";
  children: React.ReactNode;
}) {
  const isDetail = headerTone === "detail";

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[1040px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {backLabel}
          </Link>
          <div
            className={`flex flex-col lg:flex-row lg:justify-between ${
              isDetail
                ? "mt-3 gap-3 lg:items-start"
                : "mt-4 gap-4 lg:items-end"
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                {eyebrow}
              </p>
              <h1
                className={`text-balance font-heading font-semibold tracking-[-0.03em] text-[var(--dash-text)] ${
                  isDetail
                    ? "mt-1 max-w-[18ch] text-[28px] leading-[1.02] sm:text-[32px]"
                    : "mt-2 max-w-[12ch] text-[32px] leading-[0.98] sm:text-[38px]"
                }`}
              >
                {title}
              </h1>
              <p
                className={`max-w-[54ch] text-[14px] leading-relaxed text-[var(--dash-muted)] ${
                  isDetail ? "mt-2" : "mt-3"
                }`}
              >
                {description}
              </p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

export function SetupCardLink({
  href,
  eyebrow,
  title,
  description,
  meta,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)] transition-all duration-200 hover:border-[#E05A3D]/30 hover:-translate-y-[1px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
            {title}
          </h2>
          <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          {meta}
          <span className="rounded-full bg-[#E05A3D]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E05A3D] transition-colors group-hover:bg-[#E05A3D] group-hover:text-white">
            Open
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SetupInfoStrip({
  title,
  description,
  accent = "soft",
}: {
  title: string;
  description: string;
  accent?: "soft" | "warm";
}) {
  return (
    <div
      className={`rounded-[var(--dash-radius)] border p-4 ${
        accent === "warm"
          ? "border-[#E05A3D]/15 bg-[#FFF8F4]"
          : "border-[var(--dash-border)] bg-white"
      }`}
    >
      <p className="text-[13px] font-semibold text-[var(--dash-text)]">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
        {description}
      </p>
    </div>
  );
}

export function SetupTrustBanner({
  text = "Using recommended defaults - works for most businesses",
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[#FFF8F4] px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--dash-text)] text-[12px] text-[var(--dash-text)]">
        ✓
      </div>
      <p className="text-[13px] font-medium text-[var(--dash-text)]">{text}</p>
    </div>
  );
}

export function SetupSummarySection({
  heading,
  note,
  children,
}: {
  heading?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {heading ? (
        <p className="mb-2 pl-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          {heading}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
        {children}
      </div>
      {note ? (
        <p className="mt-2 pl-0.5 text-[12px] italic leading-relaxed text-[var(--dash-muted)]">
          {note}
        </p>
      ) : null}
    </section>
  );
}

export function SetupSummaryRow({
  label,
  value,
  hint,
  href,
  actionLabel,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  actionLabel?: string;
  accent?: boolean;
  last?: boolean;
}) {
  const content = (
    <div
      className={`flex items-start justify-between gap-4 px-4 py-4 transition-colors ${
        accent ? "bg-[#FFF8F4]" : "bg-white"
      } ${!last ? "border-b border-[var(--dash-border)]" : ""} ${
        href ? "group hover:bg-[#FCFAF6]" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
          {label}
        </p>
        <p className="text-[14px] font-medium leading-[1.35] text-[var(--dash-text)]">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
            {hint}
          </p>
        ) : null}
      </div>
      {actionLabel ? (
        <div className="shrink-0 pt-0.5 text-[12px] font-medium text-[var(--dash-muted)] underline decoration-[rgba(94,114,104,0.35)] underline-offset-4 transition-colors group-hover:text-[var(--dash-text)]">
          {actionLabel}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
