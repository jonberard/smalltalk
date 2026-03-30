"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

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

function BusinessProfile({ businessId, initial }: {
  businessId: string;
  initial: { name: string; logo_url: string | null; google_review_url: string };
}) {
  const [name, setName] = useState(initial.name);
  const [googleUrl, setGoogleUrl] = useState(initial.google_review_url);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="relative overflow-hidden rounded-t-[16px] bg-gradient-to-br from-[#0070EB]/[0.04] via-[#F8F9FA] to-[#0070EB]/[0.02] px-6 pb-6 pt-8">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleLogoUpload(f);
        }} />

        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,112,235,0.12)] ring-1 ring-[rgba(228,228,231,0.5)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,112,235,0.18)] active:scale-[0.97]"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[24px] font-bold tracking-tight text-[#0070EB]">{initials}</span>
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

          <p className="text-[18px] font-bold tracking-tight text-[#18181B]">{name || "Your Business"}</p>

          <div className="mt-3 flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] ring-1 ring-[rgba(228,228,231,0.5)]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0070EB]/10">
              <span className="text-[8px] font-bold text-[#0070EB]">{initials.slice(0, 2)}</span>
            </div>
            <span className="text-[11px] text-[#71717A]">How customers see you</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">
        <div>
          <label className="mb-2 block text-[12px] font-medium text-[#71717A]">Business name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name !== initial.name) save({ name }); }}
            placeholder="Your business name"
            className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-all duration-300 focus:border-[#0070EB]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
          />
        </div>
        <div>
          <label className="mb-2 block text-[12px] font-medium text-[#71717A]">Google Business Profile URL</label>
          <input
            type="text"
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            onBlur={() => { if (googleUrl !== initial.google_review_url) save({ google_review_url: googleUrl }); }}
            placeholder="https://search.google.com/local/writereview?placeid=..."
            className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-all duration-300 focus:border-[#0070EB]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
          />
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

  async function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || services.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    const { data, error } = await supabase
      .from("services")
      .insert({ business_id: businessId, name: trimmed })
      .select("id, name")
      .single();
    if (data) setServices([...services, data]);
    if (error) alert(`Failed to add service: ${error.message}`);
    setDraft("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("services").delete().eq("id", id);
    setServices(services.filter((s) => s.id !== id));
  }

  const accents = ["#0070EB", "#10B981", "#F59E0B", "#E11D48", "#8B5CF6", "#06B6D4", "#F97316", "#6366F1"];

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[#18181B]">Services</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">What you offer — shows in the Send form</p>
          </div>
          <span className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#71717A]">{services.length}</span>
        </div>
      </div>

      <div className="px-3">
        {services.map((service, i) => (
          <div
            key={service.id}
            className="group mx-0 flex items-center gap-3 rounded-[10px] px-3 py-3 transition-all duration-200 hover:bg-[#FAFAFA]"
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

            <span className="flex-1 text-[14px] font-medium text-[#18181B]">{service.name}</span>

            <button
              type="button"
              onClick={() => handleRemove(service.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[#A1A1AA] transition-all duration-200 hover:bg-[#FEE2E2] hover:text-[#EF4444] active:scale-[0.92]"
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
        <div className="border-t border-[rgba(228,228,231,0.3)] px-6 py-4">
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
              className="flex-1 rounded-[10px] border border-[#0070EB]/30 bg-white px-4 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.trim()}
              className={`shrink-0 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 ${
                draft.trim() ? "bg-[#0070EB] shadow-[0_2px_8px_rgba(0,112,235,0.25)] active:scale-[0.97]" : "cursor-not-allowed bg-[#B0D4F8]"
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
          className="flex w-full items-center gap-2.5 border-t border-[rgba(228,228,231,0.3)] px-6 py-4 text-[13px] font-medium text-[#0070EB] transition-all duration-200 hover:bg-[#0070EB]/[0.03] active:scale-[0.99]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#0070EB]/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0070EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
   TEAM
   ═══════════════════════════════════════════════════ */

function TeamList({ employees: initial, businessId }: { employees: EmployeeRow[]; businessId: string }) {
  const [employees, setEmployees] = useState(initial);
  const [draftName, setDraftName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const n = draftName.trim();
    if (!n || employees.some((e) => e.name.toLowerCase() === n.toLowerCase())) return;
    const { data, error } = await supabase
      .from("employees")
      .insert({ business_id: businessId, name: n })
      .select("id, name")
      .single();
    if (data) setEmployees([...employees, data]);
    if (error) alert(`Failed to add employee: ${error.message}`);
    setDraftName("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("employees").delete().eq("id", id);
    setEmployees(employees.filter((e) => e.id !== id));
  }

  const avatarColors = [
    { bg: "#0070EB", text: "#FFFFFF" },
    { bg: "#10B981", text: "#FFFFFF" },
    { bg: "#F59E0B", text: "#FFFFFF" },
    { bg: "#8B5CF6", text: "#FFFFFF" },
    { bg: "#E11D48", text: "#FFFFFF" },
    { bg: "#06B6D4", text: "#FFFFFF" },
  ];

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[#18181B]">Team</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">People who perform your services</p>
          </div>
          <span className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#71717A]">{employees.length}</span>
        </div>
      </div>

      <div className="px-3">
        {employees.map((emp, i) => {
          const color = avatarColors[i % avatarColors.length];
          return (
            <div
              key={emp.id}
              className="group flex items-center gap-3.5 rounded-[10px] px-3 py-3 transition-all duration-200 hover:bg-[#FAFAFA]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {emp.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#18181B]">{emp.name}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(emp.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[#A1A1AA] transition-all duration-200 hover:bg-[#FEE2E2] hover:text-[#EF4444] active:scale-[0.92]"
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
        <div className="border-t border-[rgba(228,228,231,0.3)] px-6 py-4">
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
              className="flex-1 rounded-[10px] border border-[#0070EB]/30 bg-white px-4 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draftName.trim()}
              className={`shrink-0 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 ${
                draftName.trim() ? "bg-[#0070EB] shadow-[0_2px_8px_rgba(0,112,235,0.25)] active:scale-[0.97]" : "cursor-not-allowed bg-[#B0D4F8]"
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
          className="flex w-full items-center gap-2.5 border-t border-[rgba(228,228,231,0.3)] px-6 py-4 text-[13px] font-medium text-[#0070EB] transition-all duration-200 hover:bg-[#0070EB]/[0.03] active:scale-[0.99]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#0070EB]/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0070EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

    if (data) setTopics([...topics, data]);
    if (error) alert(`Failed to add topic: ${error.message}`);
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
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="px-6 pt-5 pb-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#18181B]">Review Topics</h3>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">What customers are asked about during the review</p>
        {!isCustomized && (
          <p className="mt-2 rounded-[8px] bg-[#F0F2F5] px-3 py-2 text-[12px] text-[#71717A]">
            These are the defaults — customize them or leave as-is.
          </p>
        )}
      </div>

      {TIER_META.map((tier, ti) => {
        const tierTopics = topics.filter((t) => t.tier === tier.key).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <div key={tier.key} className={`px-6 py-4 ${ti < TIER_META.length - 1 ? "border-b border-[rgba(228,228,231,0.3)]" : ""}`}>
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
                  className="rounded-[8px] border border-[rgba(228,228,231,0.5)] px-3 py-2 text-[13px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
                />
                <input
                  type="text"
                  value={draftQuestion}
                  onChange={(e) => setDraftQuestion(e.target.value)}
                  placeholder="Follow-up question (e.g. How was the filter?)"
                  className="rounded-[8px] border border-[rgba(228,228,231,0.5)] px-3 py-2 text-[13px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
                />
                <input
                  type="text"
                  value={draftOptions}
                  onChange={(e) => setDraftOptions(e.target.value)}
                  placeholder="Options, comma-separated (e.g. Great, Good, Fair, Poor)"
                  className="rounded-[8px] border border-[rgba(228,228,231,0.5)] px-3 py-2 text-[13px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(tier.key); }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setAddingTier(null); setDraftLabel(""); setDraftQuestion(""); setDraftOptions(""); }}
                    className="rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#94A3B8] transition-all duration-200 hover:bg-[#F0F2F5] hover:text-[#71717A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdd(tier.key)}
                    disabled={!draftLabel.trim() || !draftQuestion.trim() || draftOptions.split(",").filter((o) => o.trim()).length < 2}
                    className="rounded-[8px] bg-[#0070EB] px-4 py-1.5 text-[13px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-[#B0D4F8]"
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
   BILLING
   ═══════════════════════════════════════════════════ */

function BillingSection({ subscriptionStatus }: { subscriptionStatus: string }) {
  const planName = subscriptionStatus === "active" ? "small Talk Pro" : subscriptionStatus === "trialing" ? "Free Trial" : "No Plan";
  const statusLabel = subscriptionStatus === "active" ? "Active" : subscriptionStatus === "trialing" ? "Trial" : "Inactive";

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="px-6 pt-5 pb-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#18181B]">Billing</h3>
      </div>
      <div className="px-6 py-5">
        <div className="overflow-hidden rounded-[14px] bg-gradient-to-br from-[#0070EB] to-[#0058BB] p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">Current plan</p>
              <p className="mt-1 text-[18px] font-bold tracking-tight">{planName}</p>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-[#FAFAFA] py-3 text-[13px] font-semibold text-[#71717A] transition-all duration-200 hover:bg-white hover:text-[#18181B] hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98]"
        >
          Manage Billing
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

function LogoutButton() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut();
      }}
      className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white py-3 text-[13px] font-semibold text-[#EF4444] transition-all duration-200 hover:bg-[#FEF2F2] hover:border-[#FECACA] active:scale-[0.98] disabled:opacity-60"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}

export default function SettingsPage() {
  const { business } = useAuth();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [isCustomized, setIsCustomized] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
      <div className="mx-auto max-w-[600px] px-5 pb-28 pt-8 sm:pb-16">

        <div className="mb-8">
          <h1 className="text-[22px] font-bold tracking-tight text-[#18181B]">Settings</h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[200px] animate-pulse rounded-[16px] bg-[#F4F4F5]" />
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
              }}
            />
            <ServicesList services={services} businessId={business.id} />
            <TeamList employees={employees} businessId={business.id} />
            <TopicSection topics={topics} businessId={business.id} isCustomized={isCustomized} />
            <BillingSection subscriptionStatus={business.subscription_status} />
            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
}
