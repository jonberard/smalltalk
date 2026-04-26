"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { capture } from "@/lib/posthog";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  user_ratings_total: number;
};

type StepStatus = "upcoming" | "current" | "done";

/* ═══════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════ */

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        let status: StepStatus = "upcoming";
        if (step < current) status = "done";
        else if (step === current) status = "current";

        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`h-px w-6 transition-colors duration-300 sm:w-10 ${step <= current ? "bg-primary" : "bg-accent"}`} />
            )}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-300 ${
                status === "done"
                  ? "bg-primary text-white"
                  : status === "current"
                  ? "border-2 border-primary bg-white text-primary"
                  : "border border-accent bg-white text-muted"
              }`}
            >
              {status === "done" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CHIP INPUT (reusable for services, team, neighborhoods)
   ═══════════════════════════════════════════════════ */

function ChipInput({
  items,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
  inputId,
  label,
}: {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
  suggestions?: string[];
  inputId: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) return;
    onAdd(trimmed);
    setDraft("");
    inputRef.current?.focus();
  }

  const availableSuggestions = suggestions?.filter(
    (s) => !items.some((i) => i.toLowerCase() === s.toLowerCase())
  );

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-card border border-accent bg-white px-4 py-3 text-[15px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="rounded-card bg-primary px-5 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Suggestion chips */}
      {availableSuggestions && availableSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAdd(s)}
              className="rounded-pill border border-accent bg-white px-3.5 py-1.5 text-[13px] font-medium text-muted transition-all hover:border-primary hover:text-primary active:scale-[0.97]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Added chips */}
      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-pill bg-primary/10 px-3.5 py-1.5 text-[13px] font-medium text-primary"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Remove ${item}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-primary/60 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 1 — FIND YOUR BUSINESS
   ═══════════════════════════════════════════════════ */

function StepBusiness({
  businessId,
  onNext,
  onSkip,
}: {
  businessId: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function extractCity(address: string): string | null {
    const parts = address.split(",").map((p) => p.trim());
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length === 2) return parts[0];
    return null;
  }

  const handleSearch = useCallback(async (query: string) => {
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
  }, []);

  async function handleSelect(place: PlaceResult) {
    const url = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    const city = extractCity(place.address);
    setSelected(place);
    setSearchQuery("");
    setSearchResults([]);

    await supabase
      .from("businesses")
      .update({ google_review_url: url, google_place_id: place.place_id, business_city: city })
      .eq("id", businessId);
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <h1 className="font-heading text-[28px] font-bold leading-tight text-text sm:text-[34px]">
        Let&rsquo;s find you on Google.
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        This is how we&rsquo;ll connect your reviews.
      </p>

      <div className="mt-8">
        {selected ? (
          <div className="rounded-card border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-[16px] font-semibold text-text">{selected.name}</p>
                <p className="mt-0.5 text-[13px] text-muted">{selected.address}</p>
                {selected.rating && (
                  <p className="mt-1 text-[13px] text-muted">
                    {selected.rating} stars ({selected.user_ratings_total} reviews)
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 text-[13px] font-medium text-primary hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for your business name..."
              className="w-full rounded-card border border-accent bg-white px-4 py-3.5 text-[15px] text-text placeholder-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searching && (
              <p className="mt-3 text-[13px] text-muted">Searching...</p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-card border border-accent bg-white shadow-card">
                {searchResults.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="flex w-full items-start gap-3 border-b border-accent/50 px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-background"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/50">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text">{place.name}</p>
                      <p className="mt-0.5 text-[12px] text-muted">{place.address}</p>
                      {place.rating && (
                        <p className="mt-0.5 text-[12px] text-muted">
                          {place.rating} stars · {place.user_ratings_total} reviews
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className="w-full rounded-pill bg-primary py-3.5 text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-muted transition-colors hover:text-text"
        >
          I&rsquo;ll connect this later
        </button>
        <p className="text-center text-[12px] text-muted/70">
          You&rsquo;ll need this before sending review links.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 2 — SERVICES
   ═══════════════════════════════════════════════════ */

function StepServices({
  businessId,
  onNext,
  onSkip,
}: {
  businessId: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  const SUGGESTIONS = ["Maintenance", "Repair", "Installation", "Inspection", "Consultation"];

  // Load existing services on mount (handles page refresh)
  useEffect(() => {
    supabase.from("services").select("id, name").eq("business_id", businessId).then(({ data }) => {
      if (data) setServices(data);
    });
  }, [businessId]);

  async function handleAdd(name: string) {
    if (services.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    // Check for existing duplicate in DB (in case local state is stale)
    const { data: existing } = await supabase
      .from("services")
      .select("id, name")
      .eq("business_id", businessId)
      .ilike("name", name);
    if (existing && existing.length > 0) {
      setServices((prev) => {
        if (prev.some((s) => s.id === existing[0].id)) return prev;
        return [...prev, existing[0]];
      });
      return;
    }
    const { data, error } = await supabase
      .from("services")
      .insert({ business_id: businessId, name })
      .select("id, name")
      .single();
    if (data && !error) {
      setServices((prev) => [...prev, data]);
    }
  }

  async function handleRemove(name: string) {
    const service = services.find((s) => s.name === name);
    if (!service) return;
    await supabase.from("services").delete().eq("id", service.id);
    setServices((prev) => prev.filter((s) => s.id !== service.id));
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <h1 className="font-heading text-[28px] font-bold leading-tight text-text sm:text-[34px]">
        What services do you offer?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        These show up when your customers leave a review.
      </p>

      <div className="mt-8">
        <ChipInput
          inputId="service-input"
          label="Add a service"
          items={services.map((s) => s.name)}
          onAdd={handleAdd}
          onRemove={handleRemove}
          placeholder="e.g. Weekly Pool Cleaning"
          suggestions={SUGGESTIONS}
        />
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={services.length === 0}
          className="w-full rounded-pill bg-primary py-3.5 text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-muted transition-colors hover:text-text"
        >
          I&rsquo;ll add services later
        </button>
        <p className="text-center text-[12px] text-muted/70">
          Add one now, or skip and finish the rest of setup first.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 3 — TEAM
   ═══════════════════════════════════════════════════ */

function StepTeam({
  businessId,
  onNext,
  onSkip,
}: {
  businessId: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  // Load existing employees on mount (handles page refresh)
  useEffect(() => {
    supabase.from("employees").select("id, name").eq("business_id", businessId).then(({ data }) => {
      if (data) setEmployees(data);
    });
  }, [businessId]);

  async function handleAdd(name: string) {
    if (employees.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    // Check for existing duplicate in DB
    const { data: existing } = await supabase
      .from("employees")
      .select("id, name")
      .eq("business_id", businessId)
      .ilike("name", name);
    if (existing && existing.length > 0) {
      setEmployees((prev) => {
        if (prev.some((e) => e.id === existing[0].id)) return prev;
        return [...prev, existing[0]];
      });
      return;
    }
    const { data, error } = await supabase
      .from("employees")
      .insert({ business_id: businessId, name })
      .select("id, name")
      .single();
    if (data && !error) {
      setEmployees((prev) => [...prev, data]);
    }
  }

  async function handleRemove(name: string) {
    const employee = employees.find((e) => e.name === name);
    if (!employee) return;
    await supabase.from("employees").delete().eq("id", employee.id);
    setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <h1 className="font-heading text-[28px] font-bold leading-tight text-text sm:text-[34px]">
        Who does the work?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        We&rsquo;ll mention them by name in the reviews &mdash; customers love that.
      </p>

      <div className="mt-8">
        <ChipInput
          inputId="employee-input"
          label="Add a team member"
          items={employees.map((e) => e.name)}
          onAdd={handleAdd}
          onRemove={handleRemove}
          placeholder="e.g. Marcus"
        />
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={employees.length === 0}
          className="w-full rounded-pill bg-primary py-3.5 text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-muted transition-colors hover:text-text"
        >
          I&rsquo;ll add people later
        </button>
        <p className="text-center text-[12px] text-muted/70">
          Add one now, or skip and come back when your setup details are ready.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 4 — NEIGHBORHOODS
   ═══════════════════════════════════════════════════ */

function StepNeighborhoods({
  businessId,
  onNext,
  onSkip,
}: {
  businessId: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  // Load existing neighborhoods on mount (handles page refresh)
  useEffect(() => {
    supabase.from("businesses").select("neighborhoods").eq("id", businessId).single().then(({ data }) => {
      if (data?.neighborhoods) setNeighborhoods(data.neighborhoods);
    });
  }, [businessId]);

  async function persist(updated: string[]) {
    await supabase.from("businesses").update({ neighborhoods: updated }).eq("id", businessId);
  }

  async function handleAdd(name: string) {
    if (neighborhoods.some((n) => n.toLowerCase() === name.toLowerCase())) return;
    const updated = [...neighborhoods, name];
    setNeighborhoods(updated);
    await persist(updated);
  }

  async function handleRemove(name: string) {
    const updated = neighborhoods.filter((n) => n !== name);
    setNeighborhoods(updated);
    await persist(updated);
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <h1 className="font-heading text-[28px] font-bold leading-tight text-text sm:text-[34px]">
        Where do you work?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        We&rsquo;ll weave these into reviews for hyper-local Google ranking.
      </p>

      <div className="mt-8">
        <ChipInput
          inputId="neighborhood-input"
          label="Add a neighborhood"
          items={neighborhoods}
          onAdd={handleAdd}
          onRemove={handleRemove}
          placeholder="e.g. Zilker, Cedar Park"
        />
        <p className="mt-4 text-[13px] text-muted/70">
          This helps you show up when someone searches &ldquo;pool cleaning near Zilker&rdquo; on Google.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={neighborhoods.length === 0}
          className="w-full rounded-pill bg-primary py-3.5 text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-muted transition-colors hover:text-text"
        >
          I&rsquo;ll add areas later
        </button>
        <p className="text-center text-[12px] text-muted/70">
          Add one now, or skip and fill in your service areas later.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 5 — YOU'RE READY
   ═══════════════════════════════════════════════════ */

function SummaryRow({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[14px] text-text">{label}</span>
      <span className={`text-[14px] font-medium ${done ? "text-primary" : "text-[#D97706]"}`}>
        {value} {done && <span className="ml-1">&#10003;</span>}
      </span>
    </div>
  );
}

function StepReady({
  businessId,
  onFinish,
}: {
  businessId: string;
  onFinish: (path: string) => void;
}) {
  const [summary, setSummary] = useState({
    businessConnected: false,
    businessName: "",
    serviceCount: 0,
    teamCount: 0,
    neighborhoodCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [bizRes, svcRes, empRes] = await Promise.all([
        supabase.from("businesses").select("name, google_place_id, neighborhoods").eq("id", businessId).single(),
        supabase.from("services").select("id").eq("business_id", businessId),
        supabase.from("employees").select("id").eq("business_id", businessId),
      ]);

      setSummary({
        businessConnected: !!bizRes.data?.google_place_id,
        businessName: bizRes.data?.name || "",
        serviceCount: svcRes.data?.length || 0,
        teamCount: empRes.data?.length || 0,
        neighborhoodCount: bizRes.data?.neighborhoods?.length || 0,
      });
      setLoading(false);
    }
    load();
  }, [businessId]);

  async function handleFinish(path: string) {
    const { error } = await supabase.from("businesses").update({ onboarding_completed: true }).eq("id", businessId);
    if (!error) {
      capture("onboarding_completed");
    }
    try {
      await fetchWithAuth("/api/review-links/generic", {
        method: "POST",
      });
    } catch {
      // If this misses here, the Send page will still ensure it server-side.
    }
    onFinish(path);
  }

  const hasSkipped = !summary.businessConnected || summary.serviceCount === 0 || summary.teamCount === 0 || summary.neighborhoodCount === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-primary" />
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <h1 className="font-heading text-[28px] font-bold leading-tight text-text sm:text-[34px]">
        You&rsquo;re all set.
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        Send your first review link and see what happens.
      </p>

      <div className="mt-8 overflow-hidden rounded-card bg-white shadow-card">
        <div className="divide-y divide-accent/50 px-5">
          <SummaryRow
            label="Business"
            value={summary.businessConnected ? summary.businessName : "Not connected yet"}
            done={summary.businessConnected}
          />
          <SummaryRow
            label="Services"
            value={summary.serviceCount > 0 ? `${summary.serviceCount} added` : "None yet"}
            done={summary.serviceCount > 0}
          />
          <SummaryRow
            label="Team"
            value={summary.teamCount > 0 ? `${summary.teamCount} member${summary.teamCount !== 1 ? "s" : ""}` : "None yet"}
            done={summary.teamCount > 0}
          />
          <SummaryRow
            label="Neighborhoods"
            value={summary.neighborhoodCount > 0 ? `${summary.neighborhoodCount} added` : "None yet"}
            done={summary.neighborhoodCount > 0}
          />
        </div>
      </div>

      {hasSkipped && (
        <p className="mt-4 text-center text-[13px] text-muted">
          You can always finish setup in Settings.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleFinish("/dashboard/send")}
          className="w-full rounded-pill bg-primary py-3.5 text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Send your first review link now &rarr;
        </button>
        <button
          type="button"
          onClick={() => handleFinish("/dashboard")}
          className="w-full rounded-pill border border-accent bg-white py-3.5 text-[15px] font-semibold text-text transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN ONBOARDING PAGE
   ═══════════════════════════════════════════════════ */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      // Check if onboarding is already completed
      const { data: biz } = await supabase
        .from("businesses")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (biz?.onboarding_completed) {
        router.replace("/dashboard");
        return;
      }

      setUserId(user.id);
      setLoading(false);
      capture("onboarding_started");
    });
  }, [router]);

  function handleFinish(path: string) {
    router.push(path);
  }

  if (loading || !userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background font-body">
      {/* Header */}
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-6 pt-8">
        <span className="font-heading text-[18px] font-bold text-text">small Talk</span>
        <ProgressBar current={step} total={5} />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[480px] px-6 pb-20 pt-10">
        {step === 1 && (
          <StepBusiness
            businessId={userId}
            onNext={() => setStep(2)}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepServices
            businessId={userId}
            onNext={() => setStep(3)}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepTeam
            businessId={userId}
            onNext={() => setStep(4)}
            onSkip={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepNeighborhoods
            businessId={userId}
            onNext={() => setStep(5)}
            onSkip={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <StepReady
            businessId={userId}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}
