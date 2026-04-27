import "server-only";

import Stripe from "stripe";

const CANCELABLE_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

const SUBSCRIPTION_PRIORITY: Record<string, number> = {
  active: 6,
  trialing: 5,
  past_due: 4,
  incomplete: 3,
  unpaid: 2,
  paused: 1,
  canceled: 0,
  incomplete_expired: 0,
};

function pickManagedSubscription(subscriptions: Stripe.Subscription[]) {
  if (subscriptions.length === 0) {
    return null;
  }

  return [...subscriptions]
    .filter((subscription) => CANCELABLE_STATUSES.has(subscription.status))
    .sort((left, right) => {
      const priorityDelta =
        (SUBSCRIPTION_PRIORITY[right.status] ?? -1) - (SUBSCRIPTION_PRIORITY[left.status] ?? -1);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return right.created - left.created;
    })[0] ?? null;
}

async function findManagedSubscription(
  stripe: Stripe,
  customerId: string | null,
  subscriptionId: string | null,
) {
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (CANCELABLE_STATUSES.has(subscription.status)) {
        return subscription;
      }
    } catch (error) {
      const stripeError = error as { code?: string; statusCode?: number };
      if (stripeError.code !== "resource_missing" && stripeError.statusCode !== 404) {
        throw error;
      }
    }
  }

  if (!customerId) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return pickManagedSubscription(subscriptions.data);
}

export async function findManagedCustomerAndSubscriptionByEmail(
  stripe: Stripe,
  email: string | null,
) {
  if (!email) {
    return null;
  }

  const customers = await stripe.customers.list({ email, limit: 10 });
  let bestMatch:
    | {
        customerId: string;
        subscription: Stripe.Subscription;
      }
    | null = null;

  for (const customer of customers.data) {
    if (customer.deleted) continue;

    const subscription = await findManagedSubscription(stripe, customer.id, null);
    if (!subscription) continue;

    if (!bestMatch) {
      bestMatch = { customerId: customer.id, subscription };
      continue;
    }

    const currentPriority = SUBSCRIPTION_PRIORITY[bestMatch.subscription.status] ?? -1;
    const candidatePriority = SUBSCRIPTION_PRIORITY[subscription.status] ?? -1;

    if (
      candidatePriority > currentPriority ||
      (candidatePriority === currentPriority &&
        subscription.created > bestMatch.subscription.created)
    ) {
      bestMatch = { customerId: customer.id, subscription };
    }
  }

  return bestMatch;
}

export async function cancelStripeBilling(
  stripe: Stripe,
  customerId: string | null,
  subscriptionId: string | null,
) {
  const subscription = await findManagedSubscription(
    stripe,
    customerId,
    subscriptionId,
  );

  if (!subscription) {
    return;
  }

  await stripe.subscriptions.cancel(subscription.id);
}

export async function scheduleStripeBillingCancellation(
  stripe: Stripe,
  customerId: string | null,
  subscriptionId: string | null,
) {
  const subscription = await findManagedSubscription(
    stripe,
    customerId,
    subscriptionId,
  );

  if (!subscription) {
    return null;
  }

  if (subscription.cancel_at_period_end) {
    return subscription;
  }

  return stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });
}
