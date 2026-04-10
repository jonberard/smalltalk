"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Insert business row with auth user's UUID + 7-day trial
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error: bizError } = await supabase.from("businesses").insert({
        id: userId,
        name: businessName,
        google_review_url: googleUrl,
        trial_ends_at: trialEndsAt,
      });

      if (bizError) {
        setError(bizError.message);
        setLoading(false);
        return;
      }

      // 3. Copy global default topics for this business
      const { data: defaultTopics, error: topicsReadError } = await supabase
        .from("topics")
        .select("label, tier, follow_up_question, follow_up_options, sort_order")
        .is("business_id", null);

      if (topicsReadError) {
        setError(topicsReadError.message);
        setLoading(false);
        return;
      }

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

        if (topicsWriteError) {
          setError(topicsWriteError.message);
          setLoading(false);
          return;
        }
      }

      // 4. Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] px-4 font-dashboard">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-bold tracking-tight text-[#18181B]">
            Create your account
          </h1>
          <p className="mt-1.5 text-[14px] text-[#71717A]">
            Start getting detailed reviews in minutes.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[12px] border border-[#E4E4E7] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[#18181B]">
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
                className="w-full rounded-[8px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] placeholder-[#A1A1AA] outline-none transition-colors focus:border-[#0070EB] focus:ring-2 focus:ring-[#0070EB]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#18181B]">
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
                className="w-full rounded-[8px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] placeholder-[#A1A1AA] outline-none transition-colors focus:border-[#0070EB] focus:ring-2 focus:ring-[#0070EB]/20"
              />
            </div>

            <div className="h-px bg-[#E4E4E7]" />

            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-[13px] font-medium text-[#18181B]">
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
                className="w-full rounded-[8px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] placeholder-[#A1A1AA] outline-none transition-colors focus:border-[#0070EB] focus:ring-2 focus:ring-[#0070EB]/20"
              />
            </div>

            <div>
              <label htmlFor="googleUrl" className="mb-1.5 block text-[13px] font-medium text-[#18181B]">
                Google Business review link
              </label>
              <input
                id="googleUrl"
                type="url"
                required
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=..."
                className="w-full rounded-[8px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] placeholder-[#A1A1AA] outline-none transition-colors focus:border-[#0070EB] focus:ring-2 focus:ring-[#0070EB]/20"
              />
              <p className="mt-1.5 text-[12px] text-[#A1A1AA]">
                The link where customers leave Google reviews for your business.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-[8px] bg-[#0070EB] py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#005BBF] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-[13px] text-[#71717A]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#0070EB] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
