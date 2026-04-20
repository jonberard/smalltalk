import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been retired. Use /api/send-review-request instead." },
    { status: 410 },
  );
}
