"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function friendlyOAuthError(message: string) {
  if (message.includes("access_denied")) {
    return "Google sign-in was canceled before it finished.";
  }

  return "We couldn't finish Google sign-in. Please try again.";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [readyToRetry, setReadyToRetry] = useState(false);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    const explicitError =
      searchParams.get("error_description") || searchParams.get("error");

    if (explicitError) {
      setError(friendlyOAuthError(explicitError));
      setReadyToRetry(true);
      return;
    }

    let active = true;
    let resolved = false;

    const timeout = window.setTimeout(() => {
      if (!resolved && active) {
        setError("Google sign-in took too long to finish. Please try again.");
        setReadyToRetry(true);
      }
    }, 10000);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active || !session || resolved) return;

        resolved = true;
        window.clearTimeout(timeout);
        router.replace(nextPath);
      },
    );

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || resolved) return;

      if (session) {
        resolved = true;
        window.clearTimeout(timeout);
        router.replace(nextPath);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      authListener.subscription.unsubscribe();
    };
  }, [nextPath, router, searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-[420px] rounded-card border border-accent bg-surface p-8 shadow-card">
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-text">
          Finishing Google sign-in
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Hang tight while we bring your account back into small Talk.
        </p>

        {!error ? (
          <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-accent bg-[#FCFAF6] px-4 py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            <p className="text-[13px] text-text">Connecting your Google account...</p>
          </div>
        ) : (
          <div className="mt-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-600">
            {error}
          </div>
        )}

        {readyToRetry ? (
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-pill bg-primary px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-95"
            >
              Back to sign in
            </Link>
            <Link
              href="/signup"
              className="text-center text-[13px] font-medium text-primary hover:underline"
            >
              Or create an account another way
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
