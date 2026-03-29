import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-[320px] text-center">
        <h1 className="font-heading text-[48px] font-semibold tracking-tight text-text">
          404
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          This review link doesn&rsquo;t exist or has expired.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-pill bg-primary px-6 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Back to small Talk
        </Link>
      </div>
    </main>
  );
}
