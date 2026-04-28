import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit";
import { captureServerException } from "@/lib/server-error-reporting";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SIGNUP_RATE_LIMIT_MAX = 5;
const SIGNUP_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignupBody = {
  email?: string;
  password?: string;
  business_name?: string;
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

function sanitizeBusinessName(value: string | undefined) {
  return value?.trim() ?? "";
}

async function seedDefaultTopicsForBusiness(businessId: string) {
  const { data: defaultTopics, error: defaultTopicsError } = await supabaseAdmin
    .from("topics")
    .select("label, tier, follow_up_question, follow_up_options, sort_order")
    .is("business_id", null);

  if (defaultTopicsError) {
    throw new Error(defaultTopicsError.message);
  }

  if (!defaultTopics || defaultTopics.length === 0) {
    return;
  }

  const seededTopics = defaultTopics.map((topic) => ({
    business_id: businessId,
    label: topic.label,
    tier: topic.tier,
    follow_up_question: topic.follow_up_question,
    follow_up_options: topic.follow_up_options,
    sort_order: topic.sort_order,
  }));

  const { error: insertTopicsError } = await supabaseAdmin
    .from("topics")
    .upsert(seededTopics, {
      onConflict: "business_id,label,tier",
      ignoreDuplicates: true,
    });

  if (insertTopicsError) {
    throw new Error(insertTopicsError.message);
  }
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const rateLimit = await consumePublicRateLimit({
      bucket: "auth_signup_ip",
      identifier: clientIp,
      scopeKey: "global",
      maxCount: SIGNUP_RATE_LIMIT_MAX,
      windowSeconds: SIGNUP_RATE_LIMIT_WINDOW_SECONDS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "We’ve seen a few sign-up attempts from this browser already. Please wait a bit, then try again.",
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
      route: "/api/auth/signup",
      tags: { stage: "rate_limit_lookup" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "We couldn’t verify sign-up right now. Please try again." },
      { status: 500 },
    );
  }

  let body: SignupBody;

  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = sanitizeEmail(body.email);
  const password = sanitizePassword(body.password);
  const businessName = sanitizeBusinessName(body.business_name);

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Use at least 8 characters for your password." },
      { status: 400 },
    );
  }

  if (!businessName) {
    return NextResponse.json(
      { error: "Enter your business name to keep going." },
      { status: 400 },
    );
  }

  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        business_name: businessName,
      },
    },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      return NextResponse.json(
        { error: "That email is already taken. Try signing in instead?" },
        { status: 409 },
      );
    }

    if (error.message.includes("Password should be at least")) {
      return NextResponse.json(
        { error: "Use at least 8 characters for your password." },
        { status: 400 },
      );
    }

    captureServerException(new Error(error.message), {
      route: "/api/auth/signup",
      tags: { stage: "sign_up" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  const userId = data.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  try {
    const trialEndsAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: businessError } = await supabaseAdmin
      .from("businesses")
      .upsert(
        {
          id: userId,
          name: businessName,
          owner_email: email,
          google_review_url: "",
          subscription_status: "trial",
          trial_ends_at: trialEndsAt,
          trial_requests_remaining: 10,
          onboarding_completed: false,
        },
        {
          onConflict: "id",
          ignoreDuplicates: true,
        },
      );

    if (businessError) {
      throw new Error(businessError.message);
    }

    await seedDefaultTopicsForBusiness(userId);
  } catch (setupError) {
    captureServerException(setupError, {
      route: "/api/auth/signup",
      tags: { stage: "provision_business", business_id: userId },
      extras: {
        has_session: Boolean(data.session),
      },
    });

    if (!data.session) {
      return NextResponse.json({
        success: true,
        requires_email_verification: true,
        needs_recovery: true,
        user_id: userId,
        message:
          "Check your email to verify your account. When you sign in, we’ll finish setting everything up.",
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      user_id: userId,
      next_path: "/dashboard",
      needs_recovery: true,
    });
  }

  if (!data.session) {
    return NextResponse.json({
      success: true,
      requires_email_verification: true,
      user_id: userId,
      message:
        "Check your email to verify your account, then sign in to continue.",
    });
  }

  return NextResponse.json({
    success: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
    user_id: userId,
    next_path: "/onboarding",
  });
}
