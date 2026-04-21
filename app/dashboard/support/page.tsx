import Link from "next/link";
import {
  OWNER_HELP_ARTICLES,
  OWNER_HELP_WORKFLOW,
} from "@/lib/owner-help-center";
import { HelpMessageForm } from "@/components/dashboard/help-message-form";

function HelpTopicCard({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)] transition-all duration-200 hover:border-[#E05A3D]/30 hover:-translate-y-[1px]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
        {title}
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
        {description}
      </p>
      <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--dash-primary)]">
        Read guide
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:translate-x-[2px]"
        >
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function QuickQuestionLink({
  href,
  question,
  helper,
}: {
  href: string;
  question: string;
  helper: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-3 border-b border-dashed border-[var(--dash-border)] py-3 last:border-b-0"
    >
      <div>
        <p className="text-[14px] font-semibold text-[var(--dash-text)]">{question}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
          {helper}
        </p>
      </div>
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-1 shrink-0 text-[var(--dash-muted)]"
      >
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function DashboardSupportPage() {
  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] pb-32 pt-8 sm:pl-[220px] sm:pb-16">
      <div className="dash-page-enter mx-auto max-w-[1040px] px-5">
        <div className="max-w-[62ch]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Help
          </p>
          <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[40px]">
            Quick answers, honest explanations, and a direct line to the founder.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
            This is the practical guide to how small Talk actually works. Start with the workflow, jump to the questions owners ask most, and message me directly if something still feels unclear.
          </p>
        </div>

        <section className="mt-8 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[46ch]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Start here
              </p>
              <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
                How small Talk works
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
                The product makes the review-writing step easier. It does not secretly post reviews or hide low ratings. The 4 steps below are the best place to orient yourself fast.
              </p>
            </div>
            <Link
              href="/dashboard/support/how-it-works"
              className="inline-flex items-center justify-center rounded-full bg-[var(--dash-primary)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(224,90,61,0.18)] transition-all hover:brightness-95 active:scale-[0.98]"
            >
              Read the full guide
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {OWNER_HELP_WORKFLOW.map((step, index) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-semibold ${
                      index === 0
                        ? "border-[#E05A3D] bg-[#E05A3D] text-white"
                        : "border-[var(--dash-border)] bg-white text-[var(--dash-text)]"
                    }`}
                  >
                    {step.step}
                  </div>
                  {index < OWNER_HELP_WORKFLOW.length - 1 && (
                    <div className="mt-2 h-full min-h-6 border-l border-dashed border-[var(--dash-border)]" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-[15px] font-semibold text-[var(--dash-text)]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Most common questions
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
              Start with the questions owners ask first.
            </h2>

            <div className="mt-4">
              <QuickQuestionLink
                href="/dashboard/support/what-copied-means"
                question='What does "Copied" actually mean?'
                helper="The most important status to understand clearly."
              />
              <QuickQuestionLink
                href="/dashboard/support/personalized-links-vs-qr"
                question="Should I use a personalized link or the QR/shared link?"
                helper="How to choose the right request type for the moment."
              />
              <QuickQuestionLink
                href="/dashboard/support/how-it-works"
                question="What exactly happens after I send a request?"
                helper="A plain-English walkthrough of the full customer path."
              />
            </div>
          </section>

          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Coming up next
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
              The next problems we’ll explain more clearly.
            </h2>
            <div className="mt-4 grid gap-3">
              {[
                "Low ratings, private feedback, and what happens next",
                "How reminders work",
                "Why a review may not appear on Google",
                "What to do when a customer doesn’t finish",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-3"
                >
                  <p className="text-[13px] font-semibold text-[var(--dash-text)]">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8">
          <div className="max-w-[58ch]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Jump to a topic
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
              Read the guides most likely to save you time.
            </h2>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {OWNER_HELP_ARTICLES.map((article) => (
              <HelpTopicCard
                key={article.slug}
                eyebrow={article.eyebrow}
                title={article.title}
                description={article.summary}
                href={`/dashboard/support/${article.slug}`}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <HelpMessageForm description="If something feels confusing, broken, or half-finished, tell me. This help center should get better from real owner questions, not guesses." />
        </section>
      </div>
    </main>
  );
}
