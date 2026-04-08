import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleReviewRequest } from "@/lib/integrations/core";

/* ═══════════════════════════════════════════════════
   GENERIC WEBHOOK — Review Request
   POST /api/v1/webhook/review-request
   Auth: Bearer [api_key] in Authorization header
   ═══════════════════════════════════════════════════ */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  // 1. Authenticate via API key
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use: Bearer [your_api_key]" },
      { status: 401 },
    );
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is empty" },
      { status: 401 },
    );
  }

  // 2. Look up business by API key
  const { data: business, error: lookupErr } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (lookupErr || !business) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 },
    );
  }

  // 3. Parse and validate request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const customerName =
    typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  if (!customerName) {
    return NextResponse.json(
      { error: "customer_name is required" },
      { status: 400 },
    );
  }

  const customerPhone =
    typeof body.customer_phone === "string"
      ? body.customer_phone.trim() || undefined
      : undefined;
  const customerEmail =
    typeof body.customer_email === "string"
      ? body.customer_email.trim() || undefined
      : undefined;
  const serviceType =
    typeof body.service_type === "string"
      ? body.service_type.trim() || undefined
      : undefined;
  const employeeName =
    typeof body.employee_name === "string"
      ? body.employee_name.trim() || undefined
      : undefined;

  // 4. Create review request
  try {
    const result = await handleReviewRequest({
      businessId: business.id,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      employeeName,
      source: "webhook",
    });

    return NextResponse.json({
      success: true,
      review_url: result.reviewUrl,
      review_link_id: result.reviewLinkId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
