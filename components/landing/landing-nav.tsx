"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LandingNav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

  const ctaHref = loggedIn ? "/dashboard" : "/signup";

  return (
    <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 lg:px-12">
      <Link href="/" className="font-heading text-[20px] font-semibold text-text">small Talk</Link>
      <div className="flex items-center gap-4">
        <Link
          href="/#how-it-works"
          className="hidden text-[14px] font-medium text-muted transition-colors duration-300 hover:text-text sm:inline"
        >
          How it works
        </Link>
        <Link
          href="/#pricing"
          className="hidden text-[14px] font-medium text-muted transition-colors duration-300 hover:text-text sm:inline"
        >
          Pricing
        </Link>
        <Link
          href="/#faq"
          className="hidden text-[14px] font-medium text-muted transition-colors duration-300 hover:text-text sm:inline"
        >
          FAQ
        </Link>
        {!loggedIn && (
          <Link
            href="/login"
            className="text-[14px] font-medium text-muted transition-colors duration-300 hover:text-text"
          >
            Log in
          </Link>
        )}
        <Link
          href={ctaHref}
          className="rounded-full border border-accent px-6 py-2.5 text-[14px] font-semibold text-text transition-colors duration-300 hover:border-primary hover:text-primary"
        >
          {loggedIn ? "Dashboard" : "Get Started"}
        </Link>
      </div>
    </nav>
  );
}
