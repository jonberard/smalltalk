import type { Metadata } from "next";
import type { IndustryPageData } from "./types";

export function createIndustryMetadata(data: IndustryPageData): Metadata {
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    openGraph: {
      title: data.metaTitle,
      description: data.openGraphDescription,
      type: "website",
      url: data.canonicalUrl,
      siteName: "small Talk",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: data.ogImageAlt,
        },
      ],
    },
    alternates: { canonical: data.canonicalUrl },
  };
}
