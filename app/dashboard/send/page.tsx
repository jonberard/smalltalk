"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

type ServiceRow = { id: string; name: string };
type EmployeeRow = { id: string; name: string };

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

function generateCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}

/* ═══════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════ */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-[calc(env(safe-area-inset-bottom,8px)+68px)] left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-[#18181B] px-5 py-3 text-[14px] font-medium text-white shadow-lg transition-all duration-300 sm:bottom-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {message}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AUTOCOMPLETE INPUT
   Type to filter, tap a suggestion, or type something new.
   New entries get saved to Supabase.
   ═══════════════════════════════════════════════════ */

function AutocompleteInput({
  value,
  onChange,
  placeholder,
  items,
  onSelect,
  onCreateNew,
  displayValue,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  items: { id: string; name: string }[];
  onSelect: (item: { id: string; name: string }) => void;
  onCreateNew?: (name: string) => void;
  displayValue: string;
}) {
  const [focused, setFocused] = useState(false);
  const [justPicked, setJustPicked] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = displayValue.trim()
    ? items.filter((h) => h.name.toLowerCase().includes(displayValue.toLowerCase()))
    : items;

  const showDropdown = focused && !justPicked && (filtered.length > 0 || (displayValue.trim() && onCreateNew));
  const isNew = displayValue.trim() && !items.some((h) => h.name.toLowerCase() === displayValue.trim().toLowerCase());

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          onChange(e.target.value);
          setJustPicked(false);
        }}
        onFocus={() => {
          setFocused(true);
          setJustPicked(false);
        }}
        placeholder={placeholder}
        className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-colors focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(item);
                setJustPicked(true);
                setFocused(false);
              }}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[14px] text-[#18181B] transition-colors hover:bg-[#FAFAFA]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {item.name}
            </button>
          ))}
          {isNew && onCreateNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onCreateNew(displayValue.trim());
                setJustPicked(true);
                setFocused(false);
              }}
              className="flex w-full items-center gap-2 border-t border-[rgba(228,228,231,0.3)] px-3.5 py-2.5 text-left text-[14px] text-[#0070EB] transition-colors hover:bg-[#FAFAFA]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add &ldquo;{displayValue.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SINGLE SEND FORM
   ═══════════════════════════════════════════════════ */

function SingleForm({
  services,
  employees,
  businessId,
  onSend,
  onServiceCreated,
  onEmployeeCreated,
}: {
  services: ServiceRow[];
  employees: EmployeeRow[];
  businessId: string;
  onSend: (name: string, code: string) => void;
  onServiceCreated: (s: ServiceRow) => void;
  onEmployeeCreated: (e: EmployeeRow) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [contact, setContact] = useState("");
  const [serviceText, setServiceText] = useState("");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [employeeText, setEmployeeText] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const canSend = firstName.trim() && contact.trim() && serviceId && !sending;

  async function handleCreateService(name: string) {
    const { data, error } = await supabase
      .from("services")
      .insert({ business_id: businessId, name })
      .select("id, name")
      .single();
    if (data) {
      onServiceCreated(data);
      setServiceId(data.id);
      setServiceText(data.name);
    }
    if (error) setError(`Failed to create service: ${error.message}`);
  }

  async function handleCreateEmployee(name: string) {
    const { data, error } = await supabase
      .from("employees")
      .insert({ business_id: businessId, name })
      .select("id, name")
      .single();
    if (data) {
      onEmployeeCreated(data);
      setEmployeeId(data.id);
      setEmployeeText(data.name);
    }
    if (error) setError(`Failed to create employee: ${error.message}`);
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError("");

    const code = generateCode();

    const { error: linkErr } = await supabase
      .from("review_links")
      .insert({
        business_id: businessId,
        service_id: serviceId,
        employee_id: employeeId,
        customer_name: firstName.trim(),
        customer_contact: contact.trim(),
        unique_code: code,
      });

    if (linkErr) {
      setError(`Failed to create link: ${linkErr.message}`);
      setSending(false);
      return;
    }

    onSend(firstName.trim(), code);
    setFirstName("");
    setContact("");
    setServiceText("");
    setServiceId(null);
    setEmployeeText("");
    setEmployeeId(null);
    setSending(false);
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FEF3C7]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#18181B]">Add a service first</p>
          <p className="mt-1 text-[13px] text-[#A1A1AA]">
            You need at least one service before sending review links. Type a service name below or go to{" "}
            <a href="/dashboard/settings" className="font-medium text-[#0070EB] hover:underline">Settings</a>.
          </p>
        </div>
        <div className="mt-2 w-full">
          <AutocompleteInput
            value=""
            onChange={setServiceText}
            displayValue={serviceText}
            placeholder="e.g. Weekly Pool Cleaning"
            items={[]}
            onSelect={() => {}}
            onCreateNew={handleCreateService}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* First name */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#71717A]">
          Customer first name
        </label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Alex"
          className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-colors focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
        />
      </div>

      {/* Phone or email */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#71717A]">
          Phone or email
        </label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="(555) 123-4567 or alex@email.com"
          className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-colors focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
        />
      </div>

      {/* Service — autocomplete */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#71717A]">
          Service performed
        </label>
        <AutocompleteInput
          value={serviceId || ""}
          onChange={(v) => {
            setServiceText(v);
            // Clear selection if they're typing something different
            if (serviceId) {
              const selected = services.find((s) => s.id === serviceId);
              if (selected && selected.name !== v) setServiceId(null);
            }
          }}
          displayValue={serviceText}
          placeholder="e.g. Weekly Pool Cleaning"
          items={services}
          onSelect={(item) => {
            setServiceId(item.id);
            setServiceText(item.name);
          }}
          onCreateNew={handleCreateService}
        />
        <p className="mt-1 text-[11px] text-[#A1A1AA]">Select or type a new one to add it</p>
      </div>

      {/* Employee — autocomplete (optional) */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#71717A]">
          Employee <span className="text-[#A1A1AA]">(optional)</span>
        </label>
        <AutocompleteInput
          value={employeeId || ""}
          onChange={(v) => {
            setEmployeeText(v);
            if (employeeId) {
              const selected = employees.find((e) => e.id === employeeId);
              if (selected && selected.name !== v) setEmployeeId(null);
            }
          }}
          displayValue={employeeText}
          placeholder="e.g. Marcus"
          items={employees}
          onSelect={(item) => {
            setEmployeeId(item.id);
            setEmployeeText(item.name);
          }}
          onCreateNew={handleCreateEmployee}
        />
      </div>

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className={`mt-2 w-full rounded-[10px] py-3 text-[15px] font-semibold text-white transition-all duration-200 ${
          canSend
            ? "bg-[#0070EB] shadow-[0_2px_12px_rgba(0,112,235,0.3)] active:scale-[0.98]"
            : "cursor-not-allowed bg-[#B0D4F8]"
        }`}
      >
        {sending ? "Creating..." : "Send Review Link"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BULK UPLOAD
   ═══════════════════════════════════════════════════ */

function BulkUpload() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F0F2F5]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#18181B]">Bulk CSV upload</p>
        <p className="mt-1 text-[13px] text-[#A1A1AA]">
          Send review links to multiple customers at once. This feature is coming soon.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   QR CODE (SVG placeholder — deterministic pattern)
   ═══════════════════════════════════════════════════ */

function QRBlock({ businessName }: { businessName: string }) {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const link = `usesmalltalk.com/r/${slug}`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(`https://${link}`).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = `https://${link}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-8">
      <h3 className="mb-3 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Or share a link</h3>
      <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <p className="text-[13px] text-[#71717A]">
        Print on receipts, text it, post it anywhere.
      </p>

      <div className="mt-4 flex items-start gap-4">
        {/* QR placeholder */}
        <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-[8px] border border-[rgba(228,228,231,0.5)] bg-[#FAFAFA]">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            {/* Top-left finder */}
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="#18181B" strokeWidth="3" fill="none" />
            <rect x="9" y="9" width="10" height="10" rx="1" fill="#18181B" />
            {/* Top-right finder */}
            <rect x="48" y="4" width="20" height="20" rx="2" stroke="#18181B" strokeWidth="3" fill="none" />
            <rect x="53" y="9" width="10" height="10" rx="1" fill="#18181B" />
            {/* Bottom-left finder */}
            <rect x="4" y="48" width="20" height="20" rx="2" stroke="#18181B" strokeWidth="3" fill="none" />
            <rect x="9" y="53" width="10" height="10" rx="1" fill="#18181B" />
            {/* Data dots */}
            {[
              [28, 8], [32, 8], [36, 8], [40, 8],
              [28, 14], [36, 14], [44, 14],
              [4, 28], [8, 28], [14, 28], [20, 28], [28, 28], [36, 28], [44, 28], [52, 28], [60, 28],
              [8, 32], [16, 32], [24, 32], [32, 32], [40, 32], [48, 32], [56, 32], [64, 32],
              [4, 36], [12, 36], [20, 36], [28, 36], [36, 36], [44, 36], [52, 36], [64, 36],
              [8, 40], [16, 40], [32, 40], [40, 40], [48, 40], [60, 40],
              [4, 44], [12, 44], [20, 44], [28, 44], [36, 44], [56, 44], [64, 44],
              [28, 52], [36, 52], [44, 52], [52, 52], [60, 52],
              [28, 56], [32, 56], [40, 56], [48, 56], [56, 56], [64, 56],
              [28, 60], [36, 60], [44, 60], [52, 60], [60, 60], [64, 60],
              [28, 64], [32, 64], [40, 64], [48, 64], [56, 64],
            ].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="3" height="3" fill="#18181B" />
            ))}
          </svg>
        </div>

        {/* Link + copy */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-2 rounded-[8px] bg-[#F0F2F5] px-3 py-2">
            <span className="flex-1 truncate text-[13px] font-medium text-[#18181B]">
              {link}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`shrink-0 text-[12px] font-semibold transition-colors ${copied ? "text-[#10B981]" : "text-[#0070EB] hover:text-[#0058BB]"}`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
            This generic link works for any customer. For personalized links with pre-filled names and services, use the form above.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function SendPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [toast, setToast] = useState({ message: "", visible: false });
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { business } = useAuth();

  useEffect(() => {
    if (!business) return;

    async function fetchData() {
      const [svcRes, empRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", business!.id).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", business!.id).order("name"),
      ]);
      setServices(svcRes.data || []);
      setEmployees(empRes.data || []);
      setLoading(false);
    }

    fetchData();
  }, [business]);

  function showToast(name: string, code: string) {
    setToast({
      message: `Link sent to ${name}! usesmalltalk.com/r/${code}`,
      visible: true,
    });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 6000);
  }

  return (
    <div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
      <div className="mx-auto max-w-[600px] px-5 pb-28 pt-8 sm:pb-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-[#18181B]">Send Review Link</h1>
          <p className="mt-1 text-[13px] text-[#A1A1AA]">Send a review link to a customer via SMS or email</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex gap-1 rounded-[10px] bg-[#EEEFF1] p-1">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition-all duration-200 ${
              mode === "single"
                ? "bg-white text-[#18181B] shadow-sm"
                : "text-[#A1A1AA]"
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition-all duration-200 ${
              mode === "bulk"
                ? "bg-white text-[#18181B] shadow-sm"
                : "text-[#A1A1AA]"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              Bulk CSV
              <span className="rounded-full bg-[#E4E4E7] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#71717A]">Soon</span>
            </span>
          </button>
        </div>

        {/* Form card */}
        <div className="rounded-[16px] border border-[rgba(228,228,231,0.5)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          {loading ? (
            <div className="flex flex-col gap-4 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1.5 h-[16px] w-24 animate-pulse rounded bg-[#F4F4F5]" />
                  <div className="h-[42px] animate-pulse rounded-[10px] bg-[#F4F4F5]" />
                </div>
              ))}
            </div>
          ) : mode === "single" ? (
            <SingleForm
              services={services}
              employees={employees}
              businessId={business!.id}
              onSend={showToast}
              onServiceCreated={(s) => setServices((prev) => [...prev, s])}
              onEmployeeCreated={(e) => setEmployees((prev) => [...prev, e])}
            />
          ) : (
            <BulkUpload />
          )}
        </div>

        {/* QR / Link section */}
        {business && <QRBlock businessName={business.name} />}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
