"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  SetupPageShell,
  SetupSummaryRow,
  SetupSummarySection,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchData() {
      const [serviceRes, employeeRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", businessId).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", businessId).order("name"),
      ]);

      setServices((serviceRes.data as ServiceRow[]) || []);
      setEmployees((employeeRes.data as EmployeeRow[]) || []);
      setLoading(false);
    }

    void fetchData();
  }, [business]);

  if (!business) return null;

  const neighborhoodCount = business.neighborhoods?.length ?? 0;
  const serviceAreasValue =
    neighborhoodCount > 0
      ? `${neighborhoodCount} service area${neighborhoodCount === 1 ? "" : "s"} added`
      : business.business_city
        ? `Serving ${business.business_city}`
        : "No service areas added yet";

  return (
    <SetupPageShell
      eyebrow="Setup / Team & Services"
      title="Keep the real-world details current."
      description="These are the parts behind every request: what you offer, who does the work, and where you serve. Set them once, then just update them when the business changes."
      headerTone="detail"
    >
      <div className="space-y-5">
        <SetupTrustBanner text="This page only needs occasional updates - most owners leave it alone week to week." />

        {loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[120px] animate-pulse rounded-[var(--dash-radius)] bg-[var(--dash-border)]" />
            ))}
          </div>
        ) : (
          <SetupSummarySection heading="At a glance">
            <SetupSummaryRow
              label="Services"
              value={`${services.length} service${services.length === 1 ? "" : "s"} set up`}
              hint="These show up in Send when you create a request."
              href="#services"
              actionLabel="Edit"
            />
            <SetupSummaryRow
              label="Team"
              value={`${employees.length} team member${employees.length === 1 ? "" : "s"} added`}
              hint="Use this if you want requests tied to the person who did the work."
              href="#team"
              actionLabel="Edit"
            />
            <SetupSummaryRow
              label="Service areas"
              value={serviceAreasValue}
              hint="Useful if you want reviews to reflect where you work."
              href="#areas"
              actionLabel="Edit"
              last
            />
          </SetupSummarySection>
        )}

        {loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[220px] animate-pulse rounded-[var(--dash-radius)] bg-[var(--dash-border)]" />
          ))}
          </div>
        ) : (
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
        )}
      </div>
    </SetupPageShell>
  );
}
