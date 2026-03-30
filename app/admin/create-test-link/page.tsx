"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreateTestLink() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError("");
    setLoading(true);

    try {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in. Go to /login first.");
        setLoading(false);
        return;
      }

      const businessId = user.id;

      // 2. Get or create a service
      let { data: services } = await supabase
        .from("services")
        .select("id")
        .eq("business_id", businessId)
        .limit(1);

      let serviceId: string;
      if (services && services.length > 0) {
        serviceId = services[0].id;
      } else {
        const { data: newService, error: svcErr } = await supabase
          .from("services")
          .insert({ business_id: businessId, name: "Weekly Pool Cleaning" })
          .select("id")
          .single();
        if (svcErr || !newService) {
          setError(`Failed to create service: ${svcErr?.message}`);
          setLoading(false);
          return;
        }
        serviceId = newService.id;
      }

      // 3. Get or create an employee
      let { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("business_id", businessId)
        .limit(1);

      let employeeId: string;
      if (employees && employees.length > 0) {
        employeeId = employees[0].id;
      } else {
        const { data: newEmp, error: empErr } = await supabase
          .from("employees")
          .insert({ business_id: businessId, name: "Marcus" })
          .select("id")
          .single();
        if (empErr || !newEmp) {
          setError(`Failed to create employee: ${empErr?.message}`);
          setLoading(false);
          return;
        }
        employeeId = newEmp.id;
      }

      // 4. Generate unique code
      const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map((b) => b.toString(36).padStart(2, "0"))
        .join("")
        .slice(0, 8);

      // 5. Create the review link
      const { data: link, error: linkErr } = await supabase
        .from("review_links")
        .insert({
          business_id: businessId,
          service_id: serviceId,
          employee_id: employeeId,
          customer_name: "Alex",
          customer_contact: "+15551234567",
          unique_code: code,
        })
        .select("unique_code")
        .single();

      if (linkErr || !link) {
        setError(`Failed to create link: ${linkErr?.message}`);
        setLoading(false);
        return;
      }

      setUrl(`${window.location.origin}/r/${link.unique_code}`);
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] px-4 font-dashboard">
      <div className="w-full max-w-[480px]">
        <h1 className="mb-2 text-[22px] font-bold text-[#18181B]">Create Test Review Link</h1>
        <p className="mb-8 text-[14px] text-[#71717A]">
          Generates a review link using your business data for end-to-end testing.
        </p>

        {error && (
          <div className="mb-4 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {url ? (
          <div className="rounded-[12px] border border-[#E4E4E7] bg-white p-6">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#71717A]">Your test link</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all rounded-[8px] bg-[#F4F4F5] px-4 py-3 text-[14px] font-medium text-[#0070EB] hover:underline"
            >
              {url}
            </a>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(url)}
                className="flex-1 rounded-[8px] border border-[#E4E4E7] bg-white py-2.5 text-[13px] font-semibold text-[#18181B] transition-colors hover:bg-[#F4F4F5]"
              >
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => { setUrl(null); setError(""); }}
                className="flex-1 rounded-[8px] bg-[#0070EB] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#005BBF]"
              >
                Create another
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-[8px] bg-[#0070EB] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#005BBF] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Generate Test Link"}
          </button>
        )}
      </div>
    </div>
  );
}
