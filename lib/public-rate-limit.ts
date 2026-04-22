import "server-only";

import { isIP } from "node:net";
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

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("[")) {
    const closingIndex = trimmed.indexOf("]");
    if (closingIndex > 1) {
      return trimmed.slice(1, closingIndex);
    }
  }

  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  return trimmed;
}

function findValidIpInHeader(
  value: string | null,
  direction: "first" | "last" = "first",
) {
  if (!value) {
    return null;
  }

  const candidates = value
    .split(",")
    .map(normalizeIpCandidate)
    .filter((candidate): candidate is string => !!candidate);

  const values = direction === "last" ? [...candidates].reverse() : candidates;

  return values.find((candidate) => isIP(candidate)) ?? null;
}

export function getClientIp(req: NextRequest) {
  return (
    findValidIpInHeader(req.headers.get("x-vercel-forwarded-for")) ||
    findValidIpInHeader(req.headers.get("cf-connecting-ip")) ||
    findValidIpInHeader(req.headers.get("x-real-ip")) ||
    findValidIpInHeader(req.headers.get("x-forwarded-for"), "last") ||
    "unknown"
  );
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
