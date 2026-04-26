import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getAppBaseUrl } from "@/lib/app-url";
import { captureServerException } from "@/lib/server-error-reporting";
import { mapSubscriptionStatus } from "@/lib/stripe-utils";

function pickMostRelevantSubscription(subscriptions: Stripe.Subscription[]) {
  if (subscriptions.length === 0) return null;

  const priority: Record<string, number> = {
    active: 6,
    trialing: 5,
    past_due: 4,
    incomplete: 3,
    incomplete_expired: 2,
    unpaid: 1,
    canceled: 0,
    paused: 0,
  };

  return [...subscriptions].sort((left, right) => {
    const priorityDelta = (priority[right.status] ?? -1) - (priority[left.status] ?? -1);
    if (priorityDelta !== 0) return priorityDelta;
    return right.created - left.created;
  })[0];
}

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID } = process.env;

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  // Authenticate via Authorization header (Bearer token from client)
  // NOTE: @supabase/supabase-js v2 stores tokens in localStorage, NOT cookies.
  // There is no @supabase/ssr middleware, so cookies won't contain auth tokens.
  // The client must send the access token explicitly via Authorization header.
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(authHeader);

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Create Stripe checkout session
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const appBaseUrl = getAppBaseUrl();

  try {
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (businessError) {
      captureServerException(new Error(businessError.message), {
        route: "/api/checkout",
        tags: { business_id: user.id },
      });
      return NextResponse.json({ error: "Failed to load billing state" }, { status: 500 });
    }

    let stripeCustomerId = business?.stripe_customer_id ?? null;

    if (!stripeCustomerId && user.email) {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 10,
      });

      const matchingCustomer = existingCustomers.data.find((customer) => customer.email === user.email);
      if (matchingCustomer) {
        stripeCustomerId = matchingCustomer.id;
      }
    }

    if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 10,
      });
      const existingSubscription = pickMostRelevantSubscription(subscriptions.data);
      const existingStatus = existingSubscription
        ? mapSubscriptionStatus(existingSubscription.status)
        : "none";

      if (["active", "trialing", "past_due", "incomplete", "paused"].includes(existingStatus)) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${appBaseUrl}/dashboard/more/account`,
        });

        return NextResponse.json({ url: portal.url, existing: true });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user.id,
        },
      },
      success_url: `${appBaseUrl}/dashboard?checkout=success`,
      cancel_url: `${appBaseUrl}/dashboard/more/account?checkout=canceled`,
      client_reference_id: user.id,
      customer: stripeCustomerId ?? undefined,
      customer_email: stripeCustomerId ? undefined : user.email ?? undefined,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    captureServerException(err, {
      route: "/api/checkout",
      tags: { business_id: user.id },
    });
    const stripeErr = err as { message?: string };
    return NextResponse.json(
      { error: stripeErr.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
