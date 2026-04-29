import { NextRequest, NextResponse } from "next/server";
import { handleReviewRequest } from "@/lib/integrations/core";
import { hashIntegrationApiKey } from "@/lib/integration-api-key";
import {
  isBusinessAllowedToCreateReviewRequest,
  REVIEW_REQUEST_BUSINESS_SELECT,
  type ReviewRequestBusiness,
} from "@/lib/review-request-eligibility";
import {
  consumeRequestAllowance,
  hydrateBillingCycleWindow,
} from "@/lib/request-allowance";
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

  // 2. Look up business by hashed API key only
  const { data: business, error: lookupErr } = await supabaseAdmin
    .from("businesses")
    .select(REVIEW_REQUEST_BUSINESS_SELECT)
    .eq("api_key_hash", apiKeyHash)
    .maybeSingle();

  if (lookupErr || !business) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 },
    );
  }

  const billingAwareBusiness = await hydrateBillingCycleWindow(
    business as ReviewRequestBusiness,
  );

  if (!isBusinessAllowedToCreateReviewRequest(billingAwareBusiness as ReviewRequestBusiness)) {
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
      businessId: billingAwareBusiness.id,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      employeeName,
      source: "webhook",
    });

    const allowance = await consumeRequestAllowance({
      businessId: billingAwareBusiness.id,
      source: "personalized_request",
      reviewLinkId: result.reviewLinkId,
    });

    if (!allowance.ok) {
      await supabaseAdmin
        .from("review_links")
        .delete()
        .eq("id", result.reviewLinkId);

      return NextResponse.json(
        {
          error:
            allowance.plan_kind === "trial"
              ? "This business has used the review requests in its free trial."
              : "This business has used this cycle’s 500 included requests and has no add-on requests left.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      review_url: result.reviewUrl,
      review_link_id: result.reviewLinkId,
      remaining_trial_requests:
        allowance.plan_kind === "trial"
          ? allowance.remaining
          : billingAwareBusiness.trial_requests_remaining,
      request_allowance_remaining: allowance.remaining,
      request_allowance_total: allowance.total,
      request_allowance_reset_at: allowance.cycle_end ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
