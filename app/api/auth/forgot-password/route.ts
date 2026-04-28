import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit";
import { captureServerException } from "@/lib/server-error-reporting";

const FORGOT_PASSWORD_RATE_LIMIT_MAX = 5;
const FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ForgotPasswordBody = {
  email?: string;
};

function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const rateLimit = await consumePublicRateLimit({
      bucket: "auth_forgot_password_ip",
      identifier: clientIp,
      scopeKey: "global",
      maxCount: FORGOT_PASSWORD_RATE_LIMIT_MAX,
      windowSeconds: FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "We’ve already sent a few reset requests from this browser. Please wait a bit, then try again.",
          retry_after_seconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": `${rateLimit.retryAfterSeconds}`,
          },
        },
      );
    }
  } catch (error) {
    captureServerException(error, {
      route: "/api/auth/forgot-password",
      tags: { stage: "rate_limit_lookup" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "We couldn’t start password reset right now. Please try again." },
      { status: 500 },
    );
  }

  let body: ForgotPasswordBody;

  try {
    body = (await req.json()) as ForgotPasswordBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Enter your email above, then try again." },
      { status: 400 },
    );
  }

  const authClient = createAuthClient();
  const { error } = await authClient.auth.resetPasswordForEmail(email);

  if (error) {
    captureServerException(new Error(error.message), {
      route: "/api/auth/forgot-password",
      tags: { stage: "reset_password" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "We couldn’t send that reset link right now. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "We sent you a reset link — check your inbox.",
  });
}
