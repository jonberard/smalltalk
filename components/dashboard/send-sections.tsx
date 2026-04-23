"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Business } from "@/lib/types";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { capture } from "@/lib/posthog";
import { dashboardButtonClassName } from "@/components/dashboard/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useToast } from "@/components/dashboard/toast";
import { buildQrSvg } from "@/lib/qr-code";
import {
  getReminderBadgeState,
  type ReminderBadgeState,
  type ReminderDeliverySummary,
} from "@/lib/reminder-status";

export type ServiceRow = { id: string; name: string };
export type EmployeeRow = { id: string; name: string };
type ReviewSessionRow = {
  status: string;
  feedback_type: string;
  optional_text: string | null;
  updated_at: string;
};
type RecentLinkRow = {
  id: string;
  customer_name: string;
  customer_contact: string;
  created_at: string;
  sequence_completed: boolean;
  services: { name: string } | null;
  review_sessions: ReviewSessionRow[] | null;
  review_message_deliveries: ReminderDeliverySummary[] | null;
};

export type RecentLinkItem = {
  id: string;
  customer_name: string;
  customer_contact: string;
  service_name: string;
  status: string;
  created_at: string;
  reminder_badge: ReminderBadgeState | null;
};

export type SendReviewRequestResult = {
  name: string;
  code: string;
  channel: "sms" | "email";
  deliveryStatus: "sent" | "failed" | "skipped";
  deliveryError?: string;
  remainingTrialRequests?: number;
};

type SubTier = "active" | "trial" | "expired";

function getSubTier(business: Business): SubTier {
  const status = business.subscription_status;
  if (status === "active" || status === "trialing") return "active";
  if (status === "trial") {
    const expired =
      (business.trial_ends_at && new Date(business.trial_ends_at) < new Date()) ||
      business.trial_requests_remaining <= 0;
    return expired ? "expired" : "trial";
  }
  return "expired";
}

export function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    return `${local[0]}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
  }
  const digits = contact.replace(/\D/g, "");
  return `***-${digits.slice(-4)}`;
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPrimaryStatus(link: RecentLinkRow): string {
  const deliveries = link.review_message_deliveries ?? [];
  const sessions = [...(link.review_sessions ?? [])].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  );
  const initialDelivery = deliveries.find((delivery) => delivery.kind === "initial");

  if (initialDelivery?.status === "failed") return "delivery_failed";
  if (initialDelivery?.status === "skipped" && initialDelivery.skipped_reason === "opted_out") {
    return "opted_out";
  }
  if (sessions.some((session) => session.feedback_type === "private" && !!session.optional_text?.trim())) {
    return "private_feedback";
  }
  if (sessions.some((session) => session.status === "copied")) return "copied";
  if (sessions.some((session) => session.status === "drafted")) return "drafted";
  if (sessions.some((session) => session.status === "in_progress")) return "in_progress";
  if (sessions.some((session) => session.status === "created")) return "created";

  return "sent";
}

function mapRecentLink(link: RecentLinkRow): RecentLinkItem {
  return {
    id: link.id,
    customer_name: link.customer_name,
    customer_contact: link.customer_contact,
    service_name: link.services?.name ?? "\u2014",
    status: getPrimaryStatus(link),
    created_at: link.created_at,
    reminder_badge: getReminderBadgeState(
      link.review_message_deliveries ?? [],
      link.sequence_completed,
    ),
  };
}

export function useSendWorkspace(business: Business | null) {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialRemaining, setTrialRemaining] = useState<number>(business?.trial_requests_remaining ?? 10);
  const [recentLinks, setRecentLinks] = useState<RecentLinkItem[]>([]);

  const loadRecentLinks = useCallback(async (businessId: string) => {
    const { data: links } = await supabase
      .from("review_links")
      .select(
        "id, customer_name, customer_contact, created_at, sequence_completed, services(name), review_sessions(status, feedback_type, optional_text, updated_at), review_message_deliveries(kind, status, skipped_reason)",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentLinks(((links as RecentLinkRow[] | null) ?? []).map(mapRecentLink));
  }, []);

  useEffect(() => {
    if (!business) return;
    setTrialRemaining(business.trial_requests_remaining);
    const businessId = business.id;

    async function fetchData() {
      const [serviceRes, employeeRes] = await Promise.all([
        supabase.from("services").select("id, name").eq("business_id", businessId).order("name"),
        supabase.from("employees").select("id, name").eq("business_id", businessId).order("name"),
      ]);

      setServices((serviceRes.data as ServiceRow[]) || []);
      setEmployees((employeeRes.data as EmployeeRow[]) || []);
      await loadRecentLinks(businessId);
      setLoading(false);
    }

    void fetchData();
  }, [business, loadRecentLinks]);

  async function handleSingleSend(result: SendReviewRequestResult) {
    if (typeof result.remainingTrialRequests === "number") {
      setTrialRemaining(result.remainingTrialRequests);
    }

    const link = `usesmalltalk.com/r/${result.code}`;

    if (result.deliveryStatus === "sent") {
      toast(
        `${result.channel === "email" ? "Email" : "SMS"} sent to ${result.name}! ${link}`,
        "success",
      );
    } else {
      toast(
        `Link created for ${result.name} (${result.channel === "email" ? "email" : "SMS"} not sent: ${result.deliveryError || "unknown error"}) - ${link}`,
        "info",
      );
    }

    if (business) {
      await loadRecentLinks(business.id);
    }
  }

  const tier: SubTier = business ? getSubTier(business) : "trial";
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
    return "expired";
  })();

  return {
    services,
    employees,
    loading,
    trialRemaining,
    recentLinks,
    tier,
    effectiveTier,
    setServices,
    setEmployees,
    handleSingleSend,
  };
}

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
    ? items.filter((item) => item.name.toLowerCase().includes(displayValue.toLowerCase()))
    : items;

  const showDropdown =
    focused && !justPicked && (filtered.length > 0 || (displayValue.trim() && onCreateNew));
  const isNew =
    displayValue.trim() &&
    !items.some((item) => item.name.toLowerCase() === displayValue.trim().toLowerCase());

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

      {showDropdown ? (
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
          {isNew && onCreateNew ? (
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SingleSendForm({
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
  onSend: (result: SendReviewRequestResult) => void | Promise<void>;
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

    try {
      const res = await fetchWithAuth("/api/send-review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: firstName.trim(),
          customer_contact: contact.trim(),
          service_id: serviceId,
          employee_id: employeeId,
        }),
      });

      const result = (await res.json().catch(() => ({}))) as Record<string, string | number | undefined>;

      if (!res.ok) {
        setError((result.error as string) || `Failed to send review link (${res.status})`);
        return;
      }

      await onSend({
        name: firstName.trim(),
        code: result.unique_code as string,
        channel: result.channel as "sms" | "email",
        deliveryStatus: result.delivery_status as "sent" | "failed" | "skipped",
        deliveryError: result.delivery_error as string | undefined,
        remainingTrialRequests: result.remaining_trial_requests as number | undefined,
      });

      setFirstName("");
      setContact("");
      setServiceText("");
      setServiceId(null);
      setEmployeeText("");
      setEmployeeId(null);
    } catch {
      setError("Network error sending review link");
    } finally {
      setSending(false);
    }
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
            <a href="/dashboard/more/team-services" className="font-medium text-[var(--dash-primary)] hover:underline">
              Team &amp; Services
            </a>
            .
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
      {error ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">Customer first name</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Alex"
          className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">Phone or email</label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="(555) 123-4567 or alex@email.com"
          className="w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-white px-3.5 py-2.5 text-[14px] text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] transition-colors focus:border-[#E05A3D]/40 focus:shadow-[0_0_0_3px_rgba(224,90,61,0.08)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">Service performed</label>
        <AutocompleteInput
          value={serviceId || ""}
          onChange={(v) => {
            setServiceText(v);
            if (serviceId) {
              const selected = services.find((service) => service.id === serviceId);
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
        <p className="mt-1 text-[11px] text-[var(--dash-muted)]">Select one or type a new service to add it</p>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--dash-muted)]">
          Employee <span className="text-[var(--dash-muted)]">(optional)</span>
        </label>
        <AutocompleteInput
          value={employeeId || ""}
          onChange={(v) => {
            setEmployeeText(v);
            if (employeeId) {
              const selected = employees.find((employee) => employee.id === employeeId);
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

      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={!canSend}
        className={`mt-2 ${dashboardButtonClassName({ variant: "primary", fullWidth: true })} py-3 text-[15px] ${
          canSend
            ? "bg-[var(--dash-primary)] shadow-[0_2px_12px_rgba(224,90,61,0.3)] active:scale-[0.98]"
            : "cursor-not-allowed bg-[#E05A3D]/40"
        }`}
      >
        {sending ? "Sending..." : "Send review link"}
      </button>
    </div>
  );
}

export function QRBlock({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [genericCode, setGenericCode] = useState<string | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://usesmalltalk.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function loadOrCreateGenericLink() {
      try {
        const res = await fetchWithAuth("/api/review-links/generic", {
          method: "POST",
        });
        const body = (await res.json().catch(() => ({}))) as {
          unique_code?: string;
        };

        if (!res.ok || !body.unique_code) {
          setLoadingLink(false);
          return;
        }

        setGenericCode(body.unique_code);
      } catch {
        setLoadingLink(false);
        return;
      }
      setLoadingLink(false);
    }

    void loadOrCreateGenericLink();
  }, [businessId]);

  const fullLink = genericCode ? `${origin}/r/${genericCode}` : null;
  const displayLink = genericCode ? `${origin.replace(/^https?:\/\//, "")}/r/${genericCode}` : null;
  const qrSvg = useMemo(() => {
    if (!fullLink) return null;
    return buildQrSvg(fullLink, {
      foreground: "#1A1D20",
      background: "#FFFFFF",
      quietZone: 4,
    });
  }, [fullLink]);

  function buildFilename(extension: "svg" | "png") {
    const safeName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${safeName || "small-talk"}-review-qr.${extension}`;
  }

  function handleCopy() {
    if (!fullLink) return;
    navigator.clipboard?.writeText(fullLink).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = fullLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function triggerDownload(url: string, filename: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function handleDownloadSvg() {
    if (!qrSvg) return;

    const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, buildFilename("svg"));
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function handleDownloadPng() {
    if (!qrSvg) return;

    const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const image = new Image();
      image.decoding = "async";

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not load QR image."));
        image.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas is not available.");
      }

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      triggerDownload(pngUrl, buildFilename("png"));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (loadingLink) {
    return <div className="h-[140px] animate-pulse rounded-[var(--dash-radius)] bg-[#F4F4F5]" />;
  }

  if (!fullLink || !displayLink || !qrSvg) return null;

  return (
    <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        QR / Shared Link
      </p>
      <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-[var(--dash-text)]">
        One stable link for {businessName}
      </h3>
      <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-[var(--dash-muted)]">
        Print it on receipts, post it on signs, or share it anywhere. This is your reusable business-wide link, not a one-off request.
      </p>

      <div className="mt-5 flex items-start gap-4">
        <div className="flex h-[168px] w-[168px] shrink-0 items-center justify-center rounded-[14px] border border-[var(--dash-border)] bg-white p-3 shadow-[0_1px_0_rgba(217,206,191,0.7)]">
          <div
            className="h-full w-full"
            aria-label={`QR code for ${businessName}`}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-2 rounded-[8px] bg-[var(--dash-bg)] px-3 py-2">
            <span className="flex-1 truncate text-[13px] font-medium text-[var(--dash-text)]">{displayLink}</span>
            <button
              type="button"
              onClick={handleCopy}
              className={`shrink-0 text-[12px] font-semibold transition-colors ${
                copied ? "text-[#10B981]" : "text-[#E05A3D] hover:text-[#C7432A]"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--dash-muted)]">
            This generic link works for any customer. For personalized links with pre-filled names and services, use Send from jobs instead.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className={dashboardButtonClassName({ variant: "primary", size: "sm" })}
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className={dashboardButtonClassName({ variant: "secondary", size: "sm" })}
            >
              Download SVG
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--dash-muted)]">
            PNG works well for quick printing. SVG stays sharp for designers, signs, and larger formats.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Paywall({ hadTrial }: { hadTrial: boolean }) {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    capture("trial_paywall_hit", { had_trial: hadTrial });
  }, [hadTrial]);

  async function handleSubscribe() {
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

  const heading = hadTrial
    ? "Keep it going - subscribe to pick up where you left off."
    : "Try it free for 7 days.";

  const buttonLabel = hadTrial ? "Subscribe now" : "Start free trial";

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E05A3D]/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E05A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </svg>
      </div>
      <div>
        <h3 className="text-[18px] font-bold text-[var(--dash-text)]">{heading}</h3>
        <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-[var(--dash-muted)]">
          Unlimited review links and everything you need to grow your reviews.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleSubscribe()}
        disabled={redirecting}
        className={`mt-2 ${dashboardButtonClassName({ variant: "primary" })} px-8 py-3 text-[15px]`}
      >
        {redirecting ? "Redirecting..." : buttonLabel}
      </button>
    </div>
  );
}

export function TrialRemainingBanner({ trialRemaining }: { trialRemaining: number }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--dash-radius-sm)] bg-[#FFF7ED] px-4 py-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <p className="text-[13px] text-[#92400E]">
        <span className="font-semibold">{trialRemaining}</span> review request{trialRemaining !== 1 ? "s" : ""} left in your free trial
      </p>
    </div>
  );
}

export function RecentSendsList({
  recentLinks,
  title = "Recent sends",
  description,
  maxItems,
}: {
  recentLinks: RecentLinkItem[];
  title?: string;
  description?: string;
  maxItems?: number;
}) {
  const items = typeof maxItems === "number" ? recentLinks.slice(0, maxItems) : recentLinks;

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[var(--dash-text)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--dash-muted)]">{description}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dash-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          }
          title="No review links yet"
          description="Your sent review links will appear here"
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)]">
          {items.map((link, index) => (
            <div
              key={link.id}
              className={`flex items-center gap-3 px-4 py-3 ${index < items.length - 1 ? "border-b border-[var(--dash-border)]" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--dash-text)]">{link.customer_name}</p>
                <p className="text-[12px] text-[var(--dash-muted)]">
                  {maskContact(link.customer_contact)} · {link.service_name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {link.reminder_badge ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      link.reminder_badge.tone === "warning"
                        ? "bg-[#FFF7ED] text-[#C2410C]"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {link.reminder_badge.label}
                  </span>
                ) : null}
                <StatusPill status={link.status} />
                <Link
                  href={`/dashboard/requests/${link.id}`}
                  className={dashboardButtonClassName({ size: "sm" })}
                >
                  Open request
                </Link>
              </div>
              <span className="shrink-0 text-[11px] text-[var(--dash-muted)]">{timeAgo(link.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
