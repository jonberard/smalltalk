import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Service role key required to bypass RLS — webhooks have no user auth context
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "paused":
      return "paused";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "none";
  }
}

async function updateByCustomerId(customerId: string, fields: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("businesses")
    .update(fields)
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error(`[stripe-webhook] Failed to update customer ${customerId}:`, error.message);
  }
  return error;
}

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = process.env;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[stripe-webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  switch (event.type) {
    /* ─── Checkout ─── */
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!userId) {
        console.error("[stripe-webhook] checkout.session.completed missing client_reference_id");
        break;
      }

      const { error } = await supabaseAdmin
        .from("businesses")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "trialing",
        })
        .eq("id", userId);

      if (error) {
        console.error("[stripe-webhook] Failed to update business:", error.message);
      }
      break;
    }

    /* ─── Subscription lifecycle ─── */
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = mapSubscriptionStatus(sub.status);

      await updateByCustomerId(customerId, {
        stripe_subscription_id: sub.id,
        subscription_status: status,
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = mapSubscriptionStatus(sub.status);

      await updateByCustomerId(customerId, { subscription_status: status });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await updateByCustomerId(customerId, { subscription_status: "canceled" });
      break;
    }

    case "customer.subscription.paused": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await updateByCustomerId(customerId, { subscription_status: "paused" });
      break;
    }

    case "customer.subscription.resumed": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await updateByCustomerId(customerId, { subscription_status: "active" });
      break;
    }

    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as Stripe.Subscription;
      break;
    }

    /* ─── Invoices ─── */
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Only set to "active" if currently past_due or active — don't overwrite "trialing"
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("subscription_status")
        .eq("stripe_customer_id", customerId)
        .single();

      if (biz && (biz.subscription_status === "past_due" || biz.subscription_status === "active")) {
        await updateByCustomerId(customerId, { subscription_status: "active" });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await updateByCustomerId(customerId, { subscription_status: "past_due" });
      break;
    }

    case "invoice.upcoming": {
      const invoice = event.data.object as Stripe.Invoice;
      break;
    }

    default:
  }

  return NextResponse.json({ received: true });
}
