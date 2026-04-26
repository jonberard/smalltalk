"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Business } from "@/lib/types";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { REPLY_VOICES } from "@/lib/reply-generator";
import {
  buildInitialSmsMessage,
  buildReviewRequestEmailPreview,
  REVIEW_REQUEST_TEMPLATE_TOKENS,
} from "@/lib/review-request-messages";
import { dashboardButtonClassName, dashboardUtilityLinkClassName } from "@/components/dashboard/button";
import { DashboardHelpHint } from "@/components/dashboard/help-hint";
import { useToast } from "@/components/dashboard/toast";
import { StatusPill } from "@/components/dashboard/status-pill";
import { StatCard } from "@/components/dashboard/stat-card";
import { SkeletonCard } from "@/components/dashboard/skeleton";

export type ServiceRow = { id: string; name: string };
export type EmployeeRow = { id: string; name: string };
export type TopicRow = {
  id: string;
  label: string;
  tier: string;
  follow_up_question: string;
  follow_up_options: string[];
  sort_order: number;
  business_id: string | null;
};

type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  user_ratings_total: number;
};

export type BusinessProfilePreviewSnapshot = {
  name: string;
  logo_url: string | null;
  owner_email: string | null;
  business_city: string | null;
  neighborhoods: string[];
  google_review_url: string;
  google_place_id: string | null;
  google_host: string;
  google_connected: boolean;
  google_name: string | null;
  google_address: string | null;
};

const REMINDER_TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const TIER_META: { key: string; label: string; color: string; chipBg: string; dotColor: string }[] = [
  { key: "positive", label: "4-5 stars", color: "#059669", chipBg: "#ECFDF5", dotColor: "#10B981" },
  { key: "neutral", label: "3 stars", color: "#D97706", chipBg: "#FFFBEB", dotColor: "#F59E0B" },
  { key: "negative", label: "1-2 stars", color: "#DC2626", chipBg: "#FEF2F2", dotColor: "#EF4444" },
];

function formatHourLabel(hour: number) {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

export function BusinessProfile({
  businessId,
  initial,
  onPreviewSnapshotChange,
}: {
  businessId: string;
  initial: {
    name: string;
    logo_url: string | null;
    google_review_url: string;
    google_place_id: string | null;
    owner_email: string | null;
    business_city: string | null;
    neighborhoods: string[] | null;
  };
  onPreviewSnapshotChange?: (snapshot: BusinessProfilePreviewSnapshot) => void;
}) {
  const { toast } = useToast();
  const [savedProfile, setSavedProfile] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [googleUrl, setGoogleUrl] = useState(initial.google_review_url);
  const [placeId, setPlaceId] = useState<string | null>(initial.google_place_id);
  const [businessCity, setBusinessCity] = useState(initial.business_city);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(
    initial.google_place_id
      ? { place_id: initial.google_place_id, name: "", address: "", rating: null, user_ratings_total: 0 }
      : null,
  );
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const initials = name.trim()
    ? name
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 3)
        .toUpperCase()
    : "?";

  const save = useCallback(
    async (fields: Record<string, string | null>) => {
      setSaving(true);
      const { error } = await supabase.from("businesses").update(fields).eq("id", businessId);
      setSaving(false);

      if (error) {
        toast(`Couldn't save profile changes: ${error.message}`, "error");
        return false;
      }

      setSavedProfile((prev) => ({ ...prev, ...fields }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return true;
    },
    [businessId, toast],
  );

  async function handlePlaceSearch(query: string) {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetchWithAuth(`/api/places-search?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results?: PlaceResult[] };
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  }

  function extractCity(address: string): string | null {
    const parts = address.split(",").map((part) => part.trim());
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length === 2) return parts[0];
    return null;
  }

  async function handlePlaceSelect(place: PlaceResult) {
    const url = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    setSelectedPlace(place);
    setPlaceId(place.place_id);
    setGoogleUrl(url);
    setSearchQuery("");
    setSearchResults([]);

    const city = extractCity(place.address);
    setBusinessCity(city);
    const savedProfileChange = await save({
      google_review_url: url,
      google_place_id: place.place_id,
      business_city: city,
    });

    if (!savedProfileChange) {
      setSelectedPlace(
        savedProfile.google_place_id
          ? {
              place_id: savedProfile.google_place_id,
              name: "",
              address: "",
              rating: null,
              user_ratings_total: 0,
            }
          : null,
      );
      setPlaceId(savedProfile.google_place_id);
      setGoogleUrl(savedProfile.google_review_url);
      setBusinessCity(initial.business_city);
    }
  }

  function handleClearPlace() {
    setSelectedPlace(null);
    setPlaceId(null);
    setGoogleUrl("");
    setBusinessCity(null);
    void save({ google_review_url: "", google_place_id: null, business_city: null });
  }

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast("Please upload an image file for your logo.", "error");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `logos/${businessId}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });

    if (uploadErr) {
      toast(`Couldn't upload logo: ${uploadErr.message}`, "error");
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const savedLogo = await save({ logo_url: url });

    if (!savedLogo) {
      return;
    }

    setLogoPreview(url);
    toast("Logo updated.", "success");
  }

  const connectedToGoogle = Boolean(placeId || googleUrl.trim());
  const neighborhoodCount = initial.neighborhoods?.length ?? 0;
  const areaSummary = businessCity
    ? neighborhoodCount > 0
      ? `${businessCity} + ${neighborhoodCount} area${neighborhoodCount === 1 ? "" : "s"}`
      : businessCity
    : neighborhoodCount > 0
      ? `${neighborhoodCount} service area${neighborhoodCount === 1 ? "" : "s"}`
      : "Service area not set";

  let googleHost = "";
  try {
    googleHost = googleUrl ? new URL(googleUrl).host.replace(/^www\./, "") : "";
  } catch {
    googleHost = googleUrl;
  }

  useEffect(() => {
    onPreviewSnapshotChange?.({
      name,
      logo_url: logoPreview,
      owner_email: initial.owner_email,
      business_city: businessCity,
      neighborhoods: initial.neighborhoods ?? [],
      google_review_url: googleUrl,
      google_place_id: placeId,
      google_host: googleHost,
      google_connected: connectedToGoogle,
      google_name: selectedPlace?.name || null,
      google_address: selectedPlace?.address || null,
    });
  }, [
    businessCity,
    connectedToGoogle,
    googleHost,
    googleUrl,
    initial.neighborhoods,
    initial.owner_email,
    logoPreview,
    name,
    onPreviewSnapshotChange,
    placeId,
    selectedPlace,
  ]);

  return (
    <div className="space-y-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleLogoUpload(file);
        }}
      />

      <div className="grid gap-5 min-[1180px]:grid-cols-[1.08fr_0.92fr]">
        <section className="overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#E05A3D]/[0.09] via-[#F8F9FA] to-[#DDE5DF] px-6 pb-6 pt-8">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,rgba(224,90,61,0.4),rgba(221,229,223,0.2),rgba(224,90,61,0.2))]" />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#284A63] shadow-[0_14px_34px_rgba(40,74,99,0.18)] ring-1 ring-white/80 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_20px_38px_rgba(40,74,99,0.2)] active:scale-[0.98]"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[26px] font-heading font-semibold tracking-[-0.04em] text-white">{initials}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#13261F]/0 text-[11px] font-semibold text-white opacity-0 transition-all duration-300 group-hover:bg-[#13261F]/40 group-hover:opacity-100">
                    Upload
                  </div>
                </button>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-[var(--dash-muted)] shadow-[0_10px_30px_rgba(26,46,37,0.08)]">
                    <span className="h-2 w-2 rounded-full bg-[#9FB8A3]" />
                    How customers see you
                  </div>
                  <h2 className="mt-4 text-[33px] font-heading font-semibold tracking-[-0.04em] leading-[0.95] text-[var(--dash-text)]">
                    {name || "Your Business"}
                  </h2>
                  <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
                    {businessCity || "Location pending"}
                    {neighborhoodCount > 0 ? ` · ${neighborhoodCount} area${neighborhoodCount === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
              </div>
              <StatusPill
                status={connectedToGoogle ? "connected" : "pending"}
                className="self-start bg-white/80 text-[var(--dash-text)] ring-1 ring-[rgba(26,46,37,0.08)]"
              />
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 min-[1180px]:grid-cols-3">
            <div className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Owner account</p>
              <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">
                {initial.owner_email ?? "Not set"}
              </p>
            </div>
            <div className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Primary area</p>
              <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">{areaSummary}</p>
            </div>
            <div className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Google handoff</p>
              <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">
                {connectedToGoogle ? "Connected" : "Needs connection"}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[var(--dash-radius)] border border-[rgba(19,38,31,0.12)] bg-[#13261F] text-white shadow-[0_24px_60px_rgba(19,38,31,0.24)]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white text-[13px] font-semibold text-[#1A2E25]">
                  G
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Google Business Profile</p>
                  <p className="text-[12px] text-white/60">
                    {connectedToGoogle ? "Connected and ready for review handoff" : "Connect your handoff destination"}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/10">
                <span className={`h-2 w-2 rounded-full ${connectedToGoogle ? "bg-[#9FB8A3]" : "bg-[#E6B768]"}`} />
                {connectedToGoogle ? "Connected" : "Pending"}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            {connectedToGoogle ? (
              <div className="rounded-[16px] border border-white/10 bg-white/6 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-white">{selectedPlace?.name || name || "Connected profile"}</p>
                    <p className="mt-1 break-all text-[12px] leading-relaxed text-white/65">
                      {selectedPlace?.address || googleHost || "Review link saved"}
                    </p>
                  </div>
                  <a
                    href={googleUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      googleUrl
                        ? "border-white/16 bg-white/10 text-white hover:bg-white/16"
                        : "pointer-events-none border-white/8 bg-white/5 text-white/40"
                    }`}
                  >
                    Open profile
                  </a>
                </div>
                {selectedPlace?.rating ? (
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-white/70">
                    <div className="flex items-center gap-0.5 text-[#E6B768]">
                      {Array.from({ length: 5 }).map((_, step) => (
                        <svg key={step} width="10" height="10" viewBox="0 0 24 24" fill={step < Math.round(selectedPlace.rating as number) ? "currentColor" : "rgba(255,255,255,0.18)"}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span>{selectedPlace.rating} · {selectedPlace.user_ratings_total} reviews</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-white/12 bg-white/4 px-4 py-5">
                <p className="text-[14px] font-medium text-white">No Google Business Profile connected yet</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  Search for the business or paste the review link directly. Once it is saved, customers can finish on the real Google page.
                </p>
              </div>
            )}

            <div className="relative">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => void handlePlaceSearch(event.target.value)}
                placeholder="Search for your business on Google"
                className="w-full rounded-[12px] border border-white/12 bg-white/6 py-3 pl-10 pr-4 text-[14px] text-white outline-none placeholder:text-white/40 transition-all duration-300 focus:border-[#E6B768]/40 focus:bg-white/9 focus:shadow-[0_0_0_3px_rgba(230,183,104,0.12)]"
              />
              {searching ? (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#E6B768]" />
                </div>
              ) : null}
            </div>

            {searchResults.length > 0 ? (
              <div className="overflow-hidden rounded-[14px] border border-white/8 bg-white">
                {searchResults.map((place, index) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => void handlePlaceSelect(place)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FCFAF6] ${
                      index < searchResults.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#E05A3D]/10">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--dash-text)]">{place.name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--dash-muted)]">{place.address}</p>
                    </div>
                    {place.rating ? (
                      <span className="shrink-0 text-[11px] font-medium text-[var(--dash-muted)]">
                        {place.rating}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {!showManual ? (
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="text-[12px] font-medium text-white/70 transition-colors hover:text-white"
              >
                Paste the Google review link manually
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={googleUrl}
                  onChange={(event) => setGoogleUrl(event.target.value)}
                  onBlur={() => {
                    if (googleUrl !== savedProfile.google_review_url) void save({ google_review_url: googleUrl });
                  }}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full rounded-[12px] border border-white/12 bg-white/6 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/40 transition-all duration-300 focus:border-[#E6B768]/40 focus:bg-white/9 focus:shadow-[0_0_0_3px_rgba(230,183,104,0.12)]"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] leading-relaxed text-white/50">
                    Use the direct Google review link if search cannot find the listing.
                  </p>
                  {connectedToGoogle ? (
                    <button
                      type="button"
                      onClick={handleClearPlace}
                      className="rounded-[10px] border border-white/12 px-3 py-1.5 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      Reconnect
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 min-[1180px]:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Profile details</p>
              <h3 className="mt-2 text-[19px] font-semibold tracking-tight text-[var(--dash-text)]">Keep the identity clean</h3>
              <p className="mt-2 max-w-[48ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
                This is the baseline customers see before they ever read the draft. Update the name here, and use Team & Services for neighborhoods and staffing.
              </p>
            </div>
            {saving || saved ? (
              <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-[11px] font-medium text-[#0F766E]">
                {saving ? "Saving..." : "Saved"}
              </span>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-[12px] font-medium text-[var(--dash-muted)]">Business name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => {
                  if (name !== savedProfile.name) void save({ name });
                }}
                placeholder="Your business name"
                className="w-full rounded-[12px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 min-[1180px]:grid-cols-3">
              <div className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Owner email</p>
                <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">{initial.owner_email ?? "Not set"}</p>
              </div>
              <div className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Primary city</p>
                <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">{businessCity ?? "Not set"}</p>
              </div>
              <div className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Review handoff</p>
                <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">
                  {googleHost || "Add Google review URL"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Service area</p>
              <h3 className="mt-2 text-[19px] font-semibold tracking-tight text-[var(--dash-text)]">
                {businessCity || "Add a primary location"}
                {neighborhoodCount > 0 ? ` + ${neighborhoodCount}` : ""}
              </h3>
            </div>
            <span className="text-[11px] font-medium text-[#BC4A2F]">Managed in Team & Services</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-[16px] border border-[var(--dash-border)] bg-[#FCFAF6]">
            <div className="relative h-[182px] bg-[linear-gradient(180deg,rgba(224,90,61,0.08),rgba(255,255,255,0))]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(26,46,37,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(26,46,37,0.06)_1px,transparent_1px)] bg-[size:33.333%_33.333%]" />
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#E05A3D] bg-white shadow-[0_0_0_8px_rgba(224,90,61,0.08)]" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#E05A3D]/45" />
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#E05A3D]/20" />
            </div>
            <div className="border-t border-[var(--dash-border)] px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {initial.neighborhoods?.length ? (
                  initial.neighborhoods.map((area, index) => (
                    <span
                      key={`${area}-${index}`}
                      className="rounded-full border border-[#E6DDD0] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--dash-text)]"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <p className="text-[13px] text-[var(--dash-muted)]">
                    Add neighborhoods below or from Team & Services so reviews can mention where you work.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ServicesList({
  services: initial,
  businessId,
}: {
  services: ServiceRow[];
  businessId: string;
}) {
  const [services, setServices] = useState(initial);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  async function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || services.some((service) => service.name.toLowerCase() === trimmed.toLowerCase())) return;
    const { data, error } = await supabase
      .from("services")
      .insert({ business_id: businessId, name: trimmed })
      .select("id, name")
      .single();

    if (data) {
      setServices([...services, data]);
      toast("Service added!", "success");
    }
    if (error) toast("Something went wrong. Please try again.", "error");
    setDraft("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("services").delete().eq("id", id);
    setServices(services.filter((service) => service.id !== id));
  }

  const accents = ["#E05A3D", "#10B981", "#F59E0B", "#E11D48", "#8B5CF6", "#06B6D4", "#F97316", "#6366F1"];

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Services</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">What you offer and what appears in Send</p>
          </div>
          <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">
            {services.length}
          </span>
        </div>
      </div>

      <div className="px-3">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="group mx-0 flex items-center gap-3 rounded-[var(--dash-radius-sm)] px-3 py-3 transition-all duration-200 hover:bg-[var(--dash-bg)]"
          >
            <div className="flex items-center gap-2">
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="shrink-0 cursor-grab text-[#D4D4D8] opacity-0 transition-opacity duration-200 group-hover:opacity-100 active:cursor-grabbing">
                <circle cx="3" cy="2" r="1.2" fill="currentColor" />
                <circle cx="7" cy="2" r="1.2" fill="currentColor" />
                <circle cx="3" cy="7" r="1.2" fill="currentColor" />
                <circle cx="7" cy="7" r="1.2" fill="currentColor" />
                <circle cx="3" cy="12" r="1.2" fill="currentColor" />
                <circle cx="7" cy="12" r="1.2" fill="currentColor" />
              </svg>
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accents[index % accents.length] }} />
            </div>

            <span className="flex-1 text-[14px] font-medium text-[var(--dash-text)]">{service.name}</span>

            <button
              type="button"
              onClick={() => void handleRemove(service.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--dash-muted)] transition-all duration-200 hover:bg-[#FEE2E2] hover:text-[#EF4444] active:scale-[0.92]"
              aria-label={`Remove ${service.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border-t border-[var(--dash-border)] px-6 py-4">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAdd();
                if (event.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              placeholder="What service do you offer?"
              autoFocus
              className="flex-1 rounded-[var(--dash-radius-sm)] border border-[#E05A3D]/30 bg-white px-4 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!draft.trim()}
              className={`${dashboardButtonClassName({ variant: "primary", size: "sm" })} shrink-0 ${
                draft.trim() ? "bg-[#E05A3D] shadow-[0_2px_8px_rgba(224,90,61,0.25)] active:scale-[0.97]" : "cursor-not-allowed bg-[#F0ADA0]"
              }`}
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-2.5 border-t border-[var(--dash-border)] px-6 py-4 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--dash-border)] bg-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          Add a service
        </button>
      )}
    </div>
  );
}

export function NeighborhoodsList({
  neighborhoods: initial,
  businessId,
}: {
  neighborhoods: string[];
  businessId: string;
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function persist(updated: string[]) {
    setSaving(true);
    await supabase.from("businesses").update({ neighborhoods: updated }).eq("id", businessId);
    setSaving(false);
  }

  async function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...items, trimmed];
    setItems(updated);
    setDraft("");
    setAdding(false);
    await persist(updated);
  }

  function handleRemove(index: number) {
    const updated = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(updated);
    void persist(updated);
  }

  const areaColors = ["#06B6D4", "#8B5CF6", "#F97316", "#10B981", "#E11D48", "#E05A3D", "#F59E0B", "#6366F1"];
  const areasBadge = items.length > 0 ? String(items.length) : "Not set";

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Service areas</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">Neighborhoods you serve and reference in reviews</p>
          </div>
          <div className="flex items-center gap-2">
            {saving ? <span className="text-[11px] text-[#10B981]">Saving...</span> : null}
            <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">
              {areasBadge}
            </span>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="px-6 pb-1">
          <div className="flex flex-wrap gap-2">
            {items.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="group/chip flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-white"
                style={{ backgroundColor: areaColors[index % areaColors.length] }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-all duration-200 hover:bg-white/30 group-hover/chip:opacity-100 active:scale-[0.85]"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {adding ? (
        <div className="border-t border-[var(--dash-border)] px-6 py-4">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAdd();
                if (event.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              placeholder="e.g. Zilker, Westlake, North Loop"
              autoFocus
              className="flex-1 rounded-[var(--dash-radius-sm)] border border-[#E05A3D]/30 bg-white px-4 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!draft.trim()}
              className={`${dashboardButtonClassName({ variant: "primary", size: "sm" })} shrink-0 ${
                draft.trim() ? "bg-[#E05A3D] shadow-[0_2px_8px_rgba(224,90,61,0.25)] active:scale-[0.97]" : "cursor-not-allowed bg-[#F0ADA0]"
              }`}
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-2.5 border-t border-[var(--dash-border)] px-6 py-4 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--dash-border)] bg-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          Add a neighborhood
        </button>
      )}
    </div>
  );
}

export function TeamList({
  employees: initial,
  businessId,
}: {
  employees: EmployeeRow[];
  businessId: string;
}) {
  const [employees, setEmployees] = useState(initial);
  const [draftName, setDraftName] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  async function handleAdd() {
    const name = draftName.trim();
    if (!name || employees.some((employee) => employee.name.toLowerCase() === name.toLowerCase())) return;

    const { data, error } = await supabase
      .from("employees")
      .insert({ business_id: businessId, name })
      .select("id, name")
      .single();

    if (data) {
      setEmployees([...employees, data]);
      toast("Team member added!", "success");
    }
    if (error) toast("Something went wrong. Please try again.", "error");
    setDraftName("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("employees").delete().eq("id", id);
    setEmployees(employees.filter((employee) => employee.id !== id));
  }

  const avatarColors = [
    { bg: "#E05A3D", text: "#FFFFFF" },
    { bg: "#10B981", text: "#FFFFFF" },
    { bg: "#F59E0B", text: "#FFFFFF" },
    { bg: "#8B5CF6", text: "#FFFFFF" },
    { bg: "#E11D48", text: "#FFFFFF" },
    { bg: "#06B6D4", text: "#FFFFFF" },
  ];

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Team</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">People who perform your services</p>
          </div>
          <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">
            {employees.length}
          </span>
        </div>
      </div>

      <div className="px-3">
        {employees.map((employee, index) => {
          const color = avatarColors[index % avatarColors.length];
          return (
            <div
              key={employee.id}
              className="group flex items-center gap-3.5 rounded-[var(--dash-radius-sm)] px-3 py-3 transition-all duration-200 hover:bg-[var(--dash-bg)]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {employee.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[var(--dash-text)]">{employee.name}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(employee.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--dash-muted)] transition-all duration-200 hover:bg-[#FEE2E2] hover:text-[#EF4444] active:scale-[0.92]"
                aria-label={`Remove ${employee.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="border-t border-[var(--dash-border)] px-6 py-4">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAdd();
                if (event.key === "Escape") {
                  setAdding(false);
                  setDraftName("");
                }
              }}
              placeholder="Name"
              autoFocus
              className="flex-1 rounded-[var(--dash-radius-sm)] border border-[#E05A3D]/30 bg-white px-4 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!draftName.trim()}
              className={`${dashboardButtonClassName({ variant: "primary", size: "sm" })} shrink-0 ${
                draftName.trim() ? "bg-[#E05A3D] shadow-[0_2px_8px_rgba(224,90,61,0.25)] active:scale-[0.97]" : "cursor-not-allowed bg-[#F0ADA0]"
              }`}
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-2.5 border-t border-[var(--dash-border)] px-6 py-4 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--dash-border)] bg-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          Add team member
        </button>
      )}
    </div>
  );
}

export function ReplyVoiceSection({
  businessId,
  initialVoiceId,
  initialCustomVoice,
}: {
  businessId: string;
  initialVoiceId: string;
  initialCustomVoice: string | null;
}) {
  const [selectedId, setSelectedId] = useState(initialVoiceId);
  const [customText, setCustomText] = useState(initialCustomVoice ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const voiceOptions = [...REPLY_VOICES.map((voice) => ({ id: voice.id, name: voice.name })), { id: "custom", name: "Custom" }];

  async function save(voiceId: string, custom?: string) {
    setSaving(true);
    const update: Record<string, unknown> = { reply_voice_id: voiceId };

    if (voiceId === "custom") {
      update.custom_reply_voice = custom ?? "";
    } else {
      update.custom_reply_voice = null;
    }

    await supabase.from("businesses").update(update).eq("id", businessId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Reply voice</h3>
          <DashboardHelpHint
            text="Sets the tone for your drafted replies."
            label="Reply voice help"
          />
        </div>
        {saved ? <span className="text-[12px] font-medium text-[var(--dash-success)]">Saved</span> : null}
        {saving ? <span className="text-[12px] font-medium text-[var(--dash-muted)]">Saving...</span> : null}
      </div>
      <p className="mb-4 text-[12px] text-[var(--dash-muted)]">Choose how your public review replies will sound</p>

      <div className="flex flex-wrap gap-2">
        {voiceOptions.map((voice) => (
          <button
            key={voice.id}
            type="button"
            onClick={() => {
              setSelectedId(voice.id);
              if (voice.id !== "custom") {
                void save(voice.id);
              }
            }}
            className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 ${
              selectedId === voice.id
                ? "bg-[var(--dash-primary)] text-white shadow-sm"
                : "border border-[var(--dash-border)] bg-white text-[var(--dash-muted)] hover:bg-[var(--dash-bg)] hover:text-[var(--dash-text)]"
            }`}
          >
            {voice.name}
          </button>
        ))}
      </div>

      {selectedId === "custom" ? (
        <div className="mt-4">
          <textarea
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
            placeholder="Describe your voice - e.g. Friendly and casual, I call everyone by name, I always invite them back."
            rows={3}
            className="w-full resize-none rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2.5 text-[13px] text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-primary)] focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => void save("custom", customText)}
              disabled={!customText.trim() || saving}
              className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
            >
              Save voice
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ReviewRequestMessagingSection({
  businessId,
  businessName,
  initialSmsTemplate,
  initialEmailSubjectTemplate,
  initialEmailIntroTemplate,
}: {
  businessId: string;
  businessName: string;
  initialSmsTemplate: string | null;
  initialEmailSubjectTemplate: string | null;
  initialEmailIntroTemplate: string | null;
}) {
  const { toast } = useToast();
  const [smsTemplate, setSmsTemplate] = useState(initialSmsTemplate ?? "");
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState(initialEmailSubjectTemplate ?? "");
  const [emailIntroTemplate, setEmailIntroTemplate] = useState(initialEmailIntroTemplate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const previewCustomerName = "Alex";
  const previewLink = "https://usesmalltalk.com/r/demo1234";
  const smsPreview = buildInitialSmsMessage({
    customerName: previewCustomerName,
    businessName,
    reviewLinkUrl: previewLink,
    smsTemplate,
  });
  const emailPreview = buildReviewRequestEmailPreview({
    customerName: previewCustomerName,
    businessName,
    reviewLinkUrl: previewLink,
    emailSubjectTemplate,
    emailIntroTemplate,
  });

  async function save() {
    setSaving(true);
    const update = {
      review_request_sms_template: smsTemplate.trim() || null,
      review_request_email_subject_template: emailSubjectTemplate.trim() || null,
      review_request_email_intro_template: emailIntroTemplate.trim() || null,
    };

    const { error } = await supabase.from("businesses").update(update).eq("id", businessId);
    setSaving(false);

    if (error) {
      toast(`Couldn't save message settings: ${error.message}`, "error");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast("Review request copy updated.", "success");
  }

  return (
    <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--dash-text)]">Review request message</h2>
          <p className="mt-1 max-w-[620px] text-[13px] leading-relaxed text-[var(--dash-muted)]">
            Keep the link and compliance pieces protected, but make the message sound more like your business. Leave any field blank to use the default wording.
          </p>
        </div>
        {saving || saved ? <p className="text-[12px] text-[#10B981]">{saving ? "Saving..." : "Saved"}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {REVIEW_REQUEST_TEMPLATE_TOKENS.map((token) => (
          <div
            key={token.token}
            className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-1.5 text-[11px] text-[var(--dash-muted)]"
          >
            <span className="font-semibold text-[var(--dash-text)]">{token.token}</span> {token.help}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-[12px] border border-[var(--dash-border)] bg-white p-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-[var(--dash-muted)]">SMS message</label>
            <textarea
              value={smsTemplate}
              onChange={(event) => setSmsTemplate(event.target.value)}
              rows={4}
              placeholder="Hi {{customer_name}} - {{business_name}} here. Mind leaving us a quick review? No typing - just tap through a few questions: {{review_link}}"
              className="w-full resize-none rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
              We&apos;ll automatically keep the review link attached. If you include <span className="font-medium text-[var(--dash-text)]">{"{{review_link}}"}</span>, we&apos;ll use it where you place it instead.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-[var(--dash-muted)]">Email subject</label>
            <input
              type="text"
              value={emailSubjectTemplate}
              onChange={(event) => setEmailSubjectTemplate(event.target.value)}
              placeholder="{{business_name}} would love your feedback"
              className="w-full rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-[var(--dash-muted)]">Email intro</label>
            <textarea
              value={emailIntroTemplate}
              onChange={(event) => setEmailIntroTemplate(event.target.value)}
              rows={5}
              placeholder="{{business_name}} would love your feedback. Tap the button below to answer a few quick questions - no writing required, takes about 30 seconds."
              className="w-full resize-none rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">
              The email button and link stay intact even if you change the copy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dash-border)] pt-4">
            <button
              type="button"
              onClick={() => {
                setSmsTemplate("");
                setEmailSubjectTemplate("");
                setEmailIntroTemplate("");
              }}
              className={dashboardUtilityLinkClassName()}
            >
              Reset to default wording
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className={dashboardButtonClassName({ variant: "primary" })}
            >
              Save message
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-[12px] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
          <div className="rounded-[12px] border border-[var(--dash-border)] bg-white p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">SMS preview</p>
            <div className="mt-3 max-w-[420px] rounded-[18px] bg-[#EAECEE] px-4 py-3 text-[13px] leading-relaxed text-[var(--dash-text)]">
              {smsPreview}
            </div>
          </div>

          <div className="rounded-[12px] border border-[var(--dash-border)] bg-white p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Email preview</p>
            <div className="mt-3 rounded-[16px] border border-[var(--dash-border)] bg-[#FFFCF8] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Subject</p>
              <p className="mt-1 text-[14px] font-semibold text-[var(--dash-text)]">{emailPreview.subject}</p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Intro</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[var(--dash-text)]">Hi {previewCustomerName},</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--dash-text)]">{emailPreview.intro}</p>
              <div className="mt-4 inline-flex rounded-full bg-[var(--dash-primary)] px-4 py-2 text-[12px] font-semibold text-white">
                Share Your Experience
              </div>
            </div>
          </div>

          <p className="text-[12px] leading-relaxed text-[var(--dash-muted)]">
            Reminders stay on the product defaults for now, so your follow-up sequence stays consistent and compliant.
          </p>
        </div>
      </div>
    </div>
  );
}

export function IntegrationsSection() {
  return (
    <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--dash-primary)]/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dash-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">CRM integrations</h3>
          <p className="text-[12px] text-[var(--dash-muted)]">Connect Jobber, ServiceTitan, and more to automatically send review links</p>
        </div>
        <span className="rounded-full bg-[var(--dash-bg)] px-3 py-1 text-[11px] font-medium text-[var(--dash-muted)]">Coming soon</span>
      </div>
    </div>
  );
}

export function TopicSection({
  topics: initial,
  businessId,
  isCustomized,
}: {
  topics: TopicRow[];
  businessId: string;
  isCustomized: boolean;
}) {
  const [topics, setTopics] = useState(initial);
  const [addingTier, setAddingTier] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftOptions, setDraftOptions] = useState("");
  const { toast } = useToast();

  async function handleAdd(tier: string) {
    const label = draftLabel.trim();
    const question = draftQuestion.trim();
    const options = draftOptions
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
    if (!label || !question || options.length < 2) return;

    const maxSort = topics
      .filter((topic) => topic.tier === tier)
      .reduce((max, topic) => Math.max(max, topic.sort_order), 0);

    const { data, error } = await supabase
      .from("topics")
      .insert({
        business_id: businessId,
        label,
        tier,
        follow_up_question: question,
        follow_up_options: options,
        sort_order: maxSort + 1,
      })
      .select()
      .single();

    if (data) {
      setTopics([...topics, data]);
      toast("Topic added!", "success");
    }
    if (error) toast("Something went wrong. Please try again.", "error");
    setDraftLabel("");
    setDraftQuestion("");
    setDraftOptions("");
    setAddingTier(null);
  }

  async function handleRemove(id: string) {
    await supabase.from("topics").delete().eq("id", id);
    setTopics(topics.filter((topic) => topic.id !== id));
  }

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pb-1 pt-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Review topics</h3>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">What customers are asked about during the review</p>
        {!isCustomized ? (
          <p className="mt-2 rounded-[8px] bg-[var(--dash-bg)] px-3 py-2 text-[12px] text-[var(--dash-muted)]">
            These are the defaults - customize them or leave them as-is.
          </p>
        ) : null}
      </div>

      {TIER_META.map((tier, index) => {
        const tierTopics = topics.filter((topic) => topic.tier === tier.key).sort((a, b) => a.sort_order - b.sort_order);

        return (
          <div key={tier.key} className={`px-6 py-4 ${index < TIER_META.length - 1 ? "border-b border-[var(--dash-border)]" : ""}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: tier.dotColor }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: tier.color }}>
                {tier.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tierTopics.map((topic) => (
                <span
                  key={topic.id}
                  className="group/chip flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                  style={{ backgroundColor: tier.chipBg, color: tier.color }}
                >
                  {topic.label}
                  <button
                    type="button"
                    onClick={() => void handleRemove(topic.id)}
                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-all duration-200 hover:bg-black/10 group-hover/chip:opacity-100 active:scale-[0.85]"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            {addingTier === tier.key ? (
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="text"
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  placeholder="Topic label (e.g. Filter Condition)"
                  autoFocus
                  className="rounded-[8px] border border-[var(--dash-border)] px-3 py-2 text-[13px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                <input
                  type="text"
                  value={draftQuestion}
                  onChange={(event) => setDraftQuestion(event.target.value)}
                  placeholder="Follow-up question (e.g. How was the filter?)"
                  className="rounded-[8px] border border-[var(--dash-border)] px-3 py-2 text-[13px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                <input
                  type="text"
                  value={draftOptions}
                  onChange={(event) => setDraftOptions(event.target.value)}
                  placeholder="Options, comma-separated (e.g. Great, Good, Fair, Poor)"
                  className="rounded-[8px] border border-[var(--dash-border)] px-3 py-2 text-[13px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleAdd(tier.key);
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTier(null);
                      setDraftLabel("");
                      setDraftQuestion("");
                      setDraftOptions("");
                    }}
                    className="rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#94A3B8] transition-all duration-200 hover:bg-[var(--dash-bg)] hover:text-[var(--dash-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAdd(tier.key)}
                    disabled={!draftLabel.trim() || !draftQuestion.trim() || draftOptions.split(",").filter((option) => option.trim()).length < 2}
                    className="rounded-[8px] bg-[#E05A3D] px-4 py-1.5 text-[13px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-[#F0ADA0]"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingTier(tier.key)}
                className="mt-3 flex items-center gap-1.5 text-[12px] font-medium transition-all duration-200 hover:opacity-70"
                style={{ color: tier.color }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add topic
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AutomatedRemindersSection({
  businessId,
  initialEnabled,
  initialQuietStart,
  initialQuietEnd,
  initialTimezone,
  initialBatchEnabled,
  initialBatchHour,
}: {
  businessId: string;
  initialEnabled: boolean;
  initialQuietStart: number;
  initialQuietEnd: number;
  initialTimezone: string;
  initialBatchEnabled: boolean;
  initialBatchHour: number;
}) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [quietStart, setQuietStart] = useState(initialQuietStart);
  const [quietEnd, setQuietEnd] = useState(initialQuietEnd);
  const [timeZone, setTimeZone] = useState(initialTimezone);
  const [batchEnabled, setBatchEnabled] = useState(initialBatchEnabled);
  const [batchHour, setBatchHour] = useState(initialBatchHour);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const timezones = REMINDER_TIMEZONE_OPTIONS.includes(timeZone)
    ? REMINDER_TIMEZONE_OPTIONS
    : [timeZone, ...REMINDER_TIMEZONE_OPTIONS];

  const batchFallsInQuietHours =
    quietStart !== quietEnd &&
    (quietStart < quietEnd
      ? batchHour >= quietStart && batchHour < quietEnd
      : batchHour >= quietStart || batchHour < quietEnd);

  async function save(next: {
    reminder_sequence_enabled?: boolean;
    quiet_hours_start?: number;
    quiet_hours_end?: number;
    business_timezone?: string;
    batch_initial_sms_enabled?: boolean;
    batch_initial_sms_hour?: number;
  }) {
    setSaving(true);

    const { error } = await supabase.from("businesses").update(next).eq("id", businessId);

    setSaving(false);

    if (error) {
      toast(`Couldn't save reminder settings: ${error.message}`, "error");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--dash-text)]">Automated reminders</h2>
          <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
            Follow up automatically when a customer doesn&apos;t finish their review.
          </p>
        </div>
        {saving || saved ? (
          <p className="text-[12px] text-[#10B981]">{saving ? "Saving..." : "Saved"}</p>
        ) : null}
      </div>

      <div className="mt-5 rounded-[12px] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
        <label className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-[var(--dash-text)]">
              Send automatic reminders to customers who don&apos;t complete their review
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
              small Talk can send up to two follow-ups, and stops as soon as the customer completes the flow or texts STOP.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              void save({ reminder_sequence_enabled: next });
            }}
            className={`relative mt-0.5 h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors duration-200 ${
              enabled ? "bg-[#E05A3D]" : "bg-[#D1D5DB]"
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[12px] border border-[var(--dash-border)] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Initial delivery</p>
          <div className="mt-3 rounded-[10px] bg-[var(--dash-bg)] p-3.5">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setBatchEnabled(false);
                  void save({ batch_initial_sms_enabled: false });
                }}
                className={`rounded-[10px] border px-3 py-3 text-left transition-colors ${
                  !batchEnabled
                    ? "border-[#E05A3D]/30 bg-[#FFF4ED] text-[var(--dash-text)]"
                    : "border-[var(--dash-border)] bg-white text-[var(--dash-muted)] hover:bg-[#FCFAF6]"
                }`}
              >
                <p className="text-[13px] font-semibold">Send right away</p>
                <p className="mt-1 text-[12px] leading-relaxed">
                  Best when you want the customer to get the text immediately.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchEnabled(true);
                  void save({ batch_initial_sms_enabled: true });
                }}
                className={`rounded-[10px] border px-3 py-3 text-left transition-colors ${
                  batchEnabled
                    ? "border-[#E05A3D]/30 bg-[#FFF4ED] text-[var(--dash-text)]"
                    : "border-[var(--dash-border)] bg-white text-[var(--dash-muted)] hover:bg-[#FCFAF6]"
                }`}
              >
                <p className="text-[13px] font-semibold">Queue texts for one send window</p>
                <p className="mt-1 text-[12px] leading-relaxed">
                  Hold SMS requests until your chosen local send time.
                </p>
              </button>
            </div>

            {batchEnabled ? (
              <div className="mt-3 rounded-[10px] border border-[var(--dash-border)] bg-white p-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-[12px] font-medium text-[var(--dash-muted)]">Send window</label>
                    <select
                      value={batchHour}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setBatchHour(next);
                        void save({ batch_initial_sms_hour: next });
                      }}
                      className="w-full rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                    >
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <option key={hour} value={hour}>
                          {formatHourLabel(hour)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="max-w-[26ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
                    SMS requests from jobs wait for this window. Emails still go out right away.
                  </p>
                </div>
                {batchFallsInQuietHours ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-[#B45309]">
                    That send window lands inside quiet hours, so small Talk will hold it until quiet hours end.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Sequence</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-[10px] bg-[var(--dash-bg)] px-3.5 py-3">
              <p className="text-[13px] font-medium text-[var(--dash-text)]">1. Initial message</p>
              <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                {batchEnabled
                  ? `Queued for your next ${formatHourLabel(batchHour)} send window.`
                  : "Sent immediately when you send the review request."}
              </p>
            </div>
            <div className="rounded-[10px] bg-[var(--dash-bg)] px-3.5 py-3">
              <p className="text-[13px] font-medium text-[var(--dash-text)]">2. First reminder</p>
              <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                Sent 24 hours later if the customer still hasn&apos;t completed the flow.
              </p>
            </div>
            <div className="rounded-[10px] bg-[var(--dash-bg)] px-3.5 py-3">
              <p className="text-[13px] font-medium text-[var(--dash-text)]">3. Final reminder</p>
              <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                Sent 72 hours after the initial request. That&apos;s the last message.
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-[var(--dash-muted)]">
            All SMS reminders include &quot;Reply STOP to opt out&quot; to stay compliant.
          </p>
        </div>

        <div className="rounded-[12px] border border-[var(--dash-border)] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Quiet hours</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--dash-muted)]">Start</label>
              <select
                value={quietStart}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setQuietStart(next);
                  void save({ quiet_hours_start: next });
                }}
                className="w-full rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <option key={hour} value={hour}>
                    {formatHourLabel(hour)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--dash-muted)]">End</label>
              <select
                value={quietEnd}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setQuietEnd(next);
                  void save({ quiet_hours_end: next });
                }}
                className="w-full rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <option key={hour} value={hour}>
                    {formatHourLabel(hour)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--dash-muted)]">Timezone</label>
              <select
                value={timeZone}
                onChange={(event) => {
                  const next = event.target.value;
                  setTimeZone(next);
                  void save({ business_timezone: next });
                }}
                className="w-full rounded-[10px] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none transition-colors focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
              >
                {timezones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BillingSummarySection({ business }: { business: Business }) {
  const [usageCount, setUsageCount] = useState(0);
  const [smsCount, setSmsCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [billingActionError, setBillingActionError] = useState("");
  const [billingSyncing, setBillingSyncing] = useState(false);
  const hasAttemptedBillingSync = useRef(false);

  useEffect(() => {
    async function fetchUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [requestRes, smsRes, teamRes] = await Promise.all([
        supabase
          .from("review_links")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("created_at", monthStart),
        supabase
          .from("review_message_deliveries")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id)
          .eq("channel", "sms")
          .eq("status", "sent")
          .gte("sent_at", monthStart),
        supabase
          .from("employees")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id),
      ]);

      setUsageCount(requestRes.count ?? 0);
      setSmsCount(smsRes.count ?? 0);
      setTeamCount(teamRes.count ?? 0);
      setLoading(false);
    }

    void fetchUsage();
  }, [business.id]);

  const status = business.subscription_status ?? "none";
  const hasBillingRelationship =
    status === "trialing" ||
    status === "active" ||
    status === "past_due" ||
    status === "paused" ||
    status === "incomplete" ||
    Boolean(business.stripe_customer_id);

  useEffect(() => {
    if (!hasBillingRelationship || business.stripe_customer_id || hasAttemptedBillingSync.current) {
      return;
    }

    hasAttemptedBillingSync.current = true;
    setBillingSyncing(true);

    fetchWithAuth("/api/verify-subscription", { method: "POST" })
      .then((res) => res.json())
      .then((data: { updated?: boolean; stripe_customer_id?: string | null; subscription_status?: string }) => {
        if (data.updated && (data.stripe_customer_id || data.subscription_status !== status)) {
          window.location.reload();
        }
      })
      .catch(() => {
        // Silent fallback: the page still renders the current billing state,
        // and the owner can refresh or reopen the account page.
      })
      .finally(() => {
        setBillingSyncing(false);
      });
  }, [business.stripe_customer_id, hasBillingRelationship, status]);

  async function handleCheckout() {
    setBillingActionError("");
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setBillingActionError(
          data.error || "We couldn't open Stripe right now. Please try again in a moment.",
        );
        setRedirecting(false);
      }
    } catch {
      setBillingActionError("We couldn't open Stripe right now. Please try again in a moment.");
      setRedirecting(false);
    }
  }

  async function handlePortal() {
    if (!business.stripe_customer_id) return;
    setBillingActionError("");
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/billing-portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setBillingActionError(
          data.error || "We couldn't open the billing portal right now. Please try again in a moment.",
        );
        setRedirecting(false);
      }
    } catch {
      setBillingActionError(
        "We couldn't open the billing portal right now. Please try again in a moment.",
      );
      setRedirecting(false);
    }
  }

  const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const planName =
    status === "trial"
      ? "Trial"
      : status === "trialing" || status === "active"
        ? "Pro"
        : status === "past_due"
          ? "Past due"
          : status === "canceled"
            ? "Canceled"
            : "Starter";
  const ownerSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(business.created_at));
  const badgeLabel =
    status === "active"
      ? "Active"
      : status === "trialing"
        ? trialEndsAt
          ? `Trial ends ${trialEndsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "Trial active"
        : status === "trial"
          ? trialEndsAt
            ? `Trial ends ${trialEndsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : "Free trial"
        : status === "past_due"
          ? "Payment issue"
          : status === "canceled"
            ? "Canceled"
            : "Not subscribed";
  const badgeToneClassName =
    status === "active"
      ? "bg-[#DDE5DF] text-[#365347]"
      : status === "trial" || status === "trialing"
        ? "bg-[#F3E7C7] text-[#8A651F]"
        : status === "past_due" || status === "canceled"
          ? "bg-[#FBE3DA] text-[#A6452E]"
          : "bg-[#F4EFE5] text-[var(--dash-muted)]";
  const usageTiles = [
    {
      label: "Requests this month",
      value: loading ? "—" : usageCount.toLocaleString("en-US"),
      detail:
        status === "trial" || status === "trialing"
          ? `${business.trial_requests_remaining} trial request${business.trial_requests_remaining === 1 ? "" : "s"} left`
          : "Review requests created",
    },
    {
      label: "SMS sent",
      value: loading ? "—" : smsCount.toLocaleString("en-US"),
      detail: "Delivered this month",
    },
    {
      label: "Team members",
      value: loading ? "—" : teamCount.toLocaleString("en-US"),
      detail: teamCount > 0 ? "On your account" : "Add from Team & Services",
    },
  ];
  const billingAccessRows = hasBillingRelationship
    ? [
        {
          title: "Invoices & receipts",
          detail: "Download invoice history and receipts in the billing portal.",
          value: "In Stripe",
        },
        {
          title: "Payment method",
          detail: status === "past_due" ? "Update the saved card to clear the payment issue." : "Update the saved card or billing details from the same place.",
          value: status === "past_due" ? "Needs attention" : "Saved card",
        },
        {
          title: "Plan changes",
          detail:
            status === "trialing"
              ? "Your Pro plan is in its trial period. Card details and future invoices live in Stripe."
              : status === "trial"
                ? "Upgrade from trial whenever you're ready."
              : status === "canceled"
                ? "Resume the plan without losing history."
                : "Change plans or review subscription details in Stripe.",
          value: status === "trialing" ? "Trial active" : status === "trial" ? "Trial" : status === "canceled" ? "Paused" : "Manage",
        },
      ]
    : [
        {
          title: "Start billing",
          detail: "Checkout opens in Stripe when you're ready to unlock live sending.",
          value: "Stripe",
        },
        {
          title: "Current status",
          detail:
            status === "trial" || status === "trialing"
              ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in the trial.`
              : "No paid billing activity yet.",
          value: status === "trialing" ? "Trial active" : status === "trial" ? "Trial" : "Not started",
        },
        {
          title: "Team members",
          detail: teamCount > 0 ? `${teamCount} on the account today.` : "No team members added yet.",
          value: teamCount > 0 ? `${teamCount}` : "—",
        },
      ];
  const billingAccessTitle = hasBillingRelationship ? "Billing access" : "Billing setup";
  const billingAccessDescription = hasBillingRelationship
    ? "The billing portal handles invoices, cards, and plan changes in one place."
    : "Stripe opens when you're ready to start the plan and save billing details.";
  const billingFooterNote =
    status === "active"
      ? "Your plan is active. Review requests and follow-ups keep running as normal."
      : status === "trial" || status === "trialing"
        ? trialEndsAt
          ? `Trial ends on ${trialEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
          : "Trial is active."
        : status === "past_due"
          ? "A recent payment failed. Update the billing method to keep sending without interruption."
          : status === "canceled"
            ? "Sending is paused until you resubscribe. Historic requests and replies stay on the account."
            : "Start the plan when you're ready to send live requests and follow-ups to real customers.";

  return (
    <div className="grid gap-5 min-[1180px]:grid-cols-[1.1fr_0.9fr]">
      <section className="relative overflow-hidden rounded-[16px] border border-[var(--dash-border)] bg-white px-7 py-7 shadow-[var(--dash-shadow)]">
        <div className="pointer-events-none absolute right-[-38px] top-[-56px] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(224,90,61,0.16)_0%,rgba(224,90,61,0.05)_34%,transparent_68%)]" />
        <div className="relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                Your plan
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <h2 className="font-heading text-[66px] font-semibold leading-[0.9] tracking-[-0.05em] text-[var(--dash-text)]">
                  {planName}
                </h2>
                <div className="pb-2">
                  <div className="flex items-end gap-1">
                    <span className="font-heading text-[36px] font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)]">
                      $79
                    </span>
                    <span className="pb-1 text-[13px] text-[var(--dash-muted)]">/ month</span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--dash-muted)]">Customer since {ownerSince}</p>
                </div>
              </div>
            </div>

            <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${badgeToneClassName}`}>
              {badgeLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 min-[1180px]:grid-cols-3">
            {usageTiles.map((tile) => (
              <div key={tile.label} className="rounded-[14px] border border-[var(--dash-border)] bg-[#FCFAF6] px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
                  {tile.label}
                </p>
                <p className="mt-3 font-heading text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--dash-text)]">
                  {tile.value}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--dash-muted)]">{tile.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-[#D9CFB6] pt-4">
            <div>
              <p className="text-[13px] text-[var(--dash-text)]">
                {business.stripe_customer_id
                  ? "Billing details, invoices, and payment methods live in Stripe."
                  : hasBillingRelationship
                    ? "Your subscription trial is live. Stripe billing details are still syncing into the account."
                    : "Start the plan when you’re ready to unlock live sending."}
              </p>
              {(status === "trial" || status === "trialing") && trialEndsAt ? (
                <p className="mt-1 text-[12px] text-[#9B5C2E]">
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in the trial.
                </p>
              ) : null}
              {billingSyncing && !business.stripe_customer_id ? (
                <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
                  Finishing the Stripe link for invoices and card management...
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {business.stripe_customer_id ? (
                <button
                  type="button"
                  onClick={() => void handlePortal()}
                  disabled={redirecting}
                  className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
                >
                  {redirecting ? "Redirecting..." : "Manage billing"}
                </button>
              ) : null}

              {(status === "trial" || status === "none" || status === "canceled") ? (
                <button
                  type="button"
                  onClick={() => void handleCheckout()}
                  disabled={redirecting}
                  className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
                >
                  {redirecting
                    ? "Redirecting..."
                    : status === "none"
                      ? "Start free trial"
                      : status === "trial"
                        ? "Start plan"
                        : "Resubscribe"}
                </button>
              ) : null}

              {status === "past_due" ? (
                <button
                  type="button"
                  onClick={() => void handlePortal()}
                  disabled={redirecting}
                  className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
                >
                  {redirecting ? "Redirecting..." : "Update payment"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[16px] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--dash-border)] px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
              {billingAccessTitle}
            </p>
            <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--dash-text)]">
              {hasBillingRelationship ? "Handle payment details in one place" : "Billing starts in one place"}
            </h3>
            <p className="mt-2 max-w-[34ch] text-[12px] leading-relaxed text-[var(--dash-muted)]">
              {billingAccessDescription}
            </p>
          </div>
          <StatusPill status={status} className="shrink-0" />
        </div>

        <div className="divide-y divide-[var(--dash-border)]">
          {billingAccessRows.map((row) => (
            <div key={row.title} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--dash-text)]">{row.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">{row.detail}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#E6DDD0] bg-[#FCFAF6] px-3 py-1 text-[11px] font-medium text-[var(--dash-text)]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--dash-border)] bg-[#FCFAF6] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p
              className={`max-w-[34ch] text-[12px] leading-relaxed ${
                status === "past_due" ? "text-[#C04E31]" : "text-[var(--dash-muted)]"
              }`}
            >
              {billingFooterNote}
            </p>
            {business.stripe_customer_id ? (
              <button
                type="button"
                onClick={() => void handlePortal()}
                disabled={redirecting}
                className={dashboardButtonClassName({ variant: "accent", size: "sm" })}
              >
                {redirecting ? "Redirecting..." : "Open billing portal"}
              </button>
            ) : hasBillingRelationship ? (
              <span className="rounded-full border border-[#E6DDD0] bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--dash-muted)]">
                Syncing Stripe details
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleCheckout()}
                disabled={redirecting}
                className={dashboardButtonClassName({ variant: "success", size: "sm" })}
              >
                {redirecting ? "Redirecting..." : "Start plan"}
              </button>
            )}
          </div>
          {billingActionError ? (
            <p className="mt-3 text-[12px] leading-relaxed text-[#A6452E]">
              {billingActionError}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function AccountDataSection({
  business,
  onDeleteRequested,
}: {
  business: Business;
  onDeleteRequested: () => void;
}) {
  const hasGoogle = Boolean(business.google_place_id || business.google_review_url?.trim());
  const crmCount = business.connected_crms ? Object.keys(business.connected_crms).length : 0;
  const hasBillingDocuments =
    Boolean(business.stripe_customer_id) ||
    business.subscription_status === "trialing" ||
    business.subscription_status === "active" ||
    business.subscription_status === "past_due" ||
    business.subscription_status === "paused" ||
    business.subscription_status === "incomplete";

  return (
    <div className="overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
      <div className="border-b border-[var(--dash-border)] px-6 py-5">
        <h2 className="text-[16px] font-semibold text-[var(--dash-text)]">Your data</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--dash-muted)]">
          Billing documents, connected systems, and the permanent account actions live here.
        </p>
      </div>

      <div className="divide-y divide-[var(--dash-border)]">
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Billing documents</p>
            <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">
              {hasBillingDocuments ? "Invoices available in Stripe" : "No billing documents yet"}
            </p>
            <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
              {hasBillingDocuments
                ? "Open the billing portal to download receipts and invoice history."
                : "Start the plan first, then invoices and receipts will live in the billing portal."}
            </p>
          </div>
          {hasBillingDocuments ? (
            <Link href="/dashboard/more/account#billing" className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}>
              Open billing
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Connected systems</p>
            <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">
              {hasGoogle ? "Google Business Profile connected" : "Google Business Profile pending"}
            </p>
            <p className="mt-1 text-[12px] text-[var(--dash-muted)]">
              {crmCount > 0
                ? `${crmCount} CRM integration${crmCount === 1 ? "" : "s"} connected.`
                : "No CRM integrations connected yet."}
            </p>
          </div>
          <StatusPill status={hasGoogle ? "connected" : "pending"} />
        </div>
      </div>

      <div className="border-t border-[var(--dash-border)] bg-[#FFF8F4] px-6 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#BC4A2F]">Danger zone</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-medium text-[var(--dash-text)]">Delete account and data</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
              This removes the business, review links, and billing records. It cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onDeleteRequested}
            className={dashboardButtonClassName({ variant: "danger", size: "sm" })}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountControlsSection({
  session,
  signOut,
}: {
  session: Session | null;
  signOut: () => Promise<void>;
}) {
  const { toast } = useToast();

  return (
    <div className="overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
      <div className="border-b border-[var(--dash-border)] px-6 py-5">
        <h2 className="text-[16px] font-semibold text-[var(--dash-text)]">Login & security</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--dash-muted)]">
          The everyday account items live here. Nothing below changes how requests work.
        </p>
      </div>

      <div className="divide-y divide-[var(--dash-border)]">
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Email</p>
            <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">{session?.user?.email ?? "\u2014"}</p>
            <p className="mt-1 text-[12px] text-[var(--dash-muted)]">Used for login and account notices</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Password</p>
            <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">Reset by email</p>
            <p className="mt-1 text-[12px] text-[var(--dash-muted)]">We’ll send a secure reset link to your owner email.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const email = session?.user?.email;
              if (email) {
                await supabase.auth.resetPasswordForEmail(email);
                toast("Password reset email sent.", "success");
              }
            }}
            className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
          >
            Send reset link
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Session</p>
            <p className="mt-2 text-[14px] font-medium text-[var(--dash-text)]">You are signed in</p>
            <p className="mt-1 text-[12px] text-[var(--dash-muted)]">Sign out here if you’re switching devices or owner accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-dashboard"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Delete account confirmation" className="mx-4 w-full max-w-[400px] rounded-[var(--dash-radius)] bg-white p-6 shadow-lg">
        <h3 className="text-[16px] font-bold text-[var(--dash-text)]">Delete your account?</h3>
        <p className="mt-2 text-[13px] text-[var(--dash-muted)]">
          This will permanently delete your business, all review links, and cancel your subscription. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 ${dashboardButtonClassName()}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              toast("Your account deletion has been requested. We'll process this within 48 hours and email you a confirmation.", "info");
            }}
            className={`flex-1 ${dashboardButtonClassName({ variant: "danger" })}`}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
