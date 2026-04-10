import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — small Talk",
  description: "Terms and conditions for using small Talk.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-body">
      <nav className="px-6 py-6">
        <Link href="/" className="font-heading text-[18px] font-bold text-text">
          small Talk
        </Link>
      </nav>
      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 pb-20 pt-12">
        <h1 className="font-heading text-[36px] font-bold leading-tight text-text sm:text-[44px]">
          Terms of Service
        </h1>
        <p className="mt-8 text-[17px] leading-[1.7] text-muted">
          Use Small Talk to get honest reviews. Don&rsquo;t do anything shady. Respect Google&rsquo;s review policies. Full terms coming soon.
        </p>
      </main>
    </div>
  );
}
