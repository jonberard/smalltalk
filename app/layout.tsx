import type { Metadata } from "next";
import { Fraunces, DM_Sans, Inter } from "next/font/google";
import { Suspense } from "react";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dashboard",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://usesmalltalk.com"),
  title: "small Talk — The No-Blank-Box Google Review Tool for Home Service Businesses",
  description:
    "Stop sending customers to a blank Google review box. small Talk guides customers through a 30-second conversation and drafts a detailed Google review from their real answers. No review gating. No fake reviews.",
  openGraph: {
    title: "small Talk — The No-Blank-Box Google Review Tool for Home Service Businesses",
    description:
      "Stop sending customers to a blank Google review box. small Talk guides customers through a 30-second conversation and drafts a detailed Google review from their real answers.",
    type: "website",
    url: "https://usesmalltalk.com",
    siteName: "small Talk",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "small Talk — The no-blank-box Google review tool" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "small Talk",
    description: "Stop sending customers to a blank Google review box. small Talk guides them through a 30-second conversation and drafts a detailed review from their real answers.",
    images: ["/opengraph-image"],
  },
  other: {
    "theme-color": "#E05A3D",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
      </head>
      <body className="bg-background font-body text-text antialiased">
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
