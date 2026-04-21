"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message === "Invalid login credentials") {
        setError("That email and password don\u2019t match. Try again?");
      } else if (authError.message === "Email not confirmed") {
        setError("Check your inbox \u2014 you need to confirm your email before signing in.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    try {
      const adminRes = await fetchWithAuth("/api/admin/me");

      if (adminRes.ok) {
        router.push("/admin");
        return;
      }
    } catch (adminError) {
      console.error("[login] Could not check founder admin access:", adminError);
    }

    router.push("/dashboard");
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email above, then click forgot password.");
      return;
    }
    setResetLoading(true);
    setError("");
    await supabase.auth.resetPasswordForEmail(email.trim());
    setResetSent(true);
    setResetLoading(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-text">
            Welcome back.
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Sign in to your small Talk account.
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

            {resetSent && (
              <div className="rounded-[8px] border border-[#059669]/20 bg-[#ECFDF5] px-4 py-3 text-[13px] text-[#059669]">
                We sent you a reset link &mdash; check your inbox.
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full rounded-[8px] border border-accent bg-surface px-3.5 py-2.5 text-[14px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="mt-2 text-[12px] font-medium text-primary hover:underline disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-pill bg-primary py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-[13px] text-muted">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
