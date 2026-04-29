import "server-only";

import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveStripeCustomer } from "@/lib/stripe-customer";
import {
  getSubscriptionCurrentPeriodEnd,
  getSubscriptionCurrentPeriodStart,
  mapSubscriptionStatus,
} from "@/lib/stripe-utils";

export const PAID_REQUESTS_PER_CYCLE = 500;
export const REQUEST_RELOAD_PACK_SIZE = 100;
export const REQUEST_RELOAD_PRICE_CENTS = 2500;
export const TRIAL_REQUEST_LIMIT = 10;

export type RequestAllowanceBusiness = {
  id: string;
  subscription_status: string;
  trial_requests_remaining: number;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_billing_period_start: string | null;
  current_billing_period_end: string | null;
  extra_request_credits: number;
};

export type RequestAllowanceSummary =
  | {
      kind: "trial";
      used: number;
      remaining: number;
      total: number;
      resetAt: string | null;
      warningLevel: "none" | "heads_up" | "almost_full" | "exhausted";
    }
  | {
      kind: "paid";
      used: number;
      remaining: number;
      total: number;
      included: number;
      included_remaining: number;
      extra: number;
      cycleStart: string;
      resetAt: string;
      warningLevel: "none" | "heads_up" | "almost_full" | "exhausted";
    }
  | {
      kind: "inactive";
      used: 0;
      remaining: 0;
      total: 0;
      resetAt: string | null;
      warningLevel: "exhausted";
    };

export type AllowanceConsumeResult = {
  ok: boolean;
  reason?: string;
  already_counted?: boolean;
  plan_kind?: "trial" | "paid";
  remaining?: number;
  used?: number;
  total?: number;
  included?: number;
  included_remaining?: number;
  extra?: number;
  cycle_start?: string | null;
  cycle_end?: string | null;
};

export const REQUEST_ALLOWANCE_BUSINESS_SELECT =
  "id, subscription_status, trial_requests_remaining, trial_ends_at, stripe_customer_id, stripe_subscription_id, current_billing_period_start, current_billing_period_end, extra_request_credits";

export function isPaidAllowanceStatus(status: string) {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "incomplete"
  );
}

function getWarningLevel(remaining: number) {
  if (remaining <= 0) return "exhausted" as const;
  if (remaining <= 25) return "almost_full" as const;
  if (remaining <= 100) return "heads_up" as const;
  return "none" as const;
}

export async function loadRequestAllowanceBusinessById(businessId: string) {
  return supabaseAdmin
    .from("businesses")
    .select(REQUEST_ALLOWANCE_BUSINESS_SELECT)
    .eq("id", businessId)
    .single();
}

async function findSubscriptionForCustomer(
  stripe: Stripe,
  customerId: string,
) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

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

  return [...subscriptions.data].sort((left, right) => {
    const priorityDelta =
      (priority[right.status] ?? -1) - (priority[left.status] ?? -1);
    if (priorityDelta !== 0) return priorityDelta;
    return right.created - left.created;
  })[0] ?? null;
}

export async function hydrateBillingCycleWindow(
  business: RequestAllowanceBusiness,
) {
  if (
    !isPaidAllowanceStatus(business.subscription_status) ||
    (business.current_billing_period_start &&
      business.current_billing_period_end)
  ) {
    return business;
  }

  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return business;
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const resolvedCustomer = await resolveStripeCustomer(stripe, {
    storedCustomerId: business.stripe_customer_id,
    storedSubscriptionId: business.stripe_subscription_id,
  });

  let subscription: Stripe.Subscription | null = null;

  if (resolvedCustomer.subscriptionId) {
    try {
      subscription = await stripe.subscriptions.retrieve(
        resolvedCustomer.subscriptionId,
      );
    } catch {
      subscription = null;
    }
  }

  if (!subscription && resolvedCustomer.customerId) {
    subscription = await findSubscriptionForCustomer(
      stripe,
      resolvedCustomer.customerId,
    );
  }

  if (!subscription) {
    return business;
  }

  const cycleStart = getSubscriptionCurrentPeriodStart(subscription);
  const cycleEnd = getSubscriptionCurrentPeriodEnd(subscription);

  if (!cycleStart || !cycleEnd) {
    return business;
  }

  const currentBillingPeriodStart = new Date(cycleStart * 1000).toISOString();
  const currentBillingPeriodEnd = new Date(cycleEnd * 1000).toISOString();
  const subscriptionStatus = mapSubscriptionStatus(subscription.status);

  await supabaseAdmin
    .from("businesses")
    .update({
      subscription_status: subscriptionStatus,
      stripe_customer_id:
        resolvedCustomer.customerId ?? (subscription.customer as string),
      stripe_subscription_id: subscription.id,
      current_billing_period_start: currentBillingPeriodStart,
      current_billing_period_end: currentBillingPeriodEnd,
    })
    .eq("id", business.id);

  return {
    ...business,
    subscription_status: subscriptionStatus,
    stripe_customer_id:
      resolvedCustomer.customerId ?? (subscription.customer as string),
    stripe_subscription_id: subscription.id,
    current_billing_period_start: currentBillingPeriodStart,
    current_billing_period_end: currentBillingPeriodEnd,
  };
}

export async function getRequestAllowanceSummary(
  businessOrId: string | RequestAllowanceBusiness,
): Promise<RequestAllowanceSummary> {
  const business =
    typeof businessOrId === "string"
      ? (
          await loadRequestAllowanceBusinessById(businessOrId)
        ).data ?? null
      : businessOrId;

  if (!business) {
    return {
      kind: "inactive",
      used: 0,
      remaining: 0,
      total: 0,
      resetAt: null,
      warningLevel: "exhausted",
    };
  }

  const hydratedBusiness = await hydrateBillingCycleWindow(business);

  if (hydratedBusiness.subscription_status === "trial") {
    const remaining = Math.max(0, hydratedBusiness.trial_requests_remaining);
    return {
      kind: "trial",
      used: Math.max(TRIAL_REQUEST_LIMIT - remaining, 0),
      remaining,
      total: TRIAL_REQUEST_LIMIT,
      resetAt: hydratedBusiness.trial_ends_at,
      warningLevel: getWarningLevel(remaining),
    };
  }

  if (
    !isPaidAllowanceStatus(hydratedBusiness.subscription_status) ||
    !hydratedBusiness.current_billing_period_start ||
    !hydratedBusiness.current_billing_period_end
  ) {
    return {
      kind: "inactive",
      used: 0,
      remaining: 0,
      total: 0,
      resetAt: hydratedBusiness.current_billing_period_end,
      warningLevel: "exhausted",
    };
  }

  const cycleStart = hydratedBusiness.current_billing_period_start;
  const cycleEnd = hydratedBusiness.current_billing_period_end;

  const { data: usageRows } = await supabaseAdmin
      .from("request_usage_events")
      .select("quantity")
      .eq("business_id", hydratedBusiness.id)
      .gte("created_at", cycleStart)
      .lt("created_at", cycleEnd);

  const used = (usageRows ?? []).reduce(
    (sum, row) => sum + (row.quantity ?? 0),
    0,
  );
  const includedRemaining = Math.max(PAID_REQUESTS_PER_CYCLE - used, 0);
  const extra = Math.max(hydratedBusiness.extra_request_credits, 0);
  const remaining = includedRemaining + extra;
  const total = used + remaining;

  return {
    kind: "paid",
    used,
    remaining,
    total,
    included: PAID_REQUESTS_PER_CYCLE,
    included_remaining: includedRemaining,
    extra,
    cycleStart,
    resetAt: cycleEnd,
    warningLevel: getWarningLevel(remaining),
  };
}

export async function consumeRequestAllowance(input: {
  businessId: string;
  source: "personalized_request" | "shared_public_draft";
  reviewLinkId?: string;
  reviewSessionId?: string;
}) {
  const { data, error } = await supabaseAdmin.rpc("consume_request_allowance", {
    p_business_id: input.businessId,
    p_source: input.source,
    p_review_link_id: input.reviewLinkId ?? null,
    p_review_session_id: input.reviewSessionId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? {}) as AllowanceConsumeResult;
}

export async function releaseRequestAllowance(input: {
  businessId: string;
  reviewLinkId?: string;
  reviewSessionId?: string;
}) {
  const { data, error } = await supabaseAdmin.rpc("release_request_allowance", {
    p_business_id: input.businessId,
    p_review_link_id: input.reviewLinkId ?? null,
    p_review_session_id: input.reviewSessionId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? {}) as {
    released?: boolean;
    plan_kind?: "trial" | "paid";
    remaining?: number;
    used?: number;
    total?: number;
  };
}
