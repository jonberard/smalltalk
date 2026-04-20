import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "st_public_review_session_";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type PublicFlowSessionCookie = {
  code: string;
  sessionId: string;
  deviceToken: string;
  issuedAt: number;
};

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSigningSecret() {
  return process.env.PUBLIC_FLOW_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function getPublicFlowCookieName(code: string) {
  return `${COOKIE_PREFIX}${code}`;
}

export function createPublicFlowSessionCookieValue(
  payload: PublicFlowSessionCookie,
) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readPublicFlowSessionCookie(
  req: NextRequest,
  code: string,
): PublicFlowSessionCookie | null {
  const raw = req.cookies.get(getPublicFlowCookieName(code))?.value;

  if (!raw) {
    return null;
  }

  const [encodedPayload, signature] = raw.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as PublicFlowSessionCookie;

    if (
      payload.code !== code ||
      !payload.sessionId ||
      !payload.deviceToken ||
      typeof payload.issuedAt !== "number"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setPublicFlowSessionCookie(
  res: NextResponse,
  payload: PublicFlowSessionCookie,
) {
  res.cookies.set({
    name: getPublicFlowCookieName(payload.code),
    value: createPublicFlowSessionCookieValue(payload),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearPublicFlowSessionCookie(
  res: NextResponse,
  code: string,
) {
  res.cookies.set({
    name: getPublicFlowCookieName(code),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}
