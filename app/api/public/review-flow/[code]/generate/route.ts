import { NextRequest, NextResponse } from "next/server";
import { AiRoutingError } from "@/lib/ai-routing";
import { generateReview } from "@/lib/review-generator";
import {
  loadPublicReviewContext,
  requirePublicFlowSession,
  type StoredPublicTopicAnswer,
} from "@/lib/public-review-flow";
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit";
import {
  consumeRequestAllowance,
  releaseRequestAllowance,
} from "@/lib/request-allowance";
import { supabaseAdmin } from "@/lib/supabase-admin";

type GenerateBody = {
  star_rating?: number;
  topics_selected?: StoredPublicTopicAnswer[];
  optional_text?: string;
  exclude_voice_id?: string;
};

const MAX_PUBLIC_REGENERATIONS = 3;
const MAX_PUBLIC_GENERATIONS_PER_SESSION = MAX_PUBLIC_REGENERATIONS + 1;

function sanitizeTopics(value: GenerateBody["topics_selected"]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const label =
      typeof item.label === "string" ? item.label.trim().slice(0, 120) : "";

    if (!label) {
      return [];
    }

    return [
      {
        label,
        follow_up_answer:
          typeof item.follow_up_answer === "string"
            ? item.follow_up_answer.slice(0, 120)
            : "",
        detail_text:
          typeof item.detail_text === "string"
            ? item.detail_text.slice(0, 500)
            : undefined,
      },
    ];
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const sessionContext = await requirePublicFlowSession(req, code);

  if (sessionContext.error === "not_found") {
    return NextResponse.json({ error: "Review link not found" }, { status: 404 });
  }

  if (sessionContext.error) {
    return NextResponse.json({ error: "Session expired. Reload the page to continue." }, { status: 401 });
  }

  let body: GenerateBody;

  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.star_rating || body.star_rating < 1 || body.star_rating > 5) {
    return NextResponse.json({ error: "star_rating must be between 1 and 5" }, { status: 400 });
  }

  const sanitizedTopics = sanitizeTopics(body.topics_selected);
  const optionalText =
    typeof body.optional_text === "string" ? body.optional_text.slice(0, 4000) : "";

  if (sanitizedTopics.length === 0 && !optionalText.trim()) {
    return NextResponse.json(
      { error: "Either topics or additional text is required" },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(req);
  const ipLimit = await consumePublicRateLimit({
    bucket: "review_generate_ip",
    identifier: clientIp,
    scopeKey: "global",
    maxCount: 20,
    windowSeconds: 60 * 60,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many review drafts from this browser. Please wait a bit and try again.",
        retry_after_seconds: ipLimit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const linkLimit = await consumePublicRateLimit({
    bucket: "review_generate_link",
    identifier: sessionContext.reviewLink.id,
    scopeKey: "global",
    maxCount: 25,
    windowSeconds: 60 * 60,
  });

  if (!linkLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "This review link has hit its draft limit for now. Please wait a bit and try again.",
        retry_after_seconds: linkLimit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const { data: newCount, error: rpcError } = await supabaseAdmin.rpc(
    "increment_generation_count",
    {
      p_session_id: sessionContext.session.id,
      p_max_count: MAX_PUBLIC_GENERATIONS_PER_SESSION,
    },
  );

  if (rpcError) {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  if (newCount === -1) {
    return NextResponse.json(
      {
        error:
          "You've tried a few versions already. Pick the one that feels closest, or edit it from here.",
      },
      { status: 429 },
    );
  }

  const reviewContext = await loadPublicReviewContext(code);

  if (!reviewContext?.businesses || !reviewContext.services) {
    return NextResponse.json({ error: "Review link not found" }, { status: 404 });
  }

  let consumedAllowance:
    | {
        already_counted?: boolean;
      }
    | null = null;

  if (sessionContext.reviewLink.is_generic) {
    const allowance = await consumeRequestAllowance({
      businessId: sessionContext.reviewLink.business_id,
      source: "shared_public_draft",
      reviewSessionId: sessionContext.session.id,
    });

    if (!allowance.ok) {
      return NextResponse.json(
        {
          error:
            "This review link isn’t taking new drafts right now. Please let the business know and try again soon.",
        },
        { status: 403 },
      );
    }

    consumedAllowance = {
      already_counted: allowance.already_counted,
    };
  }

  try {
    const result = await generateReview({
      star_rating: body.star_rating,
      business_name: reviewContext.businesses.name,
      service_type: reviewContext.services.name,
      employee_name: reviewContext.employees?.name ?? null,
      business_city: reviewContext.businesses.business_city ?? null,
      neighborhood:
        reviewContext.businesses.neighborhoods &&
        reviewContext.businesses.neighborhoods.length > 0
          ? reviewContext.businesses.neighborhoods[
              Math.floor(
                Math.random() * reviewContext.businesses.neighborhoods.length,
              )
            ]
          : null,
      topics_selected: sanitizedTopics,
      optional_text: optionalText || undefined,
      exclude_voice_id: body.exclude_voice_id,
    });

    await supabaseAdmin
      .from("review_sessions")
      .update({
        generated_review: result.review_text,
        voice_id: result.voice_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionContext.session.id);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate review";
    const status = error instanceof AiRoutingError ? error.statusCode : 500;

    if (
      sessionContext.reviewLink.is_generic &&
      consumedAllowance &&
      !consumedAllowance.already_counted
    ) {
      await releaseRequestAllowance({
        businessId: sessionContext.reviewLink.business_id,
        reviewSessionId: sessionContext.session.id,
      });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
