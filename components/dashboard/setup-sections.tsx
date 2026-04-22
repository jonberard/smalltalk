"use client";

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
}: {
  businessId: string;
  initial: {
    name: string;
    logo_url: string | null;
    google_review_url: string;
    google_place_id: string | null;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [googleUrl, setGoogleUrl] = useState(initial.google_review_url);
  const [placeId, setPlaceId] = useState<string | null>(initial.google_place_id);
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
      await supabase.from("businesses").update(fields).eq("id", businessId);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [businessId],
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
    await save({ google_review_url: url, google_place_id: place.place_id, business_city: city });
  }

  function handleClearPlace() {
    setSelectedPlace(null);
    setPlaceId(null);
    setGoogleUrl("");
    void save({ google_review_url: "", google_place_id: null });
  }

  async function handleLogoUpload(file: File) {
    const ext = file.name.split(".").pop();
    const path = `logos/${businessId}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });

    if (uploadErr) {
      setLogoPreview(URL.createObjectURL(file));
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl;
    setLogoPreview(url);
    void save({ logo_url: url });
  }

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="relative overflow-hidden rounded-t-[16px] bg-gradient-to-br from-[#E05A3D]/[0.04] via-[#F8F9FA] to-[#E05A3D]/[0.02] px-6 pb-6 pt-8">
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

        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_4px_24px_rgba(224,90,61,0.12)] ring-1 ring-[rgba(228,228,231,0.5)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(224,90,61,0.18)] active:scale-[0.97]"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[24px] font-bold tracking-tight text-[#E05A3D]">{initials}</span>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[20px] bg-[#18181B]/0 transition-all duration-300 group-hover:bg-[#18181B]/50">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="translate-y-1 text-[10px] font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                Upload
              </span>
            </div>
          </button>

          <p className="text-[18px] font-bold tracking-tight text-[var(--dash-text)]">{name || "Your Business"}</p>

          <div className="mt-3 flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-[var(--dash-shadow)] ring-1 ring-[rgba(228,228,231,0.5)]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E05A3D]/10">
              <span className="text-[8px] font-bold text-[#E05A3D]">{initials.slice(0, 2)}</span>
            </div>
            <span className="text-[11px] text-[var(--dash-muted)]">How customers see you</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">
        <div>
          <label className="mb-2 block text-[12px] font-medium text-[var(--dash-muted)]">Business name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              if (name !== initial.name) void save({ name });
            }}
            placeholder="Your business name"
            className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-[12px] font-medium text-[var(--dash-muted)]">Google Business Profile</label>
          {selectedPlace && placeId ? (
            <div className="flex items-start gap-3 rounded-[var(--dash-radius-sm)] border border-[#10B981]/30 bg-[#ECFDF5] px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#10B981]">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[13px] font-medium text-[var(--dash-text)]">{selectedPlace.name || "Connected"}</span>
                </div>
                {selectedPlace.address ? (
                  <p className="mt-1 pl-[24px] text-[12px] text-[var(--dash-muted)]">{selectedPlace.address}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClearPlace}
                className="shrink-0 rounded-[6px] px-2.5 py-1 text-[11px] font-medium text-[var(--dash-muted)] transition-all duration-200 hover:bg-white hover:text-[#EF4444]"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--dash-muted)]">
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
                  className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] py-3 pl-10 pr-4 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                {searching ? (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4D4D8] border-t-[#E05A3D]" />
                  </div>
                ) : null}
              </div>

              {searchResults.length > 0 ? (
                <div className="mt-2 overflow-hidden rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                  {searchResults.map((place, index) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => void handlePlaceSelect(place)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-[var(--dash-bg)] active:bg-[var(--dash-bg)] ${
                        index < searchResults.length - 1 ? "border-b border-[var(--dash-border)]" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#E05A3D]/[0.06]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[var(--dash-text)]">{place.name}</p>
                        <p className="mt-0.5 truncate text-[12px] text-[var(--dash-muted)]">{place.address}</p>
                        {place.rating ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, step) => (
                                <svg key={step} width="10" height="10" viewBox="0 0 24 24" fill={step < Math.round(place.rating as number) ? "#F59E0B" : "#E5E7EB"}>
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[11px] text-[var(--dash-muted)]">
                              {place.rating} ({place.user_ratings_total})
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {!showManual ? (
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  className="mt-2.5 text-[12px] text-[var(--dash-muted)] transition-all duration-200 hover:text-[var(--dash-text)]"
                >
                  Can&apos;t find your business? Paste your Google review link directly
                </button>
              ) : (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={googleUrl}
                    onChange={(event) => setGoogleUrl(event.target.value)}
                    onBlur={() => {
                      if (googleUrl !== initial.google_review_url) void save({ google_review_url: googleUrl });
                    }}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {saving || saved ? <p className="text-[12px] text-[#10B981]">{saving ? "Saving..." : "Saved"}</p> : null}
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
              className={`shrink-0 rounded-[var(--dash-radius-sm)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 ${
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
          className="flex w-full items-center gap-2.5 border-t border-[var(--dash-border)] px-6 py-4 text-[13px] font-medium text-[#E05A3D] transition-all duration-200 hover:bg-[#E05A3D]/[0.03] active:scale-[0.99]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#E05A3D]/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Service areas</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">Neighborhoods you serve and reference in reviews</p>
          </div>
          {saving ? <span className="text-[11px] text-[#10B981]">Saving...</span> : null}
          {!saving && items.length > 0 ? (
            <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">
              {items.length}
            </span>
          ) : null}
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
              className={`shrink-0 rounded-[var(--dash-radius-sm)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 ${
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
          className="flex w-full items-center gap-2.5 border-t border-[var(--dash-border)] px-6 py-4 text-[13px] font-medium text-[#E05A3D] transition-all duration-200 hover:bg-[#E05A3D]/[0.03] active:scale-[0.99]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#E05A3D]/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className={`shrink-0 rounded-[var(--dash-radius-sm)] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 ${
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
          className="flex w-full items-center gap-2.5 border-t border-[var(--dash-border)] px-6 py-4 text-[13px] font-medium text-[#E05A3D] transition-all duration-200 hover:bg-[#E05A3D]/[0.03] active:scale-[0.99]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#E05A3D]/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Reply voice</h3>
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
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 ${
              selectedId === voice.id
                ? "bg-[var(--dash-primary)] text-white shadow-sm"
                : "bg-[var(--dash-bg)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"
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
              className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:brightness-95 disabled:opacity-50"
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

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
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
              placeholder="{{business_name}} would love your feedback. Tap the button below to share your experience - takes 30 seconds."
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
              className="text-[12px] font-medium text-[var(--dash-muted)] underline underline-offset-2 hover:no-underline"
            >
              Reset to default wording
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-[10px] bg-[var(--dash-primary)] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:brightness-95 disabled:opacity-50"
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
}: {
  businessId: string;
  initialEnabled: boolean;
  initialQuietStart: number;
  initialQuietEnd: number;
  initialTimezone: string;
}) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [quietStart, setQuietStart] = useState(initialQuietStart);
  const [quietEnd, setQuietEnd] = useState(initialQuietEnd);
  const [timeZone, setTimeZone] = useState(initialTimezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const timezones = REMINDER_TIMEZONE_OPTIONS.includes(timeZone) ? REMINDER_TIMEZONE_OPTIONS : [timeZone, ...REMINDER_TIMEZONE_OPTIONS];

  async function save(next: {
    reminder_sequence_enabled?: boolean;
    quiet_hours_start?: number;
    quiet_hours_end?: number;
    business_timezone?: string;
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
        {saving || saved ? <p className="text-[12px] text-[#10B981]">{saving ? "Saving..." : "Saved"}</p> : null}
      </div>

      <div className="mt-5 rounded-[12px] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
        <label className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-[var(--dash-text)]">
              Send automatic reminders to customers who don&apos;t complete their review
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">
              Initial message sends right away. Then small Talk can send up to two follow-ups, and stops as soon as the customer completes the flow or texts STOP.
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[12px] border border-[var(--dash-border)] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Sequence</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-[10px] bg-[var(--dash-bg)] px-3.5 py-3">
              <p className="text-[13px] font-medium text-[var(--dash-text)]">1. Initial message</p>
              <p className="mt-1 text-[12px] text-[var(--dash-muted)]">Sent immediately when you send the review request.</p>
            </div>
            <div className="rounded-[10px] bg-[var(--dash-bg)] px-3.5 py-3">
              <p className="text-[13px] font-medium text-[var(--dash-text)]">2. First reminder</p>
              <p className="mt-1 text-[12px] text-[var(--dash-muted)]">Sent 24 hours later if the customer still hasn&apos;t completed the flow.</p>
            </div>
            <div className="rounded-[10px] bg-[var(--dash-bg)] px-3.5 py-3">
              <p className="text-[13px] font-medium text-[var(--dash-text)]">3. Final reminder</p>
              <p className="mt-1 text-[12px] text-[var(--dash-muted)]">Sent 72 hours after the initial request. That&apos;s the last message.</p>
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
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function fetchUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .gte("created_at", monthStart);
      setUsageCount(count ?? 0);
      setLoading(false);
    }

    void fetchUsage();
  }, [business.id]);

  async function handleCheckout() {
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  }

  async function handlePortal() {
    if (!business.stripe_customer_id) return;
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/billing-portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  }

  const status = business.subscription_status ?? "none";
  const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
      <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] px-6 py-7 shadow-[var(--dash-shadow)]">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--dash-text)]">small Talk Pro</h2>
            <p className="mt-0.5 text-[14px] text-[var(--dash-muted)]">$79/mo</p>
          </div>
          <StatusPill status={status} className="self-start" />
        </div>

        <div className="mt-5">
          {status === "trialing" && trialEndsAt ? (
            <div>
              <p className="text-[14px] text-[var(--dash-text)]">
                Your free trial ends{" "}
                <span className="font-medium">
                  {trialEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#D97706]">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--dash-border)]">
                  <div
                    className="h-full rounded-full bg-[#D97706] transition-all"
                    style={{ width: `${Math.max(5, ((7 - daysRemaining) / 7) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {status === "active" ? (
            <p className="text-[14px] text-[var(--dash-muted)]">
              Your subscription is active. Next billing date will appear in the Stripe portal.
            </p>
          ) : null}

          {status === "past_due" ? (
            <div className="rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3">
              <p className="text-[14px] font-medium text-[#DC2626]">
                Your payment failed. Update your payment method to keep your account active.
              </p>
            </div>
          ) : null}

          {status === "canceled" ? (
            <p className="text-[14px] text-[var(--dash-muted)]">
              Your subscription was canceled. Resubscribe to continue sending review links.
            </p>
          ) : null}

          {status === "none" ? (
            <p className="text-[14px] text-[var(--dash-muted)]">
              You&apos;re not subscribed yet. Start your free trial to begin sending review links.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {(status === "none" || status === "canceled") ? (
            <button
              type="button"
              onClick={() => void handleCheckout()}
              disabled={redirecting}
              className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
            >
              {redirecting ? "Redirecting..." : status === "none" ? "Start free trial" : "Resubscribe"}
            </button>
          ) : null}

          {status === "past_due" ? (
            <button
              type="button"
              onClick={() => void handlePortal()}
              disabled={redirecting}
              className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
            >
              {redirecting ? "Redirecting..." : "Update payment method"}
            </button>
          ) : null}

          {business.stripe_customer_id ? (
            <button
              type="button"
              onClick={() => void handlePortal()}
              disabled={redirecting}
              className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-[var(--dash-primary)] transition-all duration-150 hover:bg-[#E05A3D]/[0.04] active:scale-[0.98] disabled:opacity-60"
            >
              {redirecting ? "Redirecting..." : "Manage billing"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">This month&apos;s usage</h3>
          <div className="mt-4">
            {loading ? (
              <SkeletonCard className="max-w-[300px]" />
            ) : (
              <StatCard
                className="max-w-[300px]"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                }
                label="Review requests sent"
                value={usageCount}
              />
            )}
          </div>
        </div>

        <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
          <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Invoice history</h3>
          <div className="mt-3">
            {business.stripe_customer_id ? (
              <p className="text-[13px] leading-relaxed text-[var(--dash-muted)]">
                View and download invoices in the{" "}
                <button
                  type="button"
                  onClick={() => void handlePortal()}
                  className="font-medium text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
                >
                  billing portal
                </button>
                .
              </p>
            ) : (
              <p className="text-[13px] text-[var(--dash-muted)]">
                No invoices yet. Subscribe to start your billing history.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountControlsSection({
  session,
  signOut,
  onDeleteRequested,
}: {
  session: Session | null;
  signOut: () => Promise<void>;
  onDeleteRequested: () => void;
}) {
  const { toast } = useToast();

  return (
    <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
      <h2 className="mb-4 text-[16px] font-semibold text-[var(--dash-text)]">Login & security</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-[var(--dash-muted)]">Email</label>
          <p className="text-[14px] text-[var(--dash-text)]">{session?.user?.email ?? "\u2014"}</p>
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
          className="text-[13px] font-medium text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
        >
          Change password
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="block text-[13px] font-medium text-[var(--dash-muted)] underline underline-offset-2 hover:no-underline"
        >
          Sign out
        </button>
        <div className="border-t border-[var(--dash-border)] pt-4">
          <button
            type="button"
            onClick={onDeleteRequested}
            className="text-[12px] font-medium text-[#DC2626] underline underline-offset-2 hover:no-underline"
          >
            Delete account
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
            className="flex-1 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] py-2.5 text-[13px] font-semibold text-[var(--dash-muted)] transition-all hover:bg-[var(--dash-bg)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              toast("Your account deletion has been requested. We'll process this within 48 hours and email you a confirmation.", "info");
            }}
            className="flex-1 rounded-[var(--dash-radius-sm)] bg-[#DC2626] py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
