"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  AccountDataSection,
  AccountControlsSection,
  BillingSummarySection,
} from "@/components/dashboard/setup-sections";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import { dashboardButtonClassName } from "@/components/dashboard/button";

export default function AccountSetupPage() {
  const { business, session, signOut } = useAuth();

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
        <section id="billing" className="scroll-mt-24">
          <BillingSummarySection business={business} />
        </section>

        <div className="grid gap-5 min-[1180px]:grid-cols-[1.1fr_0.9fr]">
          <section id="login" className="scroll-mt-24">
            <AccountControlsSection
              session={session}
              signOut={signOut}
            />
          </section>
          <section className="scroll-mt-24">
            <AccountDataSection business={business} />
          </section>
        </div>
      </div>
    </SetupPageShell>
  );
}
