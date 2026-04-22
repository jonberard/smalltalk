"use client";

import { useAuth } from "@/lib/auth-context";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import { BusinessProfile } from "@/components/dashboard/setup-sections";

export default function ProfileSetupPage() {
  const { business } = useAuth();

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Profile"
      title="Keep your business identity sharp."
      description="This is the owner-facing profile layer: business name, logo, and the Google profile that your requests and handoff point back to."
    >
      <div className="space-y-5">
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
