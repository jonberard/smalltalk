import { NextRequest, NextResponse } from "next/server";
import { sendOwnerNotification } from "@/lib/owner-notifications";
import { requirePublicFlowSession } from "@/lib/public-review-flow";
import { normalizePhone } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase-admin";

type PrivateFeedbackBody = {
  feedback?: string;
  star_rating?: number;
  customer_contact?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptionalCustomerContact(rawValue: string | undefined) {
  const trimmed = rawValue?.trim() ?? "";

  if (!trimmed) {
    return { value: null as string | null };
  }

  const normalizedPhone = normalizePhone(trimmed);
  if (normalizedPhone) {
    return { value: normalizedPhone };
  }

  const normalizedEmail = trimmed.toLowerCase();
  if (EMAIL_REGEX.test(normalizedEmail)) {
    return { value: normalizedEmail };
  }

  return {
    value: null as string | null,
    error: "Enter a valid email or phone number, or leave it blank.",
  };
}

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

  const normalizedCustomerContact = normalizeOptionalCustomerContact(
    body.customer_contact,
  );

  if (normalizedCustomerContact.error) {
    return NextResponse.json(
      { error: normalizedCustomerContact.error },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("review_sessions")
    .update({
      feedback_type: "private",
      private_feedback_status: "new",
      private_feedback_handled_at: null,
      customer_contact: normalizedCustomerContact.value,
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
      sessionId: sessionContext.session.id,
      reviewLinkId: sessionContext.reviewLink.id,
      customerName: sessionContext.reviewLink.customer_name,
      customerContact:
        normalizedCustomerContact.value ??
        sessionContext.reviewLink.customer_contact ??
        null,
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

  return NextResponse.json({
    success: true,
    customer_contact:
      normalizedCustomerContact.value ??
      sessionContext.reviewLink.customer_contact ??
      null,
  });
}
