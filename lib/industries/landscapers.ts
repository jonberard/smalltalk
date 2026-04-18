import type { IndustryPageData } from "./types";

export const landscapersData: IndustryPageData = {
  slug: "landscapers",
  canonicalUrl: "https://usesmalltalk.com/for/landscapers",
  breadcrumbLabel: "Landscapers",
  industryLabel: "For landscaping companies",
  metaTitle: "Google Review Software for Landscaping Companies — small Talk",
  metaDescription: "Get more detailed Google reviews from your landscaping, lawn care, and hardscape customers. small Talk guides them through a 30-second conversation and drafts the review from their real answers.",
  openGraphDescription: "Get more detailed Google reviews from your landscaping, lawn care, and hardscape customers.",
  ogImageAlt: "small Talk — Google review software for landscaping companies",
  softwareDescription: "Google review management software for landscaping businesses.",
  hero: {
    headline: "The yard looks incredible. Now convince the next customer with words.",
    subhead: "small Talk turns “the guys did a great job” into a detailed Google review that shows off the work you actually did. Built for lawn care, landscaping, and hardscape businesses.",
    phoneMockup: {
      businessName: "Greenlawn Austin",
      ratingPrompt: "How was your yard project?",
      chips: [
        { label: "Design ideas", selected: true },
        { label: "On schedule" },
        { label: "Clean jobsite", selected: true },
        { label: "Fair price" },
        { label: "Crew was respectful", selected: true },
      ],
      draftReview: "Greenlawn Austin redid our entire backyard and the result is better than we pictured. Miguel’s crew was respectful, kept the jobsite clean, and walked us through every…",
    },
  },
  trustStrip: ["Customer-approved", "No review gating", "$79/mo", "Built for landscaping"],
  problem: {
    heading: "Landscaping is a visual business. Your Google reviews aren’t.",
    paragraphs: [
      "Your customer stands at the window watching the crew finish. The patio looks incredible. The lawn is striped. The flowerbeds are edged. They think, “I have to tell people about this.”",
      "Then they sit down to write a review and realize they don’t know how to describe it. “Great job” feels thin. “They did what they said they would” feels flat. They close the tab.",
      "Whether you have 85 reviews or just eight, the problem is the same. Thin reviews don’t showcase the work you actually did, and they give future customers and Google less context than reviews that mention the project, materials, crew, neighborhood, and outcome.",
    ],
  },
  builtForCards: {
    heading: "Built for how landscapers actually work.",
    cards: [
      {
        icon: "layers",
        heading: "Route work and project work, same tool",
        body: "Weekly lawn customers, one-time installs, seasonal cleanups — different customers need different review angles. small Talk handles all of them with service-specific topic chips so reviews actually describe the work.",
      },
      {
        icon: "users",
        heading: "Crew attribution, not just company",
        body: "Customers love the crew, not the LLC. “Miguel’s team was fantastic” matters more than “great company.” small Talk lets reviews name the actual people who showed up.",
      },
      {
        icon: "calendar",
        heading: "Seasonal pricing that doesn’t punish you",
        body: "Send 300 review requests in May, 40 in January — same flat $79/month. No per-request fees. Your slow season shouldn’t cost more.",
      },
    ],
  },
  beforeAfter: {
    heading: "From “great job” to reviews that sell the next project.",
    subhead: "Real landscaping examples, not stock copy.",
    before: {
      name: "Jennifer K.",
      text: "Great job.",
      lengthLabel: "Average length: 2 words",
    },
    after: {
      name: "Jennifer K.",
      text: "Greenlawn Austin redid our entire backyard — new flagstone patio, retaining wall, and drought-tolerant beds — and the result is better than we pictured. Miguel’s crew showed up when they said they would every single day, kept the jobsite immaculate, and walked us through every decision before they made it. The patio is level, the plants are thriving, and we’ve already had neighbors ask who did the work. Will definitely use them again for our front yard.",
      lengthLabel: "Length: 78 words • Mentions: crew, specific services, cleanliness, specific outcomes, referral intent",
    },
  },
  topicChipIntro: "small Talk comes pre-loaded with topics specific to your type of work. Customers tap. They don’t type.",
  topicChipRows: [
    {
      label: "For lawn care & maintenance",
      chips: [
        { label: "Lawn looks great", selected: true },
        { label: "Same day every week" },
        { label: "Crew is respectful", selected: true },
        { label: "Fair price" },
        { label: "Cleans up" },
        { label: "Consistent quality", selected: true },
        { label: "Easy to reach" },
        { label: "Handles problems fast" },
      ],
    },
    {
      label: "For landscape design & install",
      chips: [
        { label: "Design ideas", selected: true },
        { label: "Listened to what we wanted" },
        { label: "On schedule" },
        { label: "Clean jobsite" },
        { label: "Quality plants" },
        { label: "Crew was professional" },
        { label: "Better than we pictured", selected: true },
        { label: "Fair change orders" },
      ],
    },
    {
      label: "For hardscape & irrigation",
      chips: [
        { label: "Level and even" },
        { label: "Quality materials" },
        { label: "Handled drainage", selected: true },
        { label: "Explained the system" },
        { label: "Clean install" },
        { label: "No mess left behind" },
        { label: "Works perfectly", selected: true },
        { label: "Walked me through maintenance" },
      ],
    },
  ],
  honestReviews: {
    heading: "Sometimes the weather wins. Honest reviews still matter.",
    paragraphs: [
      "Sometimes the rain delays the install. Sometimes a plant dies the first month. Sometimes the customer isn’t thrilled with how the patio turned out. You need to know — before they tell the internet.",
      "small Talk gives every customer a real choice. Post publicly, even if it’s not glowing. Or send private feedback straight to your inbox. No review gating. No hiding the negatives. Just honest customers, honestly heard.",
    ],
  },
  pricing: {
    heading: "One price. Every landscaping business.",
    subhead: "No seasonal tiers. No per-review fees. No contracts.",
  },
  faqHeading: "Questions from landscaping businesses.",
  faq: [
    {
      question: "Does this work for solo lawn guys and crew-based operations?",
      answer: "Both. Solo operators send review links from their phone after each job. Crew-based companies send from the office or let the foreman send from the field. Works from any device — no app to install.",
    },
    {
      question: "What about weekly route customers? Do I send a review request every week?",
      answer: "No — and you shouldn’t. We recommend sending review links after specific moments: the first month of service, after a big project, after you’ve solved a problem they called about, or a few times a year for long-time customers. Weekly asks get ignored and feel needy. small Talk is designed for when the review will actually mean something.",
    },
    {
      question: "Can reviews mention specific services like ‘flagstone patio’ or ‘irrigation’?",
      answer: "Yes. small Talk lets customers select the type of work done, and that specificity makes it into the generated review naturally. Future customers searching ‘flagstone patio installation near me’ find reviews that actually mention flagstone patios.",
    },
    {
      question: "Will it work with LandscapePro / Jobber / Service Autopilot?",
      answer: "Native integrations are on the roadmap. For now, you can send links manually in about 10 seconds. If you want an API or Zapier-style workflow for your landscaping CRM, contact us and we’ll help you decide what is possible today.",
    },
    {
      question: "My older customers don’t use smartphones much. Will they figure it out?",
      answer: "Yes. The whole flow is tap-based, not type-based. No writing required until an optional note at the end. Older customers are actually the ones most likely to abandon a blank Google review box — small Talk’s guided flow is specifically designed for them.",
    },
  ],
  finalCta: {
    heading: "Your landscaping work deserves reviews that show it.",
    body: "Start your 7-day free trial. 10 review requests included. No credit card.",
  },
};
