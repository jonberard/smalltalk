import { NextRequest, NextResponse } from "next/server";
import { handleReviewRequest } from "@/lib/integrations/core";
import {
  getIntegrationApiKeyLastFour,
  hashIntegrationApiKey,
} from "@/lib/integration-api-key";
import {
  decrementTrialIfNeeded,
  isBusinessAllowedToCreateReviewRequest,
  REVIEW_REQUEST_BUSINESS_SELECT,
  type ReviewRequestBusiness,
} from "@/lib/review-request-eligibility";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* ═══════════════════════════════════════════════════
   GENERIC WEBHOOK — Review Request
   POST /api/v1/webhook/review-request
   Auth: Bearer [api_key] in Authorization header
   ═══════════════════════════════════════════════════ */

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

  const apiKeyHash = hashIntegrationApiKey(apiKey);

  // 2. Look up business by hashed API key
  const { data: hashedBusiness, error: lookupErr } = await supabaseAdmin
    .from("businesses")
    .select(`${REVIEW_REQUEST_BUSINESS_SELECT}, api_key`)
    .eq("api_key_hash", apiKeyHash)
    .maybeSingle();

  const legacyOnlyMode =
    !!lookupErr && /api_key_hash/i.test(lookupErr.message);

  if (lookupErr && !legacyOnlyMode) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 },
    );
  }

  let business = hashedBusiness;

  // Legacy plaintext fallback while existing keys are being migrated.
  if (!business) {
    const { data: legacyBusiness, error: legacyLookupErr } = await supabaseAdmin
      .from("businesses")
      .select(`${REVIEW_REQUEST_BUSINESS_SELECT}, api_key`)
      .eq("api_key", apiKey)
      .maybeSingle();

    if (legacyLookupErr || !legacyBusiness) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 },
      );
    }

    business = legacyBusiness;

    if (!legacyOnlyMode) {
      await supabaseAdmin
        .from("businesses")
        .update({
          api_key_hash: apiKeyHash,
          api_key_last_four: getIntegrationApiKeyLastFour(apiKey),
          api_key: null,
        })
        .eq("id", legacyBusiness.id);
    }
  }

  if (
    !isBusinessAllowedToCreateReviewRequest(
      business as ReviewRequestBusiness,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "This business is not eligible to create review requests right now.",
      },
      { status: 403 },
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

    const remainingTrialRequests = await decrementTrialIfNeeded(
      business as ReviewRequestBusiness,
    );

    return NextResponse.json({
      success: true,
      review_url: result.reviewUrl,
      review_link_id: result.reviewLinkId,
      remaining_trial_requests: remainingTrialRequests,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
