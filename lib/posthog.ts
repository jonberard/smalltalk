import posthog from "posthog-js";

let initialized = false;

export function getPostHog() {
  if (typeof window === "undefined") return null;

  if (!initialized) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host) return null;

    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // we handle this manually in the provider
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: false,
      // Privacy-safe defaults: mask text and attributes globally
      mask_all_text: true,
      mask_all_element_attributes: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "*",
      },
      // Disable session recording entirely — we enable it selectively for dashboard only
      disable_session_recording: true,
    });
    initialized = true;
  }

  return posthog;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  const ph = getPostHog();
  if (!ph) return;
  ph.identify(userId, traits);
}

export function reset() {
  const ph = getPostHog();
  if (!ph) return;
  ph.reset();
}
