import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share Your Experience — small Talk",
  description:
    "Take 60 seconds to share your honest experience. Your feedback helps the business and future customers.",
  openGraph: {
    title: "Share Your Experience — small Talk",
    description:
      "Take 60 seconds to share your honest experience.",
    type: "website",
  },
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
