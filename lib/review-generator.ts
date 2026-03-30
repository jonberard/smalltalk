import Anthropic from "@anthropic-ai/sdk";
import { REVIEW_VOICES, type ReviewVoice } from "./review-voices";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export type TopicInput = {
  label: string;
  follow_up_answer: string;
  detail_text?: string;
};

export type GenerateReviewInput = {
  star_rating: number;
  business_name: string;
  service_type: string;
  employee_name: string | null;
  topics_selected: TopicInput[];
  optional_text?: string;
  provider?: "anthropic" | "openai" | "gemini";
  exclude_voice_id?: string;
};

export type GenerateReviewResult = {
  review_text: string;
  voice_id: string;
  voice_name: string;
  provider: string;
  model: string;
};

/* ═══════════════════════════════════════════════════
   VOICE SELECTION
   ═══════════════════════════════════════════════════ */

function pickVoice(excludeId?: string): ReviewVoice {
  const pool = excludeId
    ? REVIEW_VOICES.filter((v) => v.id !== excludeId)
    : REVIEW_VOICES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ═══════════════════════════════════════════════════
   TONE LAYER — RATING CONTROLS EMOTIONAL REGISTER
   ═══════════════════════════════════════════════════ */

function getToneLayer(rating: number): string {
  switch (rating) {
    case 5:
      return `TONE (5 stars): Full positive expression. Interpret every keyword at its strongest. The reviewer is genuinely delighted. Voice at full intensity.`;
    case 4:
      return `TONE (4 stars): Positive but grounded — "great but not flawless." One subtle qualifier is natural. Do not oversell. Voice at 80% intensity.`;
    case 3:
      return `TONE (3 stars): Balanced and measured. You MUST acknowledge both positives AND negatives. Even if all keyword answers sound positive, keep the tone reserved — the customer gave 3 stars for a reason. Never sound enthusiastic. Voice at 50% intensity.`;
    case 2:
      return `TONE (2 stars): Disappointed but fair. Lead with what went wrong. Acknowledge anything positive briefly. Overall energy is "not what I expected." Voice in its most restrained register.`;
    case 1:
      return `TONE (1 star): Frustrated. Keywords frame failures. Even warm voices become "I really wanted this to work out but..." Even casual voices become "honestly not great." No voice softens a 1-star experience.`;
    default:
      return `TONE: Neutral.`;
  }
}

/* ═══════════════════════════════════════════════════
   EMPLOYEE NAME RULES
   ═══════════════════════════════════════════════════ */

function getEmployeeRule(rating: number, employeeName: string | null): string {
  if (!employeeName) {
    return `Do not mention any individual by name. Use "the team" if you need to reference who did the work.`;
  }
  if (rating >= 4) {
    return `Use the employee's first name "${employeeName}" naturally in the review.`;
  }
  if (rating === 3) {
    return `Only use "${employeeName}" when mentioning something positive. Otherwise say "the technician" or "the team."`;
  }
  return `Do NOT use the employee's name. Say "the technician" or "the team" instead. Never name individuals in negative reviews.`;
}

/* ═══════════════════════════════════════════════════
   PROMPT CONSTRUCTION
   ═══════════════════════════════════════════════════ */

function buildSystemPrompt(
  voice: ReviewVoice,
  rating: number,
  employeeName: string | null
): string {
  const tone = getToneLayer(rating);
  const empRule = getEmployeeRule(rating, employeeName);

  return `You are a review ghostwriter. You transform structured keyword inputs into a natural Google review.

${tone}

WRITING STYLE: ${voice.name}
${voice.prompt}

The star rating is truth. The writing style is style. The style NEVER overrides the rating's emotional register.

RULES — always apply:
- Target 30-80 words. Minimum 15 words (short_direct voice only). Maximum 100 words (thorough voice only). No voice ever exceeds 100 words.
- ${empRule}
- Never mention AI, Small Talk, or that this review was generated.
- Never start with "I" — vary your opening.
- No hashtags, no emojis.
- No "highly recommend" on anything below 4 stars.
- The review must read like a real Google review written by a real person.
- Output ONLY the review text. No quotation marks, no labels, no preamble.`;
}

function buildUserPrompt(input: GenerateReviewInput): string {
  const lines: string[] = [
    `Star rating: ${input.star_rating}/5`,
    `Business: ${input.business_name}`,
    `Service: ${input.service_type}`,
  ];

  if (input.employee_name) {
    lines.push(`Employee: ${input.employee_name}`);
  }

  lines.push("", "Topics and responses:");
  for (const topic of input.topics_selected) {
    let line = `- ${topic.label}: ${topic.follow_up_answer}`;
    if (topic.detail_text) {
      line += ` — "${topic.detail_text}"`;
    }
    lines.push(line);
  }

  if (input.optional_text) {
    lines.push("", `Additional comments from customer: "${input.optional_text}"`);
  }

  return lines.join("\n");
}

/* ═══════════════════════════════════════════════════
   PROVIDER FUNCTIONS
   ═══════════════════════════════════════════════════ */

type ProviderFn = (
  systemPrompt: string,
  userPrompt: string
) => Promise<string>;

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    max_tokens: 256,
    temperature: 0.9,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response format from Anthropic");
  }
  return block.text.trim();
}

async function callOpenAI(): Promise<string> {
  throw new Error("Provider not implemented yet");
}

async function callGemini(): Promise<string> {
  throw new Error("Provider not implemented yet");
}

const PROVIDER_ORDER = ["anthropic", "openai", "gemini"] as const;

const providers: Record<string, ProviderFn> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  gemini: callGemini,
};

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════ */

export async function generateReview(
  input: GenerateReviewInput
): Promise<GenerateReviewResult> {
  const primary = input.provider ?? process.env.REVIEW_PROVIDER ?? "anthropic";

  const voice = pickVoice(input.exclude_voice_id);
  const systemPrompt = buildSystemPrompt(
    voice,
    input.star_rating,
    input.employee_name
  );
  const userPrompt = buildUserPrompt(input);

  // Build fallback order: primary first, then remaining providers
  const fallbackOrder = [
    primary,
    ...PROVIDER_ORDER.filter((p) => p !== primary),
  ];

  let lastError: Error | null = null;

  for (const providerName of fallbackOrder) {
    const providerFn = providers[providerName];
    if (!providerFn) continue;

    try {
      const review_text = await providerFn(systemPrompt, userPrompt);
      const model =
        providerName === "anthropic"
          ? process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"
          : providerName;
      return {
        review_text,
        voice_id: voice.id,
        voice_name: voice.name,
        provider: providerName,
        model,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If it's "not implemented", skip to the next provider silently
      if (lastError.message.includes("not implemented")) continue;
      // For real failures (API error, timeout, etc.), also try fallback
      continue;
    }
  }

  throw new Error(
    `All providers failed. Last error: ${lastError?.message || "unknown"}`
  );
}
