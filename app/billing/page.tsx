"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrencyFromMinorUnits } from "@/lib/proration";
import { CancellationModal } from "@/components/CancellationModal";

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

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [logs, setLogs] = useState<PaymentLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const userId = "usr_test_default";

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (res.ok && data.subscription) {
        setSubscription(data.subscription);
      }

      // If logs are included in status or fallback
      if (data.latestPayment) {
        setLogs([data.latestPayment]);
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
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
      await fetchBillingData();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to cancel subscription");
    }
  };

  return (
    <div className="py-[var(--spacing-4)] max-w-5xl mx-auto space-y-[var(--spacing-8)]">
      {/* Page Header */}
      <div>
        <h1 className="text-[var(--typography-font-size-3xl)] font-bold text-[var(--color-on-surface-color)]">
          Billing & Subscription Dashboard
        </h1>
        <p className="mt-1 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
          Manage your subscription tier, view upcoming billing dates, and inspect immutable payment logs.
        </p>
      </div>

      {/* Subscription Status Card */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-lowest-color)] p-[var(--spacing-6)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-outline-variant-color)] pb-[var(--spacing-4)]">
          <div>
            <span className="text-[var(--typography-font-size-xs)] uppercase tracking-wider font-bold text-[var(--color-surface-variant-color)]">
              Current Plan
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <h2 className="text-[var(--typography-font-size-2xl)] font-bold text-[var(--color-on-surface-color)] capitalize">
                {subscription ? `${subscription.plan_interval} Plan` : "Free Tier"}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[var(--typography-font-size-xs)] font-bold capitalize ${
                  subscription?.status === "active"
                    ? "bg-[var(--color-secondary-container-color)] text-[var(--color-on-secondary-container-color)]"
                    : "bg-[var(--color-surface-container-high-color)] text-[var(--color-surface-variant-color)]"
                }`}
              >
                {subscription?.status || "Inactive"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/plans"
              className="rounded-[var(--radius-md)] bg-[var(--color-primary-color)] px-4 py-2 text-[var(--typography-font-size-sm)] font-semibold text-[var(--color-on-primary-color)] hover:opacity-90"
            >
              {subscription ? "Change / Upgrade Plan" : "Choose a Plan"}
            </Link>

            {subscription && !subscription.cancel_at_period_end && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="rounded-[var(--radius-md)] border border-[var(--color-outline-variant-color)] px-4 py-2 text-[var(--typography-font-size-sm)] font-medium text-[var(--color-tertiary-color)] hover:bg-[var(--color-surface-container-low-color)]"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Subscription Metadata Grid */}
        {subscription && (
          <div className="mt-[var(--spacing-6)] grid grid-cols-1 sm:grid-cols-3 gap-[var(--spacing-4)] text-[var(--typography-font-size-sm)]">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-low-color)] p-4">
              <span className="text-[var(--color-surface-variant-color)] block text-xs">Current Period Started</span>
              <span className="font-mono font-medium text-[var(--color-on-surface-color)] mt-1 block">
                {new Date(subscription.current_period_start).toLocaleDateString()}
              </span>
            </div>

            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-low-color)] p-4">
              <span className="text-[var(--color-surface-variant-color)] block text-xs">
                {subscription.cancel_at_period_end ? "Access Expiration Date" : "Next Renewal Date"}
              </span>
              <span className="font-mono font-medium text-[var(--color-on-surface-color)] mt-1 block">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>

            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-low-color)] p-4">
              <span className="text-[var(--color-surface-variant-color)] block text-xs">Renewal Status</span>
              <span className="font-medium mt-1 block">
                {subscription.cancel_at_period_end ? (
                  <span className="text-[var(--color-tertiary-color)] font-semibold">
                    Cancels at period end
                  </span>
                ) : (
                  <span className="text-[var(--color-secondary-color)] font-semibold">
                    Auto-renews automatically
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {subscription?.cancel_at_period_end && (
          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-tertiary-container-color)] p-3 text-[var(--typography-font-size-sm)] text-[var(--color-on-tertiary-container-color)]">
            <strong>Retained Access Active:</strong> You will continue enjoying full subscriber benefits until{" "}
            <span className="font-bold">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
            . Reason recorded: <em>&ldquo;{subscription.cancellation_reason || "None provided"}&rdquo;</em>.
          </div>
        )}
      </div>

      {/* Immutable Transaction History Table */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-lowest-color)] p-[var(--spacing-6)] shadow-[var(--shadow-sm)]">
        <h3 className="text-[var(--typography-font-size-lg)] font-bold text-[var(--color-on-surface-color)]">
          Payment & Transaction Audit History
        </h3>
        <p className="mt-1 text-[var(--typography-font-size-xs)] text-[var(--color-surface-variant-color)]">
          Strict database ledger sourced directly from immutable <code className="font-mono">payment_logs</code> table.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[var(--typography-font-size-sm)]">
            <thead className="border-b border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-low-color)] text-[var(--typography-font-size-xs)] uppercase tracking-wider text-[var(--color-surface-variant-color)]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline-variant-color)]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-surface-container-low-color)] transition-colors">
                    <td className="py-3 px-4 font-mono text-[var(--color-primary-color)] text-xs">
                      {log.provider_event_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs capitalize text-[var(--color-on-surface-color)]">
                      {log.event_type}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--color-on-surface-color)]">
                      {formatCurrencyFromMinorUnits(log.amount_in_minor_units, log.currency)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[var(--color-surface-variant-color)]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--color-surface-variant-color)]">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        currentPeriodEnd={subscription?.current_period_end || null}
      />
    </div>
  );
}
