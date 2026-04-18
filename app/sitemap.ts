import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://usesmalltalk.com";

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/not-review-gating`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/for/pool-companies`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/hvac`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/landscapers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/plumbers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/contractors`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
