import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been retired. Owner notifications are now handled server-side.",
    },
    { status: 410 },
  );
}
