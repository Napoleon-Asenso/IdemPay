"use client";

import React, { useState } from "react";
import { PLANS, PlanInterval } from "@/types";
import { formatCurrencyFromMinorUnits, calculateUpgradeProration } from "@/lib/proration";
import { ProrationCallout } from "@/components/ProrationCallout";
import { useRouter } from "next/navigation";

export default function PlansPage() {
  const router = useRouter();

  // Simulated active user state (Alex Dev)
  // In a real environment this is populated from session/database
  const [currentPlan, setCurrentPlan] = useState<"free" | PlanInterval>("monthly");
  const [selectedInterval, setSelectedInterval] = useState<PlanInterval>("yearly");
  const [loading, setLoading] = useState(false);

  // Upgrade proration simulation parameters: 20 days remaining out of 30
  const daysRemaining = 20;
  const totalDays = 30;

  const isCurrentActive = (interval: PlanInterval) => currentPlan === interval;
  const isUpgradingToYearly = currentPlan === "monthly" && selectedInterval === "yearly";

  const monthlyPlan = PLANS.monthly;
  const yearlyPlan = PLANS.yearly;

  // Calculate proration if upgrading from monthly to yearly
  const proration = isUpgradingToYearly
    ? calculateUpgradeProration(
        monthlyPlan.priceInMinorUnits,
        yearlyPlan.priceInMinorUnits,
        daysRemaining,
        totalDays
      )
    : null;

  const handleSubscribe = async (interval: PlanInterval) => {
    setLoading(true);
    const amountToCharge =
      interval === "yearly" && isUpgradingToYearly && proration
        ? proration.netAmountDue
        : PLANS[interval].priceInMinorUnits;

    // Navigate to checkout handoff screen
    const query = new URLSearchParams({
      plan: interval,
      amount: amountToCharge.toString(),
      isUpgrade: isUpgradingToYearly ? "true" : "false",
      userId: "usr_test_default",
    });

    router.push(`/checkout/handoff?${query.toString()}`);
  };

  return (
    <div className="py-[var(--spacing-4)]">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-[var(--typography-font-size-3xl)] sm:text-[var(--typography-font-size-4xl)] font-bold tracking-tight text-[var(--color-on-surface-color)]">
          Simple, Predictable Billing
        </h1>
        <p className="mt-[var(--spacing-3)] text-[var(--typography-font-size-base)] text-[var(--color-surface-variant-color)]">
          Transparent subscriptions with exact whole-minor-unit proration. Switch intervals anytime without lost value.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="mt-[var(--spacing-6)] inline-flex items-center rounded-[var(--radius-lg)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-color)] p-1">
          <button
            type="button"
            onClick={() => setSelectedInterval("monthly")}
            className={`rounded-[var(--radius-md)] px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--typography-font-size-sm)] font-semibold transition-all ${
              selectedInterval === "monthly"
                ? "bg-[var(--color-surface-container-lowest-color)] text-[var(--color-on-surface-color)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-surface-variant-color)] hover:text-[var(--color-on-surface-color)]"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setSelectedInterval("yearly")}
            className={`flex items-center space-x-2 rounded-[var(--radius-md)] px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--typography-font-size-sm)] font-semibold transition-all ${
              selectedInterval === "yearly"
                ? "bg-[var(--color-surface-container-lowest-color)] text-[var(--color-on-surface-color)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-surface-variant-color)] hover:text-[var(--color-on-surface-color)]"
            }`}
          >
            <span>Annual Billing</span>
            <span className="rounded-full bg-[var(--color-secondary-color)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-on-secondary-color)]">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="mt-[var(--spacing-8)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-6)] max-w-4xl mx-auto">
        {/* Monthly Plan Card */}
        <div
          className={`relative rounded-[var(--radius-xl)] border p-[var(--spacing-6)] transition-shadow ${
            selectedInterval === "monthly"
              ? "border-[var(--color-primary-color)] shadow-[var(--shadow-md)] bg-[var(--color-surface-container-lowest-color)]"
              : "border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-low-color)] opacity-80"
          }`}
        >
          {isCurrentActive("monthly") && (
            <div className="absolute top-4 right-4 rounded-full bg-[var(--color-primary-container-color)] px-3 py-1 text-[var(--typography-font-size-xs)] font-bold text-[var(--color-on-primary-container-color)]">
              Current Active Plan
            </div>
          )}

          <h2 className="text-[var(--typography-font-size-xl)] font-bold text-[var(--color-on-surface-color)]">
            {monthlyPlan.name}
          </h2>
          <p className="mt-1 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
            Ideal for individuals and teams seeking maximum monthly flexibility.
          </p>

          <div className="mt-6 flex items-baseline">
            <span className="font-mono text-[var(--typography-font-size-4xl)] font-extrabold text-[var(--color-on-surface-color)]">
              {formatCurrencyFromMinorUnits(monthlyPlan.priceInMinorUnits)}
            </span>
            <span className="ml-1 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
              /month
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {monthlyPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center text-[var(--typography-font-size-sm)] text-[var(--color-on-surface-color)]">
                <svg className="h-4 w-4 mr-2 text-[var(--color-secondary-color)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <button
              type="button"
              disabled={isCurrentActive("monthly") || loading}
              onClick={() => handleSubscribe("monthly")}
              className={`w-full rounded-[var(--radius-md)] py-[var(--spacing-3)] font-semibold text-[var(--typography-font-size-sm)] transition-colors ${
                isCurrentActive("monthly")
                  ? "bg-[var(--color-surface-container-high-color)] text-[var(--color-surface-variant-color)] cursor-not-allowed"
                  : "bg-[var(--color-primary-color)] text-[var(--color-on-primary-color)] hover:bg-[hsl(221,79%,40%)]"
              }`}
            >
              {isCurrentActive("monthly") ? "Currently Subscribed" : "Subscribe Monthly"}
            </button>
          </div>
        </div>

        {/* Yearly Plan Card */}
        <div
          className={`relative rounded-[var(--radius-xl)] border p-[var(--spacing-6)] transition-shadow ${
            selectedInterval === "yearly"
              ? "border-[var(--color-primary-color)] shadow-[var(--shadow-lg)] bg-[var(--color-surface-container-lowest-color)] ring-2 ring-[var(--color-primary-color)] ring-opacity-20"
              : "border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-low-color)] opacity-80"
          }`}
        >
          {isCurrentActive("yearly") ? (
            <div className="absolute top-4 right-4 rounded-full bg-[var(--color-primary-container-color)] px-3 py-1 text-[var(--typography-font-size-xs)] font-bold text-[var(--color-on-primary-container-color)]">
              Current Active Plan
            </div>
          ) : (
            <div className="absolute top-4 right-4 rounded-full bg-[var(--color-secondary-container-color)] px-3 py-1 text-[var(--typography-font-size-xs)] font-bold text-[var(--color-on-secondary-container-color)]">
              Best Value
            </div>
          )}

          <h2 className="text-[var(--typography-font-size-xl)] font-bold text-[var(--color-on-surface-color)]">
            {yearlyPlan.name}
          </h2>
          <p className="mt-1 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
            Commit annually, unlock full features, and save $40 every year.
          </p>

          <div className="mt-6 flex items-baseline">
            <span className="font-mono text-[var(--typography-font-size-4xl)] font-extrabold text-[var(--color-on-surface-color)]">
              {formatCurrencyFromMinorUnits(yearlyPlan.priceInMinorUnits)}
            </span>
            <span className="ml-1 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
              /year
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {yearlyPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center text-[var(--typography-font-size-sm)] text-[var(--color-on-surface-color)]">
                <svg className="h-4 w-4 mr-2 text-[var(--color-secondary-color)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <button
              type="button"
              disabled={isCurrentActive("yearly") || loading}
              onClick={() => handleSubscribe("yearly")}
              className={`w-full rounded-[var(--radius-md)] py-[var(--spacing-3)] font-semibold text-[var(--typography-font-size-sm)] transition-colors ${
                isCurrentActive("yearly")
                  ? "bg-[var(--color-surface-container-high-color)] text-[var(--color-surface-variant-color)] cursor-not-allowed"
                  : "bg-[var(--color-primary-color)] text-[var(--color-on-primary-color)] hover:bg-[hsl(221,79%,40%)]"
              }`}
            >
              {isCurrentActive("yearly")
                ? "Currently Subscribed"
                : isUpgradingToYearly
                ? "Upgrade to Yearly"
                : "Subscribe Yearly"}
            </button>
          </div>
        </div>
      </div>

      {/* Proration Callout if upgrading from Monthly to Yearly */}
      {isUpgradingToYearly && proration && (
        <div className="max-w-4xl mx-auto">
          <ProrationCallout
            currentPlanMinorUnits={monthlyPlan.priceInMinorUnits}
            newPlanMinorUnits={yearlyPlan.priceInMinorUnits}
            unusedCredit={proration.unusedCredit}
            netAmountDue={proration.netAmountDue}
            daysRemaining={daysRemaining}
            totalDays={totalDays}
          />
        </div>
      )}
    </div>
  );
}
