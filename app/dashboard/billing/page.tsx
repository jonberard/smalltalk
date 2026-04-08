"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, fetchWithAuth } from "@/lib/supabase";
import { StatusPill } from "@/components/dashboard/status-pill";
import { StatCard } from "@/components/dashboard/stat-card";
import { SkeletonCard } from "@/components/dashboard/skeleton";

export default function BillingPage() {
  const { business } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!business) return;
    async function fetchUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("review_links")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business!.id)
        .gte("created_at", monthStart);
      setUsageCount(count ?? 0);
      setLoading(false);
    }
    fetchUsage();
  }, [business]);

  async function handleCheckout() {
    setRedirecting(true);
    try {
      const res = await fetchWithAuth("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setRedirecting(false);
    } catch {
      setRedirecting(false);
    }
  }

  async function handlePortal() {
    if (!business?.stripe_customer_id) return;
    setRedirecting(true);
    try {
      const res = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripe_customer_id: business.stripe_customer_id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setRedirecting(false);
    } catch {
      setRedirecting(false);
    }
  }

  const status = business?.subscription_status ?? "none";
  const trialEndsAt = business?.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="min-h-dvh bg-[var(--dash-bg)] font-dashboard sm:pl-[220px]">
      <div className="dash-page-enter mx-auto max-w-[960px] px-5 pb-32 pt-8 sm:pb-16">
        <h1 className="font-heading text-[24px] font-semibold text-[var(--dash-text)]">Billing</h1>
        <p className="mt-1 text-[13px] text-[var(--dash-muted)]">Manage your subscription and billing</p>

        {/* Current Plan Card */}
        <div className="mt-6 rounded-[var(--dash-radius)] bg-[var(--dash-surface)] px-6 py-7 shadow-[var(--dash-shadow)]">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--dash-text)]">small Talk Pro</h2>
              <p className="mt-0.5 text-[14px] text-[var(--dash-muted)]">$79/mo</p>
            </div>
            <StatusPill status={status} className="self-start" />
          </div>

          <div className="mt-5">
            {status === "trialing" && trialEndsAt && (
              <div>
                <p className="text-[14px] text-[var(--dash-text)]">
                  Your free trial ends{" "}
                  <span className="font-medium">
                    {trialEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </p>
                <p className="mt-1 text-[13px] font-semibold text-[#D97706]">{daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--dash-border)]">
                    <div
                      className="h-full rounded-full bg-[#D97706] transition-all"
                      style={{ width: `${Math.max(5, ((7 - daysRemaining) / 7) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {status === "active" && (
              <p className="text-[14px] text-[var(--dash-muted)]">
                Your subscription is active. Next billing date will appear in the Stripe portal.
              </p>
            )}

            {status === "past_due" && (
              <div className="rounded-[var(--dash-radius-sm)] border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3">
                <p className="text-[14px] font-medium text-[#DC2626]">
                  Your payment failed. Update your payment method to keep your account active.
                </p>
              </div>
            )}

            {status === "canceled" && (
              <p className="text-[14px] text-[var(--dash-muted)]">
                Your subscription was canceled. Resubscribe to continue sending review links.
              </p>
            )}

            {status === "none" && (
              <p className="text-[14px] text-[var(--dash-muted)]">
                You&rsquo;re not subscribed yet. Start your free trial to begin sending review links.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            {(status === "none" || status === "canceled") && (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={redirecting}
                className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
              >
                {redirecting ? "Redirecting..." : status === "none" ? "Start Free Trial" : "Resubscribe"}
              </button>
            )}

            {status === "past_due" && (
              <button
                type="button"
                onClick={handlePortal}
                disabled={redirecting}
                className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
              >
                {redirecting ? "Redirecting..." : "Update Payment Method"}
              </button>
            )}

            {business?.stripe_customer_id && (
              <button
                type="button"
                onClick={handlePortal}
                disabled={redirecting}
                className="rounded-[var(--dash-radius-sm)] border border-[var(--dash-primary)] px-6 py-2.5 text-[14px] font-semibold text-[var(--dash-primary)] transition-all duration-150 hover:bg-[#E05A3D]/[0.04] active:scale-[0.98] disabled:opacity-60"
              >
                {redirecting ? "Redirecting..." : "Manage Billing"}
              </button>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]">This month&rsquo;s usage</h2>
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

        {/* Invoice History */}
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--dash-text)]">Invoice history</h2>
          <div className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] px-5 py-4">
            {business?.stripe_customer_id ? (
              <p className="text-[13px] text-[var(--dash-muted)]">
                View and download invoices in the{" "}
                <button
                  type="button"
                  onClick={handlePortal}
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
