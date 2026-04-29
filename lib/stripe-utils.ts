import type Stripe from "stripe";

export function mapSubscriptionStatus(stripeStatus: string): string {
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

export function getSubscriptionCurrentPeriodEnd(
  subscription: Stripe.Subscription,
) {
  const subscriptionWithPeriodEnd = subscription as Stripe.Subscription & {
    current_period_start?: number | null;
    current_period_end?: number | null;
    trial_end?: number | null;
    cancel_at?: number | null;
    items?: {
      data?: Array<{
        current_period_start?: number | null;
        current_period_end?: number | null;
      }>;
    } | null;
  };

  if (typeof subscriptionWithPeriodEnd.current_period_end === "number") {
    return subscriptionWithPeriodEnd.current_period_end;
  }

  if (typeof subscriptionWithPeriodEnd.cancel_at === "number") {
    return subscriptionWithPeriodEnd.cancel_at;
  }

  if (typeof subscriptionWithPeriodEnd.trial_end === "number") {
    return subscriptionWithPeriodEnd.trial_end;
  }

  const itemPeriodEnds = (subscriptionWithPeriodEnd.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (itemPeriodEnds.length > 0) {
    return Math.max(...itemPeriodEnds);
  }

  return null;
}

export function getSubscriptionCurrentPeriodStart(
  subscription: Stripe.Subscription,
) {
  const subscriptionWithPeriodStart = subscription as Stripe.Subscription & {
    current_period_start?: number | null;
    items?: {
      data?: Array<{
        current_period_start?: number | null;
      }>;
    } | null;
  };

  if (typeof subscriptionWithPeriodStart.current_period_start === "number") {
    return subscriptionWithPeriodStart.current_period_start;
  }

  const itemPeriodStarts = (subscriptionWithPeriodStart.items?.data ?? [])
    .map((item) => item.current_period_start)
    .filter((value): value is number => typeof value === "number");

  if (itemPeriodStarts.length > 0) {
    return Math.min(...itemPeriodStarts);
  }

  return null;
}
