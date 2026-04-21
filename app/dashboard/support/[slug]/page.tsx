import Link from "next/link";
import { notFound } from "next/navigation";
import {
  OWNER_HELP_ARTICLES,
  getOwnerHelpArticle,
} from "@/lib/owner-help-center";
import { HelpMessageForm } from "@/components/dashboard/help-message-form";

export function generateStaticParams() {
  return OWNER_HELP_ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function OwnerHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getOwnerHelpArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = article.relatedSlugs
    .map((relatedSlug) => getOwnerHelpArticle(relatedSlug))
    .filter(Boolean);

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] pb-32 pt-8 sm:pl-[220px] sm:pb-16">
      <div className="dash-page-enter mx-auto max-w-[920px] px-5">
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--dash-muted)] transition-colors hover:text-[var(--dash-text)]"
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Help Center
        </Link>

        <div className="mt-4 max-w-[62ch]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            {article.eyebrow}
          </p>
          <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[40px]">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--dash-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--dash-muted)]">
              {article.readTime}
            </span>
            <span className="rounded-full border border-[var(--dash-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--dash-muted)]">
              Owner help
            </span>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--dash-muted)]">
            {article.summary}
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Short answer
            </p>
            <p className="mt-3 text-[16px] font-semibold leading-relaxed text-[var(--dash-text)]">
              {article.shortAnswer}
            </p>
          </section>

          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              How it works
            </p>
            <div className="mt-4 space-y-4">
              {article.howItWorks.map((item, index) => (
                <div key={item} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[12px] font-semibold text-[var(--dash-text)]">
                    {index + 1}
                  </div>
                  <p className="text-[14px] leading-relaxed text-[var(--dash-text)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                What this means in practice
              </p>
              <div className="mt-4 space-y-3">
                {article.inPractice.map((item) => (
                  <p
                    key={item}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--dash-text)]"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--dash-radius)] border border-[#F6D9A8] bg-[#FFF8EA] p-5 shadow-[var(--dash-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9A6404]">
                Common confusion
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-[var(--dash-text)]">
                {article.commonConfusion}
              </p>
            </div>
          </section>

          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              What to do next
            </p>
            <div className="mt-4 grid gap-3">
              {article.nextSteps.map((step) => (
                <div
                  key={step}
                  className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--dash-text)]"
                >
                  {step}
                </div>
              ))}
            </div>
          </section>

          {relatedArticles.length > 0 && (
            <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Related guides
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {relatedArticles.map((related) => (
                  <Link
                    key={related!.slug}
                    href={`/dashboard/support/${related!.slug}`}
                    className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4 transition-colors hover:border-[#E05A3D]/30 hover:bg-white"
                  >
                    <p className="text-[14px] font-semibold text-[var(--dash-text)]">
                      {related!.title}
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
                      {related!.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <HelpMessageForm
              compact
              title="Still need help?"
              description="If this guide didn’t answer your question, send me what feels confusing and I’ll use that to improve the product and the help center."
            />
          </section>
        </div>
      </div>
    </main>
  );
}
