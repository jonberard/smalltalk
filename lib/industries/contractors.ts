import type { IndustryPageData } from "./types";

export const contractorsData: IndustryPageData = {
  slug: "contractors",
  canonicalUrl: "https://usesmalltalk.com/for/contractors",
  breadcrumbLabel: "Contractors",
  industryLabel: "For contractors & remodelers",
  metaTitle: "Google Review Software for Contractors and Remodelers — small Talk",
  metaDescription: "Get more detailed Google reviews from your renovation and remodeling customers. small Talk guides them through a 30-second conversation and drafts the review from their real answers. Built for general contractors, remodelers, and home improvement businesses.",
  openGraphDescription: "Get more detailed Google reviews from your renovation and remodeling customers. Built for general contractors, remodelers, and home improvement businesses.",
  ogImageAlt: "small Talk — Google review software for contractors and remodelers",
  softwareDescription: "Google review management software for contractors and remodeling businesses.",
  hero: {
    headline: "They just wrote you a check for $40,000. A review would be nice too.",
    subhead: "small Talk turns “the kitchen looks amazing” into a detailed Google review the next homeowner will actually trust. Built for general contractors, remodelers, and home improvement businesses.",
    phoneMockup: {
      businessName: "Hartwell Construction",
      ratingPrompt: "How was your kitchen remodel?",
      chips: [
        { label: "On schedule", selected: true },
        { label: "Quality work", selected: true },
        { label: "Clean jobsite" },
        { label: "Great communication", selected: true },
        { label: "Handled problems well" },
      ],
      draftReview: "Hartwell Construction did a full kitchen remodel for us. Mike and his crew were on schedule every single day, communicated constantly, and the quality of work was…",
    },
  },
  trustStrip: ["Customer-approved", "No review gating", "$79/mo", "Built for contractors"],
  problem: {
    heading: "Remodels are the reviews that matter most — and the hardest to get.",
    paragraphs: [
      "Your customer just spent two months living without a kitchen. They had a stranger in their house every day. They wrote you the biggest check they’ve written in years. When it’s done and they love it, they absolutely want to tell people — and they’re exhausted.",
      "The next morning, reality sets in. Kids, work, making lunches in the new kitchen. A Google review means sitting down with their phone and thinking of what to say. It doesn’t happen. They meant to. They didn’t.",
      "Whether you have 85 reviews or just eight, the problem is the same. For a $40,000 decision, homeowners read the reviews. Thin ones do not close the deal, and they give Google less project-specific context than reviews that mention the scope, communication, neighborhood, and finished result.",
    ],
  },
  builtForCards: {
    heading: "Built for how contractors actually work.",
    cards: [
      {
        icon: "building",
        heading: "Projects, not jobs",
        body: "Your work isn’t a 30-minute service call. It’s a multi-week project the customer remembers in detail — the crew, the schedule, the change orders, the finish. small Talk guides them through all of it, so the review mentions what actually happened.",
      },
      {
        icon: "users",
        heading: "Crew and sub-attribution",
        body: "Your customers remember Miguel and his framing crew. They remember the electrician who came back twice to get the island outlets right. small Talk lets reviews name the people the customer actually interacted with — because that’s who built their trust.",
      },
      {
        icon: "dollar",
        heading: "One price, every project size",
        body: "Whether you finish 6 projects a year or 60, it’s $79/month. Unlimited review requests. No contracts. No per-project fees.",
      },
    ],
  },
  beforeAfter: {
    heading: "From “great job” to reviews that sell the next kitchen.",
    subhead: "Real contractor examples, not stock copy.",
    before: {
      name: "Thomas D.",
      text: "Great job.",
      lengthLabel: "Average length: 2 words",
    },
    after: {
      name: "Thomas D.",
      text: "Hartwell Construction did a full kitchen remodel for us over about eight weeks — new cabinets, quartz counters, island, lighting, and flooring. From the first meeting with Mike to the final walkthrough, every part of this was more professional than we expected. Their crew showed up when they said they would every single day, kept the jobsite clean, and communicated daily about what was happening next. When we hit a few unexpected issues with the plumbing, they solved them without inflating the price. The result is a kitchen that looks exactly like the 3D renderings they showed us. Worth every dollar. We’re already planning a bathroom remodel with them next year.",
      lengthLabel: "Length: 125 words • Mentions: scope, crew, communication, problem-solving, repeat business",
    },
  },
  topicChipIntro: "small Talk comes pre-loaded with topics specific to contractor work. Customers tap. They don’t type.",
  topicChipRows: [
    {
      label: "For kitchen & bath remodels",
      chips: [
        { label: "On schedule", selected: true },
        { label: "Clean jobsite" },
        { label: "Quality materials" },
        { label: "Great communication", selected: true },
        { label: "Crew was respectful" },
        { label: "Handled problems well", selected: true },
        { label: "Looks like the design" },
        { label: "Fair change orders" },
      ],
    },
    {
      label: "For additions & whole-house",
      chips: [
        { label: "Stayed on budget" },
        { label: "Handled permits", selected: true },
        { label: "Daily updates" },
        { label: "Quality craftsmanship" },
        { label: "Subs were professional", selected: true },
        { label: "Solved surprises" },
        { label: "Protected the rest of the house" },
        { label: "Final walkthrough was thorough" },
      ],
    },
    {
      label: "For decks, roofing & exterior",
      chips: [
        { label: "On schedule" },
        { label: "Clean crew" },
        { label: "Quality materials", selected: true },
        { label: "Fair price" },
        { label: "Walked us through options", selected: true },
        { label: "Handled weather delays" },
        { label: "Works perfectly" },
        { label: "Great warranty", selected: true },
      ],
    },
  ],
  honestReviews: {
    heading: "Projects go sideways. Honest reviews still matter.",
    paragraphs: [
      "Sometimes the subs no-show. Sometimes the materials come in wrong. Sometimes the customer thought the change order was too expensive. On a two-month project, a lot can go wrong — and you need to know before they post it on Google.",
      "small Talk gives every customer a real choice. Post publicly, even if the project had issues. Or send private feedback straight to your inbox. No review gating. No hiding the tough ones. Just honest customers, honestly heard — while there’s still time to make it right.",
    ],
  },
  pricing: {
    heading: "One price. Every contractor.",
    subhead: "No tiers. No per-project fees. No contracts.",
  },
  faqHeading: "Questions from contractors and remodelers.",
  faq: [
    {
      question: "When’s the right time to send a review request on a big project?",
      answer: "A few days after the final walkthrough, once the customer has lived in the finished space a little. Send it too soon and they’re still processing the stress. Send it too late and the emotion is gone. Most contractors land on 3–7 days after completion. You can also do a second ask at the 30-day mark if the first didn’t get completed.",
    },
    {
      question: "Can the review mention my subs or specific crew members?",
      answer: "Yes. small Talk lets customers select the people they worked with — foreman, project manager, specific tradespeople. Those names show up naturally in the generated review because the customer actually said they liked them.",
    },
    {
      question: "What about commercial projects?",
      answer: "small Talk is designed for residential work where the decision-maker is also the reviewer. Commercial GC reviews typically come from property managers or owners who review you separately — small Talk can still work, but the product is sharper for residential.",
    },
    {
      question: "Will this work with Buildertrend / CoConstruct / JobTread?",
      answer: "Native integrations aren’t live yet. For now, most contractors start by sending review links manually when a project closes. If you want an API or Zapier-style workflow for your project management tool, contact us and we’ll help you decide what is possible today.",
    },
    {
      question: "I only finish a few big projects a year. Is $79/month worth it?",
      answer: "If one detailed review helps you land one additional $30,000 kitchen, that’s 32 years of small Talk paid for. The math works even on low project volume — because each review on a contractor profile has outsized impact for the next homeowner’s decision.",
    },
  ],
  finalCta: {
    heading: "Your work deserves reviews that describe it.",
    body: "Start your 7-day free trial. 10 review requests included. No credit card.",
  },
};
