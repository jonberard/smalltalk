import { NextRequest, NextResponse } from "next/server";
import { sendOwnerNotification } from "@/lib/owner-notifications";
import { requirePublicFlowSession } from "@/lib/public-review-flow";
import { supabaseAdmin } from "@/lib/supabase-admin";

type CompletePublicBody = {
  generated_review?: string;
  star_rating?: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const sessionContext = await requirePublicFlowSession(req, code);

  if (sessionContext.error === "not_found") {
    return NextResponse.json({ error: "Review link not found" }, { status: 404 });
  }

  if (sessionContext.error) {
    return NextResponse.json({ error: "Session expired. Reload the page to continue." }, { status: 401 });
  }

  let body: CompletePublicBody;

  try {
    body = (await req.json()) as CompletePublicBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const generatedReview =
    typeof body.generated_review === "string"
      ? body.generated_review.slice(0, 8000)
      : "";

  if (!generatedReview.trim()) {
    return NextResponse.json({ error: "generated_review is required" }, { status: 400 });
  }

  const starRating = body.star_rating ?? sessionContext.session.star_rating ?? null;

  if (!starRating || starRating < 1 || starRating > 5) {
    return NextResponse.json({ error: "star_rating must be between 1 and 5" }, { status: 400 });
  }

  const shouldNotify =
    starRating <= 2 &&
    !sessionContext.session.public_owner_notified_at;

  const { error } = await supabaseAdmin
    .from("review_sessions")
    .update({
      feedback_type: "public",
      generated_review: generatedReview,
      star_rating: starRating,
      status: "copied",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionContext.session.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (shouldNotify) {
    const notifyResult = await sendOwnerNotification({
      reviewLinkId: sessionContext.reviewLink.id,
      customerName: sessionContext.reviewLink.customer_name,
      starRating,
      reviewText: generatedReview,
      isPrivate: false,
    });

    if (notifyResult.success) {
      await supabaseAdmin
        .from("review_sessions")
        .update({ public_owner_notified_at: new Date().toISOString() })
        .eq("id", sessionContext.session.id)
        .is("public_owner_notified_at", null);
    }
  }

  return NextResponse.json({ success: true });
}
