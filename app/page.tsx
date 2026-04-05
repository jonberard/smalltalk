"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import Link from "next/link";

/* ═══════════════════════════════════════════════════
   SCROLL FADE-UP — IntersectionObserver, no library
   ═══════════════════════════════════════════════════ */

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll<HTMLElement>("[data-fade]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.animation =
              "fade-up 800ms ease-out forwards";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    children.forEach((child) => {
      child.style.opacity = "0";
      observer.observe(child);
    });
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ═══════════════════════════════════════════════════
   SHARED
   ═══════════════════════════════════════════════════ */

const BORDER = "border border-[#D1C4B0]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.15em] text-muted">
      {children}
    </p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-[32px] font-semibold leading-[1.15] tracking-tight text-text sm:text-[40px]">
      {children}
    </h2>
  );
}

function CTAButton({ children, large, href }: { children: React.ReactNode; large?: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-pill bg-primary font-medium text-white transition-all duration-300 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        large
          ? "px-8 py-4 text-[16px]"
          : "px-6 py-3 text-[15px]"
      }`}
    >
      {children}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════
   HERO PHONE — realistic device frame with glow
   ═══════════════════════════════════════════════════ */

function HeroPhone() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow blob */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-[60px]" />

      {/* Phone shell */}
      <div className="relative w-[280px] animate-[float_6s_ease-in-out_infinite] rounded-[44px] border border-muted/20 bg-text p-3 shadow-2xl sm:w-[320px]" style={{ aspectRatio: "19.5/40" }}>
        {/* Hardware buttons */}
        <div className="absolute -left-[3px] top-[120px] h-12 w-[3px] rounded-l-md bg-text" />
        <div className="absolute -left-[3px] top-[180px] h-12 w-[3px] rounded-l-md bg-text" />
        <div className="absolute -right-[3px] top-[140px] h-16 w-[3px] rounded-r-md bg-text" />

        {/* Inner screen */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-accent/50 bg-surface">
          {/* Dynamic island */}
          <div className="absolute inset-x-0 top-0 z-20 flex justify-center">
            <div className="-mt-px h-6 w-24 rounded-b-2xl bg-text" />
          </div>

          {/* Screen content */}
          <div className="flex flex-1 flex-col px-5 pb-6 pt-12">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <h3 className="text-[16px] font-bold leading-tight text-text sm:text-[18px]">
                Rate Crystal Clear Pools
              </h3>
              <p className="mt-1 text-[11px] text-muted">What stood out to you?</p>
            </div>

            {/* Topic chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                { label: "Right on time", on: true },
                { label: "Spotless", on: false },
                { label: "Fair price", on: false },
                { label: "Great communication", on: true },
                { label: "Professional", on: false },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
                    chip.on
                      ? "bg-primary text-white"
                      : "border border-accent bg-background text-text"
                  }`}
                >
                  {chip.label}
                </span>
              ))}
            </div>

            {/* AI drafting state */}
            <div className="mt-auto rounded-[12px] border border-accent/50 bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="animate-spin text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  AI Drafting Review...
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-accent/40" />
                <div className="h-2 w-5/6 rounded-full bg-accent/40" />
                <div className="h-2 w-4/6 rounded-full bg-accent/40" />
              </div>
            </div>

            {/* Post button */}
            <div className="mt-4 w-full rounded-[8px] bg-text py-3 text-center text-[13px] font-medium text-white opacity-50">
              Post to Google
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  const wrapRef = useFadeUp();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const ctaHref = loggedIn ? "/dashboard" : "/signup";

  async function handlePricingCta() {
    if (!loggedIn || !userId) {
      window.location.href = "/signup";
      return;
    }
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div ref={wrapRef} className="min-h-dvh bg-background font-body text-text">

      {/* ─── Nav ─── */}
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 lg:px-12">
        <span className="font-heading text-[20px] font-semibold text-text">small Talk</span>
        <div className="flex items-center gap-4">
          {!loggedIn && (
            <Link
              href="/login"
              className="text-[14px] font-medium text-muted transition-colors duration-300 hover:text-text"
            >
              Log in
            </Link>
          )}
          <Link
            href={ctaHref}
            className="rounded-[8px] border border-accent px-6 py-2.5 text-[14px] font-semibold text-text transition-colors duration-300 hover:border-primary hover:text-primary"
          >
            {loggedIn ? "Dashboard" : "Get Started"}
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════════════════
         SECTION 1: HERO
         ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-6 pb-[160px] pt-[60px] lg:px-12 lg:pt-[80px]">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between lg:gap-24">
          {/* Left — text */}
          <div className="w-full text-center lg:w-[55%] lg:text-left">
            <h1 className="font-heading text-[40px] font-bold leading-[1.1] tracking-tight text-text sm:text-[52px] lg:text-[64px]">
              Your customers love you. They just{" "}
              <em className="font-medium text-primary">hate</em> writing reviews.
            </h1>
            <p className="mx-auto mt-6 max-w-[540px] text-[17px] leading-relaxed text-muted sm:text-[19px] lg:mx-0">
              Turn happy clients into detailed 5-star Google reviews with an
              AI-guided flow that takes 30 seconds. No more blank-box
              paralysis.
            </p>
            <div className="mt-8 flex flex-col items-center gap-5 pt-2 sm:flex-row lg:justify-start">
              <Link
                href={ctaHref}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-8 py-4 text-[17px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#c84a2f] active:scale-[0.98] sm:w-auto"
              >
                {loggedIn ? "Go to Dashboard" : "Start Free Trial"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <p className="flex items-center gap-2 text-[14px] text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                No credit card required
              </p>
            </div>

            {/* Who it's for */}
            <div className="mt-10 border-t border-accent pt-8 lg:text-left">
              <p className="text-[14px] text-muted">
                Built for pool companies, landscapers, contractors, and local pros.
              </p>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="w-full lg:w-[45%] flex justify-center lg:justify-end">
            <HeroPhone />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 2: THE PROBLEM
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[800px] px-6 pb-[160px]">
        <div className="text-center">
          <Heading>
            You ask for a review. They see a{" "}
            <span className="italic text-muted/60">blank box</span>.
            {" "}They close the tab.
          </Heading>
          <p className="mx-auto mt-8 max-w-[540px] font-heading text-[19px] text-muted sm:text-[22px]">
            50% of Google reviews have no text.
          </p>

          {/* Blank review box with blinking cursor */}
          <div className="mx-auto mt-12 flex max-w-md items-start rounded-[12px] border border-[#D1C4B0] bg-white p-6 shadow-[0_12px_40px_rgba(26,46,37,0.12)]">
            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="mb-3 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#D1C4B0" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <div className="relative h-24 w-full rounded-[8px] border border-[#D1C4B0] bg-[#F9F6F0] p-3">
                <div className="h-5 w-[2px] animate-[blink_1s_step-end_infinite] bg-primary" />
                <span className="pointer-events-none absolute left-4 top-3 text-[14px] text-muted/40">
                  Share details of your own experience at this place
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 3: THE 30-SECOND FIX
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[1080px] px-6 pb-[160px]">
        <div className="mb-16 text-center">
          <SectionLabel>How it works</SectionLabel>
          <Heading>The 30-Second Fix</Heading>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {/* Step 1 — Text the link */}
          <div className="flex flex-col items-center">
            <div className="relative mx-auto h-[480px] w-[232px] rounded-[40px] border border-[#D5D5D5] bg-[#F0F0F0] p-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:w-[250px]">
              <div className="absolute inset-x-0 top-[4px] z-20 flex justify-center">
                <div className="h-[11px] w-[40px] rounded-full bg-black" />
              </div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[37px] bg-white">
                {/* iMessage nav */}
                <div className="flex items-center justify-between px-3 pb-1.5 pt-7">
                  <svg width="7" height="11" viewBox="0 0 8 12" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1L2 6l5 5"/></svg>
                  <div className="text-center">
                    <div className="mx-auto mb-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                      <span className="text-[8px] font-bold text-primary">CCP</span>
                    </div>
                    <p className="text-[9px] font-semibold text-text">Crystal Clear Pools</p>
                  </div>
                  <div className="w-[7px]" />
                </div>
                <div className="h-px bg-accent/40" />

                {/* Messages */}
                <div className="flex-1 px-3 pt-3">
                  <p className="mb-3 text-center text-[8px] text-muted/50">Today 9:41 AM</p>
                  <div className="mb-2 mr-6 rounded-2xl rounded-bl-sm bg-[#E5E5EA] px-3 py-2 text-[11px] leading-relaxed text-text">
                    Hi Sarah! How was your pool cleaning with Marcus? Tap to share your experience — takes 30 seconds, no writing required.
                  </div>
                  {/* Tappable link button */}
                  <div className="mr-6 rounded-xl rounded-bl-sm bg-primary px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold text-white">
                      Share your experience &rarr;
                    </p>
                    <p className="mt-0.5 text-[8px] text-white/60">
                      usesmalltalk.com &middot; 30 seconds
                    </p>
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-[2px] h-[3px] w-[70px] rounded-full bg-black/15" />
            </div>
            <h3 className="mt-8 font-heading text-[22px] font-semibold text-text">
              1. Text the link.
            </h3>
            <p className="mt-2 text-center text-[15px] leading-relaxed text-muted">
              One tap sends a personalized review request right after the job.
            </p>
          </div>

          {/* Step 2 — They tap, no typing */}
          <div className="flex flex-col items-center">
            <div className="relative mx-auto h-[480px] w-[232px] rounded-[40px] border border-[#D5D5D5] bg-[#F0F0F0] p-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:w-[250px]">
              <div className="absolute inset-x-0 top-[4px] z-20 flex justify-center">
                <div className="h-[11px] w-[40px] rounded-full bg-black" />
              </div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[37px] bg-white">
                <div className="flex flex-1 flex-col items-center justify-center px-5">
                  <p className="font-heading text-[14px] font-semibold text-text">What stood out?</p>
                  <p className="mt-1 text-[10px] text-muted">Tap the topics that matter</p>
                  <div className="mt-3 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                    {[
                      { label: "Punctual", on: false },
                      { label: "Fair price", on: true },
                      { label: "Clean work", on: false },
                      { label: "Professional", on: true },
                      { label: "Friendly", on: false },
                    ].map((chip) => (
                      <span
                        key={chip.label}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${
                          chip.on
                            ? "bg-primary text-white"
                            : "border border-[#D1C4B0] bg-surface text-text"
                        }`}
                      >
                        {chip.on && "✓ "}{chip.label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 w-full rounded-pill bg-primary py-2.5 text-center text-[11px] font-bold text-white">
                    Continue
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-[2px] h-[3px] w-[70px] rounded-full bg-black/15" />
            </div>
            <h3 className="mt-8 font-heading text-[22px] font-semibold text-text">
              2. They tap, no typing.
            </h3>
            <p className="mt-2 text-center text-[15px] leading-relaxed text-muted">
              Your customer picks what stood out in a few quick taps. No blank page, no writer&rsquo;s block.
            </p>
          </div>

          {/* Step 3 — AI drafts, they post */}
          <div className="flex flex-col items-center">
            <div className="relative mx-auto h-[480px] w-[232px] rounded-[40px] border border-[#D5D5D5] bg-[#F0F0F0] p-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:w-[250px]">
              <div className="absolute inset-x-0 top-[4px] z-20 flex justify-center">
                <div className="h-[11px] w-[40px] rounded-full bg-black" />
              </div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[37px] bg-white">
                <div className="flex flex-1 flex-col justify-center px-5">
                  <div className="mb-4 text-center">
                    <p className="font-heading text-[14px] font-semibold text-text">Your review is ready</p>
                    <p className="mt-1 text-[10px] text-muted">Edit anything, or post as-is</p>
                  </div>
                  <div className="rounded-[10px] border border-[#D1C4B0] bg-surface p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                        S
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text">Sarah M.</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="none">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed text-text">
                      Crystal Clear Pools was fantastic. They were perfectly punctual, charged a fair price, and conducted themselves as true professionals&hellip;
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span className="flex-1 rounded-pill border border-[#D1C4B0] py-2 text-center text-[9px] font-bold text-muted">
                      Try another
                    </span>
                    <span className="flex-1 rounded-pill bg-primary py-2 text-center text-[9px] font-bold text-white">
                      Copy &amp; post
                    </span>
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-[2px] h-[3px] w-[70px] rounded-full bg-black/15" />
            </div>
            <h3 className="mt-8 font-heading text-[22px] font-semibold text-text">
              3. AI drafts, they post.
            </h3>
            <p className="mt-2 text-center text-[15px] leading-relaxed text-muted">
              A detailed, genuine review — ready to copy and post to Google in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 4: STAT BANNER
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[1080px] px-6 pb-[160px]">
        <div className="relative overflow-hidden rounded-[16px] bg-primary px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <h3 className="relative z-10 font-heading text-[28px] font-bold leading-tight sm:text-[40px] lg:text-[48px]">
            Average review length increased from{" "}
            <span className="opacity-70 line-through decoration-2">12 words</span>{" "}
            to <em className="underline decoration-accent/50 underline-offset-8">85 words.</em>
          </h3>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 5: BEFORE / AFTER
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[960px] px-6 pb-[160px]">
        <div className="mb-16 text-center">
          <SectionLabel>The difference</SectionLabel>
          <Heading>Same customer. Different tool.</Heading>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Before */}
          <div className={`rounded-card ${BORDER} bg-surface p-8`}>
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.15em] text-muted">Without small Talk</p>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EAED]">
                <span className="text-[13px] font-bold text-[#5F6368]">S</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-text">Sarah M.</p>
                <div className="mt-0.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBC04" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted">2 weeks ago</p>
                <p className="mt-3 text-[15px] leading-relaxed text-text">Good.</p>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="rounded-card border-2 border-primary bg-surface p-8">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.15em] text-primary">With small Talk</p>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EAED]">
                <span className="text-[13px] font-bold text-[#5F6368]">S</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-text">Sarah M.</p>
                <div className="mt-0.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBC04" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted">2 weeks ago</p>
                <p className="mt-3 text-[15px] leading-relaxed text-text">
                  Crystal Clear Pools was fantastic. They were perfectly punctual, charged a fair price, and conducted themselves as true professionals. Marcus even pointed out a small crack in the pool tile I hadn&rsquo;t noticed. Highly recommend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 6: NEGATIVE REVIEW HANDLING
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[800px] px-6 pb-[160px]">
        <div className="text-center">
          <SectionLabel>Honest reviews</SectionLabel>
          <Heading>
            What happens when it&rsquo;s not 5 stars?
          </Heading>
          <p className="mx-auto mt-6 max-w-[580px] text-[17px] leading-[1.7] text-muted">
            small Talk captures honest reviews, not just positive ones. For 1&ndash;2 star ratings, your customer gets a genuine choice:
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* Option A — Public */}
          <div className={`rounded-card ${BORDER} bg-surface p-8`}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
            <h3 className="font-heading text-[18px] font-semibold text-text">Share publicly</h3>
            <p className="mt-2 text-[15px] leading-[1.7] text-muted">
              The flow continues normally — topics, follow-ups, AI draft. The review is honest and critical, exactly like the customer experienced it.
            </p>
          </div>

          {/* Option B — Private */}
          <div className={`rounded-card ${BORDER} bg-surface p-8`}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="font-heading text-[18px] font-semibold text-text">Send private feedback</h3>
            <p className="mt-2 text-[15px] leading-[1.7] text-muted">
              Goes directly to you. No public post. Many unhappy customers would rather tell you first — now they can. You get a chance to make it right.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-[15px] leading-[1.7] text-muted">
          Both options are equally prominent. This isn&rsquo;t review gating — it&rsquo;s giving your customer a choice they&rsquo;ve never had.
        </p>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 7: PRICING
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[960px] px-6 pb-[160px]">
        <div className="mb-20 text-center">
          <SectionLabel>Pricing</SectionLabel>
          <Heading>Simple, honest pricing</Heading>
          <p className="mx-auto mt-4 max-w-[480px] text-[17px] leading-[1.6] text-muted">
            Pick the plan that fits. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Single Location */}
          <div className={`flex flex-col rounded-card ${BORDER} bg-surface p-10`}>
            <div className="mb-8">
              <h3 className="font-heading text-[22px] font-semibold text-text">
                Single Location
              </h3>
              <p className="mt-2 text-[14px] text-muted">
                Perfect for independent shops and solo operators.
              </p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="font-heading text-[44px] font-bold tracking-tight text-text">$29</span>
              <span className="text-[15px] text-muted">/mo</span>
            </div>
            <p className="mb-4 text-[13px] text-muted">7-day free trial · 10 free review requests</p>
            <ul className="mb-10 flex flex-1 flex-col gap-4">
              {[
                "Unlimited review requests",
                "Unlimited review links",
                "AI review generation",
                "Real-time analytics",
                "Email support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-[14px] text-text">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handlePricingCta}
              className={`block w-full rounded-pill ${BORDER} bg-surface py-3.5 text-center text-[14px] font-semibold text-text transition-all duration-300 hover:bg-accent/30 active:scale-[0.98]`}
            >
              {loggedIn ? "Start Free Trial" : "Start free trial"}
            </button>
          </div>

          {/* Multi-Crew */}
          <div className="relative mt-5 flex flex-col rounded-card border-2 border-primary bg-surface p-10 sm:mt-0">
            <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-pill border border-primary bg-surface px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
              Most Popular
            </span>
            <div className="mb-8">
              <h3 className="font-heading text-[22px] font-semibold text-text">
                Multi-Crew
              </h3>
              <p className="mt-2 text-[14px] text-muted">
                For growing teams with multiple locations.
              </p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="font-heading text-[44px] font-bold tracking-tight text-text">$49</span>
              <span className="text-[15px] text-muted">/mo</span>
            </div>
            <p className="mb-4 text-[13px] text-muted">7-day free trial · 10 free review requests</p>
            <ul className="mb-10 flex flex-1 flex-col gap-4">
              {[
                "Bulk CSV sends",
                "Unlimited review requests",
                "Everything in Single",
                "Up to 5 locations",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-[14px] text-text">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handlePricingCta}
              className="block w-full rounded-pill bg-primary py-3.5 text-center text-[14px] font-semibold text-white transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
            >
              {loggedIn ? "Start Free Trial" : "Start free trial"}
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 8: FAQ (Accordion)
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[800px] px-6 pb-[160px]">
        <div className="mb-12 text-center">
          <SectionLabel>FAQ</SectionLabel>
          <Heading>Frequently Asked Questions</Heading>
        </div>

        <div className="flex flex-col">
          {[
            {
              q: "Is this allowed by Google?",
              a: "Yes. small Talk does not post reviews automatically or gate bad reviews. We provide a drafted text based on the customer\u2019s selections to make writing easier. The customer posts it from their own Google account.",
            },
            {
              q: "Are the reviews authentic?",
              a: "Absolutely. The AI only drafts content based on specific tags and details the customer selects. It expands their genuine sentiment into full sentences, ensuring the review accurately reflects their actual experience.",
            },
            {
              q: "How does the customer post it?",
              a: "After the AI generates the draft, the customer taps one button that copies the text and opens your Google Business review link. They paste the text and hit submit. Start to finish, about 30 seconds.",
            },
            {
              q: "Can I customize the topics my customers see?",
              a: "Yes. You can add, remove, or reword any topic from your Settings screen. Choose the categories that matter most for your trade so every review highlights what sets you apart.",
            },
            {
              q: "Do I need a credit card to start?",
              a: "No. You can sign up and test the entire flow for free. We only ask for payment when you\u2019re ready to send links to real customers.",
            },
          ].map((item, i) => (
            <details
              key={item.q}
              className={`group cursor-pointer py-6 ${
                i < 4 ? "border-b border-accent" : ""
              }`}
            >
              <summary className="flex items-center justify-between font-heading text-[18px] font-semibold text-text focus:outline-none sm:text-[20px]">
                {item.q}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 transition-transform duration-300 group-open:rotate-180"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p className="mt-4 pr-8 text-[16px] leading-[1.7] text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 9: FINAL CTA
         ════════════════════════════════════════════ */}
      <section data-fade id="get-started" className="mx-auto max-w-[1080px] px-6 pb-[160px]">
        <div className="rounded-[16px] bg-accent/40 px-6 py-20 text-center sm:px-14">
          <h2 className="mx-auto max-w-[640px] font-heading text-[36px] font-bold leading-tight text-text sm:text-[48px]">
            Get your first review in 5 minutes
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.6] text-muted">
            Set up your account, send one link, and see the difference a guided review makes.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={ctaHref}
              className="rounded-pill bg-primary px-8 py-4 text-[16px] font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#c84a2f] active:scale-[0.98]"
            >
              {loggedIn ? "Go to Dashboard" : "Start Free Trial"}
            </Link>
            <span className="text-[12px] italic uppercase tracking-widest text-muted">
              No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#D1C4B0] bg-accent/20 px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-heading text-[18px] font-bold text-text">small Talk</span>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-widest text-muted">
            <a href="#" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Privacy Policy</a>
            <a href="#" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Terms of Service</a>
            <a href="#" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Contact</a>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            &copy; 2026 small Talk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
