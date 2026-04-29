import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { captureServerException } from "@/lib/server-error-reporting";
import { recordRequestReloadPurchase } from "@/lib/request-reload-purchases";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function findRecentReloadSession(stripe: Stripe, businessId: string) {
  for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
    if (
      session.mode === "payment" &&
      session.payment_status === "paid" &&
      session.metadata?.purchaseType === "request_reload" &&
      (session.metadata?.businessId === businessId ||
        session.client_reference_id === businessId)
    ) {
      return session;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { STRIPE_SECRET_KEY } = process.env;

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe reloads are not configured" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { sessionId?: string };

  try {
    body = (await req.json()) as { sessionId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const session = sessionId
      ? await stripe.checkout.sessions.retrieve(sessionId)
      : await findRecentReloadSession(stripe, user.id);

    if (!session) {
      return NextResponse.json(
        { error: "We couldn't find that add-on purchase yet." },
        { status: 404 },
      );
    }

    if (
      session.metadata?.purchaseType !== "request_reload" ||
      session.mode !== "payment"
    ) {
      return NextResponse.json(
        { error: "That checkout session is not a reload purchase." },
        { status: 400 },
      );
    }

    const businessId = session.metadata?.businessId ?? session.client_reference_id;
    const credits = Number(session.metadata?.requestCredits ?? "0");

    if (businessId !== user.id) {
      return NextResponse.json({ error: "That purchase does not belong to this account." }, { status: 403 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "That purchase is still finishing." },
        { status: 409 },
      );
    }

    if (!credits) {
      return NextResponse.json(
        { error: "That purchase is missing its request pack details." },
        { status: 400 },
      );
    }

    const purchaseRecord = await recordRequestReloadPurchase({
      businessId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      credits,
      amountCents: session.amount_total ?? 0,
    });

    if (session.customer) {
      const { error: syncError } = await supabaseAdmin
        .from("businesses")
        .update({ stripe_customer_id: session.customer as string })
        .eq("id", businessId);

      if (syncError) {
        throw new Error(
          `Failed to sync Stripe customer after reload confirmation: ${syncError.message}`,
        );
      }
    }

    return NextResponse.json({
      confirmed: true,
      extra: purchaseRecord.extra,
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/checkout/reload/confirm",
      tags: {
        business_id: user.id,
        stripe_checkout_session_id: sessionId || "recent_lookup",
      },
    });

    return NextResponse.json(
      {
        error:
          "We saw the purchase, but couldn't finish crediting it just yet. Please refresh in a moment.",
      },
      { status: 500 },
    );
  }
}
