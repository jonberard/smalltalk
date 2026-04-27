"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError("We couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

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
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-pill border border-accent bg-white px-4 py-2.5 text-[14px] font-semibold text-text transition-colors hover:bg-[#FCFAF6] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.3 2.8 11.8S6.9 21.5 12 21.5c6.9 0 8.6-6 8.6-8.9 0-.6 0-1-.1-1.4H12Z"/>
              <path fill="#34A853" d="M3.8 7.3l3.2 2.4c.9-2.1 2.7-3.6 5-3.6 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 8.2 2 4.9 4.2 3.2 7.5l.6-.2Z"/>
              <path fill="#FBBC05" d="M12 21.5c2.6 0 4.8-.9 6.4-2.5l-3.1-2.6c-.8.6-1.9 1.1-3.3 1.1-3.7 0-5.2-2.6-5.5-3.9l-3.1 2.4C5 19.2 8.2 21.5 12 21.5Z"/>
              <path fill="#4285F4" d="M20.6 12.6c0-.6 0-1-.1-1.4H12v3.9h5.5c-.3 1.3-1.2 2.4-2.2 3.1l3.1 2.6c1.8-1.7 2.9-4.3 2.9-7.2Z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
            Signed up with Google? Use this button — you don&apos;t need a small Talk password.
          </p>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-accent" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-accent" />
          </div>

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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full rounded-[8px] border border-accent bg-surface px-3.5 py-2.5 pr-16 text-[14px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-muted transition-colors hover:text-text"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
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
