import "server-only";

import Stripe from "stripe";

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

type ResolveStripeCustomerOptions = {
  storedCustomerId?: string | null;
  storedSubscriptionId?: string | null;
  email?: string | null;
};

export type ResolvedStripeCustomer = {
  customerId: string | null;
  subscriptionId: string | null;
  staleStoredCustomerId: boolean;
  source:
    | "stored_customer"
    | "stored_subscription"
    | "email_subscription"
    | "email_customer"
    | "none";
};

export function isStripeMissingResourceError(error: unknown) {
  const stripeError = error as {
    code?: string;
    statusCode?: number;
    message?: string;
    raw?: { code?: string };
  };

  return (
    stripeError.code === "resource_missing" ||
    stripeError.raw?.code === "resource_missing" ||
    stripeError.statusCode === 404 ||
    /No such (customer|subscription)/i.test(stripeError.message ?? "")
  );
}

async function retrieveCustomerIfValid(stripe: Stripe, customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);

    if ("deleted" in customer && customer.deleted) {
      return null;
    }

    return customer;
  } catch (error) {
    if (isStripeMissingResourceError(error)) {
      return null;
    }

    throw error;
  }
}

async function retrieveSubscriptionIfValid(stripe: Stripe, subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isStripeMissingResourceError(error)) {
      return null;
    }

    throw error;
  }
}

async function listSubscriptionsForCustomer(stripe: Stripe, customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    return subscriptions.data;
  } catch (error) {
    if (isStripeMissingResourceError(error)) {
      return [];
    }

    throw error;
  }
}

function pickMostRelevantSubscription(subscriptions: Stripe.Subscription[]) {
  if (subscriptions.length === 0) {
    return null;
  }

  return [...subscriptions].sort((left, right) => {
    const priorityDelta =
      (SUBSCRIPTION_PRIORITY[right.status] ?? -1) -
      (SUBSCRIPTION_PRIORITY[left.status] ?? -1);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.created - left.created;
  })[0];
}

async function findBestCustomerWithSubscriptionByEmail(stripe: Stripe, email: string) {
  const customers = await stripe.customers.list({ email, limit: 10 });

  let bestMatch:
    | {
        customerId: string;
        subscriptionId: string;
        subscription: Stripe.Subscription;
      }
    | null = null;

  for (const customer of customers.data) {
    if (customer.deleted || customer.email !== email) {
      continue;
    }

    const subscription = pickMostRelevantSubscription(
      await listSubscriptionsForCustomer(stripe, customer.id),
    );

    if (!subscription) {
      continue;
    }

    if (!bestMatch) {
      bestMatch = {
        customerId: customer.id,
        subscriptionId: subscription.id,
        subscription,
      };
      continue;
    }

    const currentPriority =
      SUBSCRIPTION_PRIORITY[bestMatch.subscription.status] ?? -1;
    const nextPriority = SUBSCRIPTION_PRIORITY[subscription.status] ?? -1;

    if (
      nextPriority > currentPriority ||
      (nextPriority === currentPriority &&
        subscription.created > bestMatch.subscription.created)
    ) {
      bestMatch = {
        customerId: customer.id,
        subscriptionId: subscription.id,
        subscription,
      };
    }
  }

  return bestMatch;
}

async function findLatestCustomerByEmail(stripe: Stripe, email: string) {
  const customers = await stripe.customers.list({ email, limit: 10 });

  const exactMatches = customers.data
    .filter((customer) => !customer.deleted && customer.email === email)
    .sort((left, right) => right.created - left.created);

  return exactMatches[0] ?? null;
}

export async function resolveStripeCustomer(
  stripe: Stripe,
  { storedCustomerId, storedSubscriptionId, email }: ResolveStripeCustomerOptions,
): Promise<ResolvedStripeCustomer> {
  let staleStoredCustomerId = false;

  if (storedCustomerId) {
    const customer = await retrieveCustomerIfValid(stripe, storedCustomerId);

    if (customer) {
      return {
        customerId: customer.id,
        subscriptionId: storedSubscriptionId ?? null,
        staleStoredCustomerId,
        source: "stored_customer",
      };
    }

    staleStoredCustomerId = true;
  }

  if (storedSubscriptionId) {
    const subscription = await retrieveSubscriptionIfValid(
      stripe,
      storedSubscriptionId,
    );

    if (subscription) {
      return {
        customerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : null,
        subscriptionId: subscription.id,
        staleStoredCustomerId,
        source: "stored_subscription",
      };
    }
  }

  if (email) {
    const subscriptionMatch = await findBestCustomerWithSubscriptionByEmail(
      stripe,
      email,
    );

    if (subscriptionMatch) {
      return {
        customerId: subscriptionMatch.customerId,
        subscriptionId: subscriptionMatch.subscriptionId,
        staleStoredCustomerId,
        source: "email_subscription",
      };
    }

    const customer = await findLatestCustomerByEmail(stripe, email);

    if (customer) {
      return {
        customerId: customer.id,
        subscriptionId: null,
        staleStoredCustomerId,
        source: "email_customer",
      };
    }
  }

  return {
    customerId: null,
    subscriptionId: null,
    staleStoredCustomerId,
    source: "none",
  };
}
