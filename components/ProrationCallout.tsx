"use client";

import React from "react";
import { formatCurrencyFromMinorUnits } from "@/lib/proration";

interface ProrationCalloutProps {
  currentPlanMinorUnits: number;
  newPlanMinorUnits: number;
  unusedCredit: number;
  netAmountDue: number;
  daysRemaining: number;
  totalDays: number;
}

export function ProrationCallout({
  currentPlanMinorUnits,
  newPlanMinorUnits,
  unusedCredit,
  netAmountDue,
  daysRemaining,
  totalDays,
}: ProrationCalloutProps) {
  return (
    <div className="mt-[var(--spacing-4)] rounded-[var(--radius-lg)] border border-[var(--color-primary-container-color)] bg-[var(--color-surface-container-low-color)] p-[var(--spacing-4)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center space-x-2 text-[var(--color-primary-color)] font-semibold text-[var(--typography-font-size-base)]">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Mid-Cycle Upgrade Proration Applied</span>
      </div>

      <p className="mt-[var(--spacing-2)] text-[var(--typography-font-size-sm)] text-[var(--color-on-surface-color)]">
        You have{" "}
        <span className="font-semibold">{daysRemaining} days</span> remaining in your current monthly billing period ({totalDays} days total). Your unused time is credited directly toward your new plan with zero floating-point drift.
      </p>

      {/* Itemized Calculation Summary */}
      <div className="mt-[var(--spacing-3)] space-y-2 border-t border-[var(--color-outline-variant-color)] pt-[var(--spacing-3)] text-[var(--typography-font-size-sm)]">
        <div className="flex justify-between">
          <span className="text-[var(--color-surface-variant-color)]">
            New Yearly Plan:
          </span>
          <span className="font-mono font-medium text-[var(--color-on-surface-color)]">
            {formatCurrencyFromMinorUnits(newPlanMinorUnits)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[var(--color-secondary-color)]">
            Less Unused Monthly Credit ({daysRemaining}/{totalDays} days):
          </span>
          <span className="font-mono font-medium text-[var(--color-secondary-color)]">
            -{formatCurrencyFromMinorUnits(unusedCredit)}
          </span>
        </div>

        <div className="flex justify-between border-t border-[var(--color-outline-variant-color)] pt-2 text-[var(--typography-font-size-base)] font-bold">
          <span className="text-[var(--color-on-surface-color)]">
            Net Charge Due Today:
          </span>
          <span className="font-mono text-[var(--color-primary-color)]">
            {formatCurrencyFromMinorUnits(netAmountDue)}
          </span>
        </div>
      </div>
    </div>
  );
}
