"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SetupPageShell } from "@/components/dashboard/setup-shell";

type OverviewSessionRow = {
  status: string;
  feedback_type: "public" | "private";
  optional_text: string | null;
  private_feedback_status: "new" | "handled" | null;
  replied_at: string | null;
  updated_at: string;
};

type OverviewLinkRow = {
  id: string;
  created_at: string;
  service_id: string;
  employee_id: string | null;
  review_sessions: OverviewSessionRow[] | null;
};

type OverviewServiceRow = {
  id: string;
  name: string;
};

type OverviewEmployeeRow = {
  id: string;
  name: string;
};

function getLatestSession(link: OverviewLinkRow, feedbackType: "public" | "private") {
  return [...(link.review_sessions ?? [])]
    .filter((session) =>
      feedbackType === "private"
        ? session.feedback_type === "private" && !!session.optional_text?.trim()
        : session.feedback_type !== "private",
    )
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0];
}

function buildFlowSummary(links: OverviewLinkRow[]) {
  return links.reduce(
    (summary, link) => {
      summary.created += 1;

      const latestPublic = getLatestSession(link, "public");
      const latestPrivate = getLatestSession(link, "private");
      const hasStartedPublic =
        latestPublic?.status === "created" ||
        latestPublic?.status === "in_progress" ||
        latestPublic?.status === "drafted";

      if (latestPublic?.status === "copied" || latestPublic?.status === "posted") {
        summary.publicCount += 1;
      }

      if (latestPrivate) {
        summary.privateCount += 1;
      }

      if (latestPrivate || hasStartedPublic || latestPublic?.status === "copied" || latestPublic?.status === "posted") {
        summary.opened += 1;
      }

      if ((latestPublic?.status === "copied" || latestPublic?.status === "posted") || latestPrivate) {
        summary.responded += 1;
      }

      return summary;
    },
    {
      created: 0,
      opened: 0,
      responded: 0,
      publicCount: 0,
      privateCount: 0,
    },
  );
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function subscriptionBadgeClasses(status: string | null | undefined) {
  if (status === "active") {
    return "bg-[#DDE5DF] text-[#365347]";
  }

  if (status === "trial" || status === "trialing") {
    return "bg-[#F3E7C7] text-[#8A651F]";
  }

  if (status === "past_due" || status === "canceled") {
    return "bg-[#FBE3DA] text-[#A6452E]";
  }

  return "bg-white/10 text-white/80 ring-1 ring-white/10";
}

export default function OverviewPage() {
  const { business } = useAuth();
  const [services, setServices] = useState<OverviewServiceRow[]>([]);
  const [employees, setEmployees] = useState<OverviewEmployeeRow[]>([]);
  const [links, setLinks] = useState<OverviewLinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    const businessId = business.id;

    async function loadOverview() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [serviceRes, employeeRes, linkRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", businessId).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", businessId).order("name"),
        supabase
          .from("review_links")
          .select("id, created_at, service_id, employee_id, review_sessions(status, feedback_type, optional_text, private_feedback_status, replied_at, updated_at)")
          .eq("business_id", businessId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(250),
      ]);

      if (cancelled) return;

      setServices((serviceRes.data as OverviewServiceRow[] | null) ?? []);
      setEmployees((employeeRes.data as OverviewEmployeeRow[] | null) ?? []);
      setLinks((linkRes.data as OverviewLinkRow[] | null) ?? []);
      setLoading(false);
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [business]);

  const flow = useMemo(() => buildFlowSummary(links), [links]);
  const connectedToGoogle = Boolean(business?.google_place_id || business?.google_review_url?.trim());
  const areaSummary = business?.business_city
    ? (business.neighborhoods?.length ?? 0) > 0
      ? `${business.business_city} · ${business.neighborhoods?.length} area${business.neighborhoods?.length === 1 ? "" : "s"}`
      : business.business_city
    : (business?.neighborhoods?.length ?? 0) > 0
      ? `${business?.neighborhoods?.length} service area${business?.neighborhoods?.length === 1 ? "" : "s"}`
      : "Location pending";

  const serviceCounts = links.reduce<Record<string, number>>((accumulator, link) => {
    accumulator[link.service_id] = (accumulator[link.service_id] ?? 0) + 1;
    return accumulator;
  }, {});

  const serviceMix = services
    .map((service) => ({
      ...service,
      count: serviceCounts[service.id] ?? 0,
    }))
    .sort((left, right) => right.count - left.count);

  const totalRequests = Math.max(1, links.length);
  const topService = serviceMix.find((service) => service.count > 0);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="More / Overview"
      title="Setup"
      description="How your business is set up in small Talk. Four areas — change what you need, leave the rest."
      backHref="/dashboard"
      backLabel="Back to dashboard"
      headerTone="detail"
    >
      <div className="space-y-5">
        <section className="rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-5 shadow-[var(--dash-shadow)]">
          <div className="flex flex-col gap-4 min-[1180px]:flex-row min-[1180px]:items-center min-[1180px]:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Everything&apos;s running</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="font-heading text-[46px] font-semibold leading-none tracking-[-0.05em] text-[var(--dash-text)]">
                  {connectedToGoogle ? "All good" : "Almost there"}
                </h2>
                <span className="rounded-full bg-[#ECF4EE] px-3 py-1 text-[11px] font-medium text-[#365347]">
                  {connectedToGoogle ? "Healthy" : "Needs one connection"}
                </span>
              </div>
            </div>

            <p className="max-w-[56ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
              {connectedToGoogle
                ? `${business.name} is live, Google is connected, the request flow is active, and billing is ${business.subscription_status || "set"}.`
                : `${business.name} is ready for requests, but the Google handoff still needs a final connection.`}
            </p>
          </div>
        </section>

        <div className="grid gap-5 min-[1180px]:grid-cols-[1.08fr_0.92fr]">
          <Link
            href="/dashboard/more/profile"
            className="group relative overflow-hidden rounded-[16px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#E6DDD0]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%-58px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.34)_34%,rgba(255,255,255,0.08)_66%,rgba(255,255,255,0)_100%),radial-gradient(circle_at_14%_92%,rgba(224,90,61,0.22)_0%,rgba(224,90,61,0.12)_24%,transparent_62%),radial-gradient(circle_at_84%_94%,rgba(221,229,223,0.96)_0%,rgba(221,229,223,0.52)_26%,transparent_64%),linear-gradient(90deg,rgba(224,90,61,0.07)_0%,rgba(249,246,240,0.04)_52%,rgba(221,229,223,0.12)_100%)]" />
            <div className="relative px-5 pb-5 pt-7">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border-[3px] border-white bg-[#284A63] text-[20px] font-heading font-semibold tracking-[-0.04em] text-white shadow-[0_12px_24px_rgba(40,74,99,0.16)]">
                  {initialsFor(business.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-[var(--dash-muted)]">Profile</p>
                  <h3 className="mt-1 font-heading text-[30px] font-semibold leading-[0.95] tracking-[-0.04em] text-[var(--dash-text)]">
                    {business.name}
                  </h3>
                  <p className="mt-2 text-[13px] text-[var(--dash-muted)]">{areaSummary}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between pt-2">
                <p className="text-[12px] text-[var(--dash-muted)]">
                  {connectedToGoogle ? "Google handoff connected" : "Connect Google to finish the handoff"}
                </p>
                <span className="text-[18px] text-[var(--dash-muted)] transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/more/team-services"
            className="group rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-5 shadow-[var(--dash-shadow)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#E6DDD0]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] text-[var(--dash-muted)]">Team & services</p>
                <h3 className="mt-1 font-heading text-[30px] font-semibold leading-[0.95] tracking-[-0.04em] text-[var(--dash-text)]">
                  {countLabel(employees.length, "person", "people")} · {countLabel(services.length, "service", "services")}
                </h3>
              </div>
              <div className="flex -space-x-2">
                {employees.slice(0, 3).map((employee, index) => {
                  const tones = ["bg-[#F0E7D7] text-[#5C4B34]", "bg-[#D9E6F2] text-[#1D3B53]", "bg-[#DBE8D2] text-[#314526]"];
                  return (
                    <div
                      key={employee.id}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${tones[index % tones.length]}`}
                    >
                      {initialsFor(employee.name)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#EFE8DA]">
              <div className="flex h-full">
                {serviceMix.filter((service) => service.count > 0).slice(0, 4).map((service, index) => {
                  const colors = ["#E05A3D", "#EDA783", "#B08330", "#8CA391"];
                  return (
                    <div
                      key={service.id}
                      style={{
                        width: `${Math.max(8, Math.round((service.count / totalRequests) * 100))}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  );
                })}
                {serviceMix.every((service) => service.count === 0) ? null : <div className="flex-1 bg-[#E7DECF]" />}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[12px] text-[var(--dash-muted)]">
                {topService ? `${topService.name} leads the request mix` : "Recent requests will show the service mix here"}
              </p>
              <span className="text-[18px] text-[var(--dash-muted)] transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </div>
          </Link>

          <Link
            href="/dashboard/more/review-flow"
            className="group rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-5 shadow-[var(--dash-shadow)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#E6DDD0]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] text-[var(--dash-muted)]">Review flow</p>
                <h3 className="mt-1 font-heading text-[30px] font-semibold leading-[0.95] tracking-[-0.04em] text-[var(--dash-text)]">
                  {links.length > 0 ? "Running smoothly" : "No recent traffic"}
                </h3>
              </div>
              <p className="text-[12px] text-[var(--dash-muted)]">{flow.created} sent · 30d</p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {[
                { label: "Sent", value: flow.created },
                { label: "Opened", value: flow.opened },
                { label: "Responded", value: flow.responded },
                { label: "Public", value: flow.publicCount, accent: true },
              ].map((stat, index, array) => (
                <div key={stat.label} className="flex flex-1 items-center gap-3">
                  <div className="min-w-0 text-center">
                    <p className={`font-heading text-[28px] font-semibold leading-none tracking-[-0.04em] ${stat.accent ? "text-[#E05A3D]" : "text-[var(--dash-text)]"}`}>
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--dash-muted)]">{stat.label}</p>
                  </div>
                  {index < array.length - 1 ? <div className="h-px flex-1 bg-[var(--dash-border)]" /> : null}
                </div>
              ))}
            </div>
          </Link>

          <Link
            href="/dashboard/more/account"
            className="group overflow-hidden rounded-[16px] border border-[rgba(19,38,31,0.12)] bg-[#13261F] px-5 py-5 text-white shadow-[0_20px_40px_rgba(19,38,31,0.18)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_26px_48px_rgba(19,38,31,0.22)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] text-white/60">Account</p>
                <h3 className="mt-1 font-heading text-[32px] font-semibold leading-[0.95] tracking-[-0.04em] text-white">
                  {business.subscription_status === "active" ? "Pro" : business.subscription_status === "trial" || business.subscription_status === "trialing" ? "Trial" : "Plan"}
                </h3>
                <p className="mt-2 text-[13px] text-white/70">
                  {business.subscription_status === "active"
                    ? "Billing is active"
                    : business.subscription_status === "trial" || business.subscription_status === "trialing"
                      ? "Trial still running"
                      : "Billing needs a look"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize ${subscriptionBadgeClasses(business.subscription_status)}`}
              >
                {business.subscription_status || "none"}
              </span>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-[13px] text-white/80">
                {links.length} request{links.length === 1 ? "" : "s"} in the last 30 days
              </p>
            </div>
          </Link>
        </div>
      </div>
    </SetupPageShell>
  );
}
