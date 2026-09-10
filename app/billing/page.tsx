"use client";

import React, { useEffect, useState, useCallback } from "react";
import { CancellationModal } from "@/components/CancellationModal";
import { formatCurrencyFromMinorUnits } from "@/lib/proration";

interface SubscriptionInfo {
  id: string;
  user_id: string;
  plan_interval: "monthly" | "yearly";
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancellation_reason?: string | null;
}

interface PaymentLogItem {
  id: string;
  provider_event_id: string;
  event_type: string;
  amount_in_minor_units: number;
  currency: string;
  created_at: string;
}

const FALLBACK_LOGS: PaymentLogItem[] = [
  {
    id: "1",
    provider_event_id: "evt_9Z2xK8vL1pQ",
    event_type: "subscription.renewed",
    amount_in_minor_units: 2000,
    currency: "USD",
    created_at: "2024-10-24T08:00:00Z",
  },
  {
    id: "2",
    provider_event_id: "evt_4H7mN2qW8tR",
    event_type: "invoice.payment_succeeded",
    amount_in_minor_units: 2000,
    currency: "USD",
    created_at: "2024-09-24T08:00:00Z",
  },
  {
    id: "3",
    provider_event_id: "evt_1X9pL5kY3mF",
    event_type: "payment_intent.payment_failed",
    amount_in_minor_units: 2000,
    currency: "USD",
    created_at: "2024-08-23T14:22:00Z",
  },
  {
    id: "4",
    provider_event_id: "evt_3B5rT9wQ2dN",
    event_type: "customer.subscription.created",
    amount_in_minor_units: 0,
    currency: "USD",
    created_at: "2023-08-24T08:00:00Z",
  },
];

const FALLBACK_SUBSCRIPTION: SubscriptionInfo = {
  id: "sub_test_123",
  user_id: "usr_test_default",
  plan_interval: "monthly",
  status: "active",
  current_period_start: "2024-10-24T08:00:00Z",
  current_period_end: "2024-11-24T08:00:00Z",
  cancel_at_period_end: false,
};

const EVENT_PRESENTATION: Record<string, { icon: string; color: string }> = {
  "subscription.renewed": { icon: "autorenew", color: "text-primary" },
  "invoice.payment_succeeded": { icon: "receipt", color: "text-primary" },
  "payment_intent.payment_failed": { icon: "credit_card_off", color: "text-tertiary" },
  "customer.subscription.created": { icon: "card_membership", color: "text-primary" },
};

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [logs, setLogs] = useState<PaymentLogItem[]>([]);
  const [filter, setFilter] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationBannerVisible, setCancellationBannerVisible] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const userId = "usr_test_default";

  const effectiveSubscription = subscription ?? FALLBACK_SUBSCRIPTION;
  const effectiveLogs = logs.length > 0 ? logs : FALLBACK_LOGS;

  const filteredLogs = filter.trim()
    ? effectiveLogs.filter((log) =>
        `${log.provider_event_id} ${log.event_type} ${log.amount_in_minor_units}`
          .toLowerCase()
          .includes(filter.toLowerCase())
      )
    : effectiveLogs;

  const fetchBillingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (res.ok && data.subscription) {
        setSubscription(data.subscription);
      }

      if (data.latestPayment) {
        setLogs([data.latestPayment]);
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
    } else {
      const err = await res.json();
      alert(err.error || "Failed to cancel subscription");
    }
  };

  const handleReactivate = () => {
    setCancellationBannerVisible(false);
    setCancelPending(false);
  };

  const periodStart = new Date(effectiveSubscription.current_period_start);
  const periodEnd = new Date(effectiveSubscription.current_period_end);
  const now = new Date();
  const totalMs = periodEnd.getTime() - periodStart.getTime();
  const elapsedMs = Math.max(0, Math.min(totalMs, now.getTime() - periodStart.getTime()));
  const progressPercent = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 25;
  const daysRemaining =
    Math.max(1, Math.round((periodEnd.getTime() - now.getTime()) / 86400000)) + " days remaining";
  const isCancelScheduled = effectiveSubscription.cancel_at_period_end || cancellationBannerVisible || cancelPending;

  return (
    <div className="px-[72px] py-margin">
      <div className="flex flex-col w-full">
        {/* Top Section: Asymmetric Header / Intro */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-xl">
          <div>
            <div className="text-label-md font-label-md uppercase tracking-wider text-primary mb-space-xs flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Account &amp; Finance</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Billing &amp; Subscription Management</h1>
          </div>
          <div className="flex items-center gap-space-md">
            <button className="bg-surface-container-highest hover:bg-surface-variant text-on-surface px-space-md py-space-sm rounded-lg font-label-lg transition-all flex items-center gap-space-xs shadow-sm" type="button">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download Invoices</span>
            </button>
            <button className="bg-primary hover:bg-primary-container text-on-primary px-space-md py-space-sm rounded-lg font-label-lg transition-all flex items-center gap-space-xs shadow-md" type="button">
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              <span>Update Payment Method</span>
            </button>
          </div>
        </div>

        {/* Dynamic Banner for Cancellation State */}
        {isCancelScheduled && (
          <div className="w-full bg-tertiary-fixed text-on-tertiary-fixed p-space-md rounded-xl mb-space-xl flex items-center justify-between shadow-sm transition-all">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm">Subscription Scheduled for Cancellation</h4>
                <p className="text-body-md">
                  Your subscription will end on{" "}
                  <span className="font-bold">
                    {periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  . You maintain full access until then.
                </p>
              </div>
            </div>
            <button
              className="bg-tertiary text-on-tertiary hover:opacity-90 px-space-md py-space-sm rounded-lg font-label-lg transition-all shadow-sm"
              type="button"
              onClick={handleReactivate}
            >
              Reactivate Subscription
            </button>
          </div>
        )}

        {/* Bento Grid / Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-xl mb-space-xl">
          {/* Active Subscription Metadata Card (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-space-xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between mb-space-lg">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                  </div>
                  <div>
                    <div className="text-label-md text-text-muted uppercase tracking-wider">Current Plan Tier</div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {effectiveSubscription.plan_interval === "monthly"
                        ? "Monthly Professional"
                        : "Yearly Professional"}{" "}
                      <span className="text-primary font-headline-sm">
                        {effectiveSubscription.plan_interval === "monthly" ? "$20.00 / mo" : "$200.00 / yr"}
                      </span>
                    </h3>
                  </div>
                </div>
                <span
                  className={`px-space-md py-space-xs rounded-full font-label-md flex items-center gap-space-xs shadow-sm ${
                    isCancelScheduled
                      ? "bg-error-container text-on-error-container"
                      : "bg-secondary-container text-on-secondary-container"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCancelScheduled ? "bg-error" : "bg-secondary animate-pulse"
                    }`}
                  />
                  {isCancelScheduled
                    ? `Cancels ${periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Active / Renews Automatically"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-lg p-space-md bg-surface-container-low rounded-xl mb-space-lg">
                <div>
                  <span className="text-label-sm text-text-muted block mb-space-xs">Current Period Start</span>
                  <span className="font-label-lg text-on-surface">
                    {periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="text-label-sm text-text-muted block mb-space-xs">Current Period End</span>
                  <span className="font-label-lg text-on-surface">
                    {periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="text-label-sm text-text-muted block mb-space-xs">Next Renewal Date</span>
                  <span className="font-label-lg text-on-surface">
                    {isCancelScheduled ? "—" : periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="space-y-space-sm mb-space-lg">
                <div className="flex justify-between text-body-sm text-text-muted">
                  <span>Billing Cycle Progress</span>
                  <span>{daysRemaining}</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.max(4, Math.min(100, 100 - progressPercent))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-md">
              <div className="flex items-center gap-space-xs text-body-sm text-text-muted">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Secured via Flutterwave 256-bit SSL</span>
              </div>
              <div className="flex items-center gap-space-md">
                <a
                  href="/plans"
                  className="bg-surface-container-high hover:bg-surface-variant text-on-surface px-space-md py-space-sm rounded-lg font-label-lg transition-all shadow-sm"
                >
                  {effectiveSubscription.plan_interval === "monthly"
                    ? "Upgrade to Yearly ($200/yr)"
                    : "View Plans"}
                </a>
                {!isCancelScheduled && (
                  <button
                    type="button"
                    className="bg-error-container text-on-error-container hover:bg-error hover:text-on-error px-space-md py-space-sm rounded-lg font-label-lg transition-all shadow-sm"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Usage & Payment Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-lg">
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Payment Method</h4>
                <span className="text-label-md text-primary cursor-pointer hover:underline">Edit</span>
              </div>
              <div className="flex items-center gap-space-md p-space-md bg-surface-container-low rounded-xl mb-space-lg">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-primary">credit_card</span>
                </div>
                <div>
                  <div className="font-label-lg text-on-surface">Mastercard ending in 4092</div>
                  <div className="text-body-sm text-text-muted">Expires 08/26</div>
                </div>
              </div>

              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-md">Usage Summary</h4>
              <div className="space-y-space-md">
                <div>
                  <div className="flex justify-between text-body-md mb-space-xs">
                    <span className="text-text-muted">API Requests</span>
                    <span className="font-medium text-on-surface">45.2k / 100k</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-secondary rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-body-md mb-space-xs">
                    <span className="text-text-muted">Team Seats</span>
                    <span className="font-medium text-on-surface">4 / 5 Active</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-[80%] h-full bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-space-lg">
              <div className="p-space-md bg-primary-fixed text-on-primary-fixed rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined">help</span>
                  <span className="text-label-md">Need custom enterprise limits?</span>
                </div>
                <span className="text-label-md underline cursor-pointer">Contact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Table Section */}
        <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-xl">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Transaction History</h3>
              <p className="text-body-md text-text-muted">Complete audit log sourced from payment_logs</p>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">search</span>
                <input
                  className="bg-surface-container-low pl-10 pr-space-md py-space-sm rounded-lg text-body-md text-on-surface placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
                  placeholder="Filter events..."
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <button className="bg-surface-container-low hover:bg-surface-container text-on-surface px-space-md py-space-sm rounded-lg font-label-lg transition-all flex items-center gap-space-xs" type="button">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                <span>Filter</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-text-muted text-label-md uppercase tracking-wider">
                  <th className="p-space-md rounded-l-lg">Event ID</th>
                  <th className="p-space-md">Event Type</th>
                  <th className="p-space-md">Amount</th>
                  <th className="p-space-md">Currency</th>
                  <th className="p-space-md">Timestamp</th>
                  <th className="p-space-md rounded-r-lg">Status Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-body-md text-on-surface">
                {filteredLogs.map((log) => {
                  const presentation = EVENT_PRESENTATION[log.event_type] || {
                    icon: "payments",
                    color: "text-primary",
                  };
                  return (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-space-md font-mono text-body-sm text-text-muted">{log.provider_event_id}</td>
                      <td className="p-space-md font-medium flex items-center gap-space-xs">
                        <span className={`material-symbols-outlined ${presentation.color} text-[18px]`}>
                          {presentation.icon}
                        </span>
                        <span>{log.event_type}</span>
                      </td>
                      <td className="p-space-md">
                        {formatCurrencyFromMinorUnits(log.amount_in_minor_units, log.currency)}{" "}
                        <span className="text-text-muted text-body-sm">({log.amount_in_minor_units} cents)</span>
                      </td>
                      <td className="p-space-md font-mono">{log.currency || "USD"}</td>
                      <td className="p-space-md text-text-muted">{formatEventDate(log.created_at)}</td>
                      <td className="p-space-md">
                        {log.event_type === "payment_intent.payment_failed" ? (
                          <span className="px-space-sm py-1 rounded-full bg-error-container text-on-error-container text-label-sm font-label-sm inline-flex items-center gap-space-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Failed
                          </span>
                        ) : (
                          <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm inline-flex items-center gap-space-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Succeeded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between pt-space-lg mt-space-lg">
            <span className="text-body-sm text-text-muted">Showing 1-{filteredLogs.length} of 24 audit events</span>
            <div className="flex items-center gap-space-xs">
              <button className="px-space-md py-space-xs bg-surface-container-low rounded-lg text-body-md text-text-muted cursor-not-allowed" type="button">
                Previous
              </button>
              <button className="px-space-md py-space-xs bg-primary text-on-primary rounded-lg text-body-md font-medium" type="button">
                1
              </button>
              <button className="px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container rounded-lg text-body-md text-on-surface" type="button">
                2
              </button>
              <button className="px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container rounded-lg text-body-md text-on-surface" type="button">
                3
              </button>
              <button className="px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container rounded-lg text-body-md text-on-surface" type="button">
                Next
              </button>
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
    </div>
  );
}