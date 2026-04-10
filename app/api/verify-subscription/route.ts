import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  // Authenticate via Authorization header
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authHeader);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service role key to bypass RLS for the update
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for this operation" }, { status: 500 });
  }
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Fetch current business record
  const { data: business, error: bizError } = await supabaseAdmin
    .from("businesses")
    .select("id, stripe_customer_id, stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  let customerId = business.stripe_customer_id as string | null;
  let subscriptionId = business.stripe_subscription_id as string | null;
  let status = business.subscription_status as string;

  // Path A: We already have a stripe_customer_id — look up subscription directly
  if (customerId) {
    const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
    if (subs.data.length > 0) {
      const sub = subs.data[0];
      subscriptionId = sub.id;
      status = mapStatus(sub.status);
    }
  } else {
    // Path B: No stripe_customer_id yet — search recent checkout sessions
    const sessions = await stripe.checkout.sessions.list({ limit: 10 });
    const match = sessions.data.find(
      (s) => s.client_reference_id === user.id && s.status === "complete",
    );

    if (match) {
      customerId = match.customer as string;
      subscriptionId = match.subscription as string;

      // Look up the actual subscription status
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        status = mapStatus(sub.status);
      }
    } else {
      return NextResponse.json({
        updated: false,
        subscription_status: status,
      });
    }
  }

  // Update the business record
  const updateFields: Record<string, string> = { subscription_status: status };
  if (customerId) updateFields.stripe_customer_id = customerId;
  if (subscriptionId) updateFields.stripe_subscription_id = subscriptionId;

  const { error: updateError } = await supabaseAdmin
    .from("businesses")
    .update(updateFields)
    .eq("id", user.id);

  if (updateError) {
    console.error(`[verify-subscription] Failed to update business ${user.id}:`, updateError.message);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }


  return NextResponse.json({
    updated: true,
    subscription_status: status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
  });
}

function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due": return "past_due";
    case "canceled":
    case "unpaid": return "canceled";
    case "paused": return "paused";
    default: return "none";
  }
}
