"use client";

import React, { useEffect, useState, useCallback } from "react";
import { CancellationModal } from "@/components/CancellationModal";
import { StatusToast } from "@/components/StatusToast";
import { useAppView } from "@/components/AppView";
import { PLANS, type PlanInterval } from "@/types";

interface SubscriptionInfo {
  id: string;
  user_id: string;
  plan_interval: "free" | "monthly" | "yearly";
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancellation_reason?: string | null;
}

const FREE_SUBSCRIPTION: SubscriptionInfo = {
  id: "sub_free",
  user_id: "usr_test_default",
  plan_interval: "free",
  status: "inactive",
  current_period_start: "",
  current_period_end: "",
  cancel_at_period_end: false,
};

export default function BillingView() {
  const { setView } = useAppView();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationBannerVisible, setCancellationBannerVisible] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const userId = "usr_test_default";

  const effectiveSubscription = subscription ?? FREE_SUBSCRIPTION;
  const planInterval = effectiveSubscription.plan_interval as PlanInterval;
  const isFree = planInterval === "free";
  const planName = isFree ? "Free" : PLANS[planInterval].name;
  const planPriceLabel = isFree
    ? "$0 / forever"
    : planInterval === "monthly"
    ? "$20.00 / mo"
    : "$200.00 / yr";
  const yearPlanName = PLANS.yearly.name;

  const fetchBillingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (res.ok) {
        setSubscription(data.subscription ?? null);
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleConfirmCancel = async (reason: string) => {
    const res = await fetch("/api/subscription/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason }),
    });

    if (res.ok) {
      setCancelPending(true);
      setCancellationBannerVisible(true);
      await fetchBillingData();
      const dateLabel = new Date(
        effectiveSubscription.current_period_end
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      setToast(
        `Cancellation successful. You keep full access until ${dateLabel} — when your subscription ends.`
      );
    } else {
      const err = await res.json();
      alert(err.error || "Failed to cancel subscription");
    }
  };

  const handleReactivate = async () => {
    try {
      const res = await fetch("/api/subscription/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setCancellationBannerVisible(false);
        setCancelPending(false);
        await fetchBillingData();
        setToast("Subscription reactivated successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to reactivate subscription");
      }
    } catch (err) {
      console.error("Failed to reactivate subscription:", err);
      alert("Failed to reactivate subscription");
    }
  };

  const periodStart = isFree ? null : new Date(effectiveSubscription.current_period_start);
  const periodEnd = isFree ? null : new Date(effectiveSubscription.current_period_end);
  // Keep displayed period dates current: if the billing window already lapsed
  // while the subscription is still active, roll forward for legibility.
  {
    const isYearly = planInterval === "yearly";
    let guard = 0;
    while (
      periodStart &&
      periodEnd &&
      periodEnd.getTime() <= Date.now() &&
      guard < 60
    ) {
      periodStart.setTime(periodEnd.getTime());
      if (isYearly) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      guard += 1;
    }
  }
  const totalMs = periodStart && periodEnd ? periodEnd.getTime() - periodStart.getTime() : 0;
  const elapsedMs =
    periodStart && totalMs > 0
      ? Math.max(0, Math.min(totalMs, new Date().getTime() - periodStart.getTime()))
      : 0;
  const progressPercent = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;
  const daysRemaining = isFree
    ? "—"
    : Math.max(0, Math.round((periodEnd!.getTime() - new Date().getTime()) / 86400000)) +
      " days remaining";
  const isCancelScheduled = effectiveSubscription.cancel_at_period_end || cancellationBannerVisible || cancelPending;

  return (
    <div className="px-space-md sm:px-space-lg md:px-page-x py-margin">
      <div className="flex flex-col w-full">
        {/* Top Section: Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-space-lg mb-space-xl">
          <div>
            <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-space-xs shadow-sm ring-1 ring-outline-variant/50 mb-space-md">
              <span className="material-symbols-outlined text-[1rem] text-primary">receipt_long</span>
              <span className="text-label-md font-label-md uppercase tracking-wider text-primary">
                Account &amp; Finance
              </span>
            </div>
            <h1 className="font-headline-lg text-[clamp(1.75rem,1.25rem+2.5vw,3rem)] leading-[1.15] tracking-[clamp(-0.025em,calc(-0.005em_-_0.002vw),-0.005em)] text-on-surface [text-wrap:balance]">Billing &amp; Subscription Management</h1>
            <p className="text-body-lg text-on-surface-variant max-w-xl mt-space-sm [text-wrap:balance]">
              Manage your plan, billing cycle, and subscription preferences in one place.
            </p>
          </div>
        </div>

        {/* Dynamic Banner for Cancellation State */}
        {isCancelScheduled && (
          <div className="w-full bg-tertiary-fixed/60 text-on-tertiary-fixed ring-1 ring-tertiary/10 p-space-md rounded-xl mb-space-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md shadow-sm transition-all">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-full bg-tertiary/80 text-on-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[1.125rem]">warning</span>
              </div>
              <div>
                <h4 className="font-label-lg text-label-lg">Subscription Scheduled for Cancellation</h4>
                <p className="text-body-sm">
                  Your subscription will end on{" "}
                  <span className="font-bold">
                    {periodEnd
                      ? periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </span>
                  . You maintain full access until then.
                </p>
              </div>
            </div>
            <button
              className="bg-tertiary/80 text-on-tertiary hover:bg-tertiary hover:opacity-90 px-space-md py-space-sm rounded-lg font-label-md transition-all shadow-sm"
              type="button"
              onClick={handleReactivate}
            >
              Reactivate Subscription
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="mb-space-xl">
          {/* Active Subscription Card */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-xl shadow-md ring-1 ring-outline-variant/50">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary-fixed/70 via-primary-fixed/30 to-transparent blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary-fixed/40 to-transparent blur-3xl"
            />

            <div className="relative">
              {/* Plan Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md mb-space-lg">
                <div className="flex items-center gap-space-md">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-[1.5rem]">workspace_premium</span>
                  </div>
                  <div>
                    <div className="text-label-md text-text-muted uppercase tracking-wider">Current Plan Tier</div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {planName}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-space-md">
                  <span className="font-headline-sm text-headline-sm text-primary">
                    {planPriceLabel}
                  </span>
                  <span
                    className={`px-space-md py-space-xs rounded-full font-label-md flex items-center gap-space-xs shadow-sm ring-1 ring-outline-variant/50 ${
                      isFree
                        ? "bg-surface-container text-on-surface-variant"
                        : isCancelScheduled
                        ? "bg-error-container text-on-error-container"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isFree
                          ? "bg-outline"
                          : isCancelScheduled
                          ? "bg-error"
                          : "bg-secondary animate-pulse"
                      }`}
                    />
                    {isFree
                      ? "No Active Plan"
                      : isCancelScheduled
                      ? `Cancels ${periodEnd!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : "Active"}
                  </span>
                </div>
              </div>

              {/* Period Info Mini Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-lg mb-space-lg">
                <div className="rounded-xl border-2 border-outline-variant bg-surface-container-low p-space-md">
                  <div className="flex items-center gap-space-xs mb-space-sm">
                    <span className="material-symbols-outlined text-[1rem] text-primary">calendar_today</span>
                    <span className="text-label-sm text-text-muted">Current Period Start</span>
                  </div>
                  <span className="font-label-lg text-on-surface">
                    {isFree
                      ? "—"
                      : periodStart!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="rounded-xl border-2 border-outline-variant bg-surface-container-low p-space-md">
                  <div className="flex items-center gap-space-xs mb-space-sm">
                    <span className="material-symbols-outlined text-[1rem] text-primary">event_available</span>
                    <span className="text-label-sm text-text-muted">Current Period End</span>
                  </div>
                  <span className="font-label-lg text-on-surface">
                    {isFree
                      ? "—"
                      : periodEnd!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="rounded-xl border-2 border-outline-variant bg-surface-container-low p-space-md">
                  <div className="flex items-center gap-space-xs mb-space-sm">
                    <span className="material-symbols-outlined text-[1rem] text-primary">autorenew</span>
                    <span className="text-label-sm text-text-muted">Next Renewal Date</span>
                  </div>
                  <span className="font-label-lg text-on-surface">
                    {isCancelScheduled
                      ? "—"
                      : isFree
                      ? "—"
                      : periodEnd!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Billing Cycle Progress */}
              {!isFree && (
                <div className="mb-space-lg">
                  <div className="flex justify-between items-center text-body-sm text-text-muted mb-space-sm">
                    <span>Billing Cycle Progress</span>
                    <span className="font-medium text-on-surface">{daysRemaining}</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden ring-1 ring-outline-variant/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-fixed-dim transition-all"
                      style={{ width: `${Math.max(4, Math.min(100, 100 - progressPercent))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-md border-t border-surface-container">
                <div className="flex items-center gap-space-xs text-body-sm text-text-muted">
                  <span className="material-symbols-outlined text-[1rem]">lock</span>
                  <span>Secured via Flutterwave 256-bit SSL</span>
                </div>
                <div className="flex items-center gap-space-md">
                  <button
                    type="button"
                    onClick={() => setView("plans")}
                    className="inline-flex items-center justify-center gap-space-sm bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container px-space-md py-space-sm rounded-lg font-label-lg transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[1rem]">north_east</span>
                    {isFree
                      ? "View Plans & Upgrade"
                      : planInterval === "monthly"
                      ? `Upgrade to ${yearPlanName} ($200/yr)`
                      : "View Plans"}
                  </button>
                  {!isFree && !isCancelScheduled && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-space-sm bg-error-container text-on-error-container hover:bg-error hover:text-on-error px-space-md py-space-sm rounded-lg font-label-lg transition-all shadow-sm"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-[1rem]">block</span>
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Modal */}
        <CancellationModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
          currentPeriodEnd={effectiveSubscription.current_period_end}
        />
      </div>

      <StatusToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}