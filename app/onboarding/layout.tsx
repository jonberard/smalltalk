import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Business — small Talk",
  description: "Get your business ready to collect detailed Google reviews.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
