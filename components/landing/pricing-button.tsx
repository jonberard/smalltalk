"use client";

import { useEffect, useState } from "react";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { landingButtonClassName } from "@/components/landing/button";

export default function PricingButton() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  async function handleClick() {
    if (!loggedIn || !userId) {
      window.location.href = "/signup";
      return;
    }
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      window.location.href = "/dashboard";
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${landingButtonClassName({ variant: "primary", size: "md", fullWidth: true })} block`}
    >
      <span className="absolute inset-0 bg-[#D85639] translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0" />
      <span className="relative z-10 inline-flex items-center gap-2">
        Send your first guided review link
      </span>
    </button>
  );
}
