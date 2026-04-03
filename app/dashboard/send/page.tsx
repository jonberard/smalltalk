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

type SubTier = "active" | "trial" | "expired";

function getSubTier(business: {
  subscription_status: string;
  trial_ends_at: string | null;
  trial_requests_remaining: number;
}): SubTier {
  if (business.subscription_status === "active") return "active";
  if (business.subscription_status === "trial") {
    const expired =
      (business.trial_ends_at && new Date(business.trial_ends_at) < new Date()) ||
      business.trial_requests_remaining <= 0;
    return expired ? "expired" : "trial";
  }
  return "expired"; // canceled, inactive, etc.
}

function isPhone(contact: string): boolean {
  return !contact.includes("@") && /\d{7,}/.test(contact.replace(/\D/g, ""));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendSms(
  customerName: string,
  customerContact: string,
  reviewLinkUrl: string,
  businessName: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName,
        customer_contact: customerContact,
        review_link_url: reviewLinkUrl,
        business_name: businessName,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `SMS failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error sending SMS" };
  }
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
  businessName,
  onSend,
  onServiceCreated,
  onEmployeeCreated,
}: {
  services: ServiceRow[];
  employees: EmployeeRow[];
  businessId: string;
  businessName: string;
  onSend: (name: string, code: string, smsStatus?: string) => void;
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

    const linkUrl = `https://usesmalltalk.com/r/${code}`;
    let smsStatus: string | undefined;

    if (isPhone(contact.trim())) {
      const smsResult = await sendSms(
        firstName.trim(),
        contact.trim(),
        linkUrl,
        businessName,
      );
      smsStatus = smsResult.ok ? "sent" : smsResult.error;
    }

    onSend(firstName.trim(), code, smsStatus);
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
        {sending ? "Sending..." : "Send Review Link"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CSV PARSER
   ═══════════════════════════════════════════════════ */

type CsvRow = { customer_name: string; customer_contact: string; service: string; employee: string };

function parseCsv(text: string): { rows: CsvRow[]; error?: string } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { rows: [], error: "CSV must have a header row and at least one data row" };

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.findIndex((h) => h === "customer_name" || h === "name" || h === "first_name");
  const contactIdx = header.findIndex((h) => h === "customer_contact" || h === "contact" || h === "phone" || h === "email");
  const serviceIdx = header.findIndex((h) => h === "service" || h === "service_type");
  const employeeIdx = header.findIndex((h) => h === "employee" || h === "employee_name" || h === "tech");

  if (nameIdx === -1 || contactIdx === -1 || serviceIdx === -1) {
    return { rows: [], error: "CSV must include columns: customer_name, customer_contact, service" };
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx] || "";
    const contact = cols[contactIdx] || "";
    const service = cols[serviceIdx] || "";
    const employee = employeeIdx !== -1 ? cols[employeeIdx] || "" : "";
    if (name && contact && service) {
      rows.push({ customer_name: name, customer_contact: contact, service, employee });
    }
  }

  if (rows.length === 0) return { rows: [], error: "No valid rows found in CSV" };
  return { rows };
}

/* ═══════════════════════════════════════════════════
   BULK UPLOAD
   ═══════════════════════════════════════════════════ */

function BulkUpload({
  services,
  employees,
  businessId,
  businessName,
  onComplete,
}: {
  services: ServiceRow[];
  employees: EmployeeRow[];
  businessId: string;
  businessName: string;
  onComplete: (sent: number, total: number, failed: number) => void;
}) {
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setCsvRows(null);

    const reader = new FileReader();
    reader.onload = () => {
      const { rows, error } = parseCsv(reader.result as string);
      if (error) {
        setParseError(error);
      } else {
        setCsvRows(rows);
      }
    };
    reader.readAsText(file);
  }

  async function handleSend() {
    if (!csvRows || csvRows.length === 0) return;
    setSending(true);
    abortRef.current = false;

    const serviceMap = new Map(services.map((s) => [s.name.toLowerCase(), s.id]));
    const employeeMap = new Map(employees.map((e) => [e.name.toLowerCase(), e.id]));
    let failed = 0;

    for (let i = 0; i < csvRows.length; i++) {
      if (abortRef.current) break;

      setProgress({ current: i + 1, total: csvRows.length, failed });
      const row = csvRows[i];

      // Resolve service — use existing or skip if not found
      let serviceId = serviceMap.get(row.service.toLowerCase());
      if (!serviceId) {
        const { data } = await supabase
          .from("services")
          .insert({ business_id: businessId, name: row.service })
          .select("id, name")
          .single();
        if (data) {
          serviceId = data.id;
          serviceMap.set(data.name.toLowerCase(), data.id);
        } else {
          failed++;
          continue;
        }
      }

      // Resolve employee (optional)
      let employeeId: string | null = null;
      if (row.employee) {
        employeeId = employeeMap.get(row.employee.toLowerCase()) || null;
        if (!employeeId) {
          const { data } = await supabase
            .from("employees")
            .insert({ business_id: businessId, name: row.employee })
            .select("id, name")
            .single();
          if (data) {
            employeeId = data.id;
            employeeMap.set(data.name.toLowerCase(), data.id);
          }
        }
      }

      // Create review link
      const code = generateCode();
      const { error: linkErr } = await supabase.from("review_links").insert({
        business_id: businessId,
        service_id: serviceId,
        employee_id: employeeId,
        customer_name: row.customer_name,
        customer_contact: row.customer_contact,
        unique_code: code,
      });

      if (linkErr) {
        failed++;
        continue;
      }

      // Send SMS if phone
      if (isPhone(row.customer_contact)) {
        const linkUrl = `https://usesmalltalk.com/r/${code}`;
        const result = await sendSms(row.customer_name, row.customer_contact, linkUrl, businessName);
        if (!result.ok) failed++;
      }

      // 500ms delay between sends to avoid rate limiting
      if (i < csvRows.length - 1) {
        await delay(500);
      }
    }

    onComplete(csvRows.length - failed, csvRows.length, failed);
    setCsvRows(null);
    setSending(false);
    setProgress({ current: 0, total: 0, failed: 0 });
    if (fileRef.current) fileRef.current.value = "";
  }

  if (sending) {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="#E4E4E7" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="17" fill="none" stroke="#0070EB" strokeWidth="3"
              strokeDasharray={`${pct * 1.068} 106.8`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-[#18181B]">
          Sending {progress.current} of {progress.total}...
        </p>
        {progress.failed > 0 && (
          <p className="text-[13px] text-red-500">{progress.failed} failed</p>
        )}
        <button
          type="button"
          onClick={() => { abortRef.current = true; }}
          className="mt-1 text-[13px] font-medium text-[#A1A1AA] hover:text-[#71717A]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {parseError && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {parseError}
        </div>
      )}

      {!csvRows ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F0F2F5]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#18181B]">Upload a CSV file</p>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">
              Columns: <span className="font-medium text-[#71717A]">customer_name</span>,{" "}
              <span className="font-medium text-[#71717A]">customer_contact</span>,{" "}
              <span className="font-medium text-[#71717A]">service</span>,{" "}
              <span className="text-[#A1A1AA]">employee (optional)</span>
            </p>
          </div>
          <label className="mt-2 cursor-pointer rounded-[10px] bg-[#0070EB] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_12px_rgba(0,112,235,0.3)] transition-all active:scale-[0.98]">
            Choose File
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[10px] bg-[#F0F2F5] px-4 py-3">
            <p className="text-[14px] font-semibold text-[#18181B]">
              {csvRows.length} customer{csvRows.length !== 1 ? "s" : ""} ready to send
            </p>
            <p className="mt-0.5 text-[12px] text-[#A1A1AA]">
              {csvRows.filter((r) => isPhone(r.customer_contact)).length} via SMS
              {" · "}
              {csvRows.filter((r) => !isPhone(r.customer_contact)).length} link only (email delivery coming soon)
            </p>
          </div>

          {/* Preview first 5 rows */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(228,228,231,0.5)]">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#FAFAFA] text-left text-[#A1A1AA]">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Service</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-[rgba(228,228,231,0.3)]">
                    <td className="px-3 py-2 text-[#18181B]">{row.customer_name}</td>
                    <td className="px-3 py-2 text-[#71717A]">{row.customer_contact}</td>
                    <td className="px-3 py-2 text-[#71717A]">{row.service}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvRows.length > 5 && (
              <div className="border-t border-[rgba(228,228,231,0.3)] bg-[#FAFAFA] px-3 py-2 text-center text-[11px] text-[#A1A1AA]">
                +{csvRows.length - 5} more
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCsvRows(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="flex-1 rounded-[10px] border border-[rgba(228,228,231,0.5)] bg-white py-3 text-[14px] font-semibold text-[#71717A] transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="flex-1 rounded-[10px] bg-[#0070EB] py-3 text-[14px] font-semibold text-white shadow-[0_2px_12px_rgba(0,112,235,0.3)] transition-all active:scale-[0.98]"
            >
              Send All
            </button>
          </div>
        </div>
      )}
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
   PAYWALL — expired trial or canceled
   ═══════════════════════════════════════════════════ */

function Paywall({ userId }: { userId: string }) {
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_placeholder",
          user_id: userId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0070EB]/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0070EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </svg>
      </div>
      <div>
        <h3 className="text-[18px] font-bold text-[#18181B]">
          You&rsquo;ve used your free trial &mdash; ready to keep going?
        </h3>
        <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-[#71717A]">
          Subscribe to send unlimited review links, unlock bulk CSV sends, and keep growing your reviews.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={redirecting}
        className="mt-2 rounded-[10px] bg-[#0070EB] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_2px_12px_rgba(0,112,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {redirecting ? "Redirecting..." : "Subscribe Now"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BULK UPGRADE PROMPT — shown for trial users on CSV tab
   ═══════════════════════════════════════════════════ */

function BulkUpgradePrompt({ userId }: { userId: string }) {
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_placeholder",
          user_id: userId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F0F2F5]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#18181B]">Upgrade to unlock bulk sends</p>
        <p className="mt-1 text-[13px] text-[#A1A1AA]">
          Send review links to hundreds of customers at once with CSV upload. Available on paid plans.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={redirecting}
        className="mt-1 rounded-[10px] bg-[#0070EB] px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_12px_rgba(0,112,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {redirecting ? "Redirecting..." : "Subscribe"}
      </button>
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
  const [trialRemaining, setTrialRemaining] = useState<number>(10);
  const { business } = useAuth();

  const tier: SubTier = business ? getSubTier(business) : "trial";

  useEffect(() => {
    if (!business) return;
    setTrialRemaining(business.trial_requests_remaining);

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

  function showToast(name: string, code: string, smsStatus?: string) {
    const link = `usesmalltalk.com/r/${code}`;
    let msg: string;
    if (smsStatus === "sent") {
      msg = `SMS sent to ${name}! ${link}`;
    } else if (smsStatus) {
      msg = `Link created for ${name} (SMS failed: ${smsStatus}) — ${link}`;
    } else {
      msg = `Link created for ${name}! ${link}`;
    }
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 6000);
  }

  // Wraps showToast for single sends — decrements trial counter when on trial
  function handleSingleSend(name: string, code: string, smsStatus?: string) {
    if (tier === "trial" && business) {
      const newRemaining = Math.max(0, trialRemaining - 1);
      setTrialRemaining(newRemaining);
      supabase
        .from("businesses")
        .update({ trial_requests_remaining: newRemaining })
        .eq("id", business.id)
        .then();
    }
    showToast(name, code, smsStatus);
  }

  function showBulkToast(sent: number, total: number, failed: number) {
    const msg = failed > 0
      ? `Sent ${sent} of ${total} links (${failed} failed)`
      : `All ${total} links sent successfully!`;
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 6000);
  }

  // Re-check tier with live trialRemaining (business object may be stale)
  const effectiveTier: SubTier = (() => {
    if (!business) return "trial";
    if (business.subscription_status === "active") return "active";
    if (business.subscription_status === "trial") {
      const expired =
        (business.trial_ends_at && new Date(business.trial_ends_at) < new Date()) ||
        trialRemaining <= 0;
      return expired ? "expired" : "trial";
    }
    return "expired";
  })();

  return (
    <div className="min-h-dvh bg-[#F8F9FA] font-dashboard sm:pl-[200px]">
      <div className="mx-auto max-w-[600px] px-5 pb-28 pt-8 sm:pb-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-[#18181B]">Send Review Link</h1>
          <p className="mt-1 text-[13px] text-[#A1A1AA]">Send a review link to a customer via SMS or email</p>
        </div>

        {/* Trial remaining badge */}
        {effectiveTier === "trial" && (
          <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-[#EFF6FF] px-4 py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0070EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-[13px] text-[#0070EB]">
              <span className="font-semibold">{trialRemaining}</span> review request{trialRemaining !== 1 ? "s" : ""} left in your free trial
            </p>
          </div>
        )}

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
            Bulk CSV
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
          ) : effectiveTier === "expired" ? (
            <Paywall userId={business!.id} />
          ) : mode === "single" ? (
            <SingleForm
              services={services}
              employees={employees}
              businessId={business!.id}
              businessName={business!.name}
              onSend={handleSingleSend}
              onServiceCreated={(s) => setServices((prev) => [...prev, s])}
              onEmployeeCreated={(e) => setEmployees((prev) => [...prev, e])}
            />
          ) : effectiveTier === "trial" ? (
            <BulkUpgradePrompt userId={business!.id} />
          ) : (
            <BulkUpload
              services={services}
              employees={employees}
              businessId={business!.id}
              businessName={business!.name}
              onComplete={showBulkToast}
            />
          )}
        </div>

        {/* QR / Link section */}
        {business && <QRBlock businessName={business.name} />}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
