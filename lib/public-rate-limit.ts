import "server-only";

import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ConsumeRateLimitInput = {
  bucket: string;
  identifier: string;
  scopeKey?: string;
  maxCount: number;
  windowSeconds: number;
};

type ConsumeRateLimitResult = {
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
};

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function consumePublicRateLimit({
  bucket,
  identifier,
  scopeKey = "global",
  maxCount,
  windowSeconds,
}: ConsumeRateLimitInput): Promise<ConsumeRateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("consume_public_rate_limit", {
    p_bucket: bucket,
    p_identifier: identifier,
    p_scope_key: scopeKey,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(`Failed to consume rate limit: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: !!row?.allowed,
    currentCount: Number(row?.current_count ?? 0),
    retryAfterSeconds: Number(row?.retry_after_seconds ?? 0),
  };
}
