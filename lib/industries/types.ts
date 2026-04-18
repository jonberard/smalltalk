export type Chip = {
  label: string;
  selected?: boolean;
};

export type IndustryIconKey =
  | "phone"
  | "person"
  | "calendar"
  | "shield"
  | "wrench"
  | "layers"
  | "users"
  | "building"
  | "dollar"
  | "clock"
  | "map-pin";

export type IndustryPageData = {
  slug: string;
  canonicalUrl: string;
  breadcrumbLabel: string;
  industryLabel: string;
  metaTitle: string;
  metaDescription: string;
  openGraphDescription: string;
  ogImageAlt: string;
  softwareDescription: string;
  hero: {
    headline: string;
    subhead: string;
    phoneMockup: {
      businessName: string;
      ratingPrompt: string;
      chips: Chip[];
      draftReview: string;
    };
  };
  trustStrip: string[];
  problem: {
    heading: string;
    paragraphs: string[];
  };
  builtForCards: {
    heading: string;
    cards: {
      icon: IndustryIconKey;
      heading: string;
      body: string;
    }[];
  };
  beforeAfter: {
    heading: string;
    subhead: string;
    before: { name: string; text: string; lengthLabel: string };
    after: { name: string; text: string; lengthLabel: string };
  };
  topicChipIntro: string;
  topicChipRows: {
    label: string;
    chips: Chip[];
  }[];
  honestReviews: {
    heading: string;
    paragraphs: string[];
  };
  pricing: {
    heading: string;
    subhead: string;
  };
  faqHeading: string;
  faq: {
    question: string;
    answer: string;
  }[];
  finalCta: {
    heading: string;
    body: string;
  };
};
