import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type {
  AdminAiSettings,
  AiGenerationFeature,
  AiProvider,
  AiRoutingMode,
} from "@/lib/types";

export const AI_PROVIDERS: AiProvider[] = ["anthropic", "openai", "gemini"];

const DEFAULT_SETTINGS: AdminAiSettings = {
  id: "global",
  routing_mode: "auto",
  primary_provider: "anthropic",
  updated_by: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

type GenerateAiTextInput = {
  feature: AiGenerationFeature;
  starRating: number;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  providerOverride?: AiProvider;
};

export type GenerateAiTextResult = {
  text: string;
  provider: AiProvider;
  model: string;
  fallbackStep: number;
  routingMode: AiRoutingMode;
  primaryProvider: AiProvider;
};

type ProviderCallInput = {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

type ProviderModelSet = {
  fast: string;
  nuanced: string;
};

export class AiRoutingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AiRoutingError";
    this.statusCode = statusCode;
  }
}

function normalizeProvider(value: string | null | undefined): AiProvider | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return AI_PROVIDERS.includes(normalized as AiProvider)
    ? (normalized as AiProvider)
    : null;
}

function isMissingRelationError(message: string | undefined) {
  return Boolean(
    message &&
      (message.includes('relation "admin_ai_settings" does not exist') ||
        message.includes('relation "ai_generation_events" does not exist')),
  );
}

export function getAiProviderLabel(provider: AiProvider) {
  switch (provider) {
    case "anthropic":
      return "Anthropic";
    case "openai":
      return "OpenAI";
    case "gemini":
      return "Gemini";
    default:
      return provider;
  }
}

export function isAiProviderConfigured(provider: AiProvider) {
  switch (provider) {
    case "anthropic":
      return Boolean(process.env.ANTHROPIC_API_KEY);
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY);
    case "gemini":
      return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
    default:
      return false;
  }
}

export function getAiProviderModelSet(provider: AiProvider): ProviderModelSet {
  switch (provider) {
    case "anthropic":
      if (process.env.ANTHROPIC_MODEL) {
        return {
          fast: process.env.ANTHROPIC_MODEL,
          nuanced: process.env.ANTHROPIC_MODEL,
        };
      }

      return {
        fast: process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001",
        nuanced:
          process.env.ANTHROPIC_MODEL_NUANCED ?? "claude-sonnet-4-20250514",
      };
    case "openai":
      if (process.env.OPENAI_MODEL) {
        return {
          fast: process.env.OPENAI_MODEL,
          nuanced: process.env.OPENAI_MODEL,
        };
      }

      return {
        fast: process.env.OPENAI_MODEL_FAST ?? "gpt-4.1-mini",
        nuanced: process.env.OPENAI_MODEL_NUANCED ?? "gpt-4.1",
      };
    case "gemini":
      if (process.env.GEMINI_MODEL) {
        return {
          fast: process.env.GEMINI_MODEL,
          nuanced: process.env.GEMINI_MODEL,
        };
      }

      return {
        fast: process.env.GEMINI_MODEL_FAST ?? "gemini-2.5-flash",
        nuanced: process.env.GEMINI_MODEL_NUANCED ?? "gemini-2.5-pro",
      };
    default:
      return {
        fast: "unknown",
        nuanced: "unknown",
      };
  }
}

function getModelForProvider(provider: AiProvider, nuanced: boolean) {
  const models = getAiProviderModelSet(provider);
  return nuanced ? models.nuanced : models.fast;
}

function getDefaultPrimaryProvider(feature: AiGenerationFeature): AiProvider {
  const featureEnv =
    feature === "review"
      ? normalizeProvider(process.env.REVIEW_PROVIDER)
      : null;

  return (
    featureEnv ??
    normalizeProvider(process.env.AI_PRIMARY_PROVIDER) ??
    DEFAULT_SETTINGS.primary_provider
  );
}

export async function getCurrentAiSettings(): Promise<AdminAiSettings> {
  const { data, error } = await supabaseAdmin
    .from("admin_ai_settings")
    .select("id, routing_mode, primary_provider, updated_by, created_at, updated_at")
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error.message)) {
      return {
        ...DEFAULT_SETTINGS,
        primary_provider: getDefaultPrimaryProvider("review"),
      };
    }

    throw new Error(error.message);
  }

  if (!data) {
    return {
      ...DEFAULT_SETTINGS,
      primary_provider: getDefaultPrimaryProvider("review"),
    };
  }

  return data as AdminAiSettings;
}

export async function saveAiSettings(input: {
  routingMode: AiRoutingMode;
  primaryProvider: AiProvider;
  updatedBy: string;
}) {
  const row = {
    id: "global",
    routing_mode: input.routingMode,
    primary_provider: input.primaryProvider,
    updated_by: input.updatedBy,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("admin_ai_settings")
    .upsert(row, { onConflict: "id" })
    .select("id, routing_mode, primary_provider, updated_by, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminAiSettings;
}

async function logAiGenerationEvent(input: {
  feature: AiGenerationFeature;
  provider: AiProvider;
  model: string;
  success: boolean;
  latencyMs: number | null;
  fallbackStep: number;
  routingMode: AiRoutingMode;
  primaryProvider: AiProvider;
  errorMessage?: string | null;
}) {
  const { error } = await supabaseAdmin.from("ai_generation_events").insert({
    feature: input.feature,
    provider: input.provider,
    model: input.model,
    success: input.success,
    latency_ms: input.latencyMs,
    fallback_step: input.fallbackStep,
    routing_mode: input.routingMode,
    primary_provider: input.primaryProvider,
    error_message: input.errorMessage ?? null,
  });

  if (error && !isMissingRelationError(error.message)) {
    console.error("Failed to log AI generation event", error.message);
  }
}

async function callAnthropic({
  systemPrompt,
  userPrompt,
  model,
  maxTokens,
  temperature,
}: ProviderCallInput) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];

  if (block.type !== "text") {
    throw new Error("Unexpected response format from Anthropic");
  }

  return block.text.trim();
}

function extractOpenAiText(
  content: string | Array<{ type?: string; text?: string }> | null | undefined,
) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

async function callOpenAI({
  systemPrompt,
  userPrompt,
  model,
  maxTokens,
  temperature,
}: ProviderCallInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(body.error?.message || "OpenAI request failed");
  }

  const text = extractOpenAiText(body.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return text;
}

async function callGemini({
  systemPrompt,
  userPrompt,
  model,
  maxTokens,
  temperature,
}: ProviderCallInput) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(body.error?.message || "Gemini request failed");
  }

  const text =
    body.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

const PROVIDER_CALLERS: Record<
  AiProvider,
  (input: ProviderCallInput) => Promise<string>
> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  gemini: callGemini,
};

export async function generateAiText(
  input: GenerateAiTextInput,
): Promise<GenerateAiTextResult> {
  const settings = await getCurrentAiSettings();
  const routingMode: AiRoutingMode = input.providerOverride
    ? "force"
    : settings.routing_mode;
  const primaryProvider =
    input.providerOverride ??
    settings.primary_provider ??
    getDefaultPrimaryProvider(input.feature);
  const nuanced = input.starRating <= 3;
  const maxTokens = input.maxTokens ?? 256;
  const temperature = input.temperature ?? 0.9;

  const order = routingMode === "force"
    ? [primaryProvider]
    : [
        primaryProvider,
        ...AI_PROVIDERS.filter((provider) => provider !== primaryProvider),
      ];

  const uniqueOrder = order.filter(
    (provider, index) => order.indexOf(provider) === index,
  );

  let configuredProviderFound = false;
  let lastError: Error | null = null;

  for (const [fallbackStep, provider] of uniqueOrder.entries()) {
    const model = getModelForProvider(provider, nuanced);

    if (!isAiProviderConfigured(provider)) {
      await logAiGenerationEvent({
        feature: input.feature,
        provider,
        model,
        success: false,
        latencyMs: null,
        fallbackStep,
        routingMode,
        primaryProvider,
        errorMessage: "Provider is not configured",
      });

      lastError = new Error(`${getAiProviderLabel(provider)} is not configured`);
      continue;
    }

    configuredProviderFound = true;
    const startedAt = Date.now();

    try {
      const text = await PROVIDER_CALLERS[provider]({
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        model,
        maxTokens,
        temperature,
      });

      await logAiGenerationEvent({
        feature: input.feature,
        provider,
        model,
        success: true,
        latencyMs: Date.now() - startedAt,
        fallbackStep,
        routingMode,
        primaryProvider,
      });

      return {
        text,
        provider,
        model,
        fallbackStep,
        routingMode,
        primaryProvider,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown AI provider failure";

      lastError = error instanceof Error ? error : new Error(message);

      await logAiGenerationEvent({
        feature: input.feature,
        provider,
        model,
        success: false,
        latencyMs: Date.now() - startedAt,
        fallbackStep,
        routingMode,
        primaryProvider,
        errorMessage: message,
      });

      if (routingMode === "force") {
        throw new AiRoutingError(
          `${getAiProviderLabel(provider)} failed: ${message}`,
          503,
        );
      }
    }
  }

  if (!configuredProviderFound) {
    throw new AiRoutingError(
      "No AI providers are configured. Add at least one API key before generating again.",
      503,
    );
  }

  throw new AiRoutingError(
    `All AI providers failed. Last error: ${lastError?.message || "unknown"}`,
    503,
  );
}
