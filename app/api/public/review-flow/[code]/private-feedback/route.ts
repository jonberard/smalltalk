import { NextRequest, NextResponse } from "next/server";
import { sendOwnerNotification } from "@/lib/owner-notifications";
import { requirePublicFlowSession } from "@/lib/public-review-flow";
import { supabaseAdmin } from "@/lib/supabase-admin";

type PrivateFeedbackBody = {
  feedback?: string;
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

  let body: PrivateFeedbackBody;

  try {
    body = (await req.json()) as PrivateFeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const feedback =
    typeof body.feedback === "string" ? body.feedback.slice(0, 4000) : "";

  if (!feedback.trim()) {
    return NextResponse.json({ error: "feedback is required" }, { status: 400 });
  }

  const starRating = body.star_rating ?? sessionContext.session.star_rating ?? null;

  if (!starRating || starRating < 1 || starRating > 5) {
    return NextResponse.json({ error: "star_rating must be between 1 and 5" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("review_sessions")
    .update({
      feedback_type: "private",
      optional_text: feedback,
      star_rating: starRating,
      status: "drafted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionContext.session.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sessionContext.session.private_owner_notified_at) {
    const notifyResult = await sendOwnerNotification({
      reviewLinkId: sessionContext.reviewLink.id,
      customerName: sessionContext.reviewLink.customer_name,
      starRating,
      reviewText: feedback,
      isPrivate: true,
    });

    if (notifyResult.success) {
      await supabaseAdmin
        .from("review_sessions")
        .update({ private_owner_notified_at: new Date().toISOString() })
        .eq("id", sessionContext.session.id)
        .is("private_owner_notified_at", null);
    }
  }

  return NextResponse.json({ success: true });
}
