import type { Metadata } from "next";
import { Fraunces, DM_Sans, Inter } from "next/font/google";
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
  title: "small Talk — Get More Detailed Google Reviews",
  description:
    "Collect honest, detailed reviews through a guided conversation. Customers approve before posting.",
  openGraph: {
    title: "small Talk — Get More Detailed Google Reviews",
    description:
      "Collect honest, detailed reviews through a guided conversation.",
    type: "website",
    url: "https://usesmalltalk.com",
    siteName: "small Talk",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "small Talk — Get more detailed Google reviews" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "small Talk",
    description: "Collect honest, detailed Google reviews",
    images: ["/og-image.svg"],
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
        {children}
      </body>
    </html>
  );
}
