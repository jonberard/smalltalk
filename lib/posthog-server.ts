import { PostHog } from "posthog-node";

let client: PostHog | null = null;

export function getServerPostHog(): PostHog | null {
  if (client) return client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return null;

  client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  return client;
}

export function serverCapture(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  try {
    const ph = getServerPostHog();
    if (!ph) return;
    ph.capture({ distinctId, event, properties });
    // Best-effort flush for serverless — fire-and-forget, never block the response
    ph.flush().catch(() => {});
  } catch {
    // Analytics must never throw in server routes
  }
}

export async function shutdownPostHog() {
  if (client) {
    await client.shutdown();
    client = null;
  }
}
