import { NextRequest, NextResponse } from "next/server";
import { requirePublicFlowSession } from "@/lib/public-review-flow";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProgressBody = {
  star_rating?: number;
  feedback_type?: "public" | "private";
  topics_selected?: Array<{
    topic_id?: string;
    label: string;
    follow_up_answer?: string;
    detail_text?: string;
  }>;
  optional_text?: string | null;
  status?: "created" | "in_progress";
};

function sanitizeTopics(value: ProgressBody["topics_selected"]) {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const label =
      typeof item.label === "string" ? item.label.trim().slice(0, 120) : "";

    if (!label) {
      return [];
    }

    return [
      {
        topic_id:
          typeof item.topic_id === "string" ? item.topic_id : undefined,
        label,
        follow_up_answer:
          typeof item.follow_up_answer === "string"
            ? item.follow_up_answer.slice(0, 120)
            : "",
        detail_text:
          typeof item.detail_text === "string"
            ? item.detail_text.slice(0, 500)
            : undefined,
      },
    ];
  });
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

  let body: ProgressBody;

  try {
    body = (await req.json()) as ProgressBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.star_rating === "number") {
    if (body.star_rating < 1 || body.star_rating > 5) {
      return NextResponse.json({ error: "star_rating must be between 1 and 5" }, { status: 400 });
    }
    update.star_rating = body.star_rating;
  }

  if (body.feedback_type) {
    if (body.feedback_type !== "public" && body.feedback_type !== "private") {
      return NextResponse.json({ error: "Invalid feedback_type" }, { status: 400 });
    }
    update.feedback_type = body.feedback_type;
  }

  if (body.status) {
    if (!["created", "in_progress"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status for progress update" }, { status: 400 });
    }
    update.status = body.status;
  }

  if (Object.prototype.hasOwnProperty.call(body, "topics_selected")) {
    if (!Array.isArray(body.topics_selected)) {
      return NextResponse.json(
        { error: "topics_selected must be an array" },
        { status: 400 },
      );
    }

    update.topics_selected = sanitizeTopics(body.topics_selected);
  }

  if (Object.prototype.hasOwnProperty.call(body, "optional_text")) {
    const effectiveFeedbackType =
      (typeof update.feedback_type === "string" ? update.feedback_type : null) ||
      sessionContext.session.feedback_type;

    if (effectiveFeedbackType === "private") {
      return NextResponse.json(
        { error: "Private feedback must be submitted through the final feedback step." },
        { status: 400 },
      );
    }

    update.optional_text =
      typeof body.optional_text === "string" ? body.optional_text.slice(0, 4000) : null;
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("review_sessions")
    .update(update)
    .eq("id", sessionContext.session.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
