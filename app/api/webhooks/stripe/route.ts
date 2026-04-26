import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { mapSubscriptionStatus } from "@/lib/stripe-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function updateByCustomerId(customerId: string, fields: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .update(fields)
    .eq("stripe_customer_id", customerId)
    .select("id");

  if (error) {
    throw new Error(`Failed to update customer ${customerId}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No business found for Stripe customer ${customerId}`);
  }
}

async function acquireWebhookEvent(event: Stripe.Event) {
  const { error } = await supabaseAdmin.from("processed_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    stripe_created_at: new Date(event.created * 1000).toISOString(),
  });

  if (!error) {
    return "acquired" as const;
  }

  if (error.code !== "23505") {
    throw new Error(`Failed to record Stripe webhook event ${event.id}: ${error.message}`);
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("processed_webhook_events")
    .select("processed_at")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to read existing Stripe webhook event ${event.id}: ${existingError.message}`,
    );
  }

  return existing?.processed_at ? ("processed" as const) : ("processing" as const);
}

async function markWebhookProcessed(eventId: string) {
  const { error } = await supabaseAdmin
    .from("processed_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", eventId);

  if (error) {
    throw new Error(`Failed to mark Stripe webhook event ${eventId} as processed: ${error.message}`);
  }
}

async function releaseWebhookEvent(eventId: string) {
  const { error } = await supabaseAdmin
    .from("processed_webhook_events")
    .delete()
    .eq("event_id", eventId);

  if (error) {
    console.error(`[stripe-webhook] Failed to release event ${eventId}:`, error.message);
  }
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

  let lockState: "acquired" | "processed" | "processing";

  try {
    lockState = await acquireWebhookEvent(event);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to acquire Stripe webhook lock";
    console.error("[stripe-webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (lockState === "processed" || lockState === "processing") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      /* ─── Checkout ─── */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!userId) {
          throw new Error("checkout.session.completed missing client_reference_id");
        }

        let subscriptionStatus = "active";
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionStatus = mapSubscriptionStatus(subscription.status);
        }

        const updateFields: Record<string, string> = {
          subscription_status: subscriptionStatus,
        };

        if (customerId) updateFields.stripe_customer_id = customerId;
        if (subscriptionId) updateFields.stripe_subscription_id = subscriptionId;

        const { data, error } = await supabaseAdmin
          .from("businesses")
          .update(updateFields)
          .eq("id", userId)
          .select("id");

        if (error) {
          throw new Error(`Failed to update business ${userId}: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error(`No business found for checkout session user ${userId}`);
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

        await updateByCustomerId(customerId, {
          stripe_subscription_id: sub.id,
          subscription_status: status,
        });
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
        const status = mapSubscriptionStatus(sub.status);

        await updateByCustomerId(customerId, { subscription_status: status });
        break;
      }

      case "customer.subscription.trial_will_end": {
        break;
      }

      /* ─── Invoices ─── */
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: biz, error } = await supabaseAdmin
          .from("businesses")
          .select("subscription_status")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to load business for invoice.paid ${customerId}: ${error.message}`);
        }

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
        break;
      }

      default:
    }

    await markWebhookProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe webhook processing failed";
    console.error("[stripe-webhook]", message);
    await releaseWebhookEvent(event.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
