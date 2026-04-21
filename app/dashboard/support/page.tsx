"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/supabase";
import { useToast } from "@/components/dashboard/toast";

const SUPPORT_TOPICS = [
  { value: "setup_help", label: "Setup help" },
  { value: "feature_question", label: "Feature question" },
  { value: "bug_report", label: "Bug report" },
  { value: "suggestion", label: "Suggestion" },
  { value: "billing", label: "Billing" },
] as const;

function HelpCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--dash-text)]">
        {title}
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">{body}</p>
    </div>
  );
}

export default function DashboardSupportPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] =
    useState<(typeof SUPPORT_TOPICS)[number]["value"]>("setup_help");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitSupportMessage() {
    try {
      setSubmitting(true);
      const res = await fetchWithAuth("/api/support-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: topic,
          message,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(body.error || "Could not send your message.");
      }

      setMessage("");
      setTopic("setup_help");
      toast("Message sent to Jon.", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not send your message.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--dash-bg)] pb-32 pt-8 sm:pl-[220px] sm:pb-16">
      <div className="dash-page-enter mx-auto max-w-[980px] px-5">
        <div className="max-w-[60ch]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Support
          </p>
          <h1 className="mt-2 text-balance font-heading text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--dash-text)] sm:text-[40px]">
            Clear help for how small Talk works, plus a direct line to the founder.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-muted)]">
            This page is here so you always know what the product is doing, why it works this way,
            and how to reach me when you hit friction or have a good idea.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <HelpCard
            eyebrow="Guided Reviews"
            title="We don’t send customers to a blank box."
            body="small Talk replaces the blank Google review box with a short guided flow. The customer taps through what actually happened, then we draft a review from their real inputs. They still copy and post it themselves."
          />
          <HelpCard
            eyebrow="Private Feedback"
            title="Low ratings can stay private first."
            body="If a customer rates the experience 1 or 2 stars, they get a real choice: post publicly or send private feedback to you. This is not review gating. It gives you a chance to hear the problem directly and follow up in your normal channel."
          />
          <HelpCard
            eyebrow="Reminders"
            title="Reminders are automatic, but limited."
            body="For SMS review requests, small Talk can send up to two reminders after the initial message. The sequence stops if the customer completes the flow or replies STOP. We never keep nudging forever."
          />
          <HelpCard
            eyebrow="Statuses"
            title="Copied means the handoff happened. It does not guarantee a Google post."
            body="If you see a copied status, it means the customer copied the review text and we opened the Google handoff. Google still controls the final post, so we stay truthful about what we can confirm."
          />
        </div>

        <div className="mt-8 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Message Jon
          </p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
            Suggestions, bugs, confusion, or setup questions all belong here.
          </h2>
          <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            You’re reaching the founder directly. If something feels confusing, broken, or half-finished,
            I want to hear it. Messages from{" "}
            <span className="font-semibold text-[var(--dash-text)]">
              {business?.name ?? "your business"}
            </span>{" "}
            will come from your account email.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                Topic
              </span>
              <select
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value as (typeof SUPPORT_TOPICS)[number]["value"])
                }
                className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[13px] text-[var(--dash-text)] outline-none transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
              >
                {SUPPORT_TOPICS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                Message
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                placeholder="Tell me what happened, what felt confusing, or what you wish this page did better."
                className="min-h-[180px] rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--dash-text)] outline-none transition-colors placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] leading-relaxed text-[var(--dash-muted)]">
              Prefer email? You can also reach me at{" "}
              <a
                href="mailto:jon@usesmalltalk.com"
                className="font-semibold text-[var(--dash-primary)] underline underline-offset-2"
              >
                jon@usesmalltalk.com
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => void submitSupportMessage()}
              disabled={submitting || message.trim().length < 10}
              className="inline-flex items-center justify-center rounded-full bg-[var(--dash-primary)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(224,90,61,0.18)] transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send message"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
