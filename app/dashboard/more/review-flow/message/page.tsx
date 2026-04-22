"use client";

import { useAuth } from "@/lib/auth-context";
import { ReviewRequestMessagingSection } from "@/components/dashboard/setup-sections";
import { SetupPageShell } from "@/components/dashboard/setup-shell";

export default function ReviewFlowMessagePage() {
  const { business } = useAuth();

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Review Flow / Request Message"
      title="Make the ask sound like you."
      description="This is the text customers receive before they enter the guided review flow. You can personalize the message without breaking the link or compliance language."
      backHref="/dashboard/more/review-flow"
      backLabel="Back to review flow"
      headerTone="detail"
    >
      <ReviewRequestMessagingSection
        businessId={business.id}
        businessName={business.name}
        initialSmsTemplate={business.review_request_sms_template}
        initialEmailSubjectTemplate={business.review_request_email_subject_template}
        initialEmailIntroTemplate={business.review_request_email_intro_template}
      />
    </SetupPageShell>
  );
}
