import { NextRequest, NextResponse } from "next/server";
import { generateReview, type GenerateReviewInput } from "@/lib/review-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      star_rating,
      business_name,
      service_type,
      employee_name,
      topics_selected,
      optional_text,
      provider,
      exclude_voice_id,
    } = body as GenerateReviewInput;

    // Validate required fields
    if (!star_rating || !business_name || !service_type || !topics_selected) {
      return NextResponse.json(
        { error: "Missing required fields: star_rating, business_name, service_type, topics_selected" },
        { status: 400 }
      );
    }

    if (star_rating < 1 || star_rating > 5) {
      return NextResponse.json(
        { error: "star_rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!Array.isArray(topics_selected) || topics_selected.length === 0) {
      return NextResponse.json(
        { error: "topics_selected must be a non-empty array" },
        { status: 400 }
      );
    }

    const result = await generateReview({
      star_rating,
      business_name,
      service_type,
      employee_name: employee_name ?? null,
      topics_selected,
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
