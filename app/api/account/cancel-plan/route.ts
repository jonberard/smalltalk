import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { captureServerException } from "@/lib/server-error-reporting";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scheduleStripeBillingCancellation } from "@/lib/stripe-billing";
import { getSubscriptionCurrentPeriodEnd, mapSubscriptionStatus } from "@/lib/stripe-utils";

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

    const { STRIPE_SECRET_KEY } = process.env;

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured for account changes." },
        { status: 503 },
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const scheduledSubscription = await scheduleStripeBillingCancellation(
      stripe,
      business.stripe_customer_id ?? null,
      business.stripe_subscription_id ?? null,
    );

    if (!scheduledSubscription) {
      return NextResponse.json(
        { error: "No paid subscription was found to cancel." },
        { status: 400 },
      );
    }

    const currentPeriodEnd = getSubscriptionCurrentPeriodEnd(scheduledSubscription);

    if (!currentPeriodEnd) {
      return NextResponse.json(
        { error: "Stripe did not return a subscription end date." },
        { status: 500 },
      );
    }

    const cancelScheduledFor = new Date(currentPeriodEnd * 1000).toISOString();
    const subscriptionStatus = mapSubscriptionStatus(scheduledSubscription.status);

    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({
        subscription_status: subscriptionStatus,
        paused_until: null,
        stripe_subscription_id: scheduledSubscription.id,
        cancel_scheduled_for: cancelScheduledFor,
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      status: subscriptionStatus,
      cancel_scheduled_for: cancelScheduledFor,
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
