import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { captureServerException } from "@/lib/server-error-reporting";
import {
  getSubscriptionCurrentPeriodEnd,
  getSubscriptionCurrentPeriodStart,
  mapSubscriptionStatus,
} from "@/lib/stripe-utils";
import { resolveStripeCustomer } from "@/lib/stripe-customer";

const SUBSCRIPTION_PRIORITY: Record<string, number> = {
  active: 6,
  trialing: 5,
  past_due: 4,
  incomplete: 3,
  incomplete_expired: 2,
  unpaid: 1,
  canceled: 0,
  paused: 0,
};

function pickMostRelevantSubscription(subscriptions: Stripe.Subscription[]) {
  if (subscriptions.length === 0) return null;

  return [...subscriptions].sort((left, right) => {
    const priorityDelta =
      (SUBSCRIPTION_PRIORITY[right.status] ?? -1) - (SUBSCRIPTION_PRIORITY[left.status] ?? -1);

    if (priorityDelta !== 0) return priorityDelta;
    return right.created - left.created;
  })[0];
}

async function findSubscriptionForCustomer(stripe: Stripe, customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return pickMostRelevantSubscription(subscriptions.data);
}

async function findCustomerAndSubscriptionByEmail(stripe: Stripe, email: string) {
  const customers = await stripe.customers.list({ email, limit: 10 });

  let bestMatch:
    | {
        customerId: string;
        subscription: Stripe.Subscription;
      }
    | null = null;

  for (const customer of customers.data) {
    if (customer.deleted) continue;

    const subscription = await findSubscriptionForCustomer(stripe, customer.id);
    if (!subscription) continue;

    if (!bestMatch) {
      bestMatch = { customerId: customer.id, subscription };
      continue;
    }

    const currentPriority = SUBSCRIPTION_PRIORITY[bestMatch.subscription.status] ?? -1;
    const nextPriority = SUBSCRIPTION_PRIORITY[subscription.status] ?? -1;

    if (
      nextPriority > currentPriority ||
      (nextPriority === currentPriority && subscription.created > bestMatch.subscription.created)
    ) {
      bestMatch = { customerId: customer.id, subscription };
    }
  }

  return bestMatch;
}

async function findCheckoutSessionMatch(stripe: Stripe, userId: string) {
  let scanned = 0;

  for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
    scanned += 1;

    if (session.client_reference_id === userId && session.status === "complete") {
      return session;
    }

    if (scanned >= 200) {
      break;
    }
  }

  return null;
}

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
    .select("id, stripe_customer_id, stripe_subscription_id, subscription_status, current_billing_period_start, current_billing_period_end, paused_until, cancel_scheduled_for")
    .eq("id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const resolvedCustomer = await resolveStripeCustomer(stripe, {
    storedCustomerId: business.stripe_customer_id as string | null,
    storedSubscriptionId: business.stripe_subscription_id as string | null,
    email: user.email ?? null,
  });

  let customerId = resolvedCustomer.customerId;
  let subscriptionId =
    resolvedCustomer.subscriptionId ??
    (business.stripe_subscription_id as string | null);
  let status = business.subscription_status as string;
  let currentBillingPeriodStart =
    business.current_billing_period_start as string | null;
  let currentBillingPeriodEnd =
    business.current_billing_period_end as string | null;
  const pausedUntil = business.paused_until as string | null;
  let cancelScheduledFor = business.cancel_scheduled_for as string | null;

  // Path A: We already have a stripe_customer_id — look up subscription directly
  if (customerId) {
    let storedSubscription: Stripe.Subscription | null = null;

    if (subscriptionId) {
      try {
        storedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch {
        storedSubscription = null;
      }
    }

    const listedSubscription = await findSubscriptionForCustomer(stripe, customerId);
    const sub = pickMostRelevantSubscription(
      [storedSubscription, listedSubscription].filter(Boolean) as Stripe.Subscription[],
    );

    if (sub) {
      subscriptionId = sub.id;
      status = mapSubscriptionStatus(sub.status);
      const currentPeriodStart = getSubscriptionCurrentPeriodStart(sub);
      const currentPeriodEnd = getSubscriptionCurrentPeriodEnd(sub);
      currentBillingPeriodStart = currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null;
      currentBillingPeriodEnd = currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null;
      cancelScheduledFor = sub.cancel_at_period_end
        && currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null;
    }
  } else {
    // Path B1: No stripe_customer_id yet — try to recover from the account email first
    if (user.email) {
      const emailMatch = await findCustomerAndSubscriptionByEmail(stripe, user.email);

      if (emailMatch) {
        customerId = emailMatch.customerId;
        subscriptionId = emailMatch.subscription.id;
        status = mapSubscriptionStatus(emailMatch.subscription.status);
        const currentPeriodStart = getSubscriptionCurrentPeriodStart(
          emailMatch.subscription,
        );
        const currentPeriodEnd = getSubscriptionCurrentPeriodEnd(emailMatch.subscription);
        currentBillingPeriodStart = currentPeriodStart
          ? new Date(currentPeriodStart * 1000).toISOString()
          : null;
        currentBillingPeriodEnd = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null;
        cancelScheduledFor = emailMatch.subscription.cancel_at_period_end
          && currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null;
      }
    }

    // Path B2: Still nothing — scan a bounded set of checkout sessions by client_reference_id
    if (!customerId) {
      const match = await findCheckoutSessionMatch(stripe, user.id);

      if (match) {
        customerId = (match.customer as string | null) ?? null;
        subscriptionId = (match.subscription as string | null) ?? null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = mapSubscriptionStatus(sub.status);
          const currentPeriodStart = getSubscriptionCurrentPeriodStart(sub);
          const currentPeriodEnd = getSubscriptionCurrentPeriodEnd(sub);
          currentBillingPeriodStart = currentPeriodStart
            ? new Date(currentPeriodStart * 1000).toISOString()
            : null;
          currentBillingPeriodEnd = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;
          cancelScheduledFor = sub.cancel_at_period_end
            && currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;
        }
      }
    }

    if (!customerId && !subscriptionId) {
      return NextResponse.json({
        updated: false,
        subscription_status: status,
      });
    }
  }

  // Update the business record
  const isPausedWindowActive =
    pausedUntil !== null && new Date(pausedUntil).getTime() > Date.now();

  if (status === "canceled" && isPausedWindowActive) {
    status = "paused";
  }

  const updateFields: Record<string, string | null> = {
    subscription_status: status,
    current_billing_period_start: currentBillingPeriodStart,
    current_billing_period_end: currentBillingPeriodEnd,
    cancel_scheduled_for: cancelScheduledFor,
  };
  if (customerId) updateFields.stripe_customer_id = customerId;
  if (subscriptionId) updateFields.stripe_subscription_id = subscriptionId;
  if (["active", "trialing", "past_due", "incomplete"].includes(status)) {
    updateFields.paused_until = null;
  }

  const { error: updateError } = await supabaseAdmin
    .from("businesses")
    .update(updateFields)
    .eq("id", user.id);

  if (updateError) {
    captureServerException(new Error(updateError.message), {
      route: "/api/verify-subscription",
      tags: { business_id: user.id },
      extras: {
        subscription_status: status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      },
    });
    console.error(`[verify-subscription] Failed to update business ${user.id}:`, updateError.message);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }


  return NextResponse.json({
    updated: true,
    subscription_status: status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    current_billing_period_start: currentBillingPeriodStart,
    current_billing_period_end: currentBillingPeriodEnd,
    cancel_scheduled_for: cancelScheduledFor,
  });
}
