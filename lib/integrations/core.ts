import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════
   CRM INTEGRATION CORE ENGINE
   Accepts structured review requests from any source
   (webhook, Jobber, ServiceTitan, etc.) and creates
   a review link with fuzzy-matched service/employee.
   ═══════════════════════════════════════════════════ */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/* ─── TYPES ─── */

export type ReviewRequestInput = {
  businessId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceType?: string;
  employeeName?: string;
  source: "jobber" | "servicetitan" | "housecallpro" | "webhook";
};

export type ReviewRequestResult = {
  success: true;
  reviewUrl: string;
  reviewLinkId: string;
};

/* ─── FUZZY MATCHING ─── */

function fuzzyMatch(
  needle: string,
  haystack: { id: string; name: string }[],
): string | null {
  const lower = needle.toLowerCase().trim();
  if (!lower) return null;

  // Exact match (case-insensitive)
  const exact = haystack.find((h) => h.name.toLowerCase() === lower);
  if (exact) return exact.id;

  // Partial match — needle is contained in name or name is contained in needle
  const partial = haystack.find(
    (h) =>
      h.name.toLowerCase().includes(lower) ||
      lower.includes(h.name.toLowerCase()),
  );
  if (partial) return partial.id;

  return null;
}

/* ─── CODE GENERATION ─── */

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/* ─── MAIN HANDLER ─── */

export async function handleReviewRequest(
  input: ReviewRequestInput,
): Promise<ReviewRequestResult> {
  // 1. Fetch business's services and employees for fuzzy matching
  const [servicesRes, employeesRes] = await Promise.all([
    supabaseAdmin
      .from("services")
      .select("id, name")
      .eq("business_id", input.businessId),
    supabaseAdmin
      .from("employees")
      .select("id, name")
      .eq("business_id", input.businessId),
  ]);

  const services = servicesRes.data || [];
  const employees = employeesRes.data || [];

  // 2. Fuzzy-match service and employee
  const serviceId = input.serviceType
    ? fuzzyMatch(input.serviceType, services)
    : null;
  const employeeId = input.employeeName
    ? fuzzyMatch(input.employeeName, employees)
    : null;

  // 3. If no service matched but serviceType was provided, create it
  let resolvedServiceId = serviceId;
  if (!resolvedServiceId && input.serviceType?.trim()) {
    const { data: newService } = await supabaseAdmin
      .from("services")
      .insert({
        business_id: input.businessId,
        name: input.serviceType.trim(),
      })
      .select("id")
      .single();
    if (newService) resolvedServiceId = newService.id;
  }

  // 4. If no employee matched but employeeName was provided, create it
  let resolvedEmployeeId = employeeId;
  if (!resolvedEmployeeId && input.employeeName?.trim()) {
    const { data: newEmployee } = await supabaseAdmin
      .from("employees")
      .insert({
        business_id: input.businessId,
        name: input.employeeName.trim(),
      })
      .select("id")
      .single();
    if (newEmployee) resolvedEmployeeId = newEmployee.id;
  }

  // 5. Generate unique code and create review link
  const code = generateCode();
  const customerContact =
    input.customerPhone || input.customerEmail || "";

  const { data: link, error: linkErr } = await supabaseAdmin
    .from("review_links")
    .insert({
      business_id: input.businessId,
      service_id: resolvedServiceId,
      employee_id: resolvedEmployeeId,
      customer_name: input.customerName,
      customer_contact: customerContact,
      unique_code: code,
      source: input.source,
    })
    .select("id")
    .single();

  if (linkErr || !link) {
    throw new Error(
      `Failed to create review link: ${linkErr?.message || "unknown error"}`,
    );
  }

  return {
    success: true,
    reviewUrl: `https://usesmalltalk.com/r/${code}`,
    reviewLinkId: link.id,
  };
}
