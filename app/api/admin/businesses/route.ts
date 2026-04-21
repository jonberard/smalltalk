import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { listAdminBusinessSummaries } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const businesses = await listAdminBusinessSummaries();
    return NextResponse.json({ businesses });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load businesses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
