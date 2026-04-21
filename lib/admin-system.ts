import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  AI_PROVIDERS,
  getAiProviderLabel,
  getAiProviderModelSet,
  getCurrentAiSettings,
  isAiProviderConfigured,
} from "@/lib/ai-routing";
import type {
  AdminAiSettings,
  AiGenerationEvent,
  AiGenerationFeature,
  AiProvider,
} from "@/lib/types";

type RawAiGenerationEvent = AiGenerationEvent;

export type AdminSystemProviderSummary = {
  provider: AiProvider;
  label: string;
  isConfigured: boolean;
  isPrimary: boolean;
  status: "ready" | "configured" | "degraded" | "missing_key";
  statusLabel: string;
  statusNote: string;
  modelFast: string;
  modelNuanced: string;
  successes24h: number;
  failures24h: number;
  fallbackSuccesses24h: number;
  lastAttemptLabel: string;
  lastError: string | null;
};

export type AdminSystemEventSummary = {
  id: string;
  feature: AiGenerationFeature;
  provider: AiProvider;
  providerLabel: string;
  model: string;
  success: boolean;
  latencyLabel: string;
  fallbackLabel: string;
  createdLabel: string;
  errorMessage: string | null;
};

export type AdminSystemData = {
  settings: {
    routingMode: AdminAiSettings["routing_mode"];
    primaryProvider: AdminAiSettings["primary_provider"];
    updatedLabel: string;
  };
  summary: {
    attempts24h: number;
    failures24h: number;
    fallbacks24h: number;
    lastFailureLabel: string | null;
  };
  providers: AdminSystemProviderSummary[];
  recentEvents: AdminSystemEventSummary[];
};

function isMissingRelationError(message: string | undefined) {
  return Boolean(
    message &&
      (message.includes('relation "admin_ai_settings" does not exist') ||
        message.includes('relation "ai_generation_events" does not exist')),
  );
}

function formatRelative(dateString: string | null) {
  if (!dateString) {
    return "No activity yet";
  }

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function formatLatency(latencyMs: number | null) {
  if (latencyMs == null) {
    return "n/a";
  }

  if (latencyMs < 1000) {
    return `${latencyMs}ms`;
  }

  return `${(latencyMs / 1000).toFixed(1)}s`;
}

async function listRecentAiEvents(limit = 60) {
  const { data, error } = await supabaseAdmin
    .from("ai_generation_events")
    .select(
      "id, feature, provider, model, success, latency_ms, fallback_step, routing_mode, primary_provider, error_message, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingRelationError(error.message)) {
      return [] as RawAiGenerationEvent[];
    }

    throw new Error(error.message);
  }

  return (data as RawAiGenerationEvent[] | null) ?? [];
}

function statusForProvider(input: {
  isConfigured: boolean;
  failures24h: number;
  successes24h: number;
}) {
  if (!input.isConfigured) {
    return {
      status: "missing_key" as const,
      statusLabel: "Missing key",
      statusNote: "This provider is available in the router but not configured yet.",
    };
  }

  if (input.failures24h > 0 && input.successes24h === 0) {
    return {
      status: "degraded" as const,
      statusLabel: "Degraded",
      statusNote: "Recent attempts failed without a matching success.",
    };
  }

  if (input.successes24h > 0) {
    return {
      status: "ready" as const,
      statusLabel: "Ready",
      statusNote: "Recent attempts succeeded on this provider.",
    };
  }

  return {
    status: "configured" as const,
    statusLabel: "Configured",
    statusNote: "Key is present. No recent traffic has hit this provider yet.",
  };
}

export async function getAdminSystemData(): Promise<AdminSystemData> {
  const [settings, recentEvents] = await Promise.all([
    getCurrentAiSettings(),
    listRecentAiEvents(),
  ]);

  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const events24h = recentEvents.filter(
    (event) => new Date(event.created_at).getTime() >= twentyFourHoursAgo,
  );
  const lastFailure = recentEvents.find((event) => !event.success) ?? null;

  const providers = AI_PROVIDERS.map((provider) => {
    const providerEvents24h = events24h.filter((event) => event.provider === provider);
    const lastAttempt = recentEvents.find((event) => event.provider === provider) ?? null;
    const lastError =
      recentEvents.find((event) => event.provider === provider && !event.success)
        ?.error_message ?? null;
    const models = getAiProviderModelSet(provider);
    const successes24h = providerEvents24h.filter((event) => event.success).length;
    const failures24h = providerEvents24h.filter((event) => !event.success).length;
    const fallbackSuccesses24h = providerEvents24h.filter(
      (event) => event.success && event.fallback_step > 0,
    ).length;
    const providerStatus = statusForProvider({
      isConfigured: isAiProviderConfigured(provider),
      failures24h,
      successes24h,
    });

    return {
      provider,
      label: getAiProviderLabel(provider),
      isConfigured: isAiProviderConfigured(provider),
      isPrimary: settings.primary_provider === provider,
      status: providerStatus.status,
      statusLabel: providerStatus.statusLabel,
      statusNote: providerStatus.statusNote,
      modelFast: models.fast,
      modelNuanced: models.nuanced,
      successes24h,
      failures24h,
      fallbackSuccesses24h,
      lastAttemptLabel: formatRelative(lastAttempt?.created_at ?? null),
      lastError,
    };
  });

  return {
    settings: {
      routingMode: settings.routing_mode,
      primaryProvider: settings.primary_provider,
      updatedLabel:
        settings.updated_at === settings.created_at &&
        settings.created_at === new Date(0).toISOString()
          ? "Using defaults"
          : formatRelative(settings.updated_at),
    },
    summary: {
      attempts24h: events24h.length,
      failures24h: events24h.filter((event) => !event.success).length,
      fallbacks24h: events24h.filter(
        (event) => event.success && event.fallback_step > 0,
      ).length,
      lastFailureLabel: lastFailure ? formatRelative(lastFailure.created_at) : null,
    },
    providers,
    recentEvents: recentEvents.slice(0, 12).map((event) => ({
      id: event.id,
      feature: event.feature,
      provider: event.provider,
      providerLabel: getAiProviderLabel(event.provider),
      model: event.model,
      success: event.success,
      latencyLabel: formatLatency(event.latency_ms),
      fallbackLabel:
        event.fallback_step > 0 ? `Fallback #${event.fallback_step}` : "Primary",
      createdLabel: formatRelative(event.created_at),
      errorMessage: event.error_message,
    })),
  };
}
