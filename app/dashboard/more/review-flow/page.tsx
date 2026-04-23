"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  SetupPageShell,
  SetupSummaryRow,
  SetupSummarySection,
  SetupTrustBanner,
} from "@/components/dashboard/setup-shell";

export default function ReviewFlowSetupPage() {
  const { business } = useAuth();
  const [topicCount, setTopicCount] = useState<number | null>(null);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    const businessId = business.id;

    async function loadTopicCount() {
      const { count } = await supabase
        .from("topics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);

      if (!cancelled) {
        setTopicCount(count ?? 0);
      }
    }

    void loadTopicCount();

    return () => {
      cancelled = true;
    };
  }, [business]);

  if (!business) return null;

  const hasCustomMessage = Boolean(
    business.review_request_sms_template ||
      business.review_request_email_subject_template ||
      business.review_request_email_intro_template,
  );
  const hasCustomVoice = Boolean(business.custom_reply_voice);
  const remindersEnabled = business.reminder_sequence_enabled ?? true;

  return (
    <SetupPageShell
      eyebrow="Setup / Review Flow"
      title="Your review flow is already set."
      description="Most businesses leave these settings as-is. Edit the basics if you want, and only open optional customization when you need more control."
      headerTone="detail"
    >
      <div className="mx-auto max-w-[760px] space-y-6">
        <SetupTrustBanner text="Running on recommended defaults" />

        <SetupSummarySection heading="The basics">
          <SetupSummaryRow
            href="/dashboard/more/review-flow/message"
            label="Message"
            value={hasCustomMessage ? "Customized copy" : "Using recommended default"}
            hint="What customers receive when you send"
          />
          <SetupSummaryRow
            href="/dashboard/more/review-flow/reminders"
            label="Reminders"
            value={remindersEnabled ? "On" : "Off"}
            hint={
              remindersEnabled
                ? "24h, then 72h, then we stop"
                : "No follow-up messages are being sent"
            }
            last
          />
        </SetupSummarySection>

        <div>
          <p className="mb-2 pl-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Optional customization
          </p>
          <p className="mb-3 pl-0.5 text-[12px] italic leading-relaxed text-[var(--dash-muted)]">
            Most businesses leave these as-is.
          </p>
          <SetupSummarySection>
            <SetupSummaryRow
              href="/dashboard/more/review-flow/topics"
              label="Topics"
              value={topicCount === null ? "Loading topic set" : `${topicCount} active topics`}
              hint="What questions we ask customers"
            />
          <SetupSummaryRow
            href="/dashboard/more/review-flow/voice"
            label="Reply voice"
            value={hasCustomVoice ? "Custom tone" : "Using default voice"}
            hint="How suggested replies sound"
            helpText="Sets the tone for your drafted replies."
            last
          />
          </SetupSummarySection>
        </div>

        <p className="pt-1 text-center text-[12px] italic leading-relaxed text-[var(--dash-muted)]">
          You do not need to change these to get good results.
          <br />
          You can always edit them later.
        </p>
      </div>
    </SetupPageShell>
  );
}
