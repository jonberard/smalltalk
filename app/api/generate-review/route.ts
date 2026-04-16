import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReview, type GenerateReviewInput } from "@/lib/review-generator";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      session_id,
      star_rating,
      business_name,
      service_type,
      employee_name,
      business_city,
      neighborhood,
      topics_selected,
      optional_text,
      provider,
      exclude_voice_id,
    } = body as GenerateReviewInput & { session_id?: string };

    // Validate session_id exists in the database to prevent abuse
    if (!session_id) {
      return NextResponse.json(
        { error: "Missing required field: session_id" },
        { status: 400 }
      );
    }

    // Atomically increment generation count (cap at 5)
    const { data: newCount, error: rpcErr } = await supabaseAdmin
      .rpc("increment_generation_count", { p_session_id: session_id, p_max_count: 5 });

    if (rpcErr) {
      // RPC error likely means session doesn't exist
      return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    if (newCount === -1) {
      return NextResponse.json(
        { error: "You've reached the limit for this review. Please use your current draft or start fresh." },
        { status: 429 },
      );
    }

    // Validate required fields
    if (!star_rating || !business_name || !service_type) {
      return NextResponse.json(
        { error: "Missing required fields: star_rating, business_name, service_type" },
        { status: 400 }
      );
    }

    if (star_rating < 1 || star_rating > 5) {
      return NextResponse.json(
        { error: "star_rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Topics can be empty when voice transcript (optional_text) is provided
    const hasTopics = Array.isArray(topics_selected) && topics_selected.length > 0;
    if (!hasTopics && !optional_text) {
      return NextResponse.json(
        { error: "Either topics or additional text is required" },
        { status: 400 }
      );
    }

    const result = await generateReview({
      star_rating,
      business_name,
      service_type,
      employee_name: employee_name ?? null,
      business_city: business_city ?? null,
      neighborhood: neighborhood ?? null,
      topics_selected: Array.isArray(topics_selected) ? topics_selected : [],
      optional_text,
      provider,
      exclude_voice_id,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate review";

    const status = message.includes("not implemented") ? 501 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
