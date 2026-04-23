"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { landingButtonClassName } from "@/components/landing/button";

function useLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);
  return loggedIn;
}

export function HeroCTA() {
  const loggedIn = useLoggedIn();
  const ctaHref = loggedIn ? "/dashboard" : "/signup";

  return (
    <div className="mt-8 flex flex-col items-center gap-5 pt-2 sm:flex-row lg:justify-start">
      <Link
        href={ctaHref}
        className={`${landingButtonClassName({ variant: "primary", size: "lg" })} w-full sm:w-auto`}
      >
        <span className="absolute inset-0 bg-[#D85639] translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0" />
        <span className="relative z-10 inline-flex items-center gap-2">
          {loggedIn ? "Go to Dashboard" : "Send your first guided review link"}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </Link>
      <p className="flex items-center gap-2 text-[14px] text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        No credit card required
      </p>
    </div>
  );
}

export function FinalCTA() {
  const loggedIn = useLoggedIn();
  const ctaHref = loggedIn ? "/dashboard" : "/signup";

  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Link
        href={ctaHref}
        className={landingButtonClassName({ variant: "primary", size: "md" })}
      >
        <span className="absolute inset-0 bg-[#D85639] translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0" />
        <span className="relative z-10 inline-flex items-center gap-2">
          {loggedIn ? "Go to Dashboard" : "Send your first guided review link"}
        </span>
      </Link>
      <span className="text-[12px] italic uppercase tracking-widest text-muted">
        No credit card required
      </span>
    </div>
  );
}
