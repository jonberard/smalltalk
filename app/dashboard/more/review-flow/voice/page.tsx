"use client";

import { useAuth } from "@/lib/auth-context";
import { ReplyVoiceSection } from "@/components/dashboard/setup-sections";
import { SetupPageShell } from "@/components/dashboard/setup-shell";

export default function ReviewFlowVoicePage() {
  const { business } = useAuth();

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Review Flow / Reply Voice"
      title="Keep public replies sounding like your business."
      description="This setting only affects drafted public responses. It does not change the customer review flow itself, but it does shape how you show up once reviews come in."
      backHref="/dashboard/more/review-flow"
      backLabel="Back to review flow"
      headerTone="detail"
    >
      <ReplyVoiceSection
        businessId={business.id}
        initialVoiceId={business.reply_voice_id ?? "warm"}
        initialCustomVoice={business.custom_reply_voice ?? null}
      />
    </SetupPageShell>
  );
}
