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

export function HelpMessageForm({
  title = "Still stuck? Message Jon directly.",
  description = "You’re reaching the founder directly. If something feels confusing, broken, or unfinished, I want to hear it.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
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
      toast("Message sent. It’s in the founder inbox and email backup.", "success");
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
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        Message Jon
      </p>
      <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
        {title}
      </h2>
      <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
        {description} Messages from{" "}
        <span className="font-semibold text-[var(--dash-text)]">
          {business?.name ?? "your business"}
        </span>{" "}
        will come from your account email.
      </p>

      <div className={`mt-6 grid ${compact ? "gap-3" : "gap-4"}`}>
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
            rows={compact ? 5 : 7}
            placeholder="Tell me what happened, what felt confusing, or what you wish this page explained better."
            className={`rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--dash-text)] outline-none transition-colors placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)] ${
              compact ? "min-h-[140px]" : "min-h-[180px]"
            }`}
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
  );
}
