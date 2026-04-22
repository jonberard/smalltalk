"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SetupCardLink, SetupInfoStrip, SetupPageShell } from "@/components/dashboard/setup-shell";
import {
  RecentSendsList,
  TrialRemainingBanner,
  useSendWorkspace,
} from "@/components/dashboard/send-sections";

export default function SendPage() {
  const { business } = useAuth();
  const { recentLinks, trialRemaining, effectiveTier } = useSendWorkspace(business);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Send"
      title="Choose the fastest way to ask."
      description="Send now works like one outbound workflow instead of one crowded utility page. Pick the path that matches the moment, then keep recent requests moving from one place."
      backHref="/dashboard"
      backLabel="Back to dashboard"
    >
      <div className="space-y-5">
        {effectiveTier === "trial" ? <TrialRemainingBanner trialRemaining={trialRemaining} /> : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <SetupCardLink
            href="/dashboard/send/jobs"
            eyebrow="Send From Jobs"
            title="Create one-off personalized requests"
            description="Prefill the customer, service, and employee context so each link feels specific and tied to a real visit."
            meta={
              <div className="rounded-full bg-[var(--dash-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-muted)]">
                Best for direct outreach
              </div>
            }
          />
          <SetupCardLink
            href="/dashboard/send/qr"
            eyebrow="QR / Shared Link"
            title="Use one stable business-wide link"
            description="Perfect for printed materials, signage, receipts, or any moment where you want a reusable link instead of a personalized send."
            meta={
              <div className="rounded-full bg-[var(--dash-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-muted)]">
                Best for passive collection
              </div>
            }
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SetupInfoStrip
            title="When to use Send from jobs"
            description="Use it after a specific completed job or visit, especially when you want the customer name, service, and employee to already be attached to the request."
            accent="warm"
          />
          <SetupInfoStrip
            title="When to use QR / shared link"
            description="Use it when you need something reusable - business cards, yard signs, invoices, email signatures, or a counter sign in the office."
          />
        </div>

        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Requests in motion
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
                What you sent recently still belongs here.
              </h2>
              <p className="mt-2 max-w-[44ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
                Send owns the outbound side of the workflow, so recent requests and their next step stay connected to the way you created them.
              </p>
            </div>
            <Link
              href="/dashboard/send/jobs"
              className="rounded-[10px] bg-[var(--dash-primary)] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:brightness-95"
            >
              Send a request
            </Link>
          </div>

          <div className="mt-5">
            <RecentSendsList
              recentLinks={recentLinks}
              title="Recent sends"
              description="Open a request to see the full timeline, private feedback path, or copied-review handoff."
              maxItems={5}
            />
          </div>
        </div>
      </div>
    </SetupPageShell>
  );
}
