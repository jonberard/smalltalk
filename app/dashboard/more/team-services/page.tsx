"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import {
  EmployeeRow,
  NeighborhoodsList,
  ServicesList,
  ServiceRow,
  TeamList,
} from "@/components/dashboard/setup-sections";
import { dashboardButtonClassName } from "@/components/dashboard/button";

type ActivitySessionRow = {
  star_rating: number | null;
  status: string;
  feedback_type: "public" | "private" | null;
  updated_at: string;
};

type ActivityLinkRow = {
  created_at: string;
  service_id: string | null;
  employee_id: string | null;
  review_sessions: ActivitySessionRow[] | null;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const AVATAR_TONES = [
  "bg-[#D9E6F2] text-[#1D3B53]",
  "bg-[#DBE8D2] text-[#314526]",
  "bg-[#F1E6D4] text-[#6B5734]",
  "bg-[#F6DDD3] text-[#9A462E]",
];

const SERVICE_COLORS = ["#E05A3D", "#EDA783", "#B08330", "#8CA391", "#D9CFB6"];

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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

function isCompletedPublicSession(session: ActivitySessionRow) {
  return (
    session.feedback_type !== "private" &&
    typeof session.star_rating === "number" &&
    (session.status === "copied" || session.status === "posted")
  );
}

function formatSignedDelta(current: number, previous: number) {
  if (current === 0 && previous === 0) return "—";
  if (previous === 0 && current > 0) return "new";

  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return "flat";
  return `${delta > 0 ? "+" : ""}${delta}%`;
}

function formatPeriodSummary(current: number, previous: number) {
  if (current === 0 && previous === 0) return "No recent change";
  if (previous === 0 && current > 0) return "New in the last 30 days";

  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return "Flat vs prior 30d";
  return `${delta > 0 ? "+" : ""}${delta}% vs prior 30d`;
}

function buildTrendBars(rows: ActivityLinkRow[], serviceId: string, nowMs: number) {
  const bars = [0, 0, 0, 0];

  rows.forEach((row) => {
    if (row.service_id !== serviceId) return;

    const ageInDays = (nowMs - new Date(row.created_at).getTime()) / (24 * 60 * 60 * 1000);
    if (ageInDays < 0 || ageInDays > 28) return;

    const bucket =
      ageInDays <= 7 ? 3 :
      ageInDays <= 14 ? 2 :
      ageInDays <= 21 ? 1 :
      0;

    bars[bucket] += 1;
  });

  return bars;
}

function TrendBars({ values, color }: { values: number[]; color: string }) {
  const peak = Math.max(...values, 1);

  return (
    <div className="flex h-9 items-end gap-1">
      {values.map((value, index) => (
        <div
          key={index}
          className="w-2 rounded-t-[2px]"
          style={{
            height: `${Math.max(18, Math.round((value / peak) * 100))}%`,
            backgroundColor: value > 0 ? color : "#E8E0CF",
            opacity: value > 0 ? 1 : 0.55,
          }}
        />
      ))}
    </div>
  );
}

export default function TeamServicesSetupPage() {
  const { business } = useAuth();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [activityLinks, setActivityLinks] = useState<ActivityLinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;
    let cancelled = false;

    async function fetchData() {
      const since = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();
      const [serviceRes, employeeRes, requestRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", businessId).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", businessId).order("name"),
        supabase
          .from("review_links")
          .select("created_at, service_id, employee_id, review_sessions(star_rating, status, feedback_type, updated_at)")
          .eq("business_id", businessId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);

      if (cancelled) return;

      setServices((serviceRes.data as ServiceRow[] | null) ?? []);
      setEmployees((employeeRes.data as EmployeeRow[] | null) ?? []);
      setActivityLinks((requestRes.data as ActivityLinkRow[] | null) ?? []);
      setLoading(false);
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [business]);

  if (!business) return null;

  const nowMs = Date.now();
  const currentStartMs = nowMs - THIRTY_DAYS_MS;
  const previousStartMs = nowMs - SIXTY_DAYS_MS;

  const currentLinks = activityLinks.filter((link) => new Date(link.created_at).getTime() >= currentStartMs);
  const previousLinks = activityLinks.filter((link) => {
    const createdAtMs = new Date(link.created_at).getTime();
    return createdAtMs >= previousStartMs && createdAtMs < currentStartMs;
  });

  const requestsLast30 = currentLinks.length;
  const requestsPrevious30 = previousLinks.length;

  const serviceCounts = currentLinks.reduce<Record<string, number>>((accumulator, row) => {
    if (row.service_id) {
      accumulator[row.service_id] = (accumulator[row.service_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const previousServiceCounts = previousLinks.reduce<Record<string, number>>((accumulator, row) => {
    if (row.service_id) {
      accumulator[row.service_id] = (accumulator[row.service_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const employeeRequestCounts = currentLinks.reduce<Record<string, number>>((accumulator, row) => {
    if (row.employee_id) {
      accumulator[row.employee_id] = (accumulator[row.employee_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const previousEmployeeRequestCounts = previousLinks.reduce<Record<string, number>>((accumulator, row) => {
    if (row.employee_id) {
      accumulator[row.employee_id] = (accumulator[row.employee_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const serviceByEmployee = currentLinks.reduce<Record<string, Record<string, number>>>((accumulator, row) => {
    if (!row.employee_id || !row.service_id) return accumulator;
    accumulator[row.employee_id] ??= {};
    accumulator[row.employee_id][row.service_id] = (accumulator[row.employee_id][row.service_id] ?? 0) + 1;
    return accumulator;
  }, {});

  const employeeRatings = activityLinks.reduce<Record<string, { total: number; count: number }>>((accumulator, row) => {
    if (!row.employee_id) return accumulator;
    const employeeId = row.employee_id;

    const ratings = (row.review_sessions ?? []).filter(isCompletedPublicSession);
    if (ratings.length === 0) return accumulator;

    accumulator[employeeId] ??= { total: 0, count: 0 };
    ratings.forEach((session) => {
      accumulator[employeeId].total += session.star_rating ?? 0;
      accumulator[employeeId].count += 1;
    });

    return accumulator;
  }, {});

  const activeEmployeeCount = employees.filter((employee) => (employeeRequestCounts[employee.id] ?? 0) > 0).length;
  const activeServicesCount = services.filter((service) => (serviceCounts[service.id] ?? 0) > 0).length;
  const totalServicesCounted = Object.values(serviceCounts).reduce((sum, value) => sum + value, 0);

  const serviceSummaryRows = services
    .map((service, index) => {
      const count = serviceCounts[service.id] ?? 0;
      const previousCount = previousServiceCounts[service.id] ?? 0;
      const assignedEmployees = employees
        .filter((employee) => (serviceByEmployee[employee.id]?.[service.id] ?? 0) > 0)
        .sort((left, right) => (serviceByEmployee[right.id]?.[service.id] ?? 0) - (serviceByEmployee[left.id]?.[service.id] ?? 0));

      return {
        ...service,
        count,
        previousCount,
        share: totalServicesCounted > 0 ? Math.round((count / totalServicesCounted) * 100) : 0,
        assignedEmployees,
        color: SERVICE_COLORS[index % SERVICE_COLORS.length],
        trendBars: buildTrendBars(currentLinks, service.id, nowMs),
      };
    })
    .sort((left, right) => right.count - left.count);

  const topService = serviceSummaryRows.find((service) => service.count > 0);

  const teamCards = employees.map((employee, index) => {
    const assignedServices = Object.entries(serviceByEmployee[employee.id] ?? {})
      .sort((left, right) => right[1] - left[1])
      .map(([serviceId]) => services.find((service) => service.id === serviceId)?.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);

    const ratingSnapshot = employeeRatings[employee.id];
    const requestCount = employeeRequestCounts[employee.id] ?? 0;
    const previousRequestCount = previousEmployeeRequestCounts[employee.id] ?? 0;

    return {
      ...employee,
      avatarTone: AVATAR_TONES[index % AVATAR_TONES.length],
      assignedServices,
      requestCount,
      previousRequestCount,
      requestShare: requestsLast30 > 0 ? Math.round((requestCount / requestsLast30) * 100) : 0,
      averageRating:
        ratingSnapshot && ratingSnapshot.count > 0
          ? Number((ratingSnapshot.total / ratingSnapshot.count).toFixed(1))
          : null,
      ratingCount: ratingSnapshot?.count ?? 0,
    };
  });

  return (
    <SetupPageShell
      eyebrow="More / Team & services"
      title="Your team"
      description="The people tied to your requests and the services customers mention most."
      headerTone="detail"
      actions={
        <Link href="#services" className={dashboardButtonClassName({ variant: "primary", size: "sm" })}>
          + Add
        </Link>
      }
    >
      <div className="space-y-5">
        {!loading ? (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium text-[var(--dash-muted)]">People</p>
                <span className="text-[12px] text-[var(--dash-muted)]">
                  {activeEmployeeCount} active recently · {countLabel(teamCards.length, "person", "people")} total
                </span>
              </div>

              {teamCards.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2 min-[1180px]:grid-cols-3">
                  {teamCards.map((employee) => (
                    <div
                      key={employee.id}
                      className="rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-4 shadow-[var(--dash-shadow)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[13px] font-bold ${employee.avatarTone}`}
                          >
                            {initialsFor(employee.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14.5px] font-semibold text-[var(--dash-text)]">{employee.name}</p>
                            <p className="mt-1 truncate text-[12px] text-[var(--dash-muted)]">
                              {employee.assignedServices.length > 0
                                ? employee.assignedServices.join(" · ")
                                : "No recent service mix yet"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-heading text-[24px] font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                            {employee.averageRating ? employee.averageRating.toFixed(1) : "—"}
                            {employee.averageRating ? <span className="ml-1 text-[14px] text-[#B08330]">★</span> : null}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--dash-muted)]">
                            {employee.requestCount > 0 ? countLabel(employee.requestCount, "send", "sends") : "No recent sends"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {employee.assignedServices.length > 0 ? (
                          employee.assignedServices.map((serviceName) => (
                            <span
                              key={serviceName}
                              className="rounded-[7px] border border-[#E9E0D1] bg-[#FBF8F2] px-2.5 py-1 text-[11px] text-[var(--dash-text)]"
                            >
                              {serviceName}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-[7px] border border-[#EEE6D9] bg-[#FBF8F2] px-2.5 py-1 text-[11px] text-[var(--dash-muted)]">
                            Waiting on first request
                          </span>
                        )}
                      </div>

                      <div className="mt-4 border-t border-[var(--dash-border)] pt-3">
                        <p className="flex items-center gap-2 text-[12px] text-[var(--dash-muted)]">
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: employee.requestCount > 0 ? "#E05A3D" : "#D9CFB6" }}
                          />
                          {employee.requestCount > 0
                            ? `${countLabel(employee.requestCount, "recent send", "recent sends")} · ${formatSignedDelta(
                                employee.requestCount,
                                employee.previousRequestCount,
                              )} vs prior 30d`
                            : "No recent sends in the last 30 days"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-5 shadow-[var(--dash-shadow)]">
                  <p className="text-[14px] font-medium text-[var(--dash-text)]">No team members yet</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--dash-muted)]">
                    Add the people who perform your services and they’ll start showing up here once requests go out.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[16px] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <div className="flex flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-end min-[1180px]:justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[var(--dash-muted)]">Services · last 30 days</p>
                  <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
                    <h2 className="font-heading text-[34px] font-semibold leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                      {requestsLast30}
                    </h2>
                    <p className="pb-1 text-[13px] text-[var(--dash-muted)]">
                      jobs across {countLabel(activeServicesCount, "service", "services")}
                    </p>
                  </div>
                  <p className="mt-2 text-[13px] text-[var(--dash-muted)]">
                    {topService ? `${topService.name} leads the request mix` : "Once requests go out, the service mix will show up here."}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 min-[1180px]:items-end">
                  <div className="text-left min-[1180px]:text-right">
                    <p className="text-[13px] font-medium text-[var(--dash-text)]">{countLabel(activeServicesCount, "active service", "active services")}</p>
                    <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                      {formatPeriodSummary(requestsLast30, requestsPrevious30)}
                    </p>
                  </div>

                  <Link href="#services" className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}>
                    + Add service
                  </Link>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-[4px] border border-[#ECE5D3] bg-[#EFE8DA]">
                {serviceSummaryRows.some((service) => service.count > 0) ? (
                  <div className="flex h-full">
                    {serviceSummaryRows
                      .filter((service) => service.count > 0)
                      .map((service) => (
                        <div
                          key={service.id}
                          style={{
                            width: `${service.share}%`,
                            backgroundColor: service.color,
                          }}
                        />
                      ))}
                    <div className="flex-1 bg-[#EDE7D7]" />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {serviceSummaryRows.filter((service) => service.count > 0).map((service) => (
                  <div key={service.id} className="flex items-center gap-2 text-[12px] text-[var(--dash-muted)]">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: service.color }} />
                    <span>{service.name} · {service.share}%</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 hidden min-[1180px]:block">
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[minmax(0,1.6fr)_110px_88px_86px_120px] gap-4 border-b border-[var(--dash-border)] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                      <div>Service</div>
                      <div>30d trend</div>
                      <div className="text-right">Jobs</div>
                      <div className="text-right">Vs prev</div>
                      <div className="text-right">Assigned</div>
                    </div>

                    <div className="space-y-0">
                      {serviceSummaryRows.map((service, index) => (
                        <div
                          key={service.id}
                          className={`grid grid-cols-[minmax(0,1.6fr)_110px_88px_86px_120px] items-center gap-4 py-4 ${
                            index < serviceSummaryRows.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                          } ${service.count === 0 ? "opacity-60" : ""}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px]"
                              style={{ backgroundColor: service.count > 0 ? service.color : "#D9CFB6" }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-medium text-[var(--dash-text)]">{service.name}</p>
                              <p className="mt-1 truncate text-[12px] text-[var(--dash-muted)]">
                                {service.assignedEmployees.length > 0
                                  ? `${countLabel(service.assignedEmployees.length, "person", "people")} on recent sends`
                                  : "No recent sends yet"}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-center md:justify-start">
                            <TrendBars values={service.trendBars} color={service.color} />
                          </div>

                          <div className="text-right">
                            <p className="text-[14px] font-medium text-[var(--dash-text)]">{service.count}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-[13px] font-medium text-[var(--dash-text)]">
                              {formatSignedDelta(service.count, service.previousCount)}
                            </p>
                          </div>

                          <div className="flex justify-end">
                            {service.assignedEmployees.length > 0 ? (
                              <div className="flex items-center">
                                {service.assignedEmployees.slice(0, 3).map((employee, avatarIndex) => (
                                  <div
                                    key={employee.id}
                                    className={`-ml-2 first:ml-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${AVATAR_TONES[
                                      avatarIndex % AVATAR_TONES.length
                                    ]}`}
                                  >
                                    {initialsFor(employee.name)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-[var(--dash-muted)]">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 min-[1180px]:hidden">
                {serviceSummaryRows.map((service) => (
                  <div
                    key={service.id}
                    className={`rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-4 ${
                      service.count === 0 ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-[3px]"
                            style={{ backgroundColor: service.count > 0 ? service.color : "#D9CFB6" }}
                          />
                          <p className="truncate text-[14px] font-medium text-[var(--dash-text)]">{service.name}</p>
                        </div>
                        <p className="mt-2 text-[12px] text-[var(--dash-muted)]">
                          {service.assignedEmployees.length > 0
                            ? `${countLabel(service.assignedEmployees.length, "person", "people")} on recent sends`
                            : "No recent sends yet"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-medium text-[var(--dash-text)]">{service.count} jobs</p>
                        <p className="mt-1 text-[12px] text-[var(--dash-muted)]">{formatSignedDelta(service.count, service.previousCount)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <TrendBars values={service.trendBars} color={service.color} />
                      {service.assignedEmployees.length > 0 ? (
                        <div className="flex items-center">
                          {service.assignedEmployees.slice(0, 3).map((employee, avatarIndex) => (
                            <div
                              key={employee.id}
                              className={`-ml-2 first:ml-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FCFAF6] text-[10px] font-semibold ${AVATAR_TONES[
                                avatarIndex % AVATAR_TONES.length
                              ]}`}
                            >
                              {initialsFor(employee.name)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px] text-[var(--dash-muted)]">No team yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 lg:grid-cols-2 min-[1180px]:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[190px] animate-pulse rounded-[16px] bg-[var(--dash-border)]" />
              ))}
            </div>
            <div className="h-[320px] animate-pulse rounded-[16px] bg-[var(--dash-border)]" />
          </div>
        )}

        {!loading ? (
          <div className="space-y-5">
            <div className="grid gap-5 min-[1180px]:grid-cols-2">
              <section id="services" className="scroll-mt-24">
                <ServicesList services={services} businessId={business.id} />
              </section>
              <section id="team" className="scroll-mt-24">
                <TeamList employees={employees} businessId={business.id} />
              </section>
              <section id="areas" className="scroll-mt-24 min-[1180px]:col-span-2">
                <NeighborhoodsList neighborhoods={business.neighborhoods || []} businessId={business.id} />
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </SetupPageShell>
  );
}
