import { NextRequest, NextResponse } from "next/server";
import { getNextAllowedSendAt, isInQuietHours } from "@/lib/quiet-hours";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendReviewSms } from "@/lib/twilio-send";

type DeliveryRow = {
  id: string;
  review_link_id: string;
  business_id: string;
  kind: "initial" | "reminder_1" | "reminder_2";
  status: "pending" | "sent" | "failed" | "skipped";
  scheduled_for: string;
  claimed_at: string | null;
  attempt_count: number;
  to_address: string;
  normalized_phone: string | null;
  message_body: string | null;
};

type ReviewLinkContext = {
  id: string;
  business_id: string;
  is_generic: boolean;
  reminder_sequence_enabled: boolean | null;
  sequence_completed: boolean | null;
  businesses: {
    name: string;
    reminder_sequence_enabled: boolean | null;
    quiet_hours_start: number | null;
    quiet_hours_end: number | null;
    business_timezone: string | null;
  } | null;
};

function authorize(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret) {
    return { ok: false, response: NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 }) };
  }

  if (authHeader !== `Bearer ${secret}`) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true as const, response: null };
}

async function loadReviewLinkContext(reviewLinkId: string) {
  const { data } = await supabaseAdmin
    .from("review_links")
    .select(
      "id, business_id, is_generic, reminder_sequence_enabled, sequence_completed, businesses(name, reminder_sequence_enabled, quiet_hours_start, quiet_hours_end, business_timezone)",
    )
    .eq("id", reviewLinkId)
    .maybeSingle();

  return (data as ReviewLinkContext | null) ?? null;
}

async function hasOptedOut(normalizedPhone: string, businessId: string) {
  const { data } = await supabaseAdmin
    .from("sms_opt_outs")
    .select("id")
    .eq("phone_number", normalizedPhone)
    .or(`business_id.is.null,business_id.eq.${businessId}`)
    .limit(1);

  return (data ?? []).length > 0;
}

function getQuietHoursConfig(reviewLink: ReviewLinkContext) {
  return {
    start: reviewLink.businesses?.quiet_hours_start ?? 21,
    end: reviewLink.businesses?.quiet_hours_end ?? 9,
    timeZone: reviewLink.businesses?.business_timezone || "America/Chicago",
  };
}

async function evaluateDelivery(delivery: DeliveryRow) {
  const reviewLink = await loadReviewLinkContext(delivery.review_link_id);

  if (!reviewLink || !reviewLink.businesses) {
    return { action: "skip" as const, reason: "missing_link" };
  }

  if (reviewLink.sequence_completed) {
    return { action: "skip" as const, reason: "sequence_completed" };
  }

  if (!(reviewLink.businesses.reminder_sequence_enabled ?? true)) {
    return { action: "skip" as const, reason: "business_disabled" };
  }

  if (!(reviewLink.reminder_sequence_enabled ?? true)) {
    return { action: "skip" as const, reason: "link_disabled" };
  }

  if (reviewLink.is_generic) {
    return { action: "skip" as const, reason: "generic_link" };
  }

  if (!delivery.normalized_phone) {
    return { action: "skip" as const, reason: "invalid_phone" };
  }

  if (await hasOptedOut(delivery.normalized_phone, reviewLink.business_id)) {
    return { action: "skip" as const, reason: "opted_out" };
  }

  try {
    const quietHours = getQuietHoursConfig(reviewLink);
    const now = new Date();

    if (isInQuietHours(now, quietHours.timeZone, quietHours.start, quietHours.end)) {
      return {
        action: "reschedule" as const,
        nextScheduledFor: getNextAllowedSendAt(
          now,
          quietHours.timeZone,
          quietHours.start,
          quietHours.end,
        ).toISOString(),
      };
    }
  } catch {
    // Fall through and attempt the send if timezone data is invalid.
  }

  if (!delivery.message_body) {
    return { action: "skip" as const, reason: "missing_message_body" };
  }

  return { action: "send" as const, reviewLink };
}

export async function GET(req: NextRequest) {
  const auth = authorize(req);

  if (!auth.ok) {
    return auth.response;
  }

  const isDryRun = req.nextUrl.searchParams.get("test") === "true";
  const nowIso = new Date().toISOString();
  const staleClaimThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  if (isDryRun) {
    const { data: dueDeliveries } = await supabaseAdmin
      .from("review_message_deliveries")
      .select("id, review_link_id, business_id, kind, status, scheduled_for, claimed_at, attempt_count, to_address, normalized_phone, message_body")
      .in("kind", ["reminder_1", "reminder_2"])
      .eq("status", "pending")
      .lte("scheduled_for", nowIso)
      .lt("attempt_count", 3)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    const candidates = (dueDeliveries ?? []).filter((delivery) => {
      if (!delivery.claimed_at) {
        return true;
      }

      return new Date(delivery.claimed_at).getTime() < new Date(staleClaimThreshold).getTime();
    }) as DeliveryRow[];

    const results = await Promise.all(
      candidates.map(async (delivery) => {
        const evaluation = await evaluateDelivery(delivery);
        return {
          id: delivery.id,
          kind: delivery.kind,
          to: delivery.to_address,
          ...evaluation,
        };
      }),
    );

    return NextResponse.json({ dry_run: true, count: results.length, results });
  }

  const { data: claimedDeliveries, error: claimError } = await supabaseAdmin.rpc(
    "claim_due_reminder_deliveries",
    { p_limit: 50 },
  );

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  const deliveries = (claimedDeliveries ?? []) as DeliveryRow[];
  const results: Array<Record<string, string | number | boolean | null>> = [];

  for (const delivery of deliveries) {
    const evaluation = await evaluateDelivery(delivery);

    if (evaluation.action === "skip") {
      await supabaseAdmin
        .from("review_message_deliveries")
        .update({
          status: "skipped",
          skipped_reason: evaluation.reason,
          claimed_at: null,
        })
        .eq("id", delivery.id);

      results.push({
        id: delivery.id,
        kind: delivery.kind,
        status: "skipped",
        reason: evaluation.reason,
      });
      continue;
    }

    if (evaluation.action === "reschedule") {
      await supabaseAdmin
        .from("review_message_deliveries")
        .update({
          claimed_at: null,
          scheduled_for: evaluation.nextScheduledFor,
        })
        .eq("id", delivery.id);

      results.push({
        id: delivery.id,
        kind: delivery.kind,
        status: "rescheduled",
        scheduled_for: evaluation.nextScheduledFor,
      });
      continue;
    }

    const sendResult = await sendReviewSms({
      to: delivery.normalized_phone ?? delivery.to_address,
      body: delivery.message_body!,
      businessId: evaluation.reviewLink.business_id,
    });

    const nextAttemptCount = delivery.attempt_count + (sendResult.attemptedSend ? 1 : 0);

    if (sendResult.success) {
      await supabaseAdmin
        .from("review_message_deliveries")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_sid: sendResult.providerSid ?? null,
          attempt_count: nextAttemptCount,
          claimed_at: null,
          last_error: null,
          skipped_reason: null,
        })
        .eq("id", delivery.id);

      results.push({
        id: delivery.id,
        kind: delivery.kind,
        status: "sent",
        attempt_count: nextAttemptCount,
      });
      continue;
    }

    if (sendResult.skippedReason) {
      await supabaseAdmin
        .from("review_message_deliveries")
        .update({
          status: "skipped",
          skipped_reason: sendResult.skippedReason,
          last_error: sendResult.error ?? null,
          attempt_count: nextAttemptCount,
          claimed_at: null,
        })
        .eq("id", delivery.id);

      results.push({
        id: delivery.id,
        kind: delivery.kind,
        status: "skipped",
        reason: sendResult.skippedReason,
        attempt_count: nextAttemptCount,
      });
      continue;
    }

    const shouldFail = nextAttemptCount >= 3;

    await supabaseAdmin
      .from("review_message_deliveries")
      .update({
        status: shouldFail ? "failed" : "pending",
        last_error: sendResult.error ?? "Failed to send SMS reminder",
        attempt_count: nextAttemptCount,
        claimed_at: null,
      })
      .eq("id", delivery.id);

    results.push({
      id: delivery.id,
      kind: delivery.kind,
      status: shouldFail ? "failed" : "pending",
      attempt_count: nextAttemptCount,
      error: sendResult.error ?? "Failed to send SMS reminder",
    });
  }

  return NextResponse.json({
    dry_run: false,
    claimed: deliveries.length,
    processed: results.length,
    results,
  });
}
