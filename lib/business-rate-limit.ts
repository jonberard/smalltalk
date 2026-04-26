import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

type ConsumeBusinessRateLimitInput = {
  businessId: string;
  bucket: string;
  scopeKey?: string;
  maxCount: number;
  windowSeconds: number;
};

type ConsumeBusinessRateLimitResult = {
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
};

export async function consumeBusinessRateLimit({
  businessId,
  bucket,
  scopeKey = "global",
  maxCount,
  windowSeconds,
}: ConsumeBusinessRateLimitInput): Promise<ConsumeBusinessRateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("consume_business_rate_limit", {
    p_business_id: businessId,
    p_bucket: bucket,
    p_scope_key: scopeKey,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(`Failed to consume business rate limit: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: !!row?.allowed,
    currentCount: Number(row?.current_count ?? 0),
    retryAfterSeconds: Number(row?.retry_after_seconds ?? 0),
  };
}
