import "server-only";

import Stripe from "stripe";

export async function cancelStripeBilling(
  stripe: Stripe,
  customerId: string | null,
  subscriptionId: string | null,
) {
  if (subscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      return;
    } catch (error) {
      const stripeError = error as { code?: string; statusCode?: number };
      if (stripeError.code === "resource_missing" || stripeError.statusCode === 404) {
        // Fall through and attempt customer lookup if we still have a customer ID.
      } else {
        throw error;
      }
    }
  }

  if (!customerId) {
    return;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  const cancelableStatuses = new Set([
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
  ]);

  for (const subscription of subscriptions.data) {
    if (!cancelableStatuses.has(subscription.status)) continue;
    await stripe.subscriptions.cancel(subscription.id);
  }
}
