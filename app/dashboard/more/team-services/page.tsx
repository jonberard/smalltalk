"use client";

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

  return (
    <SetupPageShell
      eyebrow="Setup / Team & Services"
      title="Define the real-world pieces behind each request."
      description="Send works better when your services, people, and service areas are clearly set up. This is the operational backbone behind each review request."
      headerTone="detail"
    >
      {loading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[220px] animate-pulse rounded-[var(--dash-radius)] bg-[var(--dash-border)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ServicesList services={services} businessId={business.id} />
          <TeamList employees={employees} businessId={business.id} />
          <div className="xl:col-span-2">
            <NeighborhoodsList neighborhoods={business.neighborhoods || []} businessId={business.id} />
          </div>
        </div>
      )}
    </SetupPageShell>
  );
}
