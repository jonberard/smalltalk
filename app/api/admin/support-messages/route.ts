import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { listAdminSupportMessages } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const messages = await listAdminSupportMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load support messages.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
