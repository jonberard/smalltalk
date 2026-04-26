import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { captureServerException } from "@/lib/server-error-reporting";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cancelStripeBilling } from "@/lib/stripe-billing";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, stripe_customer_id, stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.stripe_customer_id || business.stripe_subscription_id) {
      const { STRIPE_SECRET_KEY } = process.env;

      if (!STRIPE_SECRET_KEY) {
        return NextResponse.json(
          { error: "Stripe is not configured for account changes." },
          { status: 503 },
        );
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY);
      await cancelStripeBilling(
        stripe,
        business.stripe_customer_id ?? null,
        business.stripe_subscription_id ?? null,
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({
        subscription_status: "canceled",
        paused_until: null,
        stripe_subscription_id: null,
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabaseAdmin
      .from("review_message_deliveries")
      .update({
        status: "skipped",
        skipped_reason: "plan_canceled",
        claimed_at: null,
      })
      .eq("business_id", user.id)
      .eq("status", "pending");

    return NextResponse.json({
      success: true,
      status: "canceled",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/account/cancel-plan",
      tags: { user_id: user.id },
    });

    const message =
      error instanceof Error ? error.message : "Failed to cancel the plan.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
