"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { capture, identify } from "@/lib/posthog";
import { getReviewRequestHourlyCapCopy } from "@/lib/review-request-limits";

function friendlyError(message: string): string {
  if (message.includes("User already registered")) {
    return "That email is already taken. Try signing in instead?";
  }
  if (message.includes("Password should be at least")) {
    return message;
  }
  return "Something went wrong. Please try again.";
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      capture("signup_started");

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
        },
      });

      if (authError) {
        setError(friendlyError(authError.message));
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Insert business row + seed topics (wrapped so orphan auth is handled)
      try {
        const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { error: bizError } = await supabase.from("businesses").insert({
          id: userId,
          name: businessName,
          owner_email: email,
          subscription_status: "trial",
          trial_ends_at: trialEndsAt,
          trial_requests_remaining: 10,
        });

        if (bizError) throw bizError;

        // 3. Copy global default topics for this business
        const { data: defaultTopics, error: topicsReadError } = await supabase
          .from("topics")
          .select("label, tier, follow_up_question, follow_up_options, sort_order")
          .is("business_id", null);

        if (topicsReadError) throw topicsReadError;

        if (defaultTopics && defaultTopics.length > 0) {
          const seededTopics = defaultTopics.map((t) => ({
            business_id: userId,
            label: t.label,
            tier: t.tier,
            follow_up_question: t.follow_up_question,
            follow_up_options: t.follow_up_options,
            sort_order: t.sort_order,
          }));

          const { error: topicsWriteError } = await supabase
            .from("topics")
            .insert(seededTopics);

          if (topicsWriteError) throw topicsWriteError;
        }
      } catch {
        setError(
          "Account created but we hit a snag setting up your business. Please try logging in — we'll retry the setup."
        );
        setLoading(false);
        return;
      }

      // 4. Identify and redirect to onboarding
      identify(userId, { subscription_status: "trial" });
      capture("signup_completed");
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-text">
            Let&rsquo;s get you started.
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Start getting detailed reviews in minutes.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-card border border-accent bg-surface p-8 shadow-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-[8px] border border-accent bg-surface px-3.5 py-2.5 text-[14px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="w-full rounded-[8px] border border-accent bg-surface px-3.5 py-2.5 text-[14px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-[13px] font-medium text-text">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Crystal Clear Pools"
                autoComplete="organization"
                className="w-full rounded-[8px] border border-accent bg-surface px-3.5 py-2.5 text-[14px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-pill bg-primary py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-[12px] leading-relaxed text-muted">
              {getReviewRequestHourlyCapCopy()}
            </p>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
