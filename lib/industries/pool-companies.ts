import type { IndustryPageData } from "./types";

export const poolCompaniesData: IndustryPageData = {
  slug: "pool-companies",
  canonicalUrl: "https://usesmalltalk.com/for/pool-companies",
  breadcrumbLabel: "Pool Companies",
  industryLabel: "For pool companies",
  metaTitle: "Help Pool Customers Actually Write Google Reviews | small Talk",
  metaDescription: "small Talk helps pool cleaning, repair, and construction customers get past the blank box and leave detailed Google reviews from their real experience.",
  openGraphDescription: "Turn “the pool looks great” into a detailed Google review your next customer will actually read.",
  ogImageAlt: "small Talk — Google review software for pool companies",
  softwareDescription: "small Talk helps pool service customers actually write the Google review they meant to leave.",
  hero: {
    headline: "Your customers love the crystal-clear water. Getting them to say so on Google is the hard part.",
    subhead: "small Talk turns “the pool looks great” into a detailed Google review your next customer will actually read. Built for pool cleaning, repair, and construction businesses.",
    phoneMockup: {
      businessName: "Crystal Clear Pools",
      ratingPrompt: "How was your pool service?",
      chips: [
        { label: "Crystal clear water", selected: true },
        { label: "Marcus was great", selected: true },
        { label: "Fair price" },
        { label: "On time", selected: true },
        { label: "Explained everything" },
      ],
      draftReview: "Crystal Clear Pools has been taking care of our pool and we couldn’t be happier. Marcus is always on time and thorough. He explains what he’s doing and the water looks…",
    },
  },
  trustStrip: ["Customer-approved", "No review gating", "$79/mo", "Built for pool service"],
  problem: {
    heading: "Pool customers are busy. And they hate writing reviews.",
    paragraphs: [
      "You cleaned the pool. The chemistry’s perfect. The customer is happy. You send a review request text. They open it, see a blank Google review box asking them to write an essay about chemical balance, and they close the app.",
      "The next time they see your truck in the neighborhood, they think “I should leave them a review.” They don’t.",
      "Whether you have 47 reviews or just four, the problem is the same. A wall of “great service” reviews doesn’t win you the next customer comparing you to three other pool companies. Detailed reviews give both homeowners and Google more useful context about the services, people, and area you serve.",
    ],
  },
  builtForCards: {
    heading: "Built for how pool companies actually work.",
    cards: [
      {
        icon: "map-pin",
        heading: "Route-based sending",
        body: "Finish Mrs. Henderson’s pool at 2pm. Text her the review link at 2:05. small Talk works from any phone — your office, your truck, or the tech on-site.",
      },
      {
        icon: "person",
        heading: "Tech attribution built in",
        body: "Your customers remember the person. “Marcus did a great job” is worth more than “great service.” small Talk lets reviews mention the actual tech who showed up — naturally, because that’s what the customer said.",
      },
      {
        icon: "calendar",
        heading: "Seasonal-friendly pricing",
        body: "One flat price. No per-review fees. No penalties when you send 200 review requests in June and 40 in December. Pool businesses have seasons — your software should too.",
      },
    ],
  },
  beforeAfter: {
    heading: "From “great service” to reviews that actually sell.",
    subhead: "Real examples from pool service, not stock copy.",
    before: {
      name: "Sarah M.",
      text: "Great service.",
      lengthLabel: "Average length: 3 words",
    },
    after: {
      name: "Sarah M.",
      text: "Crystal Clear Pools has been taking care of our pool for the past six months and we couldn’t be happier. Marcus is our regular tech and he’s always on time, friendly, and thorough. He explains everything he’s doing and answers all our questions about chemistry. The water has never looked better. Highly recommend them for anyone in the Austin area looking for reliable pool service.",
      lengthLabel: "Length: 68 words • Mentions: tech name, service type, area, recommendation",
    },
  },
  topicChipIntro: "small Talk comes pre-loaded with topics specific to your business type. Customers tap. They don’t type.",
  topicChipRows: [
    {
      label: "For pool cleaning & maintenance",
      chips: [
        { label: "Crystal clear water", selected: true },
        { label: "On-time every week" },
        { label: "Fair price" },
        { label: "Friendly tech", selected: true },
        { label: "Handles chemistry" },
        { label: "Notices problems early", selected: true },
        { label: "Leaves yard clean" },
        { label: "Easy to reach" },
      ],
    },
    {
      label: "For pool repair",
      chips: [
        { label: "Showed up same day" },
        { label: "Explained the problem", selected: true },
        { label: "Fair estimate" },
        { label: "Fixed it right", selected: true },
        { label: "Didn’t upsell" },
        { label: "Cleaned up after" },
        { label: "Honest about options" },
      ],
    },
    {
      label: "For pool builders",
      chips: [
        { label: "On schedule" },
        { label: "Under budget" },
        { label: "Quality materials", selected: true },
        { label: "Great communication" },
        { label: "Handled permits", selected: true },
        { label: "Clean job site" },
        { label: "Exactly what I wanted", selected: true },
        { label: "Fixed issues quickly" },
      ],
    },
  ],
  honestReviews: {
    heading: "Pool season gets rough. Honest reviews still matter.",
    paragraphs: [
      "Sometimes the algae bloom wins. Sometimes a repair takes three visits. Sometimes the customer’s unhappy and you need to know — without them blasting you on Google.",
      "small Talk gives every customer a real choice. They can post publicly, even negatively. Or they can send their feedback directly to you. No review gating. No hidden routing. Just a business owner who actually wants to hear when something goes wrong.",
    ],
  },
  pricing: {
    heading: "One price. Every pool business.",
    subhead: "No seasonal tiers. No per-review fees. No contracts.",
  },
  faqHeading: "Questions from pool businesses.",
  faq: [
    {
      question: "Does this work for one-man operations and route-based techs?",
      answer: "Yes. small Talk works from any phone. Solo operators send review links from their truck. Multi-tech crews send from the office or assign the send to the tech who finished the job. No special setup.",
    },
    {
      question: "What about seasonal businesses? Do I pay for months I’m not working?",
      answer: "Yes, it’s a flat $79/month year-round with 500 customer requests included each month. That gives most pool businesses plenty of room for the busy season, and if one stretch runs hotter than expected, you can add 100 more without switching plans.",
    },
    {
      question: "Can I include the tech’s name in the review?",
      answer: "Yes. small Talk lets customers select the tech who did the work. Their name shows up naturally in the generated review — because the customer is actually saying they liked that specific person.",
    },
    {
      question: "Will it integrate with Jobber/Housecall Pro/my scheduling software?",
      answer: "Native integrations are on the roadmap. For now, you can send links manually after each job in about 10 seconds. If you want an API or Zapier-style workflow, contact us and we’ll help you decide what is possible today.",
    },
    {
      question: "My customers are mostly older. Will they figure it out?",
      answer: "Yes — and this is actually where small Talk shines. Older customers are the ones who freeze at the blank Google review box. Our flow is tap-based, not type-based. No keyboard required until the final optional note. If grandma can text her grandkids, she can use small Talk.",
    },
  ],
  finalCta: {
    heading: "Your pool service deserves reviews that say so.",
    body: "Start your 7-day free trial. 10 review requests included. No credit card.",
  },
};
