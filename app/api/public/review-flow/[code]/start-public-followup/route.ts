import { NextRequest, NextResponse } from "next/server";
import { setPublicFlowSessionCookie } from "@/lib/public-flow-session";
import { startPublicFollowupSession } from "@/lib/public-review-flow";

type StartPublicFollowupBody = {
  source_session_id?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  let body: StartPublicFollowupBody = {};

  try {
    body = (await req.json()) as StartPublicFollowupBody;
  } catch {
    body = {};
  }

  const result = await startPublicFollowupSession(
    req,
    code,
    body.source_session_id,
  );

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Review link not found" }, { status: 404 });
  }

  if (result.status === "invalid_source") {
    return NextResponse.json(
      { error: "We couldn't reopen this request for public posting." },
      { status: 400 },
    );
  }

  const response = NextResponse.json(result.payload);
  setPublicFlowSessionCookie(response, result.cookiePayload);
  return response;
}
