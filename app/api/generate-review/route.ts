import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been retired. Public review generation now runs through the server-controlled review flow." },
    { status: 410 },
  );
}
