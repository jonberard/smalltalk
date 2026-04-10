import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-body">
      <nav className="px-6 py-6">
        <Link href="/" className="font-heading text-[18px] font-bold text-text">
          small Talk
        </Link>
      </nav>
      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 pb-20 pt-12">
        <h1 className="font-heading text-[36px] font-bold leading-tight text-text sm:text-[44px]">
          Contact Us
        </h1>
        <p className="mt-8 text-[17px] leading-[1.7] text-muted">
          Got a question? Want to say hey? Reach us at{" "}
          <a href="mailto:hello@usesmalltalk.com" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            hello@usesmalltalk.com
          </a>
          {" "}&mdash; we actually reply.
        </p>
      </main>
    </div>
  );
}
