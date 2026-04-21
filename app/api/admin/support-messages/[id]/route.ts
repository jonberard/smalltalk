import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupportMessageStatus } from "@/lib/types";

const ALLOWED_STATUSES: SupportMessageStatus[] = ["new", "reviewed", "closed"];

function isSupportMessageStatus(value: string): value is SupportMessageStatus {
  return ALLOWED_STATUSES.includes(value as SupportMessageStatus);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
  };

  if (!body.status || !isSupportMessageStatus(body.status)) {
    return NextResponse.json(
      { error: "Choose a valid support message state." },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("support_messages")
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
