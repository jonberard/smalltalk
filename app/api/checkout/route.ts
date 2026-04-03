import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  let body: { price_id?: string; user_id?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { price_id, user_id } = body;

  if (!price_id || !user_id) {
    return NextResponse.json(
      { error: "Missing required fields: price_id, user_id" },
      { status: 400 },
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const origin = req.headers.get("origin") || "https://usesmalltalk.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=canceled`,
      client_reference_id: user_id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const stripeErr = err as { message?: string };
    return NextResponse.json(
      { error: stripeErr.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
