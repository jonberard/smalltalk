"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

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
      .select("id, name, logo_url, google_review_url, google_place_id, business_city, neighborhoods, subscription_status, trial_requests_remaining, trial_ends_at, reply_voice_id, custom_reply_voice, connected_crms, created_at, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setBusiness(null);
    } else {
      setBusiness(data as Business);
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] font-dashboard">
        <div className="text-[14px] text-[#A1A1AA]">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ session, business, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
