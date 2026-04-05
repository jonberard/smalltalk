"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { StatusPill } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SkeletonRow } from "@/components/dashboard/skeleton";
import { useToast } from "@/components/dashboard/toast";

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
  const status = business.subscription_status;
  if (status === "active" || status === "trialing") return "active";
  if (status === "trial") {
    const expired =
      (business.trial_ends_at && new Date(business.trial_ends_at) < new Date()) ||
      business.trial_requests_remaining <= 0;
    return expired ? "expired" : "trial";
  }
  return "expired"; // none, canceled, paused, past_due, etc.
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

function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    return `${local[0]}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
  }
  const digits = contact.replace(/\D/g, "");
  return `***-${digits.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
        className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
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
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[14px] text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dash-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className="flex w-full items-center gap-2 border-t border-[var(--dash-border)] px-3.5 py-2.5 text-left text-[14px] text-[#E05A3D] transition-colors hover:bg-[var(--dash-bg)]"
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
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FEF7ED]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[var(--dash-text)]">Add a service first</p>
          <p className="mt-1 text-[13px] text-[var(--dash-muted)]">
            You need at least one service before sending review links. Type a service name below or go to{" "}
            <a href="/dashboard/settings" className="font-medium text-[var(--dash-primary)] hover:underline">Settings</a>.
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
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">
          Customer first name
        </label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Alex"
          className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
        />
      </div>

      {/* Phone or email */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">
          Phone or email
        </label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="(555) 123-4567 or alex@email.com"
          className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
        />
      </div>

      {/* Service — autocomplete */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">
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
        <p className="mt-1 text-[11px] text-[var(--dash-muted)]">Select or type a new one to add it</p>
      </div>

      {/* Employee — autocomplete (optional) */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">
          Employee <span className="text-[var(--dash-muted)]">(optional)</span>
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
        className={`mt-2 w-full rounded-[var(--dash-radius-sm)] py-3 text-[15px] font-semibold text-white transition-all duration-200 ${
          canSend
            ? "bg-[var(--dash-primary)] shadow-[0_2px_12px_rgba(224,90,61,0.3)] active:scale-[0.98]"
            : "cursor-not-allowed bg-[#E05A3D]/40"
        }`}
      >
        {sending ? "Sending..." : "Send Review Link"}
      </button>
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
      <h3 className="mb-3 px-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">Or share a link</h3>
      <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[13px] text-[var(--dash-muted)]">
        Print on receipts, text it, post it anywhere.
      </p>

      <div className="mt-4 flex items-start gap-4">
        {/* QR placeholder */}
        <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--dash-border)] bg-[var(--dash-bg)]">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            {/* Top-left finder */}
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="var(--dash-text)" strokeWidth="3" fill="none" />
            <rect x="9" y="9" width="10" height="10" rx="1" fill="var(--dash-text)" />
            {/* Top-right finder */}
            <rect x="48" y="4" width="20" height="20" rx="2" stroke="var(--dash-text)" strokeWidth="3" fill="none" />
            <rect x="53" y="9" width="10" height="10" rx="1" fill="var(--dash-text)" />
            {/* Bottom-left finder */}
            <rect x="4" y="48" width="20" height="20" rx="2" stroke="var(--dash-text)" strokeWidth="3" fill="none" />
            <rect x="9" y="53" width="10" height="10" rx="1" fill="var(--dash-text)" />
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
              <rect key={i} x={x} y={y} width="3" height="3" fill="var(--dash-text)" />
            ))}
          </svg>
        </div>

        {/* Link + copy */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-2 rounded-[8px] bg-[var(--dash-bg)] px-3 py-2">
            <span className="flex-1 truncate text-[13px] font-medium text-[var(--dash-text)]">
              {link}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`shrink-0 text-[12px] font-semibold transition-colors ${copied ? "text-[#10B981]" : "text-[#E05A3D] hover:text-[#C7432A]"}`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--dash-muted)]">
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

function Paywall() {
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E05A3D]/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </svg>
      </div>
      <div>
        <h3 className="text-[18px] font-bold text-[var(--dash-text)]">
          Start your free trial to send review requests
        </h3>
        <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-[var(--dash-muted)]">
          7-day free trial. Unlimited review links and everything you need to grow your reviews.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={redirecting}
        className="mt-2 rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_2px_12px_rgba(224,90,61,0.3)] transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {redirecting ? "Redirecting..." : "Subscribe Now"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function SendPage() {
  const { toast: addToast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialRemaining, setTrialRemaining] = useState<number>(10);
  const [recentLinks, setRecentLinks] = useState<{ customer_name: string; customer_contact: string; service_name: string; status: string; created_at: string }[]>([]);
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

      const { data: links } = await supabase
        .from("review_links")
        .select("customer_name, customer_contact, created_at, services(name), review_sessions(status)")
        .eq("business_id", business!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (links) {
        setRecentLinks(links.map((l: any) => ({
          customer_name: l.customer_name,
          customer_contact: l.customer_contact,
          service_name: (l.services as any)?.name ?? "\u2014",
          status: (l.review_sessions as any)?.[0]?.status ?? "sent",
          created_at: l.created_at,
        })));
      }

      setLoading(false);
    }

    fetchData();
  }, [business]);

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

    const link = `usesmalltalk.com/r/${code}`;
    let msg: string;
    if (smsStatus === "sent") {
      msg = `SMS sent to ${name}! ${link}`;
    } else if (smsStatus) {
      msg = `Link created for ${name} (SMS failed: ${smsStatus}) \u2014 ${link}`;
    } else {
      msg = `Link created for ${name}! ${link}`;
    }
    addToast(msg, "success");
  }

  // Re-check tier with live trialRemaining (business object may be stale)
  const effectiveTier: SubTier = (() => {
    if (!business) return "expired";
    const status = business.subscription_status;
    if (status === "active" || status === "trialing") return "active";
    if (status === "trial") {
      const expired =
        (business.trial_ends_at && new Date(business.trial_ends_at) < new Date()) ||
        trialRemaining <= 0;
      return expired ? "expired" : "trial";
    }
    return "expired"; // none, canceled, paused, past_due
  })();

  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-28 pt-8 sm:pb-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">Send Review Link</h1>
          <p className="mt-1 text-[13px] text-[var(--dash-muted)]">Request a review from your customer</p>
        </div>

        {/* Trial remaining badge */}
        {effectiveTier === "trial" && (
          <div className="mb-4 flex items-center gap-2 rounded-[var(--dash-radius-sm)] bg-[#FFF7ED] px-4 py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-[13px] text-[#92400E]">
              <span className="font-semibold">{trialRemaining}</span> review request{trialRemaining !== 1 ? "s" : ""} left in your free trial
            </p>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]">
          {loading ? (
            <div className="flex flex-col gap-4 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1.5 h-[16px] w-24 animate-pulse rounded bg-[#F4F4F5]" />
                  <div className="h-[42px] animate-pulse rounded-[var(--dash-radius-sm)] bg-[#F4F4F5]" />
                </div>
              ))}
            </div>
          ) : effectiveTier === "expired" ? (
            <Paywall />
          ) : (
            <SingleForm
              services={services}
              employees={employees}
              businessId={business!.id}
              businessName={business!.name}
              onSend={handleSingleSend}
              onServiceCreated={(s) => setServices((prev) => [...prev, s])}
              onEmployeeCreated={(e) => setEmployees((prev) => [...prev, e])}
            />
          )}
        </div>

        {/* QR / Link section */}
        {business && <QRBlock businessName={business.name} />}

        {/* Recent sends */}
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]">Recent sends</h2>
          {recentLinks.length === 0 ? (
            <EmptyState
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dash-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
              title="No review links yet"
              description="Your sent review links will appear here"
            />
          ) : (
            <div className="overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)]">
              {recentLinks.map((link, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < recentLinks.length - 1 ? "border-b border-[var(--dash-border)]" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--dash-text)]">{link.customer_name}</p>
                    <p className="text-[12px] text-[var(--dash-muted)]">{maskContact(link.customer_contact)} · {link.service_name}</p>
                  </div>
                  <StatusPill status={link.status} />
                  <span className="shrink-0 text-[11px] text-[var(--dash-muted)]">{timeAgo(link.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
