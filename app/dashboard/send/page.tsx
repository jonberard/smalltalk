"use client";

import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════
   TEST DATA
   ═══════════════════════════════════════════════════ */

const BUSINESS = {
  name: "Crystal Clear Pools",
  code: "crystal-clear",
  domain: "usesmalltalk.com",
};

// Simulates what Supabase would return — previous entries the owner has typed.
// Starts with a few so the demo feels real. In production this grows from usage.
const SEED_SERVICES = [
  "Weekly Pool Cleaning",
  "One-Time Deep Clean",
  "Equipment Repair",
];
const SEED_EMPLOYEES = ["Marcus", "Daniel"];

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
   New entries get remembered for next time.
   ═══════════════════════════════════════════════════ */

function AutocompleteInput({
  value,
  onChange,
  placeholder,
  history,
  onNewEntry,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  history: string[];
  onNewEntry?: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [justPicked, setJustPicked] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = value.trim()
    ? history.filter((h) => h.toLowerCase().includes(value.toLowerCase()))
    : history;

  const showDropdown = focused && !justPicked && filtered.length > 0;
  const isNew = value.trim() && !history.some((h) => h.toLowerCase() === value.trim().toLowerCase());

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setJustPicked(false);
        }}
        onFocus={() => {
          setFocused(true);
          setJustPicked(false);
        }}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => {
            if (isNew && value.trim() && onNewEntry) {
              onNewEntry(value.trim());
            }
          }, 200);
        }}
        placeholder={placeholder}
        className="w-full rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white px-3.5 py-2.5 text-[14px] text-[#18181B] outline-none placeholder:text-[#A1A1AA] transition-colors focus:border-[#0070EB]/40 focus:shadow-[0_0_0_3px_rgba(0,112,235,0.08)]"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(item);
                setJustPicked(true);
                setFocused(false);
              }}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[14px] text-[#18181B] transition-colors hover:bg-[#FAFAFA]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SINGLE SEND FORM
   ═══════════════════════════════════════════════════ */

function SingleForm({ onSend }: { onSend: (name: string) => void }) {
  const [firstName, setFirstName] = useState("");
  const [contact, setContact] = useState("");
  const [service, setService] = useState("");
  const [employee, setEmployee] = useState("");

  // In-memory history — seeded with test data, grows as owner types new entries.
  // In production these come from / write to Supabase per-business.
  const [serviceHistory, setServiceHistory] = useState(SEED_SERVICES);
  const [employeeHistory, setEmployeeHistory] = useState(SEED_EMPLOYEES);

  const canSend = firstName.trim() && contact.trim() && service.trim();

  function addToHistory(list: string[], setList: (l: string[]) => void, val: string) {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (list.some((h) => h.toLowerCase() === trimmed.toLowerCase())) return;
    setList([trimmed, ...list]);
  }

  function handleSend() {
    if (!canSend) return;
    // Remember new entries
    addToHistory(serviceHistory, setServiceHistory, service);
    addToHistory(employeeHistory, setEmployeeHistory, employee);
    onSend(firstName.trim());
    setFirstName("");
    setContact("");
    setService("");
    setEmployee("");
  }

  return (
    <div className="flex flex-col gap-4">
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
          value={service}
          onChange={setService}
          placeholder="e.g. Weekly Pool Cleaning"
          history={serviceHistory}
          onNewEntry={(v) => addToHistory(serviceHistory, setServiceHistory, v)}
        />
        <p className="mt-1 text-[11px] text-[#A1A1AA]">Your recent entries appear as you type</p>
      </div>

      {/* Employee — autocomplete (optional) */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#71717A]">
          Employee <span className="text-[#A1A1AA]">(optional)</span>
        </label>
        <AutocompleteInput
          value={employee}
          onChange={setEmployee}
          placeholder="e.g. Marcus"
          history={employeeHistory}
          onNewEntry={(v) => addToHistory(employeeHistory, setEmployeeHistory, v)}
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
        Send Review Link
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

function QRBlock() {
  const link = `${BUSINESS.domain}/r/${BUSINESS.code}`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
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

  function showToast(name: string) {
    setToast({ message: `Request sent to ${name}!`, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
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
          {mode === "single" ? (
            <SingleForm onSend={showToast} />
          ) : (
            <BulkUpload />
          )}
        </div>

        {/* QR / Link section */}
        <QRBlock />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
