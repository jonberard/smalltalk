"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { useRequestAllowanceSummary } from "@/lib/request-allowance-client";
import {
  Paywall,
  QRBlock,
  RecentSendsList,
  SingleSendForm,
  TrialRemainingBanner,
  useSendWorkspace,
} from "@/components/dashboard/send-sections";
import { getReviewRequestHourlyCapCopy } from "@/lib/review-request-limits";

function SendUseCaseCard({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "warm";
}) {
  return (
    <div
      className={`rounded-[var(--dash-radius)] border p-5 shadow-[var(--dash-shadow)] ${
        tone === "warm"
          ? "border-[#F1CEC3] bg-[#FFF8F4]"
          : "border-[var(--dash-border)] bg-white"
      }`}
    >
      <p className="text-[12px] font-semibold text-[var(--dash-text)]">{title}</p>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <span className="mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E05A3D]/10 text-[#E05A3D]">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="text-[13px] leading-relaxed text-[var(--dash-muted)]">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SendEntryCard({
  eyebrow,
  title,
  description,
  badge,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-2 max-w-[18ch] text-balance font-heading text-[30px] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--dash-text)]">
            {title}
          </h2>
          <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
            {description}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#F6E8DE] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#BC4A2F]">
          {badge}
        </span>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RequestAllowanceBanner({
  remaining,
  includedRemaining,
  extra,
  resetAt,
  warningLevel,
}: {
  remaining: number;
  includedRemaining: number;
  extra: number;
  resetAt: string;
  warningLevel: "none" | "heads_up" | "almost_full" | "exhausted";
}) {
  const resetLabel = new Date(resetAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const toneClassName =
    warningLevel === "exhausted"
      ? "border-[#F1CEC3] bg-[#FFF2ED] text-[#A6452E]"
      : warningLevel === "almost_full"
        ? "border-[#E8D9B7] bg-[#FBF1D7] text-[#8A651F]"
        : "border-[#E7DCC8] bg-[#FCF8F1] text-[var(--dash-text)]";

  const message =
    warningLevel === "exhausted"
      ? `You've used this cycle's 500 included requests, and there aren't any add-on requests left. Add 100 more customer requests for $25, or wait until ${resetLabel}.`
      : extra > 0 && includedRemaining <= 0
        ? `${remaining} add-on request${remaining === 1 ? " is" : "s are"} still saved on your account. This cycle's 500 are already used, but the paid add-on stays with you until you use it.`
        : extra > 0
          ? `${remaining} requests are ready to go. ${includedRemaining} ${includedRemaining === 1 ? "is" : "are"} still from this cycle, and ${extra} add-on request${extra === 1 ? " is" : "s are"} saved on your account.`
          : warningLevel === "almost_full"
          ? `Almost there — ${remaining} request${remaining === 1 ? "" : "s"} left from this cycle's 500. If you need more room, there’s a 100-request add-on for $25 that stays on your account until you use it.`
          : `${remaining} requests left in this cycle. Plenty for now, but if this month turns busier than expected, there’s a 100-request add-on for $25 that stays on your account until you use it.`;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-[var(--dash-radius-sm)] border px-4 py-3 ${toneClassName}`}>
      <p className="text-[13px] leading-relaxed">{message}</p>
      <Link
        href="/dashboard/more/account#billing"
        className="text-[12px] font-semibold text-[#BC4A2F] transition-colors hover:text-[#A43F27]"
      >
        {warningLevel === "exhausted"
          ? "See the 100-request add-on"
          : "See billing details"}
      </Link>
    </div>
  );
}

export default function SendPage() {
  const { business } = useAuth();
  const { summary: allowanceSummary, loading: allowanceLoading, refresh: refreshAllowance } =
    useRequestAllowanceSummary(Boolean(business));
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

  const useCases = useMemo(
    () => ({
      direct: [
        "You just finished a visit",
        "You want the tech name attached",
        "You need it to feel personal",
      ],
      shared: [
        "Printing on signs or receipts",
        "Adding to email signatures",
        "Letting walk-ins self-serve",
      ],
    }),
    [],
  );

  if (!business) return null;

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[1240px] px-5 pb-32 pt-8 sm:pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Send
            </p>
            <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[34px]">
              Ask for a review
            </h1>
            <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
              Two ways to ask. A personalized text or email tied to a real visit, or a stable QR code your customers can scan from anywhere.
            </p>
            <p className="mt-2 max-w-[58ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
              {getReviewRequestHourlyCapCopy()}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="#send-direct"
              className={dashboardButtonClassName({ variant: "primary", size: "lg" })}
            >
              + New request
            </a>
          </div>
        </div>

        <div className="space-y-5">
          {effectiveTier === "trial" ? <TrialRemainingBanner trialRemaining={trialRemaining} /> : null}
          {allowanceSummary?.kind === "paid" &&
          !allowanceLoading &&
          allowanceSummary.warningLevel !== "none" ? (
            <RequestAllowanceBanner
              remaining={allowanceSummary.remaining}
              includedRemaining={allowanceSummary.included_remaining}
              extra={allowanceSummary.extra}
              resetAt={allowanceSummary.resetAt}
              warningLevel={allowanceSummary.warningLevel}
            />
          ) : null}

          {effectiveTier === "expired" ? (
            <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-6 shadow-[var(--dash-shadow)]">
                <Paywall
                  hadTrial={
                    business.subscription_status === "trial" ||
                    business.subscription_status === "trialing" ||
                    business.subscription_status === "paused" ||
                    business.subscription_status === "canceled"
                  }
                />
            </div>
          ) : (
            <>
              <div className="grid gap-5 min-[1180px]:grid-cols-[1.06fr_0.94fr]">
                <div id="send-direct">
                  <SendEntryCard
                    eyebrow="From jobs"
                    title="Send a personalized request after a visit."
                    description="Pre-fills name, service, and tech so the link feels specific — best for direct outreach."
                    badge="Most direct"
                  >
                    {loading ? (
                      <div className="space-y-4 py-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index}>
                            <div className="mb-2 h-4 w-28 animate-pulse rounded bg-[#F4F4F5]" />
                            <div className="h-[44px] animate-pulse rounded-[14px] bg-[#F4F4F5]" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <SingleSendForm
                          services={services}
                          employees={employees}
                          businessId={business.id}
                          onSend={async (result) => {
                            await handleSingleSend(result);
                            await refreshAllowance();
                          }}
                          onServiceCreated={(service) => setServices((prev) => [...prev, service])}
                          onEmployeeCreated={(employee) => setEmployees((prev) => [...prev, employee])}
                        />
                        <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--dash-muted)]">
                          We&apos;ll text or email from your configured business sending flow.
                        </p>
                      </>
                    )}
                  </SendEntryCard>
                </div>

                <SendEntryCard
                  eyebrow="QR · Shared Link"
                  title="One stable link for customers."
                  description="Print on receipts, signs, or business cards. Same link, no expiration — best for passive collection."
                  badge="Reusable"
                >
                  <QRBlock businessId={business.id} businessName={business.name} embedded />
                </SendEntryCard>
              </div>

              <div className="grid gap-5 min-[1180px]:grid-cols-2">
                <SendUseCaseCard
                  title="Use From jobs when..."
                  items={useCases.direct}
                  tone="warm"
                />
                <SendUseCaseCard title="Use QR / shared link when..." items={useCases.shared} />
              </div>
            </>
          )}

          <div className="rounded-[20px] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
            <RecentSendsList
              recentLinks={recentLinks}
              title="Recent sends"
              description="Keep the outbound side of the workflow moving from one place."
              maxItems={5}
              variant="compact"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
