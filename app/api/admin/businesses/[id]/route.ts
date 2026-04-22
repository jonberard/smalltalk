import { NextRequest, NextResponse } from "next/server";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { getAdminBusinessDetail } from "@/lib/admin-data";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminBusinessFollowUpStatus } from "@/lib/types";

const FOLLOW_UP_STATUSES: AdminBusinessFollowUpStatus[] = [
  "none",
  "watching",
  "follow_up",
  "blocked",
  "resolved",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const detail = await getAdminBusinessDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load business detail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  if (auth.admin.role !== "founder") {
    return NextResponse.json(
      { error: "Founder access required to update founder notes." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    note?: string;
    followUpStatus?: AdminBusinessFollowUpStatus;
    reminderDueAt?: string | null;
  };

  const followUpStatus = body.followUpStatus ?? "none";

  if (!FOLLOW_UP_STATUSES.includes(followUpStatus)) {
    return NextResponse.json({ error: "Invalid follow-up status." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";
  const reminderDueAt =
    body.reminderDueAt && body.reminderDueAt.trim().length > 0
      ? body.reminderDueAt
      : null;

  if (note.length > 4000) {
    return NextResponse.json(
      { error: "Founder notes should stay under 4000 characters." },
      { status: 400 },
    );
  }

  if (reminderDueAt && Number.isNaN(new Date(reminderDueAt).getTime())) {
    return NextResponse.json({ error: "Invalid reminder date." }, { status: 400 });
  }

  const row = {
    business_id: id,
    follow_up_status: followUpStatus,
    note: note.length > 0 ? note : null,
    reminder_due_at: reminderDueAt,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("admin_business_notes")
      .upsert(row, { onConflict: "business_id" });

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAdminBusinessDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update founder notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
