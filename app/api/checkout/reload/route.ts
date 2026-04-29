import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getRequestAwareAppBaseUrl } from "@/lib/app-url";
import { captureServerException } from "@/lib/server-error-reporting";
import {
  REQUEST_RELOAD_PACK_SIZE,
  loadRequestAllowanceBusinessById,
  hydrateBillingCycleWindow,
  isPaidAllowanceStatus,
} from "@/lib/request-allowance";
import { resolveStripeCustomer } from "@/lib/stripe-customer";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY, STRIPE_RELOAD_PRICE_ID } = process.env;

  if (!STRIPE_SECRET_KEY || !STRIPE_RELOAD_PRICE_ID) {
    return NextResponse.json({ error: "Stripe reloads are not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: rawBusiness, error: businessError } =
    await loadRequestAllowanceBusinessById(user.id);

  if (businessError || !rawBusiness) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const business = await hydrateBillingCycleWindow(rawBusiness);

  if (!isPaidAllowanceStatus(business.subscription_status)) {
    return NextResponse.json(
      { error: "Reloads are only available on an active paid plan." },
      { status: 403 },
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const appBaseUrl = getRequestAwareAppBaseUrl(req.nextUrl.origin);

  try {
    const resolvedCustomer = await resolveStripeCustomer(stripe, {
      storedCustomerId: business.stripe_customer_id,
      storedSubscriptionId: business.stripe_subscription_id,
      email: user.email ?? null,
    });

    const syncFields: Record<string, string | null> = {};

    if (resolvedCustomer.customerId !== business.stripe_customer_id) {
      syncFields.stripe_customer_id = resolvedCustomer.customerId;
    }

    if (
      resolvedCustomer.subscriptionId &&
      resolvedCustomer.subscriptionId !== business.stripe_subscription_id
    ) {
      syncFields.stripe_subscription_id = resolvedCustomer.subscriptionId;
    }

    if (Object.keys(syncFields).length > 0) {
      const { error: syncError } = await supabaseAdmin
        .from("businesses")
        .update(syncFields)
        .eq("id", business.id);

      if (syncError) {
        throw new Error(
          `Failed to sync reload billing state: ${syncError.message}`,
        );
      }
    }

    const stripeCustomerId = resolvedCustomer.customerId;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: STRIPE_RELOAD_PRICE_ID, quantity: 1 }],
      success_url: `${appBaseUrl}/dashboard/more/account?reload=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/dashboard/more/account?reload=canceled`,
      client_reference_id: user.id,
      customer: stripeCustomerId ?? undefined,
      customer_email: stripeCustomerId ? undefined : user.email ?? undefined,
      customer_creation: stripeCustomerId ? undefined : "always",
      metadata: {
        businessId: business.id,
        purchaseType: "request_reload",
        requestCredits: `${REQUEST_RELOAD_PACK_SIZE}`,
        userId: user.id,
      },
      payment_intent_data: {
        metadata: {
          businessId: business.id,
          purchaseType: "request_reload",
          requestCredits: `${REQUEST_RELOAD_PACK_SIZE}`,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    captureServerException(error, {
      route: "/api/checkout/reload",
      tags: { business_id: business.id },
      extras: {
        stripe_customer_id: business.stripe_customer_id,
        stripe_subscription_id: business.stripe_subscription_id,
      },
    });

    return NextResponse.json(
      {
        error:
          "We couldn't open the add-on checkout right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
