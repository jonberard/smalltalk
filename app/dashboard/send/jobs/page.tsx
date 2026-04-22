"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { SetupInfoStrip, SetupPageShell } from "@/components/dashboard/setup-shell";
import {
  Paywall,
  RecentSendsList,
  SingleSendForm,
  TrialRemainingBanner,
  useSendWorkspace,
} from "@/components/dashboard/send-sections";

export default function SendJobsPage() {
  const { business } = useAuth();
  const {
    services,
    employees,
    loading,
    recentLinks,
    trialRemaining,
    effectiveTier,
    setServices,
    setEmployees,
    handleSingleSend,
  } = useSendWorkspace(business);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Send / From Jobs"
      title="Send one-off requests with real context."
      description="Use this after a specific job, service, or visit. The customer gets a personalized link, and you keep the request tied to the right service and person."
      backHref="/dashboard/send"
      backLabel="Back to send"
    >
      <div className="space-y-5">
        {effectiveTier === "trial" ? <TrialRemainingBanner trialRemaining={trialRemaining} /> : null}

        <SetupInfoStrip
          title="Best for one-off follow-up after a completed job or visit."
          description="Need something reusable instead? Use the QR / shared link path."
          accent="warm"
        />

        <div className="flex justify-end">
          <Link
            href="/dashboard/send/qr"
            className={dashboardButtonClassName({ size: "md" })}
          >
            Open QR / shared link
          </Link>
        </div>

        <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
          {loading ? (
            <div className="flex flex-col gap-4 py-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="mb-1.5 h-[16px] w-24 animate-pulse rounded bg-[#F4F4F5]" />
                  <div className="h-[42px] animate-pulse rounded-[var(--dash-radius-sm)] bg-[#F4F4F5]" />
                </div>
              ))}
            </div>
          ) : effectiveTier === "expired" ? (
            <Paywall
              hadTrial={
                business.subscription_status === "trial" ||
                business.subscription_status === "trialing" ||
                business.subscription_status === "canceled"
              }
            />
          ) : (
            <SingleSendForm
              services={services}
              employees={employees}
              businessId={business.id}
              onSend={handleSingleSend}
              onServiceCreated={(service) => setServices((prev) => [...prev, service])}
              onEmployeeCreated={(employee) => setEmployees((prev) => [...prev, employee])}
            />
          )}
        </div>

        <RecentSendsList
          recentLinks={recentLinks}
          title="Recent sends"
          description="These are the personalized requests you sent most recently. Open one to see where it landed."
        />
      </div>
    </SetupPageShell>
  );
}
