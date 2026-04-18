import type { IndustryPageData } from "./types";

export const plumbersData: IndustryPageData = {
  slug: "plumbers",
  canonicalUrl: "https://usesmalltalk.com/for/plumbers",
  breadcrumbLabel: "Plumbers",
  industryLabel: "For plumbing companies",
  metaTitle: "Google Review Software for Plumbers — small Talk",
  metaDescription: "Get more detailed Google reviews from your plumbing customers. small Talk guides them through a 30-second conversation and drafts the review from their real answers. Built for emergency, repair, and installation plumbing businesses.",
  openGraphDescription: "Get more detailed Google reviews from your plumbing customers. Built for emergency, repair, and installation plumbing businesses.",
  ogImageAlt: "small Talk — Google review software for plumbers",
  softwareDescription: "Google review management software for plumbing businesses.",
  hero: {
    headline: "You saved their night. Tomorrow they’ll forget to say so.",
    subhead: "small Talk turns “you saved us” into a detailed Google review the next panicked homeowner will actually read. Built for emergency, repair, and installation plumbing businesses.",
    phoneMockup: {
      businessName: "Austin Rapid Plumbing",
      ratingPrompt: "How was your emergency call?",
      chips: [
        { label: "Same-day service", selected: true },
        { label: "Fixed it right", selected: true },
        { label: "Fair price" },
        { label: "Didn’t upsell", selected: true },
        { label: "Explained the problem" },
      ],
      draftReview: "Called Austin Rapid Plumbing at midnight with water pouring through our ceiling. Danny showed up within the hour, found the leak, and fixed it on the spot. No upsell, no…",
    },
  },
  trustStrip: ["Customer-approved", "No review gating", "$79/mo", "Built for plumbers"],
  problem: {
    heading: "The best review in plumbing comes from a customer who was just panicking. You have to catch them before they move on.",
    paragraphs: [
      "It’s 11pm and they’re standing in ankle-deep water. They call three plumbers. You’re the one who picks up. You show up in 40 minutes, find the shutoff, stop the leak, and explain what happened. They’d write you a five-page review that night — if anyone had asked.",
      "By noon the next day, the water’s gone, the carpet’s drying, and they’re back to their regular life. Writing a review means thinking of what to say and typing it out on a tiny screen. They don’t.",
      "Whether you have 300 reviews or just three, the problem is the same. Thin reviews give future customers less to trust, and they give Google less context than reviews that mention the emergency, the repair, the tech, the timing, and the city.",
    ],
  },
  builtForCards: {
    heading: "Built for how plumbers actually work.",
    cards: [
      {
        icon: "phone",
        heading: "Office-ready, field-ready, either way",
        body: "Some plumbing shops send review requests from the office the morning after the job. Others let the tech send from the field when it makes sense. small Talk works either way — any phone, any browser, no app install.",
      },
      {
        icon: "shield",
        heading: "Trust reviews that actually build trust",
        body: "Plumbing customers Google you before they call. “Honest quote” and “didn’t upsell” matter more than stars. small Talk surfaces those specific details naturally — because customers get prompted to mention what actually made them trust you.",
      },
      {
        icon: "wrench",
        heading: "Emergency volume, scheduled volume, one flat price",
        body: "Unlimited review requests. Send 400 after a busy month of burst pipes. Send 80 during a slow stretch. No per-request fees. No seasonal penalties.",
      },
    ],
  },
  beforeAfter: {
    heading: "From “good plumber” to reviews that win the emergency call.",
    subhead: "Real plumbing examples, not stock copy.",
    before: {
      name: "Karen T.",
      text: "Good plumber.",
      lengthLabel: "Average length: 2 words",
    },
    after: {
      name: "Karen T.",
      text: "Woke up at 2am to water pouring through our kitchen ceiling. Called three plumbers — Austin Rapid was the only one who answered and had someone at our house within an hour. Danny found the leaking pipe behind the shower wall, explained exactly what had happened, and gave us a fair quote for the repair before starting any work. No pressure, no upsell, no trying to scare us into a bigger job. Fixed it cleanly and even helped us figure out what to do about the water damage. If you ever need an emergency plumber in Austin, these are the people to call.",
      lengthLabel: "Length: 110 words • Mentions: emergency response, tech name, honest pricing, specific outcome, recommendation",
    },
  },
  topicChipIntro: "small Talk comes pre-loaded with topics specific to plumbing. Customers tap. They don’t type.",
  topicChipRows: [
    {
      label: "For emergency / repair calls",
      chips: [
        { label: "Came right away", selected: true },
        { label: "Found the problem fast" },
        { label: "Explained it clearly", selected: true },
        { label: "Fair price" },
        { label: "Didn’t upsell" },
        { label: "Cleaned up", selected: true },
        { label: "Honest about options" },
        { label: "Worked clean" },
      ],
    },
    {
      label: "For water heater / fixture installs",
      chips: [
        { label: "On schedule" },
        { label: "Clean install", selected: true },
        { label: "No leaks" },
        { label: "Better than quoted" },
        { label: "Walked me through it", selected: true },
        { label: "Hauled away old unit" },
        { label: "Works perfectly" },
        { label: "Fair price" },
      ],
    },
    {
      label: "For drain / sewer work",
      chips: [
        { label: "Diagnosed the problem", selected: true },
        { label: "Explained the options" },
        { label: "Fair estimate" },
        { label: "Didn’t overpromise", selected: true },
        { label: "Clean worksite" },
        { label: "Respected my house" },
        { label: "Actually fixed it", selected: true },
        { label: "Followed up" },
      ],
    },
  ],
  honestReviews: {
    heading: "Not every call ends well. Honest reviews still matter.",
    paragraphs: [
      "Sometimes the repair doesn’t hold. Sometimes the customer thought the estimate was too high. Sometimes the tech had a rough day. In plumbing, trust is everything — and you need to know when something went wrong before the customer tells the internet.",
      "small Talk gives every customer a real choice. Post publicly, even if it’s negative. Or send private feedback straight to your inbox. No review gating. No hiding the rough ones. Just a clean, honest way to hear from every customer.",
    ],
  },
  pricing: {
    heading: "One price. Every plumbing business.",
    subhead: "No tiers. No per-review fees. No contracts.",
  },
  faqHeading: "Questions from plumbers.",
  faq: [
    {
      question: "Does this work for solo plumbers and multi-truck operations?",
      answer: "Both. Solo plumbers typically send review links from their phone the next morning. Multi-truck shops send from the office or a dispatcher. You decide who sends — small Talk works from any device without special setup.",
    },
    {
      question: "Can I send review requests for jobs that ended at weird hours?",
      answer: "Yes — just don’t send them at weird hours. Most plumbing shops send emergency-job review requests the next morning, around 9 or 10am. The customer wakes up, sees the text, and remembers exactly how grateful they were. That timing works better than 2am anyway.",
    },
    {
      question: "Can I track which techs generate the best reviews?",
      answer: "Yes. Add your techs in settings, assign them to review requests, and your dashboard shows which techs are generating the most reviews and the highest quality ones. Great for bonuses, training, or just knowing who your customers really love.",
    },
    {
      question: "Will this work with ServiceTitan / Housecall Pro / Jobber?",
      answer: "Native integrations are on the roadmap. For now, most plumbing companies start by sending links manually in about 10 seconds after each job. If you want an API or Zapier-style workflow, contact us and we’ll help you decide what is possible today.",
    },
    {
      question: "My customers are often older and not tech-savvy. Will they be able to use it?",
      answer: "Yes. The flow is tap-based, not type-based. No writing required until an optional note at the end. Older customers are the ones most likely to abandon the blank Google review box — small Talk is specifically designed to get them past that moment.",
    },
  ],
  finalCta: {
    heading: "Your plumbing business deserves reviews that say so.",
    body: "Start your 7-day free trial. 10 review requests included. No credit card.",
  },
};
