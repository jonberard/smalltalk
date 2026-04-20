import "server-only";

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  type PublicFlowSessionCookie,
  readPublicFlowSessionCookie,
} from "@/lib/public-flow-session";
import {
  consumePublicRateLimit,
  getClientIp,
} from "@/lib/public-rate-limit";

export type PublicTopicDef = {
  id: string;
  label: string;
  followUp: string;
  options: string[];
};

export type StoredPublicTopicAnswer = {
  topic_id?: string;
  label: string;
  follow_up_answer: string;
  detail_text?: string;
};

export type PublicReviewData = {
  businessName: string;
  businessInitials: string;
  employeeName: string | null;
  serviceType: string;
  customerName: string;
  googleReviewUrl: string;
  googlePlaceId: string | null;
  businessCity: string | null;
  neighborhoods: string[];
};

export type PublicFlowSessionState = {
  status: string;
  starRating: number | null;
  feedbackType: "public" | "private";
  topicsSelected: StoredPublicTopicAnswer[];
  optionalText: string;
  generatedReview: string;
  voiceId: string | null;
};

export type PublicBootstrapPayload = {
  review: PublicReviewData;
  topics: Record<"positive" | "neutral" | "negative", PublicTopicDef[]>;
  session: PublicFlowSessionState;
  isNewSession: boolean;
};

type ReviewLinkContext = {
  id: string;
  business_id: string;
  customer_name: string;
  is_generic: boolean;
  businesses: {
    name: string;
    logo_url: string | null;
    google_review_url: string | null;
    google_place_id: string | null;
    business_city: string | null;
    neighborhoods: string[] | null;
  } | null;
  services: {
    name: string;
  } | null;
  employees: {
    name: string;
  } | null;
};

type SessionRow = {
  id: string;
  review_link_id: string;
  status: string;
  star_rating: number | null;
  topics_selected: unknown;
  optional_text: string | null;
  generated_review: string | null;
  voice_id: string | null;
  feedback_type: "public" | "private";
  public_owner_notified_at: string | null;
  private_owner_notified_at: string | null;
};

function isCompletedSession(session: SessionRow) {
  return (
    session.status === "copied" ||
    (session.feedback_type === "private" &&
      !!session.optional_text &&
      session.optional_text.trim().length > 0)
  );
}

function getBusinessInitials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function normalizeStoredTopics(value: unknown): StoredPublicTopicAnswer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : "";
    const followUpAnswer =
      typeof candidate.follow_up_answer === "string"
        ? candidate.follow_up_answer
        : "";

    if (!label) {
      return [];
    }

    return [
      {
        topic_id:
          typeof candidate.topic_id === "string"
            ? candidate.topic_id
            : undefined,
        label,
        follow_up_answer: followUpAnswer,
        detail_text:
          typeof candidate.detail_text === "string"
            ? candidate.detail_text
            : undefined,
      },
    ];
  });
}

function buildTopicsByTier(
  rows:
    | Array<{
        id: string;
        label: string;
        tier: "positive" | "neutral" | "negative";
        follow_up_question: string;
        follow_up_options: string[];
      }>
    | null,
) {
  const grouped: Record<"positive" | "neutral" | "negative", PublicTopicDef[]> =
    {
      positive: [],
      neutral: [],
      negative: [],
    };

  for (const row of rows ?? []) {
    grouped[row.tier].push({
      id: row.id,
      label: row.label,
      followUp: row.follow_up_question,
      options: row.follow_up_options,
    });
  }

  return grouped;
}

function toSessionState(session: SessionRow): PublicFlowSessionState {
  return {
    status: session.status,
    starRating: session.star_rating,
    feedbackType: session.feedback_type || "public",
    topicsSelected: normalizeStoredTopics(session.topics_selected),
    optionalText: session.optional_text || "",
    generatedReview: session.generated_review || "",
    voiceId: session.voice_id,
  };
}

async function loadReviewLinkContext(code: string) {
  const { data, error } = await supabaseAdmin
    .from("review_links")
    .select(
      "id, business_id, customer_name, is_generic, businesses!inner(name, logo_url, google_review_url, google_place_id, business_city, neighborhoods), services!inner(name), employees(name)",
    )
    .eq("unique_code", code)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const businessRecord = Array.isArray(data.businesses)
    ? data.businesses[0]
    : data.businesses;
  const serviceRecord = Array.isArray(data.services)
    ? data.services[0]
    : data.services;
  const employeeRecord = Array.isArray(data.employees)
    ? data.employees[0]
    : data.employees;

  return {
    id: data.id,
    business_id: data.business_id,
    customer_name: data.customer_name,
    is_generic: data.is_generic,
    businesses: businessRecord
      ? {
          name: businessRecord.name,
          logo_url: businessRecord.logo_url,
          google_review_url: businessRecord.google_review_url,
          google_place_id: businessRecord.google_place_id,
          business_city: businessRecord.business_city,
          neighborhoods: businessRecord.neighborhoods,
        }
      : null,
    services: serviceRecord
      ? {
          name: serviceRecord.name,
        }
      : null,
    employees: employeeRecord
      ? {
          name: employeeRecord.name,
        }
      : null,
  } satisfies ReviewLinkContext;
}

async function loadTopicRows(businessId: string) {
  const { data: customTopics } = await supabaseAdmin
    .from("topics")
    .select(
      "id, label, tier, follow_up_question, follow_up_options, sort_order",
    )
    .eq("business_id", businessId)
    .order("sort_order");

  if ((customTopics ?? []).length > 0) {
    return customTopics;
  }

  const { data: globalTopics } = await supabaseAdmin
    .from("topics")
    .select(
      "id, label, tier, follow_up_question, follow_up_options, sort_order",
    )
    .is("business_id", null)
    .order("sort_order");

  return globalTopics ?? [];
}

async function loadSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("review_sessions")
    .select(
      "id, review_link_id, status, star_rating, topics_selected, optional_text, generated_review, voice_id, feedback_type, public_owner_notified_at, private_owner_notified_at",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SessionRow;
}

async function createSession(reviewLinkId: string, deviceToken: string) {
  const { data, error } = await supabaseAdmin
    .from("review_sessions")
    .insert({
      review_link_id: reviewLinkId,
      device_token: deviceToken,
    })
    .select(
      "id, review_link_id, status, star_rating, topics_selected, optional_text, generated_review, voice_id, feedback_type, public_owner_notified_at, private_owner_notified_at",
    )
    .single();

  if (error || !data) {
    return null;
  }

  return data as SessionRow;
}

function buildBootstrapPayload(
  reviewLink: ReviewLinkContext,
  topics: Record<"positive" | "neutral" | "negative", PublicTopicDef[]>,
  session: SessionRow,
  isNewSession: boolean,
): PublicBootstrapPayload {
  const businessName = reviewLink.businesses?.name || "";

  return {
    review: {
      businessName,
      businessInitials: getBusinessInitials(businessName),
      employeeName: reviewLink.employees?.name || null,
      serviceType: reviewLink.services?.name || "",
      customerName: reviewLink.customer_name,
      googleReviewUrl: reviewLink.businesses?.google_review_url || "",
      googlePlaceId: reviewLink.businesses?.google_place_id || null,
      businessCity: reviewLink.businesses?.business_city || null,
      neighborhoods: reviewLink.businesses?.neighborhoods || [],
    },
    topics,
    session: toSessionState(session),
    isNewSession,
  };
}

export async function bootstrapPublicReviewFlow(
  req: NextRequest,
  code: string,
): Promise<
  | {
      status: "ok";
      payload: PublicBootstrapPayload;
      cookiePayload: PublicFlowSessionCookie | null;
    }
  | { status: "not_found" }
  | { status: "rate_limited"; retryAfterSeconds: number }
> {
  const reviewLink = await loadReviewLinkContext(code);

  if (!reviewLink || !reviewLink.businesses || !reviewLink.services) {
    return { status: "not_found" };
  }

  const topicRows = await loadTopicRows(reviewLink.business_id);
  const topics = buildTopicsByTier(
    topicRows as Array<{
      id: string;
      label: string;
      tier: "positive" | "neutral" | "negative";
      follow_up_question: string;
      follow_up_options: string[];
    }>,
  );

  const existingCookie = readPublicFlowSessionCookie(req, code);

  if (existingCookie) {
    const session = await loadSession(existingCookie.sessionId);

    const shouldStartFreshGenericSession =
      !!session &&
      session.review_link_id === reviewLink.id &&
      reviewLink.is_generic &&
      isCompletedSession(session);

    if (
      session &&
      session.review_link_id === reviewLink.id &&
      !shouldStartFreshGenericSession
    ) {
      return {
        status: "ok",
        payload: buildBootstrapPayload(reviewLink, topics, session, false),
        cookiePayload: existingCookie,
      };
    }
  }

  const sessionLimit = await consumePublicRateLimit({
    bucket: "session_create_ip_link",
    identifier: getClientIp(req),
    scopeKey: reviewLink.id,
    maxCount: 10,
    windowSeconds: 60 * 60,
  });

  if (!sessionLimit.allowed) {
    return {
      status: "rate_limited",
      retryAfterSeconds: sessionLimit.retryAfterSeconds,
    };
  }

  const cookiePayload: PublicFlowSessionCookie = {
    code,
    sessionId: "",
    deviceToken: randomUUID(),
    issuedAt: Date.now(),
  };

  const session = await createSession(reviewLink.id, cookiePayload.deviceToken);

  if (!session) {
    return { status: "not_found" };
  }

  cookiePayload.sessionId = session.id;

  return {
    status: "ok",
    payload: buildBootstrapPayload(reviewLink, topics, session, true),
    cookiePayload,
  };
}

export async function requirePublicFlowSession(
  req: NextRequest,
  code: string,
) {
  const reviewLink = await loadReviewLinkContext(code);

  if (!reviewLink) {
    return { error: "not_found" as const };
  }

  const cookie = readPublicFlowSessionCookie(req, code);

  if (!cookie) {
    return { error: "unauthorized" as const };
  }

  const session = await loadSession(cookie.sessionId);

  if (!session || session.review_link_id !== reviewLink.id) {
    return { error: "unauthorized" as const };
  }

  return {
    error: null,
    reviewLink,
    session,
    cookie,
  } as const;
}

export async function loadPublicReviewContext(code: string) {
  return loadReviewLinkContext(code);
}
