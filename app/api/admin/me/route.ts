import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const result = await getOrProvisionAdminFromRequest(req);

  if (!result.ok) {
    return result.response;
  }

  return NextResponse.json({
    admin: result.admin,
    user: {
      id: result.user.id,
      email: result.user.email,
    },
  });
}
