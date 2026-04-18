"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/posthog";

/** Replace dynamic segments that contain capability tokens with placeholders */
function sanitizePath(pathname: string): string {
  // /r/<code> → /r/[code]
  if (pathname.startsWith("/r/")) {
    return "/r/[code]";
  }
  return pathname;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    getPostHog();
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    const ph = getPostHog();
    if (!ph) return;

    const safePath = sanitizePath(pathname);
    let url = window.origin + safePath;
    if (searchParams.toString()) {
      url += "?" + searchParams.toString();
    }
    ph.capture("$pageview", { $current_url: url, $pathname: safePath });
  }, [pathname, searchParams]);

  // Enable session replay only on dashboard pages (never on /r/[code])
  // Recording is disabled globally in posthog.ts init — we selectively enable it here
  useEffect(() => {
    const ph = getPostHog();
    if (!ph) return;

    const isDashboard = pathname.startsWith("/dashboard");
    if (isDashboard) {
      ph.startSessionRecording?.();
    } else {
      ph.stopSessionRecording?.();
    }
  }, [pathname]);

  return <>{children}</>;
}
