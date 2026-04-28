import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { captureServerException } from "@/lib/server-error-reporting";
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";

const RECOVER_BUSINESS_RATE_LIMIT_MAX = 5;
const RECOVER_BUSINESS_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const RECOVER_BUSINESS_LIMIT_ERROR =
  "We’ve already tried a few times from this browser. Please wait a bit, then try again.";
const RECOVER_BUSINESS_GENERIC_ERROR =
  "We couldn’t rebuild your business profile right now. Please try again in a moment.";

function deriveBusinessName(email: string | null | undefined, metadata: unknown) {
  const metadataRecord =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : null;
  const metadataName =
    typeof metadataRecord?.business_name === "string"
      ? metadataRecord.business_name.trim()
      : "";

  if (metadataName) {
    return metadataName;
  }

  const localPart = email?.split("@")[0]?.trim() || "";

  if (!localPart) {
    return "My Business";
  }

  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function seedDefaultTopicsIfMissing(businessId: string) {
  const { data: defaultTopics, error: defaultTopicsError } = await supabaseAdmin
    .from("topics")
    .select("label, tier, follow_up_question, follow_up_options, sort_order")
    .is("business_id", null);

  if (defaultTopicsError) {
    captureServerException(new Error(defaultTopicsError.message), {
      route: "/api/auth/recover-business",
      tags: { business_id: businessId, stage: "load_default_topics" },
    });
    return { success: false };
  }

  if (!defaultTopics || defaultTopics.length === 0) {
    return { success: true };
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
    captureServerException(new Error(insertTopicsError.message), {
      route: "/api/auth/recover-business",
      tags: { business_id: businessId, stage: "seed_default_topics" },
    });
    return { success: false };
  }

  return { success: true };
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  let recoveryLimit;

  try {
    recoveryLimit = await consumePublicRateLimit({
      bucket: "auth_recover_business_ip",
      identifier: clientIp,
      scopeKey: "global",
      maxCount: RECOVER_BUSINESS_RATE_LIMIT_MAX,
      windowSeconds: RECOVER_BUSINESS_RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/auth/recover-business",
      tags: { stage: "rate_limit_lookup" },
      extras: { client_ip: clientIp },
    });

    return NextResponse.json(
      { error: "We couldn’t verify your account recovery right now. Please try again." },
      { status: 500 },
    );
  }

  if (!recoveryLimit.allowed) {
    return NextResponse.json(
      {
        error: RECOVER_BUSINESS_LIMIT_ERROR,
        retry_after_seconds: recoveryLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": `${recoveryLimit.retryAfterSeconds}`,
        },
      },
    );
  }

  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingBusiness, error: existingBusinessError } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingBusinessError) {
    captureServerException(new Error(existingBusinessError.message), {
      route: "/api/auth/recover-business",
      tags: { business_id: user.id, stage: "load_existing_business" },
    });
    return NextResponse.json(
      { error: RECOVER_BUSINESS_GENERIC_ERROR },
      { status: 500 },
    );
  }

  let recovered = false;

  if (!existingBusiness) {
    const trialEndsAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: insertBusinessError } = await supabaseAdmin
      .from("businesses")
      .upsert({
        id: user.id,
        name: deriveBusinessName(user.email, user.user_metadata),
        owner_email: user.email ?? null,
        // Google connection happens during onboarding, so start blank.
        google_review_url: "",
        subscription_status: "trial",
        trial_ends_at: trialEndsAt,
        trial_requests_remaining: 10,
        onboarding_completed: false,
      }, {
        onConflict: "id",
        ignoreDuplicates: true,
      });

    if (insertBusinessError) {
      captureServerException(new Error(insertBusinessError.message), {
        route: "/api/auth/recover-business",
        tags: { business_id: user.id, stage: "upsert_business" },
      });
      return NextResponse.json(
        { error: RECOVER_BUSINESS_GENERIC_ERROR },
        { status: 500 },
      );
    }

    recovered = true;
  }

  const topicSeedResult = await seedDefaultTopicsIfMissing(user.id);

  if (!topicSeedResult.success) {
    return NextResponse.json(
      { error: RECOVER_BUSINESS_GENERIC_ERROR },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, recovered });
}
