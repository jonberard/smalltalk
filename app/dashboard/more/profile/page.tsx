"use client";

import { useAuth } from "@/lib/auth-context";
import {
  SetupPageShell,
  SetupInfoStrip,
} from "@/components/dashboard/setup-shell";
import { BusinessProfile } from "@/components/dashboard/setup-sections";

export default function ProfileSetupPage() {
  const { business } = useAuth();

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="More / Profile"
      title="Business profile"
      description="This is what customers see before they ever land on Google: your name, logo, and the handoff destination at the end of the request."
      headerTone="detail"
    >
      <div className="space-y-5">
        <SetupInfoStrip
          title={business.google_place_id ? "Google handoff is connected" : "Google handoff still needs a connection"}
          description={
            business.google_place_id
              ? `${business.name} is ready to hand customers off to the real Google review page.`
              : "Search for the listing or paste the Google review link directly so the final step lands in the right place."
          }
          accent={business.google_place_id ? "soft" : "warm"}
        />

        <BusinessProfile
          businessId={business.id}
          initial={{
            name: business.name,
            logo_url: business.logo_url,
            google_review_url: business.google_review_url,
            google_place_id: business.google_place_id,
            owner_email: business.owner_email,
            business_city: business.business_city,
            neighborhoods: business.neighborhoods,
          }}
        />
      </div>
    </SetupPageShell>
  );
}
