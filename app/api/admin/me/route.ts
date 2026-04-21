import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { countNewSupportMessages } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  const result = await getOrProvisionAdminFromRequest(req);

  if (!result.ok) {
    return result.response;
  }

  const newSupportMessages = await countNewSupportMessages().catch(() => 0);

  return NextResponse.json({
    admin: result.admin,
    user: {
      id: result.user.id,
      email: result.user.email,
    },
    counts: {
      newSupportMessages,
    },
  });
}
