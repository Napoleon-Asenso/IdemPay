"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, PlanInterval } from "@/types";
import { calculateUpgradeProration } from "@/lib/proration";

export default function PlansPage() {
  const router = useRouter();

  const currentPlan: PlanInterval = "monthly";
  const [prorationVisible, setProrationVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const daysRemaining = 20;
  const totalDays = 30;

  const proration = calculateUpgradeProration(
    PLANS.monthly.priceInMinorUnits,
    PLANS.yearly.priceInMinorUnits,
    daysRemaining,
    totalDays
  );

  const initiateCheckout = (plan: PlanInterval, amountInMinorUnits: number, isUpgrade: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const query = new URLSearchParams({
      plan,
      amount: amountInMinorUnits.toString(),
      isUpgrade: isUpgrade ? "true" : "false",
      userId: "usr_test_default",
    });

    router.push(`/checkout/handoff?${query.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-margin">
      <div className="flex flex-col w-full">
        {/* Top Banner / Editorial Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin mb-space-xl items-end">
          <div className="lg:col-span-8 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed text-label-md tracking-wider uppercase font-semibold">
                Subscription Management
              </span>
              <span className="text-on-surface-variant text-body-sm">/ Scale your tools seamlessly</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Flexible plans engineered for unstoppable growth.
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">
              Upgrade, downgrade, or switch billing cycles instantly. Transparent proration ensures you only ever pay for what you use.
            </p>
          </div>
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <div className="p-space-lg rounded-xl bg-surface-container-high flex items-center gap-space-md shadow-sm w-full sm:w-auto">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-on-primary text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
              <div>
                <div className="text-label-md text-on-surface-variant">Current Active Plan</div>
                <div className="text-headline-sm text-primary">Monthly Plan ($20/mo)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-margin mb-space-xl">
          {/* Free Tier Card */}
          <div className="flex flex-col justify-between p-space-xl rounded-xl bg-surface-container-low shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div>
              <div className="flex justify-between items-center mb-space-lg">
                <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wider">Starter</span>
                <span className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface text-label-sm">Basic</span>
              </div>
              <div className="mb-space-lg">
                <div className="flex items-baseline gap-space-xs">
                  <span className="text-headline-lg font-headline-lg text-on-surface">$0</span>
                  <span className="text-body-md text-on-surface-variant">/ forever</span>
                </div>
                <p className="text-body-md text-on-surface-variant mt-space-sm">Essential tools for personal projects and casual exploration.</p>
              </div>
              <div className="space-y-space-md mb-space-xl">
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Up to 3 active subscriptions tracked</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Standard renewal alerts (Email)</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-outline text-[20px]">cancel</span>
                  <span>Automated cancellation concierge</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-outline text-[20px]">cancel</span>
                  <span>Advanced spending analytics</span>
                </div>
              </div>
            </div>
            <button
              className="w-full py-space-md px-space-lg rounded-lg bg-surface-container text-on-surface font-medium hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-space-sm"
              type="button"
            >
              <span>Downgrade to Free</span>
            </button>
          </div>

          {/* Monthly Plan Card (Active) */}
          <div className="flex flex-col justify-between p-space-xl rounded-xl bg-surface-container shadow-md relative overflow-hidden ring-2 ring-primary/20 transition-all duration-300 hover:shadow-lg">
            <div className="absolute top-0 right-0 bg-primary text-on-primary text-label-sm font-semibold px-space-lg py-space-xs rounded-bl-xl tracking-wider uppercase">
              Active Plan
            </div>
            <div>
              <div className="flex justify-between items-center mb-space-lg">
                <span className="text-label-lg font-semibold text-primary uppercase tracking-wider">Monthly Pro</span>
                <span className="px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-medium">Most Flexible</span>
              </div>
              <div className="mb-space-lg">
                <div className="flex items-baseline gap-space-xs">
                  <span className="text-headline-lg font-headline-lg text-on-surface">$20.00</span>
                  <span className="text-body-md text-on-surface-variant">/ month</span>
                </div>
                <p className="text-body-md text-on-surface-variant mt-space-sm">Full professional feature set billed on a predictable monthly schedule.</p>
              </div>
              <div className="space-y-space-md mb-space-xl">
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Unlimited subscription tracking</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Instant SMS &amp; Email alerts</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Automated cancellation concierge</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Advanced spending analytics &amp; export</span>
                </div>
              </div>
            </div>
            <div className="w-full py-space-md px-space-lg rounded-lg bg-surface-container-high text-on-surface font-medium text-center opacity-80 cursor-default">
              Current Plan
            </div>
          </div>

          {/* Yearly Plan Card */}
          <div className="flex flex-col justify-between p-space-xl rounded-xl bg-surface-container-low shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="absolute top-0 right-0 bg-secondary text-on-secondary text-label-sm font-semibold px-space-lg py-space-xs rounded-bl-xl tracking-wider uppercase">
              Best Value
            </div>
            <div>
              <div className="flex justify-between items-center mb-space-lg">
                <span className="text-label-lg font-semibold text-secondary uppercase tracking-wider">Yearly Scale</span>
                <span className="px-space-md py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-medium">Save 17%</span>
              </div>
              <div className="mb-space-lg">
                <div className="flex items-baseline gap-space-xs">
                  <span className="text-headline-lg font-headline-lg text-on-surface">$200.00</span>
                  <span className="text-body-md text-on-surface-variant">/ year</span>
                </div>
                <p className="text-body-md text-on-surface-variant mt-space-sm">Maximum savings for power users and growing enterprises.</p>
              </div>
              <div className="space-y-space-md mb-space-xl">
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Everything in Monthly Pro</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Priority 24/7 concierge support</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Custom category tagging &amp; budgets</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Dedicated account manager</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full py-space-md px-space-lg rounded-lg bg-primary text-on-primary font-medium hover:bg-primary-container transition-colors flex items-center justify-center gap-space-sm shadow-sm"
              onClick={() => setProrationVisible(true)}
            >
              <span>Upgrade to Yearly</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Interactive Proration Callout */}
        {prorationVisible && (
          <div className="transition-all duration-300 mb-space-xl" id="proration-callout">
            <div className="p-space-xl rounded-xl bg-surface-container-highest shadow-xl border-0 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full pointer-events-none blur-2xl"></div>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-space-lg mb-space-lg">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-xs">
                    <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Mid-Cycle Proration Calculation</h3>
                  </div>
                  <p className="text-body-md text-on-surface-variant">
                    Switching from Monthly Pro to Yearly Scale today. Here is how your billing breaks down:
                  </p>
                </div>
                <button
                  className="text-on-surface-variant hover:text-on-surface p-space-xs rounded-full hover:bg-surface-container transition-colors"
                  type="button"
                  onClick={() => setProrationVisible(false)}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-margin mb-space-xl">
                <div className="p-space-lg rounded-lg bg-surface-container-low flex flex-col justify-between">
                  <span className="text-label-md text-on-surface-variant uppercase tracking-wider mb-space-sm">Current Plan Credit</span>
                  <div>
                    <div className="text-headline-sm text-on-surface">
                      ${(proration.unusedCredit / 100).toFixed(2)}
                    </div>
                    <div className="text-body-sm text-on-surface-variant mt-space-xs">20 days remaining on $20/mo cycle</div>
                  </div>
                </div>
                <div className="p-space-lg rounded-lg bg-surface-container-low flex flex-col justify-between">
                  <span className="text-label-md text-on-surface-variant uppercase tracking-wider mb-space-sm">New Plan Charge</span>
                  <div>
                    <div className="text-headline-sm text-on-surface">$200.00</div>
                    <div className="text-body-sm text-on-surface-variant mt-space-xs">Annual billing (saves $40/yr)</div>
                  </div>
                </div>
                <div className="p-space-lg rounded-lg bg-primary text-on-primary flex flex-col justify-between shadow-sm">
                  <span className="text-label-md text-on-primary-container uppercase tracking-wider mb-space-sm">Net Immediate Due</span>
                  <div>
                    <div className="text-headline-sm text-on-primary">
                      ${(proration.netAmountDue / 100).toFixed(2)}
                    </div>
                    <div className="text-body-sm text-on-primary-container mt-space-xs">Charged securely upon confirmation</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-end gap-space-md">
                <button
                  type="button"
                  className="w-full sm:w-auto px-space-lg py-space-md rounded-lg bg-surface-container text-on-surface font-medium hover:bg-surface-container-high transition-colors"
                  onClick={() => setProrationVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto px-space-xl py-space-md rounded-lg bg-secondary text-on-secondary font-medium hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-space-sm shadow-sm"
                  onClick={() => initiateCheckout("yearly", proration.netAmountDue, true)}
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>
                    Confirm &amp; Secure Checkout (${(proration.netAmountDue / 100).toFixed(2)})
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info / FAQ Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-margin">
          <div className="p-space-xl rounded-xl bg-surface-container-low shadow-sm">
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="material-symbols-outlined text-primary text-[24px]">help</span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">How does proration work?</h4>
            </div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              When you change plans mid-cycle, our system automatically calculates the unused portion of your current billing period and applies it as a direct credit toward your new subscription tier. You will only be billed the net difference immediately. All math runs on exact whole-cent integer arithmetic with zero floating-point drift.
            </p>
          </div>
          <div className="p-space-xl rounded-xl bg-surface-container-low shadow-sm">
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">Secure Payment &amp; Guarantee</h4>
            </div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              All transactions are processed through enterprise-grade encrypted channels compliant with PCI-DSS standards. Enjoy a 14-day money-back guarantee on all yearly upgrades if you are not fully satisfied.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}