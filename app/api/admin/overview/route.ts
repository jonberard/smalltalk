import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { getAdminOverviewData } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const overview = await getAdminOverviewData();
    return NextResponse.json(overview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load founder overview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
