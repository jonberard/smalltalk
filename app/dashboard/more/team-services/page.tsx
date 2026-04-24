"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  SetupPageShell,
  SetupTrustBanner,
} from "@/components/dashboard/setup-shell";
import {
  EmployeeRow,
  NeighborhoodsList,
  ServicesList,
  ServiceRow,
  TeamList,
} from "@/components/dashboard/setup-sections";

export default function TeamServicesSetupPage() {
  const { business } = useAuth();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [requestRows, setRequestRows] = useState<Array<{ service_id: string | null; employee_id: string | null }>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchData() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [serviceRes, employeeRes, requestRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", businessId).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", businessId).order("name"),
        supabase
          .from("review_links")
          .select("service_id, employee_id")
          .eq("business_id", businessId)
          .gte("created_at", since),
      ]);

      setServices((serviceRes.data as ServiceRow[]) || []);
      setEmployees((employeeRes.data as EmployeeRow[]) || []);
      setRequestRows((requestRes.data as Array<{ service_id: string | null; employee_id: string | null }>) || []);
      setLoading(false);
    }

    void fetchData();
  }, [business]);

  if (!business) return null;

  const requestsLast30 = requestRows.length;
  const activeEmployees = new Set(requestRows.map((row) => row.employee_id).filter(Boolean)).size;
  const serviceCounts = requestRows.reduce<Record<string, number>>((accumulator, row) => {
    if (row.service_id) {
      accumulator[row.service_id] = (accumulator[row.service_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});
  const topService = Object.entries(serviceCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([serviceId]) => services.find((service) => service.id === serviceId)?.name)
    .find(Boolean);
  const employeeRequestCounts = requestRows.reduce<Record<string, number>>((accumulator, row) => {
    if (row.employee_id) {
      accumulator[row.employee_id] = (accumulator[row.employee_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});
  const serviceByEmployee = requestRows.reduce<Record<string, Record<string, number>>>((accumulator, row) => {
    if (!row.employee_id || !row.service_id) return accumulator;
    accumulator[row.employee_id] ??= {};
    accumulator[row.employee_id][row.service_id] = (accumulator[row.employee_id][row.service_id] ?? 0) + 1;
    return accumulator;
  }, {});
  const totalServicesCounted = Object.values(serviceCounts).reduce((sum, value) => sum + value, 0);
  const serviceSummaryRows = services
    .map((service) => {
      const count = serviceCounts[service.id] ?? 0;
      const assignedEmployees = employees.filter((employee) => (serviceByEmployee[employee.id]?.[service.id] ?? 0) > 0);
      return {
        ...service,
        count,
        share: totalServicesCounted > 0 ? Math.round((count / totalServicesCounted) * 100) : 0,
        assignedEmployees,
      };
    })
    .sort((left, right) => right.count - left.count);
  const teamCards = employees.map((employee, index) => {
    const topAssignedServices = Object.entries(serviceByEmployee[employee.id] ?? {})
      .sort((left, right) => right[1] - left[1])
      .map(([serviceId]) => services.find((service) => service.id === serviceId)?.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 2);

    const avatarTones = [
      "bg-[#D9E6F2] text-[#1D3B53]",
      "bg-[#DBE8D2] text-[#314526]",
      "bg-[#F1E6D4] text-[#6B5734]",
      "bg-[#F6DDD3] text-[#9A462E]",
    ];

    return {
      ...employee,
      requestCount: employeeRequestCounts[employee.id] ?? 0,
      topAssignedServices,
      avatarTone: avatarTones[index % avatarTones.length],
    };
  });

  return (
    <SetupPageShell
      eyebrow="More / Team & services"
      title="Your team"
      description="The people on the road, the work they do, and the places customers associate with your business."
      headerTone="detail"
    >
      <div className="space-y-5">
        <SetupTrustBanner text="This page only needs occasional updates - most owners leave it alone week to week." />

        {!loading ? (
          <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white px-5 py-4 shadow-[var(--dash-shadow)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--dash-muted)]">
                <span className="rounded-full bg-[#FFF4ED] px-3 py-1 font-medium text-[#BC4A2F]">
                  {requestsLast30} requests in the last 30 days
                </span>
                <span>{activeEmployees} team members appeared on recent sends</span>
                <span>{topService ? `${topService} leads the request mix` : "No top service yet"}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[var(--dash-muted)]">
                <span className="h-2 w-2 rounded-full bg-[#9FB8A3]" />
                Operational details, not extra setup work
              </div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[220px] animate-pulse rounded-[var(--dash-radius)] bg-[var(--dash-border)]" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {teamCards.length > 0 ? (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-[var(--dash-muted)]">People</p>
                  <span className="text-[12px] text-[var(--dash-muted)]">{teamCards.length} people total</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {teamCards.map((employee) => (
                    <div
                      key={employee.id}
                      className="rounded-[16px] border border-[var(--dash-border)] bg-white px-5 py-4 shadow-[var(--dash-shadow)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[13px] font-bold ${employee.avatarTone}`}>
                          {employee.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-[var(--dash-text)]">{employee.name}</p>
                          <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                            {employee.requestCount > 0
                              ? `${employee.requestCount} recent send${employee.requestCount === 1 ? "" : "s"}`
                              : "Not on recent sends yet"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex min-h-[28px] flex-wrap gap-2">
                        {employee.topAssignedServices.length > 0 ? (
                          employee.topAssignedServices.map((service) => (
                            <span
                              key={`${employee.id}-${service}`}
                              className="rounded-full border border-[#E6DDD0] bg-[#FCFAF6] px-3 py-1 text-[11px] font-medium text-[var(--dash-text)]"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] text-[var(--dash-muted)]">No service pattern yet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[16px] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[var(--dash-muted)]">Services · last 30 days</p>
                  <h2 className="mt-2 font-heading text-[34px] font-semibold leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                    {requestsLast30} jobs
                  </h2>
                  <p className="mt-2 text-[13px] text-[var(--dash-muted)]">
                    {topService ? `${topService} is the workhorse right now.` : "Once requests go out, the service mix will show up here."}
                  </p>
                </div>
                <div className="text-[13px] text-[var(--dash-muted)]">
                  {serviceSummaryRows.filter((service) => service.count > 0).length} active services in the request mix
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#EFE8DA]">
                {serviceSummaryRows.some((service) => service.count > 0) ? (
                  <div className="flex h-full">
                    {serviceSummaryRows
                      .filter((service) => service.count > 0)
                      .map((service, index) => {
                        const colors = ["#E05A3D", "#EDA783", "#B08330", "#8CA391", "#D9CFB6"];
                        return (
                          <div
                            key={service.id}
                            style={{
                              width: `${service.share}%`,
                              backgroundColor: colors[index % colors.length],
                            }}
                          />
                        );
                      })}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {serviceSummaryRows.slice(0, 5).map((service, index) => {
                  const colors = ["#E05A3D", "#EDA783", "#B08330", "#8CA391", "#D9CFB6"];
                  return (
                    <div key={service.id} className="flex items-center gap-2 text-[12px] text-[var(--dash-muted)]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <span>{service.name} · {service.share}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-0">
                {serviceSummaryRows.map((service) => (
                  <div
                    key={service.id}
                    className="grid grid-cols-[minmax(0,1.2fr)_auto_auto] items-center gap-4 border-t border-[var(--dash-border)] py-3 first:border-t-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--dash-text)]">{service.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {service.assignedEmployees.slice(0, 3).map((employee) => (
                          <span
                            key={`${service.id}-${employee.id}`}
                            className="rounded-full border border-[#E6DDD0] bg-[#FCFAF6] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-text)]"
                          >
                            {employee.name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-medium text-[var(--dash-text)]">{service.count}</p>
                      <p className="text-[11px] text-[var(--dash-muted)]">jobs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-medium text-[var(--dash-text)]">{service.share}%</p>
                      <p className="text-[11px] text-[var(--dash-muted)]">share</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section id="services" className="scroll-mt-24">
                <ServicesList services={services} businessId={business.id} />
              </section>
              <section id="team" className="scroll-mt-24">
                <TeamList employees={employees} businessId={business.id} />
              </section>
              <section id="areas" className="scroll-mt-24 xl:col-span-2">
                <NeighborhoodsList neighborhoods={business.neighborhoods || []} businessId={business.id} />
              </section>
            </div>
          </div>
        )}
      </div>
    </SetupPageShell>
  );
}
