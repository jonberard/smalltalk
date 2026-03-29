"use client";

import { useState, useRef } from "react";

/* ═══════════════════════════════════════════════════
   SEED DATA
   ═══════════════════════════════════════════════════ */

const SEED_SERVICES = [
  "Weekly Pool Cleaning",
  "One-Time Deep Clean",
  "Equipment Repair",
  "Pool Opening (Seasonal)",
  "Pool Closing (Seasonal)",
  "Chemical Balancing",
];

const SEED_EMPLOYEES = [
  { name: "Marcus", role: "Lead Technician" },
  { name: "Daniel", role: "Technician" },
  { name: "Priya", role: "Technician" },
  { name: "Kenji", role: "Apprentice" },
];

const TOPIC_TIERS = {
  shared: ["Timeliness", "Work Quality", "Communication", "Pricing", "Professionalism", "Cleanliness"],
  positive: ["Went Above & Beyond", "Would Recommend"],
  neutral: ["What Went Well", "What Could Improve"],
  negative: ["Responsiveness", "Follow-Through", "Didn't Fix the Problem"],
};

/* ═══════════════════════════════════════════════════
   BUSINESS PROFILE — the identity section
   ═══════════════════════════════════════════════════ */

function BusinessProfile() {
  const [name, setName] = useState("Crystal Clear Pools");
  const [googleUrl, setGoogleUrl] = useState("https://search.google.com/local/writereview?placeid=PLACEHOLDER");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = name.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase()
    : "?";

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      {/* Brand hero — the owner sees their identity */}
      <div className="relative overflow-hidden rounded-t-[16px] bg-gradient-to-br from-[#0070EB]/[0.04] via-[#F8F9FA] to-[#0070EB]/[0.02] px-6 pb-6 pt-8">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setLogoPreview(URL.createObjectURL(f));
        }} />

        <div className="flex flex-col items-center">
          {/* Logo — large and tappable */}
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

          {/* Mini customer preview */}
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] ring-1 ring-[rgba(228,228,231,0.5)]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0070EB]/10">
              <span className="text-[8px] font-bold text-[#0070EB]">{initials.slice(0, 2)}</span>
            </div>
            <span className="text-[11px] text-[#71717A]">How customers see you</span>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4 px-6 py-6">
        <div>
          <label className="mb-2 block text-[12px] font-medium text-[#71717A]">Business name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            placeholder="https://search.google.com/local/writereview?placeid=..."
            className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-all duration-300 focus:border-[#0070EB]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SERVICES — each one earns its space
   ═══════════════════════════════════════════════════ */

function ServicesList() {
  const [services, setServices] = useState(SEED_SERVICES);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setServices([...services, trimmed]);
    setDraft("");
    setAdding(false);
  }

  function handleRemove(idx: number) {
    setServices(services.filter((_, i) => i !== idx));
  }

  // Subtle accent colors per service for the leading dot
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
            key={service}
            className="group mx-0 flex items-center gap-3 rounded-[10px] px-3 py-3 transition-all duration-200 hover:bg-[#FAFAFA]"
          >
            {/* Grip + accent dot */}
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

            <span className="flex-1 text-[14px] font-medium text-[#18181B]">{service}</span>

            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[#A1A1AA] transition-all duration-200 hover:bg-[#FEE2E2] hover:text-[#EF4444] active:scale-[0.92]"
              aria-label={`Remove ${service}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add row */}
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
   TEAM — people with presence
   ═══════════════════════════════════════════════════ */

function TeamList() {
  const [employees, setEmployees] = useState(SEED_EMPLOYEES);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    const n = draftName.trim();
    if (!n || employees.some((e) => e.name.toLowerCase() === n.toLowerCase())) return;
    setEmployees([...employees, { name: n, role: draftRole.trim() || "Team Member" }]);
    setDraftName("");
    setDraftRole("");
    setAdding(false);
  }

  function handleRemove(idx: number) {
    setEmployees(employees.filter((_, i) => i !== idx));
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
              key={emp.name}
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
                <p className="text-[12px] text-[#94A3B8]">{emp.role}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
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

      {/* Add member */}
      {adding ? (
        <div className="border-t border-[rgba(228,228,231,0.3)] px-6 py-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Name"
                autoFocus
                className="flex-1 rounded-[10px] border border-[#0070EB]/30 bg-white px-4 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
              />
              <input
                type="text"
                value={draftRole}
                onChange={(e) => setDraftRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Role"
                className="flex-1 rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-[#FAFAFA] px-4 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-all duration-300 focus:border-[#0070EB]/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setAdding(false); setDraftName(""); setDraftRole(""); }}
                className="rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#94A3B8] transition-all duration-200 hover:bg-[#F0F2F5] hover:text-[#71717A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!draftName.trim()}
                className={`rounded-[8px] px-4 py-1.5 text-[13px] font-semibold text-white transition-all duration-200 ${
                  draftName.trim() ? "bg-[#0070EB] shadow-[0_2px_8px_rgba(0,112,235,0.25)] active:scale-[0.97]" : "cursor-not-allowed bg-[#B0D4F8]"
                }`}
              >
                Add
              </button>
            </div>
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
   REVIEW TOPICS — visual tier separation
   ═══════════════════════════════════════════════════ */

function TopicSection() {
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || customTopics.includes(trimmed)) return;
    setCustomTopics([...customTopics, trimmed]);
    setDraft("");
    setAdding(false);
  }

  const tiers: { key: keyof typeof TOPIC_TIERS; label: string; color: string; chipBg: string; dotColor: string }[] = [
    { key: "shared", label: "All ratings", color: "#71717A", chipBg: "#F4F4F5", dotColor: "#94A3B8" },
    { key: "positive", label: "4-5 stars", color: "#059669", chipBg: "#ECFDF5", dotColor: "#10B981" },
    { key: "neutral", label: "3 stars", color: "#D97706", chipBg: "#FFFBEB", dotColor: "#F59E0B" },
    { key: "negative", label: "1-2 stars", color: "#DC2626", chipBg: "#FEF2F2", dotColor: "#EF4444" },
  ];

  return (
    <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="px-6 pt-5 pb-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#18181B]">Review Topics</h3>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">What customers are asked about during the review</p>
      </div>

      {tiers.map((tier, ti) => (
        <div key={tier.key} className={`px-6 py-4 ${ti < tiers.length - 1 ? "border-b border-[rgba(228,228,231,0.3)]" : ""}`}>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: tier.dotColor }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TOPIC_TIERS[tier.key].map((t) => (
              <span
                key={t}
                className="rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                style={{ backgroundColor: tier.chipBg, color: tier.color }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Custom topics */}
      <div className="border-t border-[rgba(228,228,231,0.3)] px-6 py-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-[6px] w-[6px] rounded-full bg-[#0070EB]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0070EB]">Custom</span>
        </div>

        {customTopics.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {customTopics.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 rounded-[8px] bg-[#EFF6FF] px-3 py-1.5 text-[12px] font-medium text-[#0070EB]"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setCustomTopics(customTopics.filter((c) => c !== t))}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#0070EB]/15 active:scale-[0.85]"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {customTopics.length === 0 && !adding && (
          <p className="mb-3 text-[12px] leading-relaxed text-[#94A3B8]">
            Add topics specific to your business. AI generates the follow-up questions automatically.
          </p>
        )}

        {adding ? (
          <div className="flex gap-2.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setDraft(""); }
              }}
              placeholder="e.g. Filter Condition"
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
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#0070EB] transition-all duration-200 hover:text-[#0058BB] active:scale-[0.98]"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#0070EB]/[0.06]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0070EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            Add custom topic
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BILLING — premium feel
   ═══════════════════════════════════════════════════ */

function BillingSection() {
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
              <p className="mt-1 text-[18px] font-bold tracking-tight">small Talk Pro</p>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
              Active
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-0.5">
            <span className="text-[28px] font-bold tracking-tight">$29</span>
            <span className="text-[13px] text-white/60">/month</span>
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

export default function SettingsPage() {
  return (
    <div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
      <div className="mx-auto max-w-[600px] px-5 pb-28 pt-8 sm:pb-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-bold tracking-tight text-[#18181B]">Settings</h1>
        </div>

        <div className="flex flex-col gap-8">
          <BusinessProfile />
          <ServicesList />
          <TeamList />
          <TopicSection />
          <BillingSection />
        </div>
      </div>
    </div>
  );
}
