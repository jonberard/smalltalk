import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  let body: { stripe_customer_id?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { stripe_customer_id } = body;

  if (!stripe_customer_id) {
    return NextResponse.json({ error: "Missing stripe_customer_id" }, { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const origin = req.headers.get("origin") || "https://usesmalltalk.com";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${origin}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const stripeErr = err as { message?: string };
    return NextResponse.json(
      { error: stripeErr.message || "Failed to create portal session" },
      { status: 500 },
    );
  }
}
