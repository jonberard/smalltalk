import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  } = await supabase.auth.getUser(authHeader);

  return user?.id ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const userId = await getAuthenticatedUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("review_sessions")
    .select("id, feedback_type, review_links!inner(business_id)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const reviewLink = Array.isArray(session.review_links)
    ? session.review_links[0]
    : session.review_links;

  if (!reviewLink || reviewLink.business_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.feedback_type !== "private") {
    return NextResponse.json(
      { error: "Only private feedback can be marked handled." },
      { status: 400 },
    );
  }

  const handledAt = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("review_sessions")
    .update({
      private_feedback_status: "handled",
      private_feedback_handled_at: handledAt,
      updated_at: handledAt,
    })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    private_feedback_status: "handled",
    private_feedback_handled_at: handledAt,
  });
}
