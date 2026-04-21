export type OwnerHelpArticle = {
  slug: string;
  category: "start-here" | "statuses" | "links";
  eyebrow: string;
  title: string;
  summary: string;
  readTime: string;
  shortAnswer: string;
  howItWorks: string[];
  inPractice: string[];
  commonConfusion: string;
  nextSteps: string[];
  relatedSlugs: string[];
};

export const OWNER_HELP_WORKFLOW = [
  {
    step: "1",
    title: "Send a request",
    detail: "Text or email a personalized request, or use the shared QR/generic link when you need one link for everyone.",
  },
  {
    step: "2",
    title: "Customer goes through the flow",
    detail: "They rate the experience, answer a few guided prompts, and small Talk drafts a review from their real inputs.",
  },
  {
    step: "3",
    title: "They copy and head to Google",
    detail: "The customer still has to paste and post the review on Google manually. small Talk cannot submit it for them.",
  },
  {
    step: "4",
    title: "Low ratings can stay private first",
    detail: "Customers with a low rating can choose private feedback instead of public posting, so you hear the issue directly.",
  },
];

export const OWNER_HELP_ARTICLES: OwnerHelpArticle[] = [
  {
    slug: "how-it-works",
    category: "start-here",
    eyebrow: "Start here",
    title: "How small Talk works",
    summary:
      "A plain-English walkthrough of what happens after you send a request, what the customer sees, and where the process ends in Google.",
    readTime: "3 min read",
    shortAnswer:
      "small Talk guides the customer through a short review-writing flow, drafts the review from their real inputs, then hands them off to Google to paste and post it themselves.",
    howItWorks: [
      "You send a personalized request by text or email, or you share the generic QR/shared link when you need one reusable entry point.",
      "The customer rates the experience and taps through a few guided prompts so the draft is based on what actually happened.",
      "small Talk drafts the review in their voice. The customer can edit it, copy it, and then we open the Google handoff.",
      "If the customer gives a low rating, they can choose either to post publicly or to send private feedback directly to you.",
    ],
    inPractice: [
      "This means small Talk helps with the hardest part of the process: getting from a blank review box to real written feedback.",
      "It also means the last part still belongs to the customer and to Google. We can guide the handoff, but we do not control the final post.",
    ],
    commonConfusion:
      "Owners sometimes assume small Talk posts reviews to Google automatically. It does not. The customer still has to paste and submit the review on Google.",
    nextSteps: [
      "Read what “Copied” actually means so you know what the dashboard can confirm.",
      "Choose the right request type: personalized link or QR/shared link.",
    ],
    relatedSlugs: ["what-copied-means", "personalized-links-vs-qr"],
  },
  {
    slug: "what-copied-means",
    category: "statuses",
    eyebrow: "Statuses",
    title: "What “Copied” actually means",
    summary:
      "The most important status to understand clearly: copied is the last confirmed step inside small Talk, not proof that a Google review is live.",
    readTime: "2 min read",
    shortAnswer:
      "“Copied” means the customer copied the draft review and we opened the Google handoff. It does not mean the review is live on Google.",
    howItWorks: [
      "The customer finishes the draft, taps the copy button, and small Talk copies the text to their clipboard.",
      "Right after that, we send them to Google so they can paste and submit the review.",
      "From that point forward, Google owns the final post. We can no longer confirm whether the customer actually pasted and submitted it.",
    ],
    inPractice: [
      "Treat “Copied” as a strong positive signal, not as final proof of a live review.",
      "If you need to know what actually posted, check Google directly.",
    ],
    commonConfusion:
      "The dashboard can honestly say the customer copied the review and reached the Google handoff. It should not claim a Google review was posted unless we later add confirmed Google review sync.",
    nextSteps: [
      "Use the request detail timeline to see the last confirmed action inside small Talk.",
      "If copied counts feel high but Google looks light, read why a review may not appear on Google next.",
    ],
    relatedSlugs: ["how-it-works", "personalized-links-vs-qr"],
  },
  {
    slug: "personalized-links-vs-qr",
    category: "links",
    eyebrow: "Links and QR codes",
    title: "Personalized links vs QR/shared links",
    summary:
      "When to use each request type, what each one tracks, and why owners should use both instead of treating them like interchangeable tools.",
    readTime: "3 min read",
    shortAnswer:
      "Use personalized links when you know the customer and want request-level tracking. Use the QR/shared link when you need one reusable link for anyone to scan or open.",
    howItWorks: [
      "A personalized link is tied to one review request. It works best when you have the customer’s phone number or email and want to follow that request through the dashboard.",
      "The generic QR/shared link is reusable. It is great for counters, receipts, leave-behinds, yard signs, and in-person service moments where you just want a simple door into the review flow.",
      "Personalized links are better when you want reminders, clearer request history, and direct follow-up context. QR/shared links are better when convenience matters more than per-customer tracking.",
    ],
    inPractice: [
      "If you are texting or emailing someone directly, use a personalized link.",
      "If you are printing a QR code or using one link in many places, use the shared link.",
    ],
    commonConfusion:
      "The QR/shared link is not a worse version of the personalized link. It is a different tool for a different situation. Owners usually need both.",
    nextSteps: [
      "Use personalized requests when you want individual tracking and reminders.",
      "Use the QR/shared link for in-person moments, printed materials, or a simple always-available review path.",
    ],
    relatedSlugs: ["how-it-works", "what-copied-means"],
  },
];

export function getOwnerHelpArticle(slug: string) {
  return OWNER_HELP_ARTICLES.find((article) => article.slug === slug) ?? null;
}
