"use client";

import { SetupCardLink, SetupInfoStrip, SetupPageShell } from "@/components/dashboard/setup-shell";

export default function ReviewFlowSetupPage() {
  return (
    <SetupPageShell
      eyebrow="Setup / Review Flow"
      title="Shape how the guided review experience feels."
      description="These controls belong together because they all influence the customer journey: what you ask, how you follow up, how the request is framed, and how public replies sound later."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <SetupCardLink
          href="/dashboard/more/review-flow/message"
          eyebrow="Request Message"
          title="Customize the outbound copy"
          description="Keep the link and compliance pieces protected while letting the text sound more like your business."
        />
        <SetupCardLink
          href="/dashboard/more/review-flow/topics"
          eyebrow="Topics"
          title="Decide what customers talk about"
          description="Tune the guided prompts and follow-up questions so the reviews reflect the parts of service that matter most."
        />
        <SetupCardLink
          href="/dashboard/more/review-flow/reminders"
          eyebrow="Reminders"
          title="Control the follow-up cadence"
          description="Quiet hours, reminder timing, and the on/off behavior now live in one dedicated place."
        />
        <SetupCardLink
          href="/dashboard/more/review-flow/voice"
          eyebrow="Reply Voice"
          title="Set the tone for public replies"
          description="Choose how small Talk drafts responses so they sound aligned with your business when you answer public reviews."
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SetupInfoStrip
          title="Why this is grouped together"
          description="These are all workflow controls, not account settings. Moving them here makes Home, Send, and Setup feel like parts of the same system instead of separate mini-products."
          accent="warm"
        />
        <SetupInfoStrip
          title="What stays elsewhere"
          description="Daily work like private feedback, public replies, and request history still belongs in Inbox, Replies, and Send. Review Flow is only about configuration."
        />
      </div>
    </SetupPageShell>
  );
}
