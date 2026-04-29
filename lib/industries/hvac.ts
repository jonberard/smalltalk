import type { IndustryPageData } from "./types";

export const hvacData: IndustryPageData = {
  slug: "hvac",
  canonicalUrl: "https://usesmalltalk.com/for/hvac",
  breadcrumbLabel: "HVAC Companies",
  industryLabel: "For HVAC companies",
  metaTitle: "Help HVAC Customers Actually Write Google Reviews | small Talk",
  metaDescription: "small Talk helps HVAC repair, installation, and maintenance customers get past the blank box and leave detailed Google reviews from their real experience.",
  openGraphDescription: "Turn “thank God you came tonight” into a detailed Google review before the moment is gone.",
  ogImageAlt: "small Talk — Google review software for HVAC companies",
  softwareDescription: "small Talk helps HVAC customers actually write the Google review they meant to leave.",
  hero: {
    headline: "You fixed the AC at 9pm in July. Now they’re too tired to write about it.",
    subhead: "small Talk turns “thank God you came tonight” into a detailed Google review — before your customer forgets. Built for HVAC repair, installation, and maintenance businesses.",
    phoneMockup: {
      businessName: "Ironside HVAC",
      ratingPrompt: "How was your AC repair?",
      chips: [
        { label: "Same-day service", selected: true },
        { label: "Diagnosed it fast", selected: true },
        { label: "Explained the fix" },
        { label: "Fair price", selected: true },
        { label: "Friendly tech" },
      ],
      draftReview: "Called Ironside on a Sunday evening when our AC stopped working. Dave was at the house within 90 minutes, diagnosed the issue fast, and had us back to 72…",
    },
  },
  trustStrip: ["Customer-approved", "No review gating", "$79/mo", "Built for HVAC"],
  problem: {
    heading: "The best time to ask for a review is the moment the AC kicks back on. Not three days later.",
    paragraphs: [
      "It’s 103 degrees. Their house has been 88 inside since noon. Your tech shows up, finds a bad capacitor, swaps it, and the cold air hits. They’d write you a glowing review right then — if writing a review didn’t require them to think of something clever to say.",
      "By the time the house cools down and they remember, Google’s blank review box is the last thing they want to deal with. The moment is gone.",
      "Whether you have 62 reviews or just six, the problem is the same. Short reviews do not give future customers much to trust, and they give Google less service-specific context than a review that mentions the repair, the tech, the timing, and the city.",
    ],
  },
  builtForCards: {
    heading: "Built for how HVAC businesses work.",
    cards: [
      {
        icon: "phone",
        heading: "Send from the truck",
        body: "Your tech finishes the job at 4:52pm. They text the review link from their phone before they leave the driveway. small Talk works from any device — no app install, no special software on your service van tablet.",
      },
      {
        icon: "person",
        heading: "Tech attribution that actually means something",
        body: "Homeowners remember the person who fixed their AC at 10pm. “Dave was a lifesaver” is worth more than “good service.” small Talk lets reviews mention the tech by name — because that’s what the customer actually said.",
      },
      {
        icon: "calendar",
        heading: "Summer volume, winter calm, one flat price",
        body: "You get 500 customer requests each month. Run hot in August, coast a little in February, and if one stretch gets especially busy, add 100 more without changing your whole plan.",
      },
    ],
  },
  beforeAfter: {
    heading: "From “good service” to reviews that win you the next job.",
    subhead: "Real HVAC examples, not stock copy.",
    before: {
      name: "Mike R.",
      text: "Good service.",
      lengthLabel: "Average length: 2 words",
    },
    after: {
      name: "Mike R.",
      text: "Called Ironside at 7pm on a Sunday when our AC stopped working. Dave was at the house within 90 minutes, diagnosed a bad capacitor, had the replacement part on the truck, and had us back to 72 degrees by 9pm. He explained what went wrong and gave us honest advice about the age of the unit without trying to upsell us on a full replacement. First time we’ve felt like an HVAC company was actually on our side. Highly recommend.",
      lengthLabel: "Length: 82 words • Mentions: tech name, emergency response, specific issue, honest pricing",
    },
  },
  topicChipIntro: "small Talk comes pre-loaded with topics specific to HVAC. Customers tap. They don’t type.",
  topicChipRows: [
    {
      label: "For AC & heating repair",
      chips: [
        { label: "Same-day service", selected: true },
        { label: "Diagnosed it fast", selected: true },
        { label: "Had the part on the truck" },
        { label: "Fair price" },
        { label: "Didn’t upsell" },
        { label: "Explained the problem", selected: true },
        { label: "Cleaned up" },
        { label: "Honest about the unit" },
      ],
    },
    {
      label: "For installation",
      chips: [
        { label: "On schedule" },
        { label: "Clean install" },
        { label: "Walked me through it", selected: true },
        { label: "Proper permits" },
        { label: "Better than quoted" },
        { label: "Crew was respectful" },
        { label: "Works perfectly", selected: true },
      ],
    },
    {
      label: "For maintenance plans",
      chips: [
        { label: "Reliable scheduling" },
        { label: "Caught it before it broke", selected: true },
        { label: "Same tech every visit" },
        { label: "Thorough inspection", selected: true },
        { label: "Fair renewal" },
        { label: "Easy to reach" },
        { label: "Knows my system", selected: true },
      ],
    },
  ],
  honestReviews: {
    heading: "Sometimes the repair didn’t go smoothly. Honest reviews still matter.",
    paragraphs: [
      "Sometimes a compressor fails the day after you replaced the capacitor. Sometimes the customer thinks the estimate was too high. Sometimes something goes wrong and you need to know — before they tell the internet.",
      "small Talk gives every customer a real choice. Post publicly, even if it’s negative. Or send private feedback straight to you. No review gating. No hidden filters. Just a clean way to hear everything your customers have to say.",
    ],
  },
  pricing: {
    heading: "One price. Every HVAC business.",
    subhead: "No seasonal tiers. No per-review fees. No contracts.",
  },
  faqHeading: "Questions from HVAC businesses.",
  faq: [
    {
      question: "Does this work for one-truck shops and multi-tech operations?",
      answer: "Yes to both. Solo techs send review links from their phone after each job. Larger shops send from the office or give techs the ability to send from the field. No special setup either way.",
    },
    {
      question: "What about emergency / after-hours calls?",
      answer: "Especially after-hours. Those are the reviews that mean the most. Your tech sends the link as they’re leaving the driveway at 10pm — the customer completes it from bed and posts it before they forget how grateful they were.",
    },
    {
      question: "Can I track reviews by tech?",
      answer: "Yes. Add your techs in settings, assign them to review requests, and your dashboard shows which techs are generating the most reviews and the highest quality ones. Great for payroll bonuses or identifying training needs.",
    },
    {
      question: "Will this work with ServiceTitan/Housecall Pro/Jobber?",
      answer: "Native integrations are on the roadmap. For now, most HVAC shops start by sending links manually after each job in about 10 seconds. If you want an API or Zapier-style workflow, contact us and we’ll help you decide what is possible today.",
    },
    {
      question: "My techs aren’t great with tech. Can they actually send these?",
      answer: "If they can text a photo of the unit to dispatch, they can send a small Talk review link. It’s a text message with a link. That’s the whole interface on the send side.",
    },
  ],
  finalCta: {
    heading: "Your HVAC company deserves reviews that say so.",
    body: "Start your 7-day free trial. 10 review requests included. No credit card.",
  },
};
