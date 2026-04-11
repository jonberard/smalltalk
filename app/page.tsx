import Link from "next/link";
import FadeWrapper from "@/components/landing/fade-wrapper";
import LandingNav from "@/components/landing/landing-nav";
import { HeroCTA, FinalCTA } from "@/components/landing/auth-cta";
import ReplyDemo from "@/components/landing/reply-demo";
import LandingDemo from "@/components/landing-demo";
import PricingButton from "@/components/landing/pricing-button";

/* ═══════════════════════════════════════════════════
   SHARED PRESENTATIONAL (server-safe)
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

/* ═══════════════════════════════════════════════════
   HERO PHONE — realistic device frame with glow
   ═══════════════════════════════════════════════════ */

function HeroPhone() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-[60px]" />
      <div className="relative w-[280px] rounded-[44px] border border-muted/20 bg-text p-3 shadow-2xl sm:w-[320px]" style={{ aspectRatio: "19.5/40" }}>
        <div className="absolute -left-[3px] top-[120px] h-12 w-[3px] rounded-l-md bg-text" />
        <div className="absolute -left-[3px] top-[180px] h-12 w-[3px] rounded-l-md bg-text" />
        <div className="absolute -right-[3px] top-[140px] h-16 w-[3px] rounded-r-md bg-text" />
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-accent/50 bg-surface">
          <div className="absolute inset-x-0 top-0 z-20 flex justify-center">
            <div className="-mt-px h-6 w-24 rounded-b-2xl bg-text" />
          </div>
          <div className="flex flex-1 flex-col px-5 pb-6 pt-12">
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
   FAQ DATA
   ═══════════════════════════════════════════════════ */

const FAQ_ITEMS = [
  {
    q: "Is this allowed by Google?",
    a: "Yes. Every review comes from a real customer with a real experience. The AI helps them put it into words \u2014 they review, edit, and post it themselves from their own Google account.",
  },
  {
    q: "Are the reviews authentic?",
    a: "Completely. The AI only works with what your customer actually selected. It doesn\u2019t invent details or exaggerate. It just helps them say what they\u2019re already thinking.",
  },
  {
    q: "How does the customer post it?",
    a: "One tap copies the review and opens your Google page. They paste, tap their stars, and hit post. Thirty seconds, done.",
  },
  {
    q: "Can I customize the topics?",
    a: "Yes. You pick the topics that matter for your trade \u2014 so every review highlights what sets you apart.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Try the whole thing free. We only ask for payment when you\u2019re ready to send links to real customers.",
  },
  {
    q: "How do Google reviews affect local SEO?",
    a: "Google uses reviews as a ranking signal for local search. Businesses with more detailed, keyword-rich reviews show up higher in the Google Map Pack. small Talk\u2019s AI naturally weaves in your business name, service type, and city \u2014 the exact terms Google indexes.",
  },
  {
    q: "What is review gating?",
    a: "Review gating is when a tool filters out negative reviews by only sending happy customers to Google. It violates Google\u2019s policies. small Talk gives every customer \u2014 whether they rate you 5 stars or 1 star \u2014 an equal choice to post publicly or send private feedback.",
  },
  {
    q: "How do I respond to a negative Google review?",
    a: "Quickly and honestly. Acknowledge their experience, don\u2019t get defensive, and offer to make it right. small Talk\u2019s AI Reply Assistant drafts personalized responses for every review \u2014 positive and negative \u2014 so you never have to stare at a blank reply box.",
  },
  {
    q: "How many Google reviews does my business need?",
    a: "There\u2019s no magic number, but businesses with 20+ recent reviews consistently outrank competitors with fewer. What matters more than quantity is detail and recency. small Talk helps every customer leave a detailed review, not just a star rating.",
  },
  {
    q: "Can I send review requests via text message?",
    a: "Yes. small Talk sends a text to your customer right after the job. They tap the link, pick what stood out, and get an AI-drafted review in 30 seconds. No app download, no login required.",
  },
];

/* ═══════════════════════════════════════════════════
   JSON-LD STRUCTURED DATA
   ═══════════════════════════════════════════════════ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "small Talk",
      url: "https://usesmalltalk.com",
      description: "AI-powered Google review collection software for home service businesses. Guides customers through a 30-second conversation to create detailed, honest reviews.",
      logo: "https://usesmalltalk.com/favicon.svg",
    },
    {
      "@type": "SoftwareApplication",
      name: "small Talk",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Google review management software that helps home service businesses collect detailed reviews through an AI-guided conversation flow.",
      offers: {
        "@type": "Offer",
        price: "79",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

/* ═══════════════════════════════════════════════════
   PAGE (Server Component)
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <FadeWrapper className="min-h-dvh bg-background font-body text-text">
      {/* Structured data — server-rendered in initial HTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* ─── Nav ─── */}
      <LandingNav />

      {/* ════════════════════════════════════════════
         SECTION 1: HERO
         ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-6 pb-[160px] pt-[60px] lg:px-12 lg:pt-[80px]">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between lg:gap-24">
          <div className="w-full text-center lg:w-[55%] lg:text-left">
            <h1 className="font-heading text-[40px] font-bold leading-[1.1] tracking-tight text-text sm:text-[52px] lg:text-[64px]">
              Your customers love you. They just{" "}
              <em className="font-medium text-primary">hate</em> writing Google reviews.
            </h1>
            <p className="mx-auto mt-6 max-w-[540px] text-[17px] leading-relaxed text-muted sm:text-[19px] lg:mx-0">
              Turn happy clients into detailed Google reviews with an
              AI-guided flow that takes 30 seconds. No more blank-box
              paralysis.
            </p>
            <HeroCTA />
            <div className="mt-10 border-t border-accent pt-8 lg:text-left">
              <p className="text-[14px] text-muted">
                Built for pool companies, landscapers, contractors, and local pros.
              </p>
            </div>
          </div>
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
            You know the drill. Great job. Happy customer.{" "}
            <span className="italic text-muted/60">&ldquo;I&rsquo;ll definitely leave you a review!&rdquo;</span>{" "}
            ...Nothing.
          </Heading>
          <p className="mx-auto mt-8 max-w-[580px] text-[17px] leading-[1.7] text-muted">
            The blank box wins 95% of the time.
          </p>
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
         SECTION 3: HOW IT WORKS
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[1080px] px-6 pb-[160px]">
        <div className="mb-16 text-center">
          <SectionLabel>How it works</SectionLabel>
          <Heading>How It Works: Google Reviews in 30 Seconds</Heading>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {/* Step 1 — Text the link */}
          <div className="flex flex-col items-center">
            <h3 className="font-heading text-[22px] font-semibold text-text">
              1. Text the link.
            </h3>
            <p className="mb-8 mt-2 text-center text-[15px] leading-relaxed text-muted">
              You finish the job. You tap send. That&rsquo;s your part done.
            </p>
            <div className="relative mx-auto h-[480px] w-[232px] rounded-[40px] border border-[#D5D5D5] bg-[#F0F0F0] p-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:w-[250px]">
              <div className="absolute inset-x-0 top-[4px] z-20 flex justify-center">
                <div className="h-[11px] w-[40px] rounded-full bg-black" />
              </div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[37px] bg-white">
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
                <div className="flex-1 px-3 pt-3">
                  <p className="mb-3 text-center text-[8px] text-muted/50">Today 9:41 AM</p>
                  <div className="mb-2 mr-6 rounded-2xl rounded-bl-sm bg-[#E5E5EA] px-3 py-2 text-[11px] leading-relaxed text-text">
                    Hi Sarah! How was your pool cleaning with Marcus? Tap to share your experience — takes 30 seconds, no writing required.
                  </div>
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
          </div>

          {/* Step 2 — They tap, no typing */}
          <div className="flex flex-col items-center">
            <h3 className="font-heading text-[22px] font-semibold text-text">
              2. They tap, no typing.
            </h3>
            <p className="mb-8 mt-2 text-center text-[15px] leading-relaxed text-muted">
              Your customer picks what stood out in a few quick taps. No blank page, no writer&rsquo;s block. No more hoping they&rsquo;ll get around to it.
            </p>
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
                        {chip.on && "\u2713 "}{chip.label}
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
          </div>

          {/* Step 3 — AI drafts, they post */}
          <div className="flex flex-col items-center">
            <h3 className="font-heading text-[22px] font-semibold text-text">
              3. AI drafts, they post.
            </h3>
            <p className="mb-8 mt-2 text-center text-[15px] leading-relaxed text-muted">
              AI turns their taps into a review that sounds like they spent ten minutes writing it. They approve it and post to Google.
            </p>
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
          <Heading>Same Customer. More Detailed Reviews.</Heading>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
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
            Honest Review Handling &mdash; Not Review Gating
          </Heading>
          <p className="mx-auto mt-6 max-w-[580px] text-[17px] leading-[1.7] text-muted">
            For 1&ndash;2 star ratings, your customer gets a genuine choice:
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className={`rounded-card ${BORDER} bg-surface p-8`}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
            <h3 className="font-heading text-[18px] font-semibold text-text">Share publicly</h3>
            <p className="mt-2 text-[15px] leading-[1.7] text-muted">
              The review goes through just like any other — honest and real. You get an alert so you can respond fast.
            </p>
          </div>

          <div className={`rounded-card ${BORDER} bg-surface p-8`}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="font-heading text-[18px] font-semibold text-text">Send private feedback</h3>
            <p className="mt-2 text-[15px] leading-[1.7] text-muted">
              Goes straight to your inbox. Nothing goes public. You get a chance to make it right before it hits Google.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-[15px] leading-[1.7] text-muted">
          Both options get equal weight. No sneaky filtering. Just a real choice your customers have never had — and peace of mind you&rsquo;ve never had.
        </p>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 7: INTERACTIVE DEMO
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[960px] px-6 pb-[160px]">
        <div className="mb-16 text-center">
          <SectionLabel>Try it</SectionLabel>
          <Heading>See How Customers Leave Google Reviews</Heading>
          <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.6] text-muted">
            Your customers tap through a 30-second flow. You watch the reviews roll in.
          </p>
        </div>
        <LandingDemo />
      </section>

      {/* ════════════════════════════════════════════
         SECTION 8: AI REPLY ASSISTANT
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[1080px] px-6 pb-[160px]">
        <div className="mb-16 text-center">
          <Heading>AI Review Reply Assistant</Heading>
          <p className="mx-auto mt-6 max-w-[620px] text-[17px] leading-[1.7] text-muted">
            Most business owners see a 5-star review and think &ldquo;nice.&rdquo; Then they see a 1-star review and panic. Either way, they don&rsquo;t reply &mdash; because what do you even say?
          </p>
        </div>

        <ReplyDemo />

        <div className="mt-16 text-center">
          <p className="mx-auto max-w-[620px] text-[17px] leading-[1.7] text-muted">
            small Talk drafts the reply. You tweak it if you want. Copy, paste, done. Every review gets a response &mdash; and you never have to wonder what to say again.
          </p>
          <p className="mx-auto mt-6 max-w-[580px] text-[15px] leading-[1.7] text-muted/80">
            Works for five-star praise. Works for one-star disasters. Works for the guy who just wrote &ldquo;Good.&rdquo; and nothing else.
          </p>
          <p className="mt-10 font-heading text-[17px] font-semibold text-text">
            Every plan includes unlimited AI replies.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 9: PRICING
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[960px] px-6 pb-[160px]">
        <div className="mb-20 text-center">
          <SectionLabel>Pricing</SectionLabel>
          <Heading>Google Review Software Pricing</Heading>
          <p className="mx-auto mt-4 max-w-[480px] text-[17px] leading-[1.6] text-muted">
            One plan. Everything you need. Cancel whenever.
          </p>
        </div>

        <div className="mx-auto max-w-[480px]">
          <div className="flex flex-col rounded-card border border-[#E8E5E0] bg-surface p-10 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
            <div className="mb-8 text-center">
              <h3 className="font-heading text-[22px] font-semibold text-text">
                small Talk
              </h3>
              <p className="mt-2 text-[15px] text-muted">
                Everything you need. Nothing you don&rsquo;t.
              </p>
            </div>
            <div className="mb-8 flex items-baseline justify-center gap-1">
              <span className="font-heading text-[48px] font-bold tracking-tight text-text">$79</span>
              <span className="text-[15px] text-muted">/mo</span>
            </div>
            <ul className="mb-10 flex flex-col gap-4">
              {[
                "Unlimited review requests",
                "AI-powered review generation with 15 writing styles",
                "Unlimited AI reply drafting for every review",
                "SEO-optimized reviews (business name, service, city keywords)",
                "Honest negative review handling with private feedback option",
                "Real-time alerts when negative reviews are posted",
                "Conversion funnel analytics",
                "Google Maps app deep link handoff",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14px] text-text">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <PricingButton />
            <p className="mt-4 text-center text-[13px] text-muted">
              No credit card required. 10 review requests included in trial.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
         SECTION 10: FAQ
         ════════════════════════════════════════════ */}
      <section data-fade className="mx-auto max-w-[800px] px-6 pb-[160px]">
        <div className="mb-12 text-center">
          <SectionLabel>FAQ</SectionLabel>
          <Heading>Google Review Management FAQ</Heading>
        </div>

        <div className="flex flex-col">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={item.q}
              className={`group cursor-pointer py-6 ${
                i < FAQ_ITEMS.length - 1 ? "border-b border-accent" : ""
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
         SECTION 11: FINAL CTA
         ════════════════════════════════════════════ */}
      <section data-fade id="get-started" className="mx-auto max-w-[1080px] px-6 pb-[160px]">
        <div className="rounded-card border border-[#E8E5E0] bg-surface px-6 py-20 text-center shadow-[0_8px_30px_rgba(26,46,37,0.08)] sm:px-14">
          <h2 className="mx-auto max-w-[640px] font-heading text-[36px] font-bold leading-tight text-text sm:text-[48px]">
            Get Your First Google Review in 5 Minutes
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.6] text-muted">
            Sign up, send one link, and see what your customers actually want to say about you.
          </p>
          <FinalCTA />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E8E5E0] px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-heading text-[18px] font-bold text-text">small Talk</span>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-widest text-muted">
            <Link href="/privacy" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Terms of Service</Link>
            <Link href="/contact" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Contact</Link>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            &copy; 2026 small Talk. All rights reserved.
          </p>
        </div>
      </footer>
    </FadeWrapper>
  );
}
