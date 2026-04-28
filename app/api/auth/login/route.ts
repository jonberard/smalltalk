import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit";
import { captureServerException } from "@/lib/server-error-reporting";

const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

type LoginBody = {
  email?: string;
  password?: string;
};

function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function sanitizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function sanitizePassword(value: string | undefined) {
  return value?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const rateLimit = await consumePublicRateLimit({
      bucket: "auth_login_ip",
      identifier: clientIp,
      scopeKey: "global",
      maxCount: LOGIN_RATE_LIMIT_MAX,
      windowSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "We’ve seen a few sign-in attempts from this browser already. Please wait a bit, then try again.",
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
      route: "/api/auth/login",
      tags: { stage: "rate_limit_lookup" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "We couldn’t verify sign-in right now. Please try again." },
      { status: 500 },
    );
  }

  let body: LoginBody;

  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = sanitizeEmail(body.email);
  const password = sanitizePassword(body.password);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter both your email and password." },
      { status: 400 },
    );
  }

  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return NextResponse.json(
        { error: "That email and password don’t match. Try again?" },
        { status: 401 },
      );
    }

    if (error.message === "Email not confirmed") {
      return NextResponse.json(
        {
          error:
            "Check your inbox — you need to confirm your email before signing in.",
        },
        { status: 403 },
      );
    }

    captureServerException(new Error(error.message), {
      route: "/api/auth/login",
      tags: { stage: "sign_in" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  if (!data.session) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
}
