import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReply, type GenerateReplyInput } from "@/lib/reply-generator";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      sessionId,
      businessName,
      reviewText,
      starRating,
      employeeName,
      serviceType,
      topicsSelected,
      replyVoiceId,
      customReplyVoice,
      reviewSource,
    } = body as GenerateReplyInput & { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!businessName || !starRating || !replyVoiceId || !reviewSource) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Ownership check: verify the session belongs to the user's business
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from("review_sessions")
      .select("id, review_links!inner(business_id)")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const link = session.review_links as unknown as { business_id: string };
    if (link.business_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to reply to this review" }, { status: 403 });
    }

    // Atomically increment reply generation count (cap at 5)
    const { data: newCount, error: rpcErr } = await supabaseAdmin
      .rpc("increment_reply_generation_count", { p_session_id: sessionId, p_max_count: 5 });

    if (rpcErr) {
      return NextResponse.json({ error: "Failed to validate generation limit" }, { status: 500 });
    }

    if (newCount === -1) {
      return NextResponse.json(
        { error: "You've reached the reply generation limit for this review." },
        { status: 429 },
      );
    }

    const result = await generateReply({
      businessName,
      reviewText: reviewText || "",
      starRating,
      employeeName,
      serviceType,
      topicsSelected,
      replyVoiceId,
      customReplyVoice,
      reviewSource,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
