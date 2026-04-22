"use client";

import { useAuth } from "@/lib/auth-context";
import {
  SetupPageShell,
  SetupSummaryRow,
  SetupSummarySection,
  SetupTrustBanner,
} from "@/components/dashboard/setup-shell";
import { BusinessProfile } from "@/components/dashboard/setup-sections";

export default function ProfileSetupPage() {
  const { business } = useAuth();

  if (!business) return null;

  const hasGoogleConnection = Boolean(business.google_place_id || business.google_review_url);
  const brandValue = business.logo_url
    ? "Your business name and logo are set."
    : "Your business name is set. Add a logo if you want a more polished look.";
  const googleValue = hasGoogleConnection
    ? "Google review handoff is connected."
    : "Google handoff is not connected yet.";
  const googleHint = hasGoogleConnection
    ? business.business_city
      ? `Requests hand off to your Google review profile for ${business.business_city}.`
      : "Customers can finish by copying into your Google review flow."
    : "Add your Google profile here so customers land in the right review handoff.";

  return (
    <SetupPageShell
      eyebrow="Setup / Profile"
      title="Keep the basics current."
      description="This is the simple identity layer behind every request: your business name, logo, and the Google profile customers hand off to at the end."
      headerTone="detail"
    >
      <div className="space-y-5">
        <SetupTrustBanner text="Most businesses only come back here when something changes." />

        <SetupSummarySection heading="At a glance">
          <SetupSummaryRow
            label="Brand"
            value={brandValue}
            hint="Customers see your business name throughout the flow. A logo is optional."
          />
          <SetupSummaryRow
            label="Google profile"
            value={googleValue}
            hint={googleHint}
            last
          />
        </SetupSummarySection>

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
