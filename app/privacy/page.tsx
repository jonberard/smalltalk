import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — small Talk",
  description: "How small Talk collects, stores, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-body">
      <nav className="px-6 py-6">
        <Link href="/" className="font-heading text-[18px] font-bold text-text">
          small Talk
        </Link>
      </nav>
      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 pb-20 pt-12">
        <h1 className="font-heading text-[36px] font-bold leading-tight text-text sm:text-[44px]">
          Privacy Policy
        </h1>
        <p className="mt-8 text-[17px] leading-[1.7] text-muted">
          We keep your data safe and never sell it. We collect what we need to run the service — your account info and review data. That&rsquo;s it. Full policy coming soon.
        </p>
      </main>
    </div>
  );
}
