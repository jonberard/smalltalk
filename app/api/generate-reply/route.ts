import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReply, type GenerateReplyInput } from "@/lib/reply-generator";

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
      businessName,
      reviewText,
      starRating,
      employeeName,
      serviceType,
      topicsSelected,
      replyVoiceId,
      customReplyVoice,
      reviewSource,
    } = body as GenerateReplyInput;

    if (!businessName || !starRating || !replyVoiceId || !reviewSource) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
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
