import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  // Authenticate the request
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Derive stripe_customer_id from the authenticated user's business record
  const { data: business } = await supabase
    .from("businesses")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe_customer_id = business?.stripe_customer_id;
  if (!stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const appBaseUrl = getAppBaseUrl();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${appBaseUrl}/dashboard/more/account`,
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
