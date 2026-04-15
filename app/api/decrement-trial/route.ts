import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req: NextRequest) {
  // Authenticate the request
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read current value, then atomically decrement only if > 0
  // Use .gte guard so concurrent requests can't overshoot
  const { data: before, error: readErr } = await supabaseAdmin
    .from("businesses")
    .select("trial_requests_remaining")
    .eq("id", user.id)
    .single();

  if (readErr || !before) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (before.trial_requests_remaining <= 0) {
    return NextResponse.json({ remaining: 0, exhausted: true });
  }

  const newVal = before.trial_requests_remaining - 1;

  // Only update if the value hasn't changed (optimistic concurrency)
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("businesses")
    .update({ trial_requests_remaining: newVal })
    .eq("id", user.id)
    .eq("trial_requests_remaining", before.trial_requests_remaining)
    .select("trial_requests_remaining")
    .single();

  if (updateErr || !updated) {
    // Concurrent update beat us — re-read and report current state
    const { data: current } = await supabaseAdmin
      .from("businesses")
      .select("trial_requests_remaining")
      .eq("id", user.id)
      .single();

    const remaining = current?.trial_requests_remaining ?? 0;
    return NextResponse.json({ remaining, exhausted: remaining <= 0 });
  }

  return NextResponse.json({
    remaining: updated.trial_requests_remaining,
    exhausted: updated.trial_requests_remaining <= 0,
  });
}
