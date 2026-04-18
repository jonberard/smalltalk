"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { Business } from "@/lib/types";

type AuthContextType = {
  session: Session | null;
  business: Business | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  business: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [noBusiness, setNoBusiness] = useState(false);

  useEffect(() => {
    // Get initial session — use getUser() for server-verified auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          fetchBusiness(user.id);
        });
      } else {
        setLoading(false);
        router.replace("/login");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchBusiness(session.user.id);
        } else {
          setBusiness(null);
          setLoading(false);
          router.replace("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  async function fetchBusiness(userId: string) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, owner_email, logo_url, google_review_url, google_place_id, business_city, neighborhoods, subscription_status, trial_requests_remaining, trial_ends_at, reply_voice_id, custom_reply_voice, connected_crms, created_at, stripe_customer_id, stripe_subscription_id, onboarding_completed, reminder_sequence_enabled, quiet_hours_start, quiet_hours_end, business_timezone")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // Orphaned auth account — no business record exists
      setNoBusiness(true);
      setBusiness(null);
    } else {
      const biz = data as Business;
      setNoBusiness(false);
      setBusiness(biz);

      // Redirect to onboarding if not completed (unless already there)
      if (!biz.onboarding_completed && !window.location.pathname.startsWith("/onboarding")) {
        router.replace("/onboarding");
      }
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh bg-[#F8F9FA] font-dashboard">
        {/* Sidebar skeleton (desktop) */}
        <div className="hidden w-[220px] shrink-0 border-r border-[#E8E5E0] bg-white sm:block">
          <div className="px-5 pt-7 pb-6">
            <div className="h-4 w-20 animate-pulse rounded bg-[#E8E5E0]" />
            <div className="mt-2 h-3 w-14 animate-pulse rounded bg-[#E8E5E0]" />
          </div>
          <div className="flex flex-col gap-2 px-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-[10px] bg-[#F3F0EB]" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 px-6 pt-20 sm:pt-10">
          <div className="mx-auto max-w-[600px]">
            <div className="h-6 w-40 animate-pulse rounded bg-[#E8E5E0]" />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-[12px] bg-white shadow-sm" />
              ))}
            </div>
            <div className="mt-6 h-64 animate-pulse rounded-[12px] bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (noBusiness && !loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] px-4 font-dashboard">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF7ED]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[#1A1D20]">
            We hit a snag setting up your business
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Your account was created but we couldn&apos;t finish setting up your business profile. Try signing out and back in, or contact us for help.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setNoBusiness(false);
                if (session?.user?.id) {
                  await fetchBusiness(session.user.id);
                } else {
                  setLoading(false);
                }
              }}
              className="w-full rounded-[8px] bg-[#E05A3D] py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-95"
            >
              Retry Setup
            </button>
            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-[8px] border border-[#E8E5E0] bg-white py-2.5 text-[14px] font-semibold text-[#1A1D20] transition-colors hover:bg-[#F8F9FA]"
            >
              Sign Out
            </button>
            <a
              href="mailto:hello@usesmalltalk.com"
              className="text-[13px] font-medium text-[#E05A3D] hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, business, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
