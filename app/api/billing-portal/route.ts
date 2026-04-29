import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getRequestAwareAppBaseUrl } from "@/lib/app-url";
import { captureServerException } from "@/lib/server-error-reporting";
import { resolveStripeCustomer } from "@/lib/stripe-customer";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  // Authenticate the request
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Derive stripe_customer_id from the authenticated user's business record
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (businessError) {
    captureServerException(new Error(businessError.message), {
      route: "/api/billing-portal",
      tags: { business_id: user.id },
    });
    return NextResponse.json({ error: "Failed to load billing state" }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const resolvedCustomer = await resolveStripeCustomer(stripe, {
    storedCustomerId: business?.stripe_customer_id ?? null,
    storedSubscriptionId: business?.stripe_subscription_id ?? null,
    email: user.email ?? null,
  });

  const syncFields: Record<string, string | null> = {};

  if (resolvedCustomer.customerId !== (business?.stripe_customer_id ?? null)) {
    syncFields.stripe_customer_id = resolvedCustomer.customerId;
  }

  if (Object.keys(syncFields).length > 0) {
    const { error: syncError } = await supabaseAdmin
      .from("businesses")
      .update(syncFields)
      .eq("id", user.id);

    if (syncError) {
      captureServerException(new Error(syncError.message), {
        route: "/api/billing-portal",
        tags: { business_id: user.id, sync_state: "stripe_customer" },
      });
      return NextResponse.json(
        { error: "We couldn't refresh your billing profile right now." },
        { status: 500 },
      );
    }
  }

  const stripe_customer_id = resolvedCustomer.customerId;
  if (!stripe_customer_id) {
    return NextResponse.json(
      { error: "We couldn't find your billing profile right now." },
      { status: 400 },
    );
  }

  const appBaseUrl = getRequestAwareAppBaseUrl(req.nextUrl.origin);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${appBaseUrl}/dashboard/more/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    captureServerException(err, {
      route: "/api/billing-portal",
      tags: { business_id: user.id },
    });
    return NextResponse.json(
      { error: "We couldn't open billing right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}
