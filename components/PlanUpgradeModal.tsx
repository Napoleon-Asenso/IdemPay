"use client";

import React from "react";

/**
 * Shown when a user with an ACTIVE plan that is already scheduled for
 * cancellation tries to subscribe to another paid plan. It surfaces the
 * running plan and its exhaustion date, then lets the user either
 * (a) approve the new plan to start only after the running plan exhausts
 *     (no charge today, no double billing), or
 * (b) start now via a prorated checkout that credits the unused portion.
 */
interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanName: string;
  periodEndLabel: string;
  targetPlanName: string;
  targetPlanPriceLabel: string;
  proratedDueLabel: string;
  fullPriceLabel: string;
  queueing: boolean;
  onQueueAfterEnd: () => void;
  onStartNowProrated: () => void;
}

export function PlanUpgradeModal({
  isOpen,
  onClose,
  currentPlanName,
  periodEndLabel,
  targetPlanName,
  targetPlanPriceLabel,
  proratedDueLabel,
  fullPriceLabel,
  queueing,
  onQueueAfterEnd,
  onStartNowProrated,
}: PlanUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-space-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-space-lg">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[1.125rem]">event_repeat</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Switching to {targetPlanName}
            </h3>
          </div>
          <button className="text-text-muted hover:text-on-surface" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Running plan context — always shown before allowing a new purchase */}
        <div className="rounded-xl bg-surface-container-low ring-1 ring-outline-variant/50 p-space-lg mb-space-lg">
          <div className="flex items-center gap-space-md mb-space-sm">
            <span className="material-symbols-outlined text-primary text-[1.125rem]">workspace_premium</span>
            <span className="font-label-lg text-label-lg text-on-surface">Your current plan is still running</span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            <strong className="text-on-surface">{currentPlanName}</strong> is active and scheduled for
            cancellation. You keep full access until{" "}
            <strong className="text-on-surface">{periodEndLabel}</strong>. Adding{" "}
            <strong className="text-on-surface">{targetPlanName}</strong> now would otherwise double-charge
            you for overlapping periods.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-lg mb-space-lg">
          <button
            type="button"
            disabled={queueing}
            onClick={onQueueAfterEnd}
            className="text-left rounded-xl border-2 border-primary bg-primary-container/40 hover:bg-primary-container p-space-lg transition-colors flex flex-col gap-space-sm"
          >
            <span className="material-symbols-outlined text-primary text-[1.375rem]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            <span className="font-label-lg text-label-lg text-on-surface">
              Add {targetPlanName} after this plan ends
            </span>
            <span className="text-body-sm text-on-surface-variant">
              No charge today. Starts automatically on {periodEndLabel} and runs for{" "}
              {targetPlanPriceLabel}.
            </span>
            <span className="text-label-sm text-primary mt-space-xs">
              {queueing ? "Approving..." : "Approve — Recommended"}
            </span>
          </button>

          <button
            type="button"
            disabled={queueing}
            onClick={onStartNowProrated}
            className="text-left rounded-xl border-2 border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low p-space-lg transition-colors flex flex-col gap-space-sm"
          >
            <span className="material-symbols-outlined text-primary text-[1.375rem]">bolt</span>
            <span className="font-label-lg text-label-lg text-on-surface">
              Start {targetPlanName} now
            </span>
            <span className="text-body-sm text-on-surface-variant">
              Prorated charge of {proratedDueLabel} (full {fullPriceLabel}, credited for your
              remaining days).
            </span>
            <span className="text-label-sm text-on-surface-variant mt-space-xs">
              Pay {proratedDueLabel} today
            </span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="px-space-lg py-space-sm rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-lg"
            onClick={onClose}
          >
            Keep my current plan
          </button>
        </div>
      </div>
    </div>
  );
}