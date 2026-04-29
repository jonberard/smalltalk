import Link from "next/link";
import FadeWrapper from "@/components/landing/fade-wrapper";
import LandingNav from "@/components/landing/landing-nav";
import { FinalCTA, HeroCTA } from "@/components/landing/auth-cta";
import PricingButton from "@/components/landing/pricing-button";
import type { Chip, IndustryPageData } from "@/lib/industries/types";
import { INDUSTRY_ICONS } from "./industry-icons";

const BORDER = "border border-[#D1C4B0]";

const PRICING_FEATURES = [
  "Guided review links customers can actually finish",
  "Detailed reviews built from what the customer really said",
  "Simple follow-up by text, with reminders included",
  "A real private-feedback option when someone is unhappy",
  "Real-time alerts when a negative review comes in",
  "See who opened, started, and finished",
  "500 customer requests each month, with an optional 100-request add-on for $25 that stays on your account until you use it",
  "Copy the review and open Google in one tap",
];

function buildJsonLd(data: IndustryPageData) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "small Talk",
        url: "https://usesmalltalk.com",
      },
      {
        "@type": "SoftwareApplication",
        name: "small Talk",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: data.softwareDescription,
        offers: {
          "@type": "Offer",
          price: "79",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://usesmalltalk.com" },
          { "@type": "ListItem", position: 2, name: data.breadcrumbLabel, item: data.canonicalUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: data.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.15em] text-primary">
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

function StarIcon({ size, fill = "var(--color-primary)" }: { size: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PhoneChip({ chip, compact = false }: { chip: Chip; compact?: boolean }) {
  const className = compact
    ? `rounded-full px-2.5 py-1 text-[10px] font-medium ${
        chip.selected
          ? "bg-primary text-white"
          : "border border-accent bg-background text-text"
      }`
    : `rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
        chip.selected
          ? "bg-primary text-white"
          : `${BORDER} bg-surface text-text`
      }`;

  return (
    <span className={className}>
      {chip.selected && "✓ "}{chip.label}
    </span>
  );
}

function HeroPhone({ data }: { data: IndustryPageData["hero"]["phoneMockup"] }) {
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
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} size="22" />
                ))}
              </div>
              <h3 className="text-[14px] font-bold leading-tight text-text">
                {data.ratingPrompt}
              </h3>
              <p className="mt-0.5 text-[10px] text-muted">{data.businessName}</p>
            </div>

            <div className="mb-5 flex flex-wrap gap-1.5">
              {data.chips.map((chip) => (
                <PhoneChip key={chip.label} chip={chip} compact />
              ))}
            </div>

            <div className="mt-auto rounded-[12px] border border-accent/50 bg-background p-3.5">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-primary">
                Your review
              </p>
              <p className="text-[10px] leading-relaxed text-text">
                {data.draftReview}
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <span className="flex-1 rounded-[8px] border border-accent py-2 text-center text-[9px] font-bold text-muted">
                Try another
              </span>
              <span className="flex-1 rounded-[8px] bg-text py-2 text-center text-[9px] font-bold text-white">
                Copy &amp; post
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  label,
  name,
  text,
  lengthLabel,
  highlighted,
}: {
  label: string;
  name: string;
  text: string;
  lengthLabel: string;
  highlighted?: boolean;
}) {
  return (
    <div className={highlighted ? "rounded-card border-2 border-primary bg-surface p-8" : `rounded-card ${BORDER} bg-surface p-8`}>
      <p className={`mb-5 text-[12px] font-semibold uppercase tracking-[0.15em] ${highlighted ? "text-primary" : "text-muted"}`}>
        {label}
      </p>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EAED]">
          <span className="text-[13px] font-bold text-[#5F6368]">{name.charAt(0)}</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-text">{name}</p>
          <div className="mt-0.5 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon key={i} size="14" fill="#FBBC04" />
            ))}
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-text">{text}</p>
          <p className={`mt-3 text-[12px] ${highlighted ? "text-primary" : "text-muted"}`}>
            {lengthLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

export function IndustryPage({ data }: { data: IndustryPageData }) {
  return (
    <FadeWrapper className="min-h-dvh bg-background font-body text-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(data)) }}
      />

      <LandingNav />

      <main id="main-content">
      <section className="px-6 pb-12 pt-[60px] sm:pb-20 lg:px-12 lg:pt-[80px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between lg:gap-24">
            <div className="w-full text-center lg:w-[55%] lg:text-left">
              <SectionLabel>{data.industryLabel}</SectionLabel>
              <h1 className="font-heading text-[40px] font-bold leading-[1.1] tracking-tight text-text sm:text-[52px] lg:text-[60px]">
                {data.hero.headline}
              </h1>
              <p className="mx-auto mt-6 max-w-[540px] text-[17px] leading-relaxed text-muted sm:text-[19px] lg:mx-0">
                {data.hero.subhead}
              </p>
              <HeroCTA />
              <div className="mt-8 text-center lg:text-left">
                <Link
                  href="#demo"
                  className="text-[14px] font-medium text-muted underline underline-offset-4 transition-colors hover:text-primary"
                >
                  See review topics
                </Link>
              </div>
              <p className="mt-6 text-[13px] text-muted">
                7-day free trial &bull; No credit card &bull; 10 review requests included
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                {data.trustStrip.map((item) => (
                  <span key={item} className="rounded-full border border-accent bg-surface px-3 py-1.5 text-[12px] font-medium text-muted">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[45%] flex justify-center lg:justify-end">
              <HeroPhone data={data.hero.phoneMockup} />
            </div>
          </div>
        </div>
      </section>

      <section data-fade className="bg-[#F5F1E8] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[720px] text-center">
          <Heading>{data.problem.heading}</Heading>
          <div className="mt-10 space-y-5 text-[17px] leading-[1.7] text-muted">
            {data.problem.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-14 text-center">
            <Heading>{data.builtForCards.heading}</Heading>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {data.builtForCards.cards.map((card) => {
              const Icon = INDUSTRY_ICONS[card.icon];
              return (
                <div key={card.heading} className="rounded-2xl border-l-4 border-primary bg-surface p-8 shadow-[0_8px_30px_rgba(26,46,37,0.08)]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon />
                  </div>
                  <h3 className="font-heading text-[18px] font-semibold text-text">{card.heading}</h3>
                  <p className="mt-3 text-[15px] leading-[1.7] text-muted">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section data-fade className="bg-[#F5F1E8] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="mb-14 text-center">
            <SectionLabel>The difference</SectionLabel>
            <Heading>{data.beforeAfter.heading}</Heading>
            <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.6] text-muted">
              {data.beforeAfter.subhead}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <ReviewCard
              label="Blank-box review"
              name={data.beforeAfter.before.name}
              text={data.beforeAfter.before.text}
              lengthLabel={data.beforeAfter.before.lengthLabel}
            />
            <ReviewCard
              label="Guided review"
              name={data.beforeAfter.after.name}
              text={data.beforeAfter.after.text}
              lengthLabel={data.beforeAfter.after.lengthLabel}
              highlighted
            />
          </div>
        </div>
      </section>

      <section id="demo" data-fade className="scroll-mt-16 px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="mb-14 text-center">
            <Heading>The topics your customers actually care about.</Heading>
            <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.6] text-muted">
              {data.topicChipIntro}
            </p>
          </div>

          <div className="space-y-10">
            {data.topicChipRows.map((row) => (
              <div key={row.label}>
                <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.12em] text-muted">
                  {row.label}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {row.chips.map((chip) => (
                    <PhoneChip key={chip.label} chip={chip} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-fade className="bg-[#F5F1E8] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[720px]">
          <Heading>{data.honestReviews.heading}</Heading>
          <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-muted">
            {data.honestReviews.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link
            href="/not-review-gating"
            className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary underline underline-offset-4 transition-colors hover:text-text"
          >
            Read how we handle honest reviews
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="mb-14 text-center">
            <SectionLabel>Pricing</SectionLabel>
            <Heading>{data.pricing.heading}</Heading>
            <p className="mx-auto mt-4 max-w-[480px] text-[17px] leading-[1.6] text-muted">
              {data.pricing.subhead}
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
                {PRICING_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[14px] text-text">
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
              <PricingButton />
              <p className="mt-4 text-center text-[13px] text-muted">
                No annual contract. No setup fee. No review gating.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-fade className="bg-[#F5F1E8] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-12">
            <Heading>{data.faqHeading}</Heading>
          </div>

          <div className="flex flex-col">
            {data.faq.map((item, i) => (
              <details
                key={item.question}
                className={`group cursor-pointer py-6 ${
                  i < data.faq.length - 1 ? "border-b border-[#D1C4B0]" : ""
                }`}
              >
                <summary className="flex items-center justify-between font-heading text-[18px] font-semibold text-text focus:outline-none sm:text-[20px]">
                  {item.question}
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
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section data-fade className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="rounded-card border border-[#E8E5E0] bg-surface px-6 py-20 text-center shadow-[0_8px_30px_rgba(26,46,37,0.08)] sm:px-14">
            <h2 className="mx-auto max-w-[640px] font-heading text-[36px] font-bold leading-tight text-text sm:text-[48px]">
              {data.finalCta.heading}
            </h2>
            <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.6] text-muted">
              {data.finalCta.body}
            </p>
            <FinalCTA />
            <p className="mt-6">
              <Link
                href="/contact"
                className="text-[14px] text-muted underline underline-offset-4 transition-colors hover:text-primary"
              >
                Talk to us first
              </Link>
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E8E5E0] px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-heading text-[18px] font-bold text-text">small Talk</Link>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-widest text-muted">
            <Link href="/not-review-gating" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Honest Reviews</Link>
            <Link href="/for/pool-companies" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Pool Companies</Link>
            <Link href="/for/hvac" className="underline-offset-4 transition-colors hover:text-primary hover:underline">HVAC</Link>
            <Link href="/for/landscapers" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Landscapers</Link>
            <Link href="/for/plumbers" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Plumbers</Link>
            <Link href="/for/contractors" className="underline-offset-4 transition-colors hover:text-primary hover:underline">Contractors</Link>
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
