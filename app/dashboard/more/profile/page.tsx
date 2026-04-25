"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { BusinessProfile, BusinessProfilePreviewSnapshot } from "@/components/dashboard/setup-sections";

export default function ProfileSetupPage() {
  const { business } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<BusinessProfilePreviewSnapshot | null>(null);

  if (!business) return null;

  const initialPreview = useMemo<BusinessProfilePreviewSnapshot>(() => {
    let googleHost = "";
    try {
      googleHost = business.google_review_url ? new URL(business.google_review_url).host.replace(/^www\./, "") : "";
    } catch {
      googleHost = business.google_review_url ?? "";
    }

    return {
      name: business.name,
      logo_url: business.logo_url,
      owner_email: business.owner_email,
      business_city: business.business_city,
      neighborhoods: business.neighborhoods ?? [],
      google_review_url: business.google_review_url,
      google_place_id: business.google_place_id,
      google_host: googleHost,
      google_connected: Boolean(business.google_place_id || business.google_review_url?.trim()),
      google_name: business.name,
      google_address: business.business_city,
    };
  }, [business]);

  const currentPreview = previewSnapshot ?? initialPreview;

  return (
    <>
      <SetupPageShell
        eyebrow="More / Profile"
        title="Business profile"
        description="This is what customers see before they ever land on Google: your name, logo, and the handoff destination at the end of the request."
        headerTone="detail"
        actions={
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
          >
            Preview
          </button>
        }
      >
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
          onPreviewSnapshotChange={setPreviewSnapshot}
        />
      </SetupPageShell>

      <ProfilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        snapshot={currentPreview}
      />
    </>
  );
}

function ProfilePreviewModal({
  open,
  onClose,
  snapshot,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: BusinessProfilePreviewSnapshot;
}) {
  if (!open) return null;

  const initials = snapshot.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const areaLine = snapshot.business_city
    ? snapshot.neighborhoods.length > 0
      ? `${snapshot.business_city} · ${snapshot.neighborhoods.length} area${snapshot.neighborhoods.length === 1 ? "" : "s"}`
      : snapshot.business_city
    : snapshot.neighborhoods.length > 0
      ? `${snapshot.neighborhoods.length} service area${snapshot.neighborhoods.length === 1 ? "" : "s"}`
      : "Location pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2E25]/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-[980px] overflow-hidden rounded-[20px] border border-[var(--dash-border)] bg-[var(--dash-bg)] shadow-[0_30px_80px_rgba(26,46,37,0.18)]">
        <div className="flex items-center justify-between border-b border-[var(--dash-border)] bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Static preview</p>
            <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">What customers see before Google</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-[1.06fr_0.94fr]">
          <section className="overflow-hidden rounded-[18px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
            <div className="h-24 bg-[linear-gradient(120deg,rgba(224,90,61,0.14),rgba(249,246,240,0.6)_55%,rgba(221,229,223,0.9))]" />
            <div className="px-6 pb-6 pt-0">
              <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[18px] border-[3px] border-white bg-[#284A63] shadow-[0_18px_42px_rgba(40,74,99,0.18)]">
                {snapshot.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={snapshot.logo_url} alt={`${snapshot.name} logo`} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-heading text-[28px] font-semibold tracking-[-0.04em] text-white">{initials}</span>
                )}
              </div>

              <h3 className="mt-4 font-heading text-[38px] font-semibold leading-[0.95] tracking-[-0.04em] text-[var(--dash-text)]">
                {snapshot.name}
              </h3>
              <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
                {areaLine}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--dash-border)] pt-4">
                <div className="rounded-full bg-[#FFF4ED] px-3 py-1.5 text-[12px] font-medium text-[#BC4A2F]">
                  Review request ready
                </div>
                {snapshot.google_connected ? (
                  <div className="rounded-full bg-[#ECF4EE] px-3 py-1.5 text-[12px] font-medium text-[#365347]">
                    Google handoff connected
                  </div>
                ) : (
                  <div className="rounded-full bg-[#F7F2E8] px-3 py-1.5 text-[12px] font-medium text-[var(--dash-muted)]">
                    Google handoff pending
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-[18px] border border-[var(--dash-border)] bg-[#FCFAF6] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Customer-facing handoff</p>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--dash-text)]">
                  Thanks for choosing {snapshot.name}. Once they finish the guided flow, customers land on the real Google review page tied to this business.
                </p>
                <div className="mt-4 inline-flex rounded-full bg-[var(--dash-primary)] px-4 py-2 text-[12px] font-semibold text-white">
                  Continue to Google
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[18px] border border-[rgba(19,38,31,0.12)] bg-[#13261F] text-white shadow-[0_24px_60px_rgba(19,38,31,0.24)]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">Google Business Profile</p>
                  <p className="mt-1 text-[12px] text-white/60">
                    {snapshot.google_connected ? "Connected destination" : "No connected destination yet"}
                  </p>
                </div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/10">
                  {snapshot.google_connected ? "Connected" : "Pending"}
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-[16px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[16px] font-semibold text-white">
                  {snapshot.google_name || snapshot.name || "Google listing"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  {snapshot.google_address || snapshot.google_host || "Connect the real review link to finish the handoff."}
                </p>
              </div>

              <div className="space-y-3">
                {[92, 26, 11, 5, 3].map((value, index) => (
                  <div key={index} className="grid grid-cols-[28px_1fr_28px] items-center gap-3 text-[12px] text-white/70">
                    <span>{5 - index}★</span>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full ${index === 0 ? "bg-[#9FB8A3]" : index === 1 ? "bg-[#E6B768]" : "bg-white/20"}`}
                        style={{ width: `${Math.max(6, value)}%` }}
                      />
                    </div>
                    <span className="text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[14px] border border-white/10 bg-white/6 px-4 py-3 text-[12px] leading-relaxed text-white/70">
                This preview is static. It uses your saved business details and Google handoff settings only — no AI generation and no extra token cost.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
