import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — small Talk",
  description: "Sign in to your small Talk dashboard.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
