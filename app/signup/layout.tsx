import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — small Talk",
  description: "Start getting detailed Google reviews in minutes.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
