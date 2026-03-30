"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] px-4 font-dashboard">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-bold tracking-tight text-[#18181B]">
            Sign in to small Talk
          </h1>
          <p className="mt-1.5 text-[14px] text-[#71717A]">
            Welcome back.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[12px] border border-[#E4E4E7] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-[8px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] placeholder-[#A1A1AA] outline-none transition-colors focus:border-[#0070EB] focus:ring-2 focus:ring-[#0070EB]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-[8px] bg-[#0070EB] py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#005BBF] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-[13px] text-[#71717A]">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#0070EB] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
