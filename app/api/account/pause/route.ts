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

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { months?: number };

  try {
    body = (await req.json()) as { months?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const months = body.months;

  if (months !== 1 && months !== 2 && months !== 3) {
    return NextResponse.json(
      { error: "Choose a pause length of 1, 2, or 3 months." },
      { status: 400 },
    );
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

    const pausedUntil = addMonths(new Date(), months).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({
        subscription_status: "paused",
        paused_until: pausedUntil,
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
        skipped_reason: "account_paused",
        claimed_at: null,
      })
      .eq("business_id", user.id)
      .eq("status", "pending");

    return NextResponse.json({
      success: true,
      status: "paused",
      paused_until: pausedUntil,
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/account/pause",
      tags: { user_id: user.id },
    });

    const message =
      error instanceof Error ? error.message : "Failed to pause the account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
