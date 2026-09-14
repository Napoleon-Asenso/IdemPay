"use client";

import React from "react";

interface ProrationCalloutProps {
  currentPlanMinorUnits: number;
  newPlanMinorUnits: number;
  unusedCredit: number;
  netAmountDue: number;
  daysRemaining: number;
  totalDays: number;
  onCancel?: () => void;
  onConfirm?: (() => void) | (() => Promise<void>);
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProrationCallout({
  newPlanMinorUnits,
  unusedCredit,
  netAmountDue,
  daysRemaining,
  onCancel,
  onConfirm,
}: ProrationCalloutProps) {
  return (
    <div className="transition-all duration-300 mb-space-xl">
      <div className="p-space-xl rounded-xl bg-surface-container-highest shadow-xl border-0 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-space-lg mb-space-lg">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="material-symbols-outlined text-primary text-[1.375rem]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Mid-Cycle Proration Calculation</h3>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Switching plans mid-cycle. Here is how your billing breaks down with exact whole-cent integer math.
            </p>
          </div>
          {onCancel && (
            <button className="text-on-surface-variant hover:text-on-surface p-space-xs rounded-full hover:bg-surface-container transition-colors" type="button" onClick={onCancel}>
              <span className="material-symbols-outlined text-[1.25rem]">close</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-margin mb-space-xl">
          <div className="p-space-lg rounded-lg bg-surface-container-low flex flex-col justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider mb-space-sm">Current Plan Credit</span>
            <div>
              <div className="text-headline-sm text-on-surface">{formatUsd(unusedCredit)}</div>
              <div className="text-body-sm text-on-surface-variant mt-space-xs">{daysRemaining} days remaining on current cycle</div>
            </div>
          </div>
          <div className="p-space-lg rounded-lg bg-surface-container-low flex flex-col justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider mb-space-sm">New Plan Charge</span>
            <div>
              <div className="text-headline-sm text-on-surface">{formatUsd(newPlanMinorUnits)}</div>
              <div className="text-body-sm text-on-surface-variant mt-space-xs">Annual billing (saves $40/yr)</div>
            </div>
          </div>
          <div className="p-space-lg rounded-lg bg-primary text-on-primary flex flex-col justify-between shadow-sm">
            <span className="text-label-md text-on-primary-container uppercase tracking-wider mb-space-sm">Net Immediate Due</span>
            <div>
              <div className="text-headline-sm text-on-primary">{formatUsd(netAmountDue)}</div>
              <div className="text-body-sm text-on-primary-container mt-space-xs">Charged securely upon confirmation</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-space-md">
          {onCancel && (
            <button type="button" className="w-full sm:w-auto px-space-lg py-space-md rounded-lg bg-surface-container text-on-surface font-medium hover:bg-surface-container-high transition-colors" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="w-full sm:w-auto px-space-xl py-space-md rounded-lg bg-secondary text-on-secondary font-medium hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-space-sm shadow-sm"
            onClick={onConfirm}
          >
            <span className="material-symbols-outlined text-[1.125rem]">lock</span>
            <span>Confirm &amp; Secure Checkout ({formatUsd(netAmountDue)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}