"use client";

import { useEffect, useState } from "react";
import { supabase, fetchWithAuth } from "@/lib/supabase";

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
      className="block w-full rounded-pill bg-primary py-3.5 text-center text-[14px] font-semibold text-white transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
    >
      Send your first guided review link
    </button>
  );
}
