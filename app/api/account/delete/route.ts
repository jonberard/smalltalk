import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { captureServerException } from "@/lib/server-error-reporting";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cancelStripeBilling } from "@/lib/stripe-billing";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, stripe_customer_id, stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    if (businessError) {
      throw new Error(`Failed to load business for deletion: ${businessError.message}`);
    }

    if (!business) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (authDeleteError) {
        throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
      }

      return NextResponse.json({ success: true, deleted: true, hadBusiness: false });
    }

    if (business.stripe_customer_id || business.stripe_subscription_id) {
      const { STRIPE_SECRET_KEY } = process.env;

      if (!STRIPE_SECRET_KEY) {
        return NextResponse.json(
          { error: "Stripe is not configured for account deletion." },
          { status: 503 },
        );
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY);
      await cancelStripeBilling(
        stripe,
        business.stripe_customer_id ?? null,
        business.stripe_subscription_id ?? null,
      );
    }

    const { error: adminMembershipDeleteError } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("user_id", user.id);

    if (adminMembershipDeleteError) {
      throw new Error(`Failed to delete admin membership: ${adminMembershipDeleteError.message}`);
    }

    const { error: businessDeleteError } = await supabaseAdmin
      .from("businesses")
      .delete()
      .eq("id", user.id);

    if (businessDeleteError) {
      throw new Error(`Failed to delete business: ${businessDeleteError.message}`);
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    return NextResponse.json({ success: true, deleted: true, hadBusiness: true });
  } catch (error) {
    captureServerException(error, {
      route: "/api/account/delete",
      tags: { user_id: user.id },
    });

    const message =
      error instanceof Error ? error.message : "Failed to delete the account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
