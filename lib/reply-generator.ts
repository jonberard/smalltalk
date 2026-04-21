import { generateAiText } from "@/lib/ai-routing";
import type { AiProvider } from "@/lib/types";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export type GenerateReplyInput = {
  businessName: string;
  reviewText: string;
  starRating: number;
  employeeName?: string;
  serviceType?: string;
  topicsSelected?: { label: string; follow_up_answer: string }[];
  replyVoiceId: string;
  customReplyVoice?: string;
  reviewSource: "smalltalk" | "organic";
  provider?: AiProvider;
};

export type GenerateReplyResult = {
  reply_text: string;
  voice_id: string;
  provider: AiProvider;
  model: string;
};

/* ═══════════════════════════════════════════════════
   REPLY VOICES — tone guidance for business owner responses
   ═══════════════════════════════════════════════════ */

export type ReplyVoice = {
  id: string;
  name: string;
  prompt: string;
};

export const REPLY_VOICES: ReplyVoice[] = [
  {
    id: "warm_owner",
    name: "Warm Owner",
    prompt:
      "Friendly and grateful. Mention the employee by name if they were involved. Express genuine appreciation for the specifics they shared. End with a warm invitation to come back.",
  },
  {
    id: "professional_owner",
    name: "Professional",
    prompt:
      "Polished and measured. Acknowledge specific points from the review without being effusive. Maintain a composed, business-appropriate tone throughout. Precise language, no slang.",
  },
  {
    id: "casual_owner",
    name: "Casual",
    prompt:
      "Relaxed and short. Feels like a quick text from the owner — contractions, simple words, genuine but not formal. Skip corporate phrases entirely. Keep it to 1-2 sentences when possible.",
  },
  {
    id: "empathetic_owner",
    name: "Empathetic",
    prompt:
      "For negative or mixed reviews. Take responsibility without making excuses. Acknowledge what went wrong specifically. Offer a concrete path to resolution — not vague promises. Show the owner genuinely cares.",
  },
  {
    id: "brief_owner",
    name: "Brief",
    prompt:
      "One to two sentences maximum. Match the energy of short reviews. No fluff, no filler, no formalities. Just a quick, genuine acknowledgment and maybe a thank-you.",
  },
];

/* ═══════════════════════════════════════════════════
   VOICE RESOLUTION
   ═══════════════════════════════════════════════════ */

function getVoiceInstruction(voiceId: string, customVoice?: string): string {
  if (voiceId === "custom" && customVoice) {
    return `VOICE STYLE: Custom — ${customVoice}`;
  }
  const voice = REPLY_VOICES.find((v) => v.id === voiceId);
  if (voice) {
    return `VOICE STYLE: ${voice.name} — ${voice.prompt}`;
  }
  return `VOICE STYLE: Warm Owner — Friendly and grateful. Mention the employee by name if they were involved. Express genuine appreciation and invite them back.`;
}

/* ═══════════════════════════════════════════════════
   TONE BY RATING
   ═══════════════════════════════════════════════════ */

function getReplyTone(rating: number): string {
  switch (rating) {
    case 5:
      return "TONE: Grateful and warm. This customer loved the experience. Show genuine appreciation without being over-the-top.";
    case 4:
      return "TONE: Appreciative with subtle acknowledgment. Great experience but not perfect — don't oversell, be real.";
    case 3:
      return "TONE: Balanced. Acknowledge the mixed experience honestly. Thank them for the positives, own the negatives.";
    case 2:
      return "TONE: Empathetic. Take responsibility. Don't make excuses. Offer to make it right. Show you actually care.";
    case 1:
      return "TONE: Genuinely concerned. Don't get defensive. Don't argue. Acknowledge their frustration is valid. Offer direct contact to resolve this.";
    default:
      return "TONE: Professional and warm.";
  }
}

/* ═══════════════════════════════════════════════════
   PROMPT CONSTRUCTION
   ═══════════════════════════════════════════════════ */

function buildSystemPrompt(input: GenerateReplyInput): string {
  const voiceInstruction = getVoiceInstruction(input.replyVoiceId, input.customReplyVoice);
  const tone = getReplyTone(input.starRating);
  const isStarOnly = !input.reviewText || input.reviewText.trim().length === 0;

  const sourceContext = input.reviewSource === "smalltalk"
    ? `This review came through small Talk, so you have internal data about what the customer experienced. Use the topics and specific answers to make the reply personal and specific. Reference what they mentioned — e.g., "Marcus will love hearing this" or "I'm sorry the timing didn't meet your expectations."`
    : `This is an organic Google review. You only have the review text to work with. Still be specific — pull details from what they wrote and respond to them directly.`;

  return `You are a business owner writing a reply to a customer's Google review. You are replying AS the business, not as a third party.

${tone}

${voiceInstruction}

${sourceContext}

RULES — always apply:
- Match reply length to review length. A one-word or one-line review gets a one-line reply. A full paragraph gets a full paragraph. NEVER write a 4-sentence reply to "Good."
- Your reply must NEVER exceed 2x the word count of the review text. ${isStarOnly ? "This is a star-only review with no text — keep the reply to 1-2 short sentences." : ""}
- Include the business name naturally once.
- If the employee was mentioned positively, say you'll pass along the compliment. Use their name.
- For negative reviews: never argue, never make excuses, always offer a path to resolution.
- Never say "We appreciate your feedback" or "Thank you for your valuable feedback" — that's corporate robot speak. Be human.
- No emojis, no hashtags.
- For 4-5 star reviews: end with a natural invitation to return.
- For 1-2 star reviews: end with a direct contact offer (e.g., "Feel free to reach out to us directly").
- For 3 star reviews: end with either, depending on what fits.
- Output ONLY the reply text. No quotation marks, no labels, no preamble.`;
}

function buildUserPrompt(input: GenerateReplyInput): string {
  const lines: string[] = [
    `Business: ${input.businessName}`,
    `Star rating: ${input.starRating}/5`,
  ];

  if (input.reviewText && input.reviewText.trim()) {
    lines.push(`Review text: "${input.reviewText}"`);
  } else {
    lines.push("Review text: (none — star-only review, no text provided)");
  }

  if (input.serviceType) {
    lines.push(`Service: ${input.serviceType}`);
  }
  if (input.employeeName) {
    lines.push(`Employee: ${input.employeeName}`);
  }

  if (input.reviewSource === "smalltalk" && input.topicsSelected && input.topicsSelected.length > 0) {
    lines.push("", "Internal data from the review flow (customer's actual answers):");
    for (const topic of input.topicsSelected) {
      lines.push(`- ${topic.label}: ${topic.follow_up_answer}`);
    }
  }

  return lines.join("\n");
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════ */

export async function generateReply(
  input: GenerateReplyInput
): Promise<GenerateReplyResult> {
  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input);

  const result = await generateAiText({
    feature: "reply",
    starRating: input.starRating,
    systemPrompt,
    userPrompt,
    providerOverride: input.provider,
  });

  return {
    reply_text: result.text,
    voice_id: input.replyVoiceId,
    provider: result.provider,
    model: result.model,
  };
}
