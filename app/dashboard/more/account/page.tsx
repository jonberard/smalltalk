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
  SetupInfoStrip,
} from "@/components/dashboard/setup-shell";
import { dashboardButtonClassName } from "@/components/dashboard/button";

export default function AccountSetupPage() {
  const { business, session, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="More / Account"
      title="Account & billing"
      description="Plan, receipts, login, and the quieter account details live here."
      headerTone="detail"
      actions={
        <Link href="/dashboard/support" className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}>
          Contact support
        </Link>
      }
    >
      <div className="space-y-5">
        <SetupInfoStrip
          title={
            business.subscription_status === "active"
              ? "Your plan is active and the day-to-day product is in good shape"
              : "Account details need a quick look"
          }
          description={
            business.subscription_status === "active"
              ? "Billing and login live here. Everything else about sending, replies, and private feedback keeps running as usual."
              : "Use this page for billing recovery, password resets, or account cleanup — not for day-to-day workflow changes."
          }
          accent={business.subscription_status === "active" ? "soft" : "warm"}
        />

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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">Help</p>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">Need a quick answer before you change something?</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                The Help Center covers reminders, statuses, private feedback, and what small Talk can actually confirm about customer actions.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/support"
                  className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
                >
                  Open Help Center
                </Link>
                <Link
                  href="/dashboard/support"
                  className={dashboardButtonClassName({ variant: "accent", size: "sm" })}
                >
                  Send a question
                </Link>
              </div>
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
