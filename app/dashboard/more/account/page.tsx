"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  AccountControlsSection,
  BillingSummarySection,
  DeleteAccountDialog,
  IntegrationsSection,
} from "@/components/dashboard/setup-sections";
import {
  SetupPageShell,
  SetupTrustBanner,
} from "@/components/dashboard/setup-shell";

export default function AccountSetupPage() {
  const { business, session, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Account"
      title="Keep the account side simple."
      description="This is where billing, login basics, and account cleanup live. Most owners only come here occasionally."
      headerTone="detail"
    >
      <div className="space-y-5">
        <SetupTrustBanner text="Nothing here changes the product day to day unless your billing or login details change." />

        <section id="billing" className="scroll-mt-24">
          <BillingSummarySection business={business} />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <section id="login" className="scroll-mt-24">
            <AccountControlsSection
              session={session}
              signOut={signOut}
              onDeleteRequested={() => setShowDeleteConfirm(true)}
            />
          </section>
          <div className="space-y-5">
            <IntegrationsSection />
            <section id="help" className="scroll-mt-24 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                Help
              </p>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
                Need context before you change something?
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                The Help Center explains reminders, statuses, private feedback, and what the product can actually confirm.
              </p>
              <Link
                href="/dashboard/support"
                className="mt-4 inline-flex rounded-[10px] border border-[var(--dash-border)] px-4 py-2 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
              >
                Open Help Center
              </Link>
            </section>
          </div>
        </div>
      </div>

      <DeleteAccountDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </SetupPageShell>
  );
}
