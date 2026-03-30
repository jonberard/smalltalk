export type ReviewVoice = {
  id: string;
  name: string;
  prompt: string;
};

export const REVIEW_VOICES: ReviewVoice[] = [
  {
    id: "short_direct",
    name: "Short & Direct",
    prompt:
      "Convert each keyword into one brief clause. Chain them with periods, not commas. No filler words, no transitions, no scene-setting. The entire review should be 1-2 sentences, 15-30 words. If a keyword doesn't add new information, skip it.",
  },
  {
    id: "thorough",
    name: "Thorough",
    prompt:
      "Give each keyword its own sentence or clear mention. Use transitional phrases like 'on top of that' or 'worth noting' to connect ideas naturally. Be specific — convert vague keywords into concrete observations. Write 4-5 sentences, 80-100 words total.",
  },
  {
    id: "warm",
    name: "Warm",
    prompt:
      "Open with a feeling word — 'impressed,' 'pleased,' 'grateful.' Convert keywords into appreciative language that sounds genuine, not gushing. Close with a natural recommendation that flows from what was said. Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "matter_of_fact",
    name: "Matter of Fact",
    prompt:
      "State each keyword as a plain observation with zero emotional color. No adjectives beyond what the keyword itself implies. Reads like someone filling out a survey in complete sentences. Write 2-3 sentences, 30-50 words.",
  },
  {
    id: "enthusiastic",
    name: "Enthusiastic",
    prompt:
      "Identify the strongest keyword and lead with it emphatically. Use one exclamation point maximum. Convert neutral keywords into energetic language — 'on time' becomes 'right on schedule.' Vocabulary should feel genuinely excited, not performative. Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "understated",
    name: "Understated",
    prompt:
      "Downplay praise subtly. 'Exceptional' becomes 'honestly better than I expected.' 'Great value' becomes 'hard to argue with the price.' Let the reader infer enthusiasm from specificity rather than adjectives. Write 2-3 sentences, 30-50 words.",
  },
  {
    id: "advice_giver",
    name: "Advice Giver",
    prompt:
      "Frame the review as a recommendation. Start with 'If you're looking for...' or similar. Weave keywords in as reasons someone should choose this service. The reader should feel like they're getting a tip from a friend. Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "narrative",
    name: "Narrative",
    prompt:
      "Set a one-sentence context — why the service was needed or what the situation was. Then weave keywords into a brief story of what happened. End with the outcome or how things turned out. Write 3-4 sentences, 60-80 words.",
  },
  {
    id: "bottom_line",
    name: "Bottom Line",
    prompt:
      "Start with the verdict — the overall impression in one decisive clause. Then use keywords as supporting evidence for that verdict. The structure is conclusion-first, details-second. Write 2-3 sentences, 30-50 words.",
  },
  {
    id: "comparative",
    name: "Comparative",
    prompt:
      "Reference past experiences vaguely — 'I've used a few services like this' or 'compared to what I'm used to.' Use keywords to explain what made this one different. Never name competitors or specific businesses. Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "technical",
    name: "Technical",
    prompt:
      "Focus on how the work was done, not how it felt. Convert keywords into craft-specific observations — 'clean' becomes a note about technique, 'on time' becomes a note about scheduling logistics. The reviewer sounds like they understand the trade. Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "casual",
    name: "Casual",
    prompt:
      "Write like a text to a friend. Use contractions freely. Drop in 'honestly' or 'gotta say' naturally. Convert formal keywords into everyday language — 'professional' becomes 'knew what they were doing.' No stiff phrasing. Write 2-3 sentences, 30-50 words.",
  },
  {
    id: "professional",
    name: "Professional",
    prompt:
      "Use measured, clean prose with no slang or colloquialisms. Keywords become business-appropriate language. Sentences are structured and complete. The reviewer sounds like someone who writes emails for a living. Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "relieved",
    name: "Relieved",
    prompt:
      "Imply there was a worry or past bad experience without dwelling on it. Use keywords to frame how this service resolved that concern. The emotional arc is anxiety-to-relief. 'On time' becomes 'actually showed up when they said they would.' Write 2-3 sentences, 40-60 words.",
  },
  {
    id: "loyal",
    name: "Loyal",
    prompt:
      "Write as someone with an ongoing relationship. 'On time' becomes 'consistently on time.' 'Good quality' becomes 'always solid work.' Keywords reinforce a pattern of reliability rather than a single visit. Imply you'll keep using them. Write 2-3 sentences, 40-60 words.",
  },
];
