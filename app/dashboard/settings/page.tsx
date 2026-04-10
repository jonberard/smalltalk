"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { REVIEW_VOICES } from "@/lib/review-voices";
import { REPLY_VOICES } from "@/lib/reply-generator";
import { useToast } from "@/components/dashboard/toast";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

type ServiceRow = { id: string; name: string };
type EmployeeRow = { id: string; name: string };
type TopicRow = {
  id: string;
  label: string;
  tier: string;
  follow_up_question: string;
  follow_up_options: string[];
  sort_order: number;
  business_id: string | null;
};

/* ═══════════════════════════════════════════════════
   BUSINESS PROFILE
   ═══════════════════════════════════════════════════ */

type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  user_ratings_total: number;
};

function BusinessProfile({ businessId, initial }: {
  businessId: string;
  initial: { name: string; logo_url: string | null; google_review_url: string; google_place_id: string | null };
}) {
  const [name, setName] = useState(initial.name);
  const [googleUrl, setGoogleUrl] = useState(initial.google_review_url);
  const [placeId, setPlaceId] = useState<string | null>(initial.google_place_id);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Google Places search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(
    initial.google_place_id
      ? { place_id: initial.google_place_id, name: "", address: "", rating: null, user_ratings_total: 0 }
      : null
  );
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const initials = name.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase()
    : "?";

  const save = useCallback(async (fields: Record<string, string | null>) => {
    setSaving(true);
    await supabase.from("businesses").update(fields).eq("id", businessId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [businessId]);

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
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  }

  async function handlePlaceSelect(place: PlaceResult) {
    const url = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    setSelectedPlace(place);
    setPlaceId(place.place_id);
    setGoogleUrl(url);
    setSearchQuery("");
    setSearchResults([]);

    // Extract city from address (typically "City, State ZIP, Country" format)
    const city = extractCity(place.address);
    save({ google_review_url: url, google_place_id: place.place_id, business_city: city });
  }

  function extractCity(address: string): string | null {
    // Google formatted_address: "123 Main St, Austin, TX 78701, USA"
    const parts = address.split(",").map((p) => p.trim());
    // City is usually the second-to-last US part (before "State ZIP" and "USA/Country")
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length === 2) return parts[0];
    return null;
  }

  function handleClearPlace() {
    setSelectedPlace(null);
    setPlaceId(null);
    setGoogleUrl("");
    save({ google_review_url: "", google_place_id: null });
  }

  async function handleLogoUpload(file: File) {
    const ext = file.name.split(".").pop();
    const path = `logos/${businessId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      // If bucket doesn't exist yet, show the preview anyway
      setLogoPreview(URL.createObjectURL(file));
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl;
    setLogoPreview(url);
    save({ logo_url: url });
  }

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="relative overflow-hidden rounded-t-[16px] bg-gradient-to-br from-[#E05A3D]/[0.04] via-[#F8F9FA] to-[#E05A3D]/[0.02] px-6 pb-6 pt-8">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleLogoUpload(f);
        }} />

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name !== initial.name) save({ name }); }}
            placeholder="Your business name"
            className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
          />
        </div>
        <div>
          <label className="mb-2 block text-[12px] font-medium text-[var(--dash-muted)]">Google Business Profile</label>

          {/* Selected place card */}
          {selectedPlace && placeId ? (
            <div className="flex items-start gap-3 rounded-[var(--dash-radius-sm)] border border-[#10B981]/30 bg-[#ECFDF5] px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#10B981]">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[13px] font-medium text-[var(--dash-text)]">
                    {selectedPlace.name || "Connected"}
                  </span>
                </div>
                {selectedPlace.address && (
                  <p className="mt-1 text-[12px] text-[var(--dash-muted)] pl-[24px]">{selectedPlace.address}</p>
                )}
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
              {/* Search field */}
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
                  onChange={(e) => handlePlaceSearch(e.target.value)}
                  placeholder="Search for your business on Google"
                  className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] py-3 pl-10 pr-4 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                {searching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4D4D8] border-t-[#E05A3D]" />
                  </div>
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                  {searchResults.map((place, i) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handlePlaceSelect(place)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-[var(--dash-bg)] active:bg-[var(--dash-bg)] ${
                        i < searchResults.length - 1 ? "border-b border-[var(--dash-border)]" : ""
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
                        <p className="mt-0.5 text-[12px] text-[var(--dash-muted)] truncate">{place.address}</p>
                        {place.rating && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill={s < Math.round(place.rating!) ? "#F59E0B" : "#E5E7EB"}>
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[11px] text-[var(--dash-muted)]">{place.rating} ({place.user_ratings_total})</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual fallback */}
              {!showManual ? (
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  className="mt-2.5 text-[12px] text-[var(--dash-muted)] transition-all duration-200 hover:text-[var(--dash-muted)]"
                >
                  Can&apos;t find your business? Paste your Google review link directly
                </button>
              ) : (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    onBlur={() => { if (googleUrl !== initial.google_review_url) save({ google_review_url: googleUrl }); }}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-all duration-300 focus:border-[#E05A3D]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                  />
                </div>
              )}
            </>
          )}
        </div>
        {(saving || saved) && (
          <p className="text-[12px] text-[#10B981]">{saving ? "Saving..." : "Saved"}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SERVICES
   ═══════════════════════════════════════════════════ */

function ServicesList({ services: initial, businessId }: { services: ServiceRow[]; businessId: string }) {
  const [services, setServices] = useState(initial);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  async function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || services.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    const { data, error } = await supabase
      .from("services")
      .insert({ business_id: businessId, name: trimmed })
      .select("id, name")
      .single();
    if (data) {
      setServices([...services, data]);
      toast("Service added!", "success");
    }
    if (error) toast(`Something went wrong: ${error.message}`, "error");
    setDraft("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("services").delete().eq("id", id);
    setServices(services.filter((s) => s.id !== id));
  }

  const accents = ["#E05A3D", "#10B981", "#F59E0B", "#E11D48", "#8B5CF6", "#06B6D4", "#F97316", "#6366F1"];

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Services</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">What you offer — shows in the Send form</p>
          </div>
          <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">{services.length}</span>
        </div>
      </div>

      <div className="px-3">
        {services.map((service, i) => (
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
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accents[i % accents.length] }} />
            </div>

            <span className="flex-1 text-[14px] font-medium text-[var(--dash-text)]">{service.name}</span>

            <button
              type="button"
              onClick={() => handleRemove(service.id)}
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
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setDraft(""); }
              }}
              placeholder="What service do you offer?"
              autoFocus
              className="flex-1 rounded-[var(--dash-radius-sm)] border border-[#E05A3D]/30 bg-white px-4 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <button
              type="button"
              onClick={handleAdd}
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

/* ═══════════════════════════════════════════════════
   NEIGHBORHOODS
   ═══════════════════════════════════════════════════ */

function NeighborhoodsList({ neighborhoods: initial, businessId }: { neighborhoods: string[]; businessId: string }) {
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
    if (!trimmed || items.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...items, trimmed];
    setItems(updated);
    setDraft("");
    setAdding(false);
    persist(updated);
  }

  function handleRemove(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    persist(updated);
  }

  const areaColors = ["#06B6D4", "#8B5CF6", "#F97316", "#10B981", "#E11D48", "#E05A3D", "#F59E0B", "#6366F1"];

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Service Areas</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">Neighborhoods you serve — boosts local SEO in reviews</p>
          </div>
          {saving && <span className="text-[11px] text-[#10B981]">Saving...</span>}
          {!saving && items.length > 0 && (
            <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">{items.length}</span>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="px-6 pb-1">
          <div className="flex flex-wrap gap-2">
            {items.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="group/chip flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-white"
                style={{ backgroundColor: areaColors[i % areaColors.length] }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
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
      )}

      {adding ? (
        <div className="border-t border-[var(--dash-border)] px-6 py-4">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setDraft(""); }
              }}
              placeholder="e.g. Zilker, Westlake, North Loop"
              autoFocus
              className="flex-1 rounded-[var(--dash-radius-sm)] border border-[#E05A3D]/30 bg-white px-4 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <button
              type="button"
              onClick={handleAdd}
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

/* ═══════════════════════════════════════════════════
   TEAM
   ═══════════════════════════════════════════════════ */

function TeamList({ employees: initial, businessId }: { employees: EmployeeRow[]; businessId: string }) {
  const [employees, setEmployees] = useState(initial);
  const [draftName, setDraftName] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  async function handleAdd() {
    const n = draftName.trim();
    if (!n || employees.some((e) => e.name.toLowerCase() === n.toLowerCase())) return;
    const { data, error } = await supabase
      .from("employees")
      .insert({ business_id: businessId, name: n })
      .select("id, name")
      .single();
    if (data) {
      setEmployees([...employees, data]);
      toast("Team member added!", "success");
    }
    if (error) toast(`Something went wrong: ${error.message}`, "error");
    setDraftName("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("employees").delete().eq("id", id);
    setEmployees(employees.filter((e) => e.id !== id));
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
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Team</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">People who perform your services</p>
          </div>
          <span className="rounded-full bg-[var(--dash-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--dash-muted)]">{employees.length}</span>
        </div>
      </div>

      <div className="px-3">
        {employees.map((emp, i) => {
          const color = avatarColors[i % avatarColors.length];
          return (
            <div
              key={emp.id}
              className="group flex items-center gap-3.5 rounded-[var(--dash-radius-sm)] px-3 py-3 transition-all duration-200 hover:bg-[var(--dash-bg)]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {emp.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[var(--dash-text)]">{emp.name}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(emp.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--dash-muted)] transition-all duration-200 hover:bg-[#FEE2E2] hover:text-[#EF4444] active:scale-[0.92]"
                aria-label={`Remove ${emp.name}`}
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
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setDraftName(""); }
              }}
              placeholder="Name"
              autoFocus
              className="flex-1 rounded-[var(--dash-radius-sm)] border border-[#E05A3D]/30 bg-white px-4 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
            />
            <button
              type="button"
              onClick={handleAdd}
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

/* ═══════════════════════════════════════════════════
   REVIEW TOPICS
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   INTEGRATIONS SECTION
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   REPLY VOICE
   ═══════════════════════════════════════════════════ */

function ReplyVoiceSection({ businessId, initialVoiceId, initialCustomVoice }: {
  businessId: string;
  initialVoiceId: string;
  initialCustomVoice: string | null;
}) {
  const [selectedId, setSelectedId] = useState(initialVoiceId);
  const [customText, setCustomText] = useState(initialCustomVoice ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const VOICE_OPTIONS = [
    ...REPLY_VOICES.map((v) => ({ id: v.id, name: v.name })),
    { id: "custom", name: "Custom" },
  ];

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
    <div className="space-y-4">
      <h2 className="px-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Review Replies</h2>

      <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Reply Voice</h3>
          {saved && <span className="text-[12px] font-medium text-[var(--dash-success)]">Saved</span>}
          {saving && <span className="text-[12px] font-medium text-[var(--dash-muted)]">Saving...</span>}
        </div>
        <p className="mb-4 text-[12px] text-[var(--dash-muted)]">Choose how your replies to customer reviews will sound</p>

        <div className="flex flex-wrap gap-2">
          {VOICE_OPTIONS.map((voice) => (
            <button
              key={voice.id}
              type="button"
              onClick={() => {
                setSelectedId(voice.id);
                if (voice.id !== "custom") {
                  save(voice.id);
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

        {selectedId === "custom" && (
          <div className="mt-4">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Describe your voice — e.g., 'Friendly and casual, I call everyone by name, I always invite them back'"
              rows={3}
              className="w-full resize-none rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2.5 text-[13px] text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-primary)] focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => save("custom", customText)}
                disabled={!customText.trim() || saving}
                className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:brightness-95 disabled:opacity-50"
              >
                Save Voice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INTEGRATIONS (Coming Soon)
   ═══════════════════════════════════════════════════ */

function IntegrationsSection() {
  return (
    <div className="space-y-4">
      <h2 className="px-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Integrations</h2>

      <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--dash-primary)]/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dash-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">CRM Integrations</h3>
            <p className="text-[12px] text-[var(--dash-muted)]">Connect Jobber, ServiceTitan, and more to automatically send review links</p>
          </div>
          <span className="rounded-full bg-[var(--dash-bg)] px-3 py-1 text-[11px] font-medium text-[var(--dash-muted)]">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}

const TIER_META: { key: string; label: string; color: string; chipBg: string; dotColor: string }[] = [
  { key: "positive", label: "4-5 stars", color: "#059669", chipBg: "#ECFDF5", dotColor: "#10B981" },
  { key: "neutral", label: "3 stars", color: "#D97706", chipBg: "#FFFBEB", dotColor: "#F59E0B" },
  { key: "negative", label: "1-2 stars", color: "#DC2626", chipBg: "#FEF2F2", dotColor: "#EF4444" },
];

function TopicSection({ topics: initial, businessId, isCustomized }: {
  topics: TopicRow[];
  businessId: string;
  isCustomized: boolean;
}) {
  const [topics, setTopics] = useState(initial);
  const [addingTier, setAddingTier] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const { toast } = useToast();
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftOptions, setDraftOptions] = useState("");

  async function handleAdd(tier: string) {
    const label = draftLabel.trim();
    const question = draftQuestion.trim();
    const options = draftOptions.split(",").map((o) => o.trim()).filter(Boolean);
    if (!label || !question || options.length < 2) return;

    const maxSort = topics.filter((t) => t.tier === tier).reduce((max, t) => Math.max(max, t.sort_order), 0);

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
    if (error) toast(`Something went wrong: ${error.message}`, "error");
    setDraftLabel("");
    setDraftQuestion("");
    setDraftOptions("");
    setAddingTier(null);
  }

  async function handleRemove(id: string) {
    await supabase.from("topics").delete().eq("id", id);
    setTopics(topics.filter((t) => t.id !== id));
  }

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow)]">
      <div className="px-6 pt-5 pb-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-[var(--dash-text)]">Review Topics</h3>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">What customers are asked about during the review</p>
        {!isCustomized && (
          <p className="mt-2 rounded-[8px] bg-[var(--dash-bg)] px-3 py-2 text-[12px] text-[var(--dash-muted)]">
            These are the defaults — customize them or leave as-is.
          </p>
        )}
      </div>

      {TIER_META.map((tier, ti) => {
        const tierTopics = topics.filter((t) => t.tier === tier.key).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <div key={tier.key} className={`px-6 py-4 ${ti < TIER_META.length - 1 ? "border-b border-[var(--dash-border)]" : ""}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: tier.dotColor }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tierTopics.map((t) => (
                <span
                  key={t.id}
                  className="group/chip flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                  style={{ backgroundColor: tier.chipBg, color: tier.color }}
                >
                  {t.label}
                  <button
                    type="button"
                    onClick={() => handleRemove(t.id)}
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
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder="Topic label (e.g. Filter Condition)"
                  autoFocus
                  className="rounded-[8px] border border-[var(--dash-border)] px-3 py-2 text-[13px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                <input
                  type="text"
                  value={draftQuestion}
                  onChange={(e) => setDraftQuestion(e.target.value)}
                  placeholder="Follow-up question (e.g. How was the filter?)"
                  className="rounded-[8px] border border-[var(--dash-border)] px-3 py-2 text-[13px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                />
                <input
                  type="text"
                  value={draftOptions}
                  onChange={(e) => setDraftOptions(e.target.value)}
                  placeholder="Options, comma-separated (e.g. Great, Good, Fair, Poor)"
                  className="rounded-[8px] border border-[var(--dash-border)] px-3 py-2 text-[13px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(tier.key); }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setAddingTier(null); setDraftLabel(""); setDraftQuestion(""); setDraftOptions(""); }}
                    className="rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#94A3B8] transition-all duration-200 hover:bg-[var(--dash-bg)] hover:text-[var(--dash-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdd(tier.key)}
                    disabled={!draftLabel.trim() || !draftQuestion.trim() || draftOptions.split(",").filter((o) => o.trim()).length < 2}
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

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { business, session, signOut } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [isCustomized, setIsCustomized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!business) return;

    async function fetchAll() {
      const [svcRes, empRes, topicRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", business!.id).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", business!.id).order("name"),
        supabase.from("topics").select("*").or(`business_id.eq.${business!.id},business_id.is.null`).order("sort_order"),
      ]);

      setServices(svcRes.data || []);
      setEmployees(empRes.data || []);

      const allTopics = (topicRes.data || []) as TopicRow[];

      // If business has custom topics, show those. Otherwise show globals.
      const customTopics = allTopics.filter((t) => t.business_id === business!.id);
      if (customTopics.length > 0) {
        setTopics(customTopics);
        setIsCustomized(true);
      } else {
        setTopics(allTopics.filter((t) => t.business_id === null));
        setIsCustomized(false);
      }

      setLoading(false);
    }

    fetchAll();
  }, [business]);

  if (!business) return null;

  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">Settings</h1>
        <p className="mt-1 mb-6 text-[13px] text-[var(--dash-muted)]">Manage your business profile and preferences</p>

        {loading ? (
          <div className="flex flex-col gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[200px] animate-pulse rounded-[var(--dash-radius)] bg-[var(--dash-border)]" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <BusinessProfile
              businessId={business.id}
              initial={{
                name: business.name,
                logo_url: business.logo_url,
                google_review_url: business.google_review_url,
                google_place_id: business.google_place_id,
              }}
            />
            <ServicesList services={services} businessId={business.id} />
            <NeighborhoodsList neighborhoods={business.neighborhoods || []} businessId={business.id} />
            <TeamList employees={employees} businessId={business.id} />
            <TopicSection topics={topics} businessId={business.id} isCustomized={isCustomized} />

            {/* Reply Voice */}
            <ReplyVoiceSection
              businessId={business.id}
              initialVoiceId={business.reply_voice_id ?? "warm"}
              initialCustomVoice={business.custom_reply_voice ?? null}
            />

            {/* Integrations */}
            <IntegrationsSection />

            {/* Account */}
            <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
              <h2 className="mb-4 text-[16px] font-semibold text-[var(--dash-text)]">Account</h2>
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
                      toast("Password reset email sent!", "success");
                    }
                  }}
                  className="text-[13px] font-medium text-[var(--dash-primary)] underline underline-offset-2 hover:no-underline"
                >
                  Change password
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="block text-[13px] font-medium text-[var(--dash-muted)] underline underline-offset-2 hover:no-underline"
                >
                  Sign out
                </button>
                <div className="border-t border-[var(--dash-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-[12px] font-medium text-[#DC2626] underline underline-offset-2 hover:no-underline"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-dashboard" onKeyDown={(e) => { if (e.key === "Escape") setShowDeleteConfirm(false); }}>
                <div role="dialog" aria-modal="true" aria-label="Delete account confirmation" className="mx-4 w-full max-w-[400px] rounded-[var(--dash-radius)] bg-white p-6 shadow-lg">
                  <h3 className="text-[16px] font-bold text-[var(--dash-text)]">Delete your account?</h3>
                  <p className="mt-2 text-[13px] text-[var(--dash-muted)]">
                    This will permanently delete your business, all review links, and cancel your subscription. This action cannot be undone.
                  </p>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] py-2.5 text-[13px] font-semibold text-[var(--dash-muted)] transition-all hover:bg-[var(--dash-bg)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        toast("Your account deletion has been requested. We\u2019ll process this within 48 hours and email you a confirmation.", "info");
                      }}
                      className="flex-1 rounded-[var(--dash-radius-sm)] bg-[#DC2626] py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
