"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppView } from "@/components/AppView";
import { PLANS, PlanInterval } from "@/types";

const PLAN_TABS: { interval: PlanInterval; label: string }[] = [
  { interval: "free", label: "Starter" },
  { interval: "monthly", label: "Monthly" },
  { interval: "yearly", label: "Yearly" },
];

const PLAN_TIER: Record<PlanInterval, number> = {
  free: 0,
  monthly: 1,
  yearly: 2,
};

function normalizePlan(activePlan: string): PlanInterval {
  const lower = activePlan.toLowerCase();
  return lower === "monthly" || lower === "yearly" ? lower : "free";
}

export default function PlansView() {
  const router = useRouter();
  const { activePlan } = useAppView();

  const currentPlan = normalizePlan(activePlan);

  const [selected, setSelected] = useState<PlanInterval>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  const getPlanAction = (interval: PlanInterval) => {
    const diff = PLAN_TIER[interval] - PLAN_TIER[currentPlan];
    if (diff === 0) {
      return { label: "Current Plan", isCurrent: true, isUpgrade: false };
    }
    return diff > 0
      ? { label: `Get ${PLANS[interval].name}`, isCurrent: false, isUpgrade: true }
      : { label: `Downgrade to ${PLANS[interval].name}`, isCurrent: false, isUpgrade: false };
  };

  const renderAction = (interval: PlanInterval) => {
    const action = getPlanAction(interval);

    if (action.isCurrent) {
      return (
        <div className="w-full py-space-md px-space-lg rounded-lg bg-surface-container-high text-on-surface font-medium text-center opacity-80 cursor-default border-2 border-outline-variant">
          Current Plan
        </div>
      );
    }

    return (
      <button
        type="button"
        className="w-full py-space-md px-space-lg rounded-lg bg-primary text-on-primary font-medium hover:bg-primary-container transition-colors flex items-center justify-center gap-space-sm shadow-sm"
        onClick={() => {
          if (action.isUpgrade) {
            initiateCheckout(interval, PLANS[interval].priceInMinorUnits, true);
          } else {
            handleDowngrade(interval);
          }
        }}
      >
        <span>{action.label}</span>
        <span className="material-symbols-outlined text-[1.125rem]">arrow_forward</span>
      </button>
    );
  };

  const handleDowngrade = async (target: PlanInterval) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/subscription/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr_test_default", planInterval: target }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to downgrade plan");
      }
    } catch (err) {
      console.error("Failed to downgrade plan:", err);
      alert("Failed to downgrade plan");
    } finally {
      setIsProcessing(false);
    }
  };

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

  const cardClasses = (isActive: boolean) =>
    `flex flex-col justify-between p-space-xl rounded-xl relative overflow-hidden transition-all duration-300 ${
      isActive
        ? "bg-surface-container shadow-md border-2 border-primary hover:shadow-lg"
        : "bg-surface-container-low shadow-sm border-2 border-outline-variant opacity-80 hover:opacity-100 hover:shadow-md"
    }`;

  return (
    <div className="px-space-md sm:px-space-lg md:px-page-x py-margin">
      <div className="flex flex-col w-full">
        {/* Hero Text */}
        <div className="flex flex-col items-center text-center gap-space-sm mb-space-lg w-full">
          <h1 className="font-headline-lg text-[clamp(1.75rem,1.25rem+2.5vw,3rem)] leading-[1.15] tracking-[clamp(-0.025em,calc(-0.005em_-_0.002vw),-0.005em)] text-on-surface [text-wrap:balance]">
            Pricing Plans
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto w-full [text-wrap:balance]">
            Choose the right plan for your needs.
          </p>
        </div>

        {/* Segmented Plan Nav */}
        <div className="flex justify-center mb-space-xl">
          <div className="inline-flex items-center gap-space-xs p-space-xs bg-surface-container rounded-full shadow-sm">
            {PLAN_TABS.map((tab) => (
              <button
                key={tab.interval}
                type="button"
                className={`px-space-md sm:px-space-xl py-space-sm rounded-full font-label-lg transition-all ${
                  selected === tab.interval
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                onClick={() => setSelected(tab.interval)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-margin mb-space-xl">
          {/* Free Tier Card */}
          <div className={cardClasses(selected === "free")}>
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
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Up to 3 active subscriptions tracked</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Standard renewal alerts (Email)</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-outline text-[1.25rem]">cancel</span>
                  <span>Automated cancellation concierge</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-outline text-[1.25rem]">cancel</span>
                  <span>Advanced spending analytics</span>
                </div>
              </div>
            </div>
            {renderAction("free")}
          </div>

          {/* Monthly Plan Card */}
          <div className={cardClasses(selected === "monthly")}>
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
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Unlimited subscription tracking</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Instant SMS &amp; Email alerts</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Automated cancellation concierge</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Advanced spending analytics &amp; export</span>
                </div>
              </div>
            </div>
            {renderAction("monthly")}
          </div>

          {/* Yearly Plan Card */}
          <div className={cardClasses(selected === "yearly")}>
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
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Everything in Monthly Pro</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Priority 24/7 concierge support</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Custom category tagging &amp; budgets</span>
                </div>
                <div className="flex items-center gap-space-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Dedicated account manager</span>
                </div>
              </div>
            </div>
            {renderAction("yearly")}
          </div>
        </div>
      </div>
    </div>
  );
}