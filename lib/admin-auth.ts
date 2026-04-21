import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminRole, AdminUser } from "@/lib/types";

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function getFounderAdminEmailAllowlist() {
  return (process.env.FOUNDER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function getAdminMembershipForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id, email, role, is_active, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AdminUser | null) ?? null;
}

async function provisionFounderAdmin(user: AuthenticatedUser) {
  if (!user.email) {
    return null;
  }

  const allowlist = getFounderAdminEmailAllowlist();

  if (!allowlist.includes(normalizeEmail(user.email))) {
    return null;
  }

  const row = {
    user_id: user.id,
    email: user.email,
    role: "founder" as AdminRole,
    is_active: true,
  };

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .upsert(row, { onConflict: "user_id" })
    .select("user_id, email, role, is_active, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminUser;
}

export async function getOrProvisionAdminFromRequest(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const existing = await getAdminMembershipForUser(user.id);

  if (existing?.is_active) {
    return {
      ok: true as const,
      user,
      admin: existing,
    };
  }

  if (existing && !existing.is_active) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Founder admin access is inactive for this account." },
        { status: 403 },
      ),
    };
  }

  const provisioned = await provisionFounderAdmin(user);

  if (provisioned) {
    return {
      ok: true as const,
      user,
      admin: provisioned,
    };
  }

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        error: "Founder admin access required.",
        email: user.email,
        hint:
          "Add your email to FOUNDER_ADMIN_EMAILS or insert a row into admin_users for this account.",
      },
      { status: 403 },
    ),
  };
}
