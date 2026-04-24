"use client";

import { useAuth } from "@/lib/auth-context";
import { AutomatedRemindersSection } from "@/components/dashboard/setup-sections";
import { SetupPageShell } from "@/components/dashboard/setup-shell";

export default function ReviewFlowRemindersPage() {
  const { business } = useAuth();

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Review Flow / Reminders"
      title="Control the follow-up without nagging forever."
      description="This is where the send window, reminder sequence, and quiet hours live now - enough control to keep requests timely without turning it into a campaign tool."
      backHref="/dashboard/more/review-flow"
      backLabel="Back to review flow"
      headerTone="detail"
    >
      <AutomatedRemindersSection
        businessId={business.id}
        initialEnabled={business.reminder_sequence_enabled ?? true}
        initialQuietStart={business.quiet_hours_start ?? 21}
        initialQuietEnd={business.quiet_hours_end ?? 9}
        initialTimezone={business.business_timezone ?? "America/Chicago"}
        initialBatchEnabled={business.batch_initial_sms_enabled ?? false}
        initialBatchHour={business.batch_initial_sms_hour ?? 18}
      />
    </SetupPageShell>
  );
}
