import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureGenericReviewLinkForBusiness } from "@/lib/generic-review-link";

async function getAuthenticatedUserId(req: NextRequest) {
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

  return user.id;
}

export async function POST(req: NextRequest) {
  const businessId = await getAuthenticatedUserId(req);

  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviewLink = await ensureGenericReviewLinkForBusiness(businessId);

    return NextResponse.json({
      id: reviewLink.id,
      unique_code: reviewLink.unique_code,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to ensure generic review link";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
