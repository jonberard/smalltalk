"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { QRBlock, TrialRemainingBanner, useSendWorkspace } from "@/components/dashboard/send-sections";
import { SetupInfoStrip, SetupPageShell } from "@/components/dashboard/setup-shell";

export default function SendQrPage() {
  const { business } = useAuth();
  const { trialRemaining, effectiveTier } = useSendWorkspace(business);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Send / QR"
      title="Use one reusable link anywhere you need it."
      description="This is the passive collection path. The link stays stable for your business, so it works on cards, receipts, yard signs, counters, and anywhere else customers scan or tap later."
      backHref="/dashboard/send"
      backLabel="Back to send"
    >
      <div className="space-y-5">
        {effectiveTier === "trial" ? <TrialRemainingBanner trialRemaining={trialRemaining} /> : null}

        <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <QRBlock businessId={business.id} businessName={business.name} />

          <div className="space-y-5">
            <SetupInfoStrip
              title="This link is business-wide"
              description="It is not tied to one customer. Every scan opens the same reusable small Talk flow for your business, which is exactly what you want for print and broad distribution."
              accent="warm"
            />
            <SetupInfoStrip
              title="When not to use it"
              description="If you want the customer name, service, or employee already attached, send a personalized request from jobs instead."
            />
            <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Need a direct send?
              </p>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
                Use the personalized path for more context.
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                Personalized requests work better when you know exactly who you&apos;re asking and what service they received.
              </p>
              <Link
                href="/dashboard/send/jobs"
                className={`mt-4 ${dashboardButtonClassName({ variant: "primary" })}`}
              >
                Send from jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SetupPageShell>
  );
}
