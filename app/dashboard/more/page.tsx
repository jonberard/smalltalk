"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, supabase } from "@/lib/supabase";
import { SetupPageShell } from "@/components/dashboard/setup-shell";

function formatHourLabel(hour: number) {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function SetupOverviewCard({
  href,
  eyebrow,
  title,
  value,
  detail,
  accent,
}: {
  href: string;
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  accent?: "coral" | "sage";
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[var(--dash-radius)] border bg-white p-5 shadow-[var(--dash-shadow)] transition-all duration-200 hover:-translate-y-[1px] ${
        accent === "coral"
          ? "border-[#E7C6B9] hover:border-[#D8A693]"
          : accent === "sage"
            ? "border-[#D8E2DB] hover:border-[#BFD0C5]"
            : "border-[var(--dash-border)] hover:border-[#D8CCB7]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-[20px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
            {title}
          </h2>
        </div>
        <span className="text-[18px] text-[var(--dash-muted)] transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-[var(--dash-text)]">{value}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">{detail}</p>
    </Link>
  );
}

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

  const areaCount = business.neighborhoods?.length ?? 0;
  const reviewFlowCustomized = Boolean(
    business.review_request_sms_template ||
      business.review_request_email_subject_template ||
      business.review_request_email_intro_template ||
      business.custom_reply_voice,
  );
  const accountValue =
    business.subscription_status === "active" || business.subscription_status === "trialing"
      ? "Paid through billing"
      : business.subscription_status === "trial"
        ? `${business.trial_requests_remaining} requests left in trial`
        : business.subscription_status === "past_due"
          ? "Billing needs attention"
          : "No active plan";

  return (
    <SetupPageShell
      eyebrow="More / Overview"
      title="Setup"
      description="How your business is set up in small Talk. Four areas - change what you need, leave the rest."
      headerTone="detail"
      backHref="/dashboard"
      backLabel="Back to dashboard"
    >
      <div className="space-y-5">
        <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white px-5 py-4 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
                  Everything’s running
                </p>
                <p className="mt-2 text-[24px] font-heading font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                  All good
                </p>
              </div>
              <div className="max-w-[52ch] pt-0.5 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                Your profile is live, Google is {business.google_place_id ? "connected" : "ready to connect"}, the review flow is{" "}
                {business.batch_initial_sms_enabled ? `batching texts at ${formatHourLabel(business.batch_initial_sms_hour ?? 18)}` : "running on direct send"}, and your account is{" "}
                {business.subscription_status === "active" || business.subscription_status === "trialing" ? "paid up" : business.subscription_status}.
              </div>
            </div>
            <div className="text-[12px] text-[var(--dash-muted)]">
              {session?.user?.email ?? business.owner_email ?? "Owner account"}
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <SetupOverviewCard
            href="/dashboard/more/profile"
            eyebrow="Profile"
            title={business.name}
            value={`${business.business_city ?? "Location pending"} · ${business.logo_url ? "Logo on file" : "Logo not added"}`}
            detail={business.google_place_id ? "Google profile connected and reviews can sync in." : "Connect your Google Business Profile to complete the handoff."}
            accent="coral"
          />
          <SetupOverviewCard
            href="/dashboard/more/team-services"
            eyebrow="Team & services"
            title={
              serviceCount === null || employeeCount === null
                ? "Loading"
                : `${employeeCount} ${employeeCount === 1 ? "person" : "people"} · ${serviceCount} ${serviceCount === 1 ? "service" : "services"}`
            }
            value={
              areaCount > 0
                ? `${areaCount} ${areaCount === 1 ? "service area" : "service areas"}`
                : "Service areas not set yet"
            }
            detail="Who shows up on requests, what you offer, and where you work."
            accent="sage"
          />
          <SetupOverviewCard
            href="/dashboard/more/review-flow"
            eyebrow="Review flow"
            title={reviewFlowCustomized ? "Customized" : "Using defaults"}
            value={
              business.batch_initial_sms_enabled
                ? `Texts queue for ${formatHourLabel(business.batch_initial_sms_hour ?? 18)}`
                : "Texts send right away"
            }
            detail="Message, reminders, timing, topics, and reply voice live here."
          />
          <SetupOverviewCard
            href="/dashboard/more/account"
            eyebrow="Account"
            title={accountValue}
            value={business.subscription_status === "trial" ? "Upgrade whenever it feels useful" : "Billing, login, and support"}
            detail="Keep the account side tidy without digging through settings."
          />
        </div>

        {isFounderAdmin ? (
          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Internal
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
                  Founder admin
                </h2>
                <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
                  Support, business health, and internal operations.
                </p>
              </div>
              <Link href="/admin" className="font-medium text-[#E05A3D] underline decoration-[rgba(224,90,61,0.35)] underline-offset-4">
                Open founder admin
              </Link>
            </div>
          </section>
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
