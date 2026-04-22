import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type ReviewRequestBusiness = {
  id: string;
  name: string;
  subscription_status: string;
  trial_requests_remaining: number;
  trial_ends_at: string | null;
  reminder_sequence_enabled: boolean | null;
  review_request_sms_template: string | null;
  review_request_email_subject_template: string | null;
  review_request_email_intro_template: string | null;
};

export const REVIEW_REQUEST_BUSINESS_SELECT =
  "id, name, subscription_status, trial_requests_remaining, trial_ends_at, reminder_sequence_enabled, review_request_sms_template, review_request_email_subject_template, review_request_email_intro_template";

export function isBusinessAllowedToCreateReviewRequest(
  business: ReviewRequestBusiness,
) {
  if (
    business.subscription_status === "active" ||
    business.subscription_status === "trialing"
  ) {
    return true;
  }

  if (business.subscription_status !== "trial") {
    return false;
  }

  const trialActive =
    !business.trial_ends_at ||
    new Date(business.trial_ends_at) > new Date();

  return trialActive && business.trial_requests_remaining > 0;
}

export async function loadReviewRequestBusinessById(businessId: string) {
  return supabaseAdmin
    .from("businesses")
    .select(REVIEW_REQUEST_BUSINESS_SELECT)
    .eq("id", businessId)
    .single();
}

export async function decrementTrialIfNeeded(
  business: ReviewRequestBusiness,
) {
  if (business.subscription_status !== "trial") {
    return business.trial_requests_remaining;
  }

  const nextRemaining = Math.max(0, business.trial_requests_remaining - 1);

  const { data: updated } = await supabaseAdmin
    .from("businesses")
    .update({ trial_requests_remaining: nextRemaining })
    .eq("id", business.id)
    .eq("trial_requests_remaining", business.trial_requests_remaining)
    .select("trial_requests_remaining")
    .single();

  if (updated) {
    return updated.trial_requests_remaining;
  }

  const { data: current } = await supabaseAdmin
    .from("businesses")
    .select("trial_requests_remaining")
    .eq("id", business.id)
    .single();

  return current?.trial_requests_remaining ?? nextRemaining;
}
