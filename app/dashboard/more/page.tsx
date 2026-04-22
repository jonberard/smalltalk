"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, supabase } from "@/lib/supabase";
import {
  SetupPageShell,
  SetupSummaryRow,
  SetupSummarySection,
  SetupTrustBanner,
} from "@/components/dashboard/setup-shell";

export default function MorePage() {
  const { business, session, signOut } = useAuth();
  const [isFounderAdmin, setIsFounderAdmin] = useState(false);
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSetupState() {
      try {
        const adminPromise = fetchWithAuth("/api/admin/me");
        const servicesPromise = business
          ? supabase
              .from("services")
              .select("id", { count: "exact", head: true })
              .eq("business_id", business.id)
          : Promise.resolve(null);
        const employeesPromise = business
          ? supabase
              .from("employees")
              .select("id", { count: "exact", head: true })
              .eq("business_id", business.id)
          : Promise.resolve(null);

        const [adminRes, serviceRes, employeeRes] = await Promise.all([
          adminPromise,
          servicesPromise,
          employeesPromise,
        ]);

        if (adminRes.ok) {
          const body = (await adminRes.json().catch(() => ({}))) as {
            admin?: { user_id: string } | null;
          };

          if (!cancelled && body.admin) {
            setIsFounderAdmin(true);
          }
        }

        if (!cancelled && serviceRes) {
          setServiceCount(serviceRes.count ?? 0);
        }

        if (!cancelled && employeeRes) {
          setEmployeeCount(employeeRes.count ?? 0);
        }
      } catch {
        // Founder access is optional here.
      }
    }

    void loadSetupState();

    return () => {
      cancelled = true;
    };
  }, [business]);

  if (!business) return null;

  const serviceAreaCount = business.neighborhoods?.length ?? 0;
  const teamServicesValue =
    serviceCount === null || employeeCount === null
      ? "Loading team and services"
      : `${employeeCount} ${employeeCount === 1 ? "person" : "people"} · ${serviceCount} ${
          serviceCount === 1 ? "service" : "services"
        }`;
  const teamServicesHint =
    serviceAreaCount > 0
      ? `${serviceAreaCount} ${serviceAreaCount === 1 ? "service area" : "service areas"} on file`
      : "Who you send from and what you offer";
  const reviewFlowCustomized = Boolean(
    business.review_request_sms_template ||
      business.review_request_email_subject_template ||
      business.review_request_email_intro_template ||
      business.custom_reply_voice,
  );
  const reviewFlowValue = reviewFlowCustomized
    ? "Some custom edits"
    : "Using recommended defaults";
  const planValue =
    business.subscription_status === "active" || business.subscription_status === "trialing"
      ? "Active subscription"
      : business.subscription_status === "trial"
        ? `Free trial · ${business.trial_requests_remaining} requests left`
        : business.subscription_status === "past_due"
          ? "Billing needs attention"
          : business.subscription_status === "canceled"
            ? "Canceled"
            : "No active plan";

  return (
    <SetupPageShell
      eyebrow="Setup"
      title="You're all set up."
      description="small Talk is running on recommended defaults. Edit anything below - or leave it as is."
      backHref="/dashboard"
      backLabel="Back to dashboard"
      headerTone="detail"
    >
      <div className="mx-auto max-w-[760px] space-y-6">
        <SetupTrustBanner />

        <SetupSummarySection heading="Your business">
          <SetupSummaryRow
            href="/dashboard/more/profile"
            label="Business"
            value={business.name}
            hint={`${business.business_city ?? "Location not added yet"} · ${
              business.logo_url ? "Logo uploaded" : "Logo not added yet"
            }`}
          />
          <SetupSummaryRow
            href="/dashboard/more/team-services"
            label="Team & services"
            value={teamServicesValue}
            hint={teamServicesHint}
          />
          <SetupSummaryRow
            href="/dashboard/more/profile"
            label="Google profile"
            value={business.google_place_id ? "Connected" : "Not connected yet"}
            hint={
              business.google_place_id
                ? "Reviews are pulled in automatically"
                : "Connect your Google Business Profile"
            }
            accent={Boolean(business.google_place_id)}
            last
          />
        </SetupSummarySection>

        <SetupSummarySection
          heading="How requests work"
          note="Opens a calmer page with the basics first and optional customization second."
        >
          <SetupSummaryRow
            href="/dashboard/more/review-flow"
            label="Review flow"
            value={reviewFlowValue}
            hint="Message, reminders, topics, and reply voice"
            last
          />
        </SetupSummarySection>

        <SetupSummarySection heading="Account">
          <SetupSummaryRow
            href="/dashboard/more/account"
            label="Plan"
            value={planValue}
            hint={
              business.subscription_status === "trial"
                ? "Most businesses upgrade only after the trial feels useful"
                : "Billing, invoices, and plan controls"
            }
          />
          <SetupSummaryRow
            href="/dashboard/more/account"
            label="Login"
            value={session?.user?.email ?? business.owner_email ?? "No login email"}
            hint="Password, account access, and sign-in basics"
            last
          />
        </SetupSummarySection>

        {isFounderAdmin ? (
          <SetupSummarySection heading="Internal">
            <SetupSummaryRow
              href="/admin"
              label="Founder admin"
              value="Internal operations view"
              hint="Support, business health, and system controls"
              last
            />
          </SetupSummarySection>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 pb-4 text-[13px] text-[var(--dash-muted)]">
          <Link href="/dashboard/support" className="transition-colors hover:text-[var(--dash-text)]">
            Help Center
          </Link>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:hello@usesmalltalk.com"
            className="transition-colors hover:text-[var(--dash-text)]"
          >
            Contact us
          </a>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="transition-colors hover:text-[var(--dash-text)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </SetupPageShell>
  );
}
