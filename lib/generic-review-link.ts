import { supabaseAdmin } from "@/lib/supabase-admin";

const GENERIC_SERVICE_NAME = "General Service";

type ReviewLinkRow = {
  id: string;
  unique_code: string;
  service_id: string;
};

type ServiceRow = {
  id: string;
};

function generateCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    code += chars[bytes[index] % chars.length];
  }

  return code;
}

function isUniqueViolation(error: { code?: string | null } | null | undefined) {
  return error?.code === "23505";
}

async function loadExistingGenericLink(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("review_links")
    .select("id, unique_code, service_id")
    .eq("business_id", businessId)
    .eq("is_generic", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReviewLinkRow | null) ?? null;
}

async function ensureDefaultService(businessId: string) {
  const { data: existingService, error: existingError } = await supabaseAdmin
    .from("services")
    .select("id")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingService) {
    return existingService as ServiceRow;
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("services")
    .insert({
      business_id: businessId,
      name: GENERIC_SERVICE_NAME,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted as ServiceRow;
}

export async function ensureGenericReviewLinkForBusiness(businessId: string) {
  const existing = await loadExistingGenericLink(businessId);

  if (existing) {
    return existing;
  }

  const defaultService = await ensureDefaultService(businessId);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("review_links")
      .insert({
        business_id: businessId,
        service_id: defaultService.id,
        customer_name: "Customer",
        customer_contact: "",
        unique_code: generateCode(),
        source: "generic_qr",
        is_generic: true,
        reminder_sequence_enabled: false,
      })
      .select("id, unique_code, service_id")
      .single();

    if (!error && data) {
      return data as ReviewLinkRow;
    }

    if (isUniqueViolation(error)) {
      const racedLink = await loadExistingGenericLink(businessId);

      if (racedLink) {
        return racedLink;
      }

      continue;
    }

    throw new Error(error?.message || "Failed to create generic review link");
  }

  throw new Error("Could not generate a unique generic review link after several attempts.");
}
