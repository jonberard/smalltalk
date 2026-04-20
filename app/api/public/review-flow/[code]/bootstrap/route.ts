import { NextRequest, NextResponse } from "next/server";
import { bootstrapPublicReviewFlow } from "@/lib/public-review-flow";
import { setPublicFlowSessionCookie } from "@/lib/public-flow-session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const result = await bootstrapPublicReviewFlow(req, code);

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Review link not found" }, { status: 404 });
  }

  if (result.status === "rate_limited") {
    return NextResponse.json(
      {
        error:
          "Too many attempts from this browser. Please wait a bit and try again.",
        retry_after_seconds: result.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const response = NextResponse.json(result.payload);

  if (result.cookiePayload) {
    setPublicFlowSessionCookie(response, result.cookiePayload);
  }

  return response;
}
