import type { Metadata } from "next";
import Link from "next/link";
import FadeWrapper from "@/components/landing/fade-wrapper";
import LandingNav from "@/components/landing/landing-nav";
import { FinalCTA } from "@/components/landing/auth-cta";

/* ═══════════════════════════════════════════════════
   METADATA
   ═══════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Not Review Gating — How small Talk Handles Honest Reviews",
  description:
    "Review gating is when tools hide unhappy customers from Google. small Talk doesn't do that. Every customer gets a real choice — post publicly or send private feedback. Here's exactly how it works.",
  openGraph: {
    title: "Not Review Gating — How small Talk Handles Honest Reviews",
    description:
      "Review gating is when tools hide unhappy customers from Google. small Talk doesn't do that. Every customer gets a real choice.",
    type: "website",
    url: "https://usesmalltalk.com/not-review-gating",
    siteName: "small Talk",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "small Talk — Not Review Gating" }],
  },
  alternates: {
    canonical: "https://usesmalltalk.com/not-review-gating",
  },
};

/* ═══════════════════════════════════════════════════
   SHARED PRESENTATIONAL (server-safe)
   ═══════════════════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.15em] text-primary">
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════
   GATING FLOW DIAGRAM
   ═══════════════════════════════════════════════════ */

function GatingDiagram() {
  return (
    <div data-fade className="flex flex-col items-center">
      {/* Label */}
      <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.15em] text-primary">
        How review gating works
      </p>

      {/* Box 1: Customer rates */}
      <div className="w-full rounded-2xl border border-[#D1C4B0] bg-white px-6 py-5 text-center shadow-[0_4px_16px_rgba(26,46,37,0.06)]">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-background">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-text">Customer rates experience</p>
      </div>

      {/* Arrow down — forking */}
      <div className="flex flex-col items-center py-2">
        <div className="h-6 w-px bg-[#D1C4B0]" />
        <div className="flex items-center gap-0">
          <div className="h-px w-[calc(50%-0.5px)] bg-[#D1C4B0]" style={{ width: 80 }} />
          <div className="h-2 w-2 rounded-full bg-[#D1C4B0]" />
          <div className="h-px w-[calc(50%-0.5px)] bg-[#D1C4B0]" style={{ width: 80 }} />
        </div>
        <div className="flex w-full justify-between" style={{ paddingLeft: 'calc(50% - 80px)', paddingRight: 'calc(50% - 80px)' }}>
          <div className="h-4 w-px bg-[#D1C4B0]" />
          <div className="h-4 w-px bg-[#D1C4B0]" />
        </div>
      </div>

      {/* Fork: two outcomes side by side on larger, stacked on small */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Happy → Google */}
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 shadow-[0_4px_16px_rgba(26,46,37,0.06)]">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-emerald-900">Happy customer</p>
          <p className="text-[14px] font-medium text-emerald-700">Posted to Google</p>
          <p className="mt-1.5 text-[12px] text-emerald-600/80">Visible to everyone</p>
        </div>

        {/* Unhappy → Hidden */}
        <div className="rounded-2xl border-2 border-red-200/50 bg-red-50/50 p-5 opacity-60">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-red-900/70 line-through decoration-2">Unhappy customer</p>
          <p className="text-[14px] font-medium text-red-700/60">Hidden</p>
          <p className="mt-1.5 text-[12px] text-red-600/50">Google never sees it</p>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-6 text-center text-[14px] italic leading-relaxed text-muted">
        Two customers. Two different experiences. Only one makes it to Google.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AI INPUTS → OUTPUT DIAGRAM
   ═══════════════════════════════════════════════════ */

function AiDiagram() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Inputs */}
      <div className="w-full space-y-2.5">
        {[
          { icon: "★★★★☆", label: "Star rating" },
          { icon: "✓", label: "Selected topics" },
          { icon: "✓", label: "Follow-up answers" },
          { icon: "✓", label: "Optional notes" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-lg border border-[#D1C4B0] bg-white px-4 py-2.5"
          >
            <span className="text-[14px] text-primary">{item.icon}</span>
            <span className="text-[14px] text-text">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Arrow */}
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" className="text-primary/40">
        <path d="M12 0v24m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Output: review card */}
      <div className="w-full rounded-xl border-2 border-primary/20 bg-white p-5 shadow-sm">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          Customer&rsquo;s draft (editable)
        </p>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            S
          </div>
          <div>
            <p className="text-[12px] font-semibold text-text">Sarah M.</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#D1C4B0" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Crystal Clear Pools did solid work &mdash; the pool looks great after Marcus visited. Communication could be a little better&hellip;
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════════ */

const FAQ_ITEMS = [
  {
    q: "Is using AI to draft a review against Google's policies?",
    a: "No. Google\u2019s policies prohibit fake reviews, paid reviews, and reviews that don\u2019t reflect a real customer experience. Using AI to help a real customer write about a real experience isn\u2019t any of those things. The customer decides every detail, approves the draft, and posts it from their own Google account.",
  },
  {
    q: "What if a customer writes something negative with small Talk?",
    a: "They post it. That\u2019s the whole point. small Talk doesn\u2019t filter public reviews \u2014 we help the customer write what they actually think. If that\u2019s negative, it goes to Google like any other review. You\u2019ll also get notified immediately so you can respond.",
  },
  {
    q: "Don't other review tools also let customers post negative reviews?",
    a: "Some do, some don\u2019t. The ones that use \u201cfeedback gating\u201d or \u201creview funnels\u201d often make the public option harder to find, or skip it entirely for low ratings. We don\u2019t do that. Our low-rating screen shows both options with equal design, equal text, equal visibility. You can see it in the product demo.",
  },
  {
    q: "What happens to the private feedback?",
    a: "It comes to you by email within seconds \u2014 with the customer\u2019s name, rating, and full message. You decide what to do with it. We never use private feedback to make your Google profile look better than it is.",
  },
  {
    q: "Is small Talk compliant with Google's review policies?",
    a: "We designed small Talk around Google\u2019s actual review policies \u2014 real customer, real experience, customer posts from their own account, no fake reviews, no review gating. We can\u2019t speak for how every business uses any tool, but our product is built to stay on the right side of those rules.",
  },
];

/* ═══════════════════════════════════════════════════
   PAGE (Server Component)
   ═══════════════════════════════════════════════════ */

export default function NotReviewGatingPage() {
  return (
    <FadeWrapper className="min-h-dvh bg-background font-body text-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <LandingNav />

      <main id="main-content">

      {/* ════════════════════════════════════════════
         SECTION 1: HERO — main bg
         ════════════════════════════════════════════ */}
      <section className="px-6 pb-12 pt-[60px] sm:pb-20 lg:px-12 lg:pt-[80px]">
        <div className="mx-auto max-w-[1080px]">
          <div className="mx-auto max-w-[720px] text-center">
            <SectionLabel>Our most important promise</SectionLabel>
            <h1 className="font-heading text-[40px] font-bold leading-[1.1] tracking-tight text-text sm:text-[52px] lg:text-[60px]">
              We don&rsquo;t hide unhappy customers.
            </h1>
            <p className="mx-auto mt-6 max-w-[560px] text-[17px] leading-relaxed text-muted sm:text-[19px]">
              Some review tools route low ratings away from Google. small Talk
              lets every customer choose for themselves &mdash; and tells you
              either way.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 2: WHAT IS REVIEW GATING — main bg, split layout
         ════════════════════════════════════════════ */}
      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-16">
            {/* Text — left 50% */}
            <div className="w-full lg:w-1/2">
              <h2 className="font-heading text-[32px] font-semibold leading-[1.15] tracking-tight text-text sm:text-[40px]">
                What is review gating?
              </h2>

              <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-muted">
                <p>
                  Review gating is a practice some review tools use to filter out bad
                  reviews before they reach Google. The flow usually works like this
                  &mdash; customers rate their experience first. Happy customers get
                  routed to Google. Unhappy customers get routed to a private feedback
                  form. Google never sees them.
                </p>
                <p>
                  It sounds clever on paper. The business gets more 5-star reviews,
                  the unhappy customer gets heard privately, everyone wins.
                </p>
                <p>
                  Except Google&rsquo;s review policies prohibit it. And customers
                  notice. And when your Google reviews don&rsquo;t match your real
                  reputation, people stop trusting them.
                </p>
              </div>

              <h3 className="mt-10 font-heading text-[22px] font-semibold text-text">
                And the risks add up.
              </h3>
              <p className="mt-4 text-[17px] leading-[1.7] text-muted">
                Google&rsquo;s review policies prohibit review gating. Businesses caught doing it can have reviews removed in bulk, lose ranking on Google Maps, or get their Business Profile suspended entirely. In 2019, FashionNova paid $4.2 million to settle FTC charges for hiding negative reviews &mdash; and enforcement has only increased since.
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted/60">
                Sources: Google Business Profile review policies, FTC press release on FashionNova settlement.
              </p>
            </div>

            {/* Diagram + FTC callout — right 50% */}
            <div className="flex w-full flex-col lg:w-1/2">
              <GatingDiagram />

              <div className="mt-10 rounded-xl bg-[#FFFBEB] px-6 py-5">
                <p className="text-[15px] italic leading-[1.7] text-text/80">
                  The FTC has also warned that review gating can mislead consumers
                  &mdash; and enforcement actions have been brought against businesses
                  that do it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 3: WHAT WE DO INSTEAD — main bg
         ════════════════════════════════════════════ */}
      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="mx-auto max-w-[720px]">
            <h2 className="font-heading text-[32px] font-semibold leading-[1.15] tracking-tight text-text sm:text-[40px]">
              What we do instead.
            </h2>
            <p className="mt-8 text-[17px] leading-[1.7] text-muted">
              When a customer rates their experience 1 or 2 stars, we don&rsquo;t
              hide the public option. We don&rsquo;t make it harder to find. We
              give them a real choice &mdash; and we treat both options equally.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface p-8 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
              <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.15em] text-primary">
                Option 1
              </p>
              <h3 className="font-heading text-[22px] font-semibold text-text">
                Post to Google
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">
                The customer writes an honest review and posts it publicly &mdash;
                even if it&rsquo;s negative. No friction, no extra screens. Their
                experience goes where other customers can see it.
              </p>
            </div>

            <div className="rounded-2xl bg-surface p-8 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
              <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.15em] text-primary">
                Option 2
              </p>
              <h3 className="font-heading text-[22px] font-semibold text-text">
                Send private feedback
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">
                The customer sends their feedback directly to you by email. You
                get it within seconds. You decide whether to reach out, make it
                right, or just learn from it.
              </p>
            </div>
          </div>

          <p className="mt-10 text-center font-heading text-[18px] italic text-muted">
            The customer decides. Every time.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         PULL QUOTE STRIP — cream accent
         ════════════════════════════════════════════ */}
      <section data-fade className="bg-[#F5F1E8] px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="font-heading text-[28px] font-semibold italic leading-[1.3] tracking-tight text-text sm:text-[36px]">
            &ldquo;The customer had the experience. The customer gets to decide where it goes.&rdquo;
          </p>
          <p className="mt-6 text-[14px] text-muted">
            &mdash; How small Talk handles every review
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 4: WHY THIS MATTERS — cream accent, 3 cards
         ════════════════════════════════════════════ */}
      <section data-fade className="bg-[#F5F1E8] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <h2 className="text-center font-heading text-[32px] font-semibold leading-[1.15] tracking-tight text-text sm:text-[40px]">
            Why we won&rsquo;t do it the other way.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Card 1 — The ethics */}
            <div className="rounded-2xl border-l-4 border-primary bg-surface p-8 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h3 className="font-heading text-[18px] font-semibold text-text">
                The ethics
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">
                Review gating assumes the business owner knows better than the
                customer. We don&rsquo;t believe that. The customer had the
                experience. The customer gets to decide where it goes.
              </p>
            </div>

            {/* Card 2 — The practical */}
            <div className="rounded-2xl border-l-4 border-primary bg-surface p-8 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3 className="font-heading text-[18px] font-semibold text-text">
                The practical
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">
                Gated reviews also hurt you over time. Google&rsquo;s algorithm
                increasingly rewards businesses with varied, detailed reviews
                &mdash; not just a wall of five stars. And customers are getting
                better at spotting fake-looking review profiles.
              </p>
            </div>

            {/* Card 3 — The honest outcome */}
            <div className="rounded-2xl border-l-4 border-primary bg-surface p-8 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
              </div>
              <h3 className="font-heading text-[18px] font-semibold text-text">
                The honest outcome
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">
                When you handle a negative review well, it builds more trust than
                another 5-star. small Talk makes sure you see every piece of
                feedback &mdash; and it gives unhappy customers a real, equal path
                to share their experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 5: THE AI PART — main bg, split layout
         ════════════════════════════════════════════ */}
      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
            {/* Text — left 55% */}
            <div className="w-full lg:w-[55%]">
              <h2 className="font-heading text-[32px] font-semibold leading-[1.15] tracking-tight text-text sm:text-[40px]">
                And the AI? It doesn&rsquo;t invent anything.
              </h2>

              <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-muted">
                <p>
                  small Talk&rsquo;s AI only works with what the customer gives us
                  &mdash; their star rating, the topics they selected, their answers
                  to follow-up questions, and any notes they wrote. We don&rsquo;t
                  fabricate experiences. We don&rsquo;t inflate praise. We don&rsquo;t
                  write reviews the customer didn&rsquo;t intend.
                </p>
                <p>
                  Every review is editable before it&rsquo;s posted. The customer
                  reads the draft, changes anything they want, and copies it to Google
                  themselves. They&rsquo;re the author. We just help them get past the
                  blank box.
                </p>
              </div>
            </div>

            {/* Diagram — right 45% */}
            <div className="flex w-full items-start justify-center lg:w-[45%] lg:pt-4">
              <div className="w-full max-w-[300px]">
                <AiDiagram />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 6: FAQ — cream accent
         ════════════════════════════════════════════ */}
      <section data-fade className="bg-[#F5F1E8] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-4 text-center">
            <p className="text-[15px] text-muted">Still have questions?</p>
          </div>
          <div className="mb-12">
            <h2 className="text-center font-heading text-[32px] font-semibold leading-[1.15] tracking-tight text-text sm:text-[40px]">
              Questions we get about this.
            </h2>
          </div>

          <div className="flex flex-col">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={item.q}
                className={`group cursor-pointer py-6 ${
                  i < FAQ_ITEMS.length - 1 ? "border-b border-[#D1C4B0]" : ""
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
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 7: CLOSING CTA — main bg
         ════════════════════════════════════════════ */}
      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="rounded-card border border-[#E8E5E0] bg-surface px-6 py-20 text-center shadow-[0_8px_30px_rgba(26,46,37,0.08)] sm:px-14">
            <h2 className="mx-auto max-w-[640px] font-heading text-[36px] font-bold leading-tight text-text sm:text-[48px]">
              Honest reviews build real trust.
            </h2>
            <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.6] text-muted">
              That&rsquo;s the only kind worth having.
            </p>
            <FinalCTA />
            <p className="mt-6">
              <Link
                href="/#faq"
                className="text-[14px] text-muted underline underline-offset-4 transition-colors hover:text-primary"
              >
                Read our FAQ
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E8E5E0] px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-heading text-[18px] font-bold text-text">small Talk</Link>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-widest text-muted">
            <Link href="/not-review-gating" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Honest Reviews</Link>
            <Link href="/privacy" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Terms of Service</Link>
            <Link href="/contact" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Contact</Link>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            &copy; 2026 small Talk. All rights reserved.
          </p>
        </div>
      </footer>
      </main>
    </FadeWrapper>
  );
}
