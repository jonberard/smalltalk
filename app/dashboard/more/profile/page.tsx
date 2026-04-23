"use client";

import { useAuth } from "@/lib/auth-context";
import {
  SetupPageShell,
  SetupTrustBanner,
} from "@/components/dashboard/setup-shell";
import { BusinessProfile } from "@/components/dashboard/setup-sections";

export default function ProfileSetupPage() {
  const { business } = useAuth();

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Profile"
      title="Keep the basics current."
      description="This is the simple identity layer behind every request: your business name, logo, and the Google profile customers hand off to at the end."
      headerTone="detail"
    >
      <div className="space-y-5">
        <SetupTrustBanner text="Most businesses only come back here when something changes." />

        <BusinessProfile
          businessId={business.id}
          initial={{
            name: business.name,
            logo_url: business.logo_url,
            google_review_url: business.google_review_url,
            google_place_id: business.google_place_id,
          }}
        />
      </div>
    </SetupPageShell>
  );
}
