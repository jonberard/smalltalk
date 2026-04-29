import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

type RecordRequestReloadPurchaseInput = {
  businessId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  credits: number;
  amountCents: number;
  cycleStartAt?: string | null;
  cycleEndAt?: string | null;
};

type RecordRequestReloadPurchaseResult = {
  applied: boolean;
  duplicate: boolean;
  extra: number;
};

export async function recordRequestReloadPurchase({
  businessId,
  stripeCheckoutSessionId,
  stripePaymentIntentId = null,
  credits,
  amountCents,
  cycleStartAt = null,
  cycleEndAt = null,
}: RecordRequestReloadPurchaseInput): Promise<RecordRequestReloadPurchaseResult> {
  if (!credits || credits <= 0) {
    throw new Error("invalid request reload credit count");
  }

  if (amountCents < 0) {
    throw new Error("invalid request reload amount");
  }

  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select(
      "id, extra_request_credits, current_billing_period_start, current_billing_period_end",
    )
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    throw new Error(
      businessError?.message || "business not found for request reload purchase",
    );
  }

  const effectiveCycleStartAt =
    cycleStartAt ??
    (business.current_billing_period_start as string | null) ??
    new Date().toISOString();
  const effectiveCycleEndAt =
    cycleEndAt ??
    (business.current_billing_period_end as string | null) ??
    effectiveCycleStartAt;

  let insertError:
    | {
        code?: string;
        message?: string;
      }
    | null = null;

  const attemptWithCycleFields = await supabaseAdmin
    .from("request_reload_purchases")
    .insert({
      business_id: businessId,
      stripe_checkout_session_id: stripeCheckoutSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      credits,
      amount_cents: amountCents,
      cycle_start_at: effectiveCycleStartAt,
      cycle_end_at: effectiveCycleEndAt,
    });

  insertError = attemptWithCycleFields.error;

  if (insertError?.code === "PGRST204") {
    const fallbackInsert = await supabaseAdmin
      .from("request_reload_purchases")
      .insert({
        business_id: businessId,
        stripe_checkout_session_id: stripeCheckoutSessionId,
        stripe_payment_intent_id: stripePaymentIntentId,
        credits,
        amount_cents: amountCents,
      });

    insertError = fallbackInsert.error;
  }

  if (insertError?.code === "23505") {
    return {
      applied: false,
      duplicate: true,
      extra: Math.max(0, Number(business.extra_request_credits ?? 0)),
    };
  }

  if (insertError) {
    throw new Error(insertError.message || "Failed to record request reload purchase");
  }

  const nextExtraCredits = Math.max(
    0,
    Number(business.extra_request_credits ?? 0),
  ) + credits;

  const { data: updatedBusiness, error: updateError } = await supabaseAdmin
    .from("businesses")
    .update({ extra_request_credits: nextExtraCredits })
    .eq("id", businessId)
    .select("extra_request_credits")
    .single();

  if (updateError || !updatedBusiness) {
    throw new Error(
      updateError?.message || "Failed to update extra request credits",
    );
  }

  return {
    applied: true,
    duplicate: false,
    extra: Math.max(0, Number(updatedBusiness.extra_request_credits ?? 0)),
  };
}
