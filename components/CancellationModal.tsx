"use client";

import React, { useState } from "react";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  currentPeriodEnd: string | null;
}

const CANCELLATION_REASONS = [
  "Too Expensive",
  "Missing Features",
  "Temporary Break",
  "Switched to Alternative",
  "Other",
];

export function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  currentPeriodEnd,
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalReason =
        selectedReason === "Other" && otherText.trim()
          ? `Other: ${otherText.trim()}`
          : selectedReason;

      await onConfirm(finalReason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-lowest-color)] p-[var(--spacing-6)] shadow-[var(--shadow-xl)]">
        <h3 className="text-[var(--typography-font-size-xl)] font-bold text-[var(--color-on-surface-color)]">
          Cancel Subscription
        </h3>

        <p className="mt-2 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
          We are sorry to see you go. If you cancel, your account will remain{" "}
          <strong className="text-[var(--color-on-surface-color)]">Active</strong> with full access until the end of your paid billing cycle on{" "}
          <strong className="text-[var(--color-on-surface-color)]">
            {currentPeriodEnd
              ? new Date(currentPeriodEnd).toLocaleDateString()
              : "period end"}
          </strong>
          .
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[var(--typography-font-size-xs)] font-bold uppercase tracking-wider text-[var(--color-surface-variant-color)]">
              Reason for Cancellation (Optional)
            </label>
            <div className="mt-2 space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center space-x-2 text-[var(--typography-font-size-sm)] text-[var(--color-on-surface-color)] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-[var(--color-primary-color)] focus:ring-[var(--color-primary-color)]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Other" && (
            <div>
              <textarea
                placeholder="Tell us what we could improve..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-low-color)] p-2 text-[var(--typography-font-size-sm)] text-[var(--color-on-surface-color)] focus:border-[var(--color-primary-color)] focus:outline-none"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3 border-t border-[var(--color-outline-variant-color)] pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-[var(--radius-md)] px-4 py-2 text-[var(--typography-font-size-sm)] font-medium text-[var(--color-on-surface-color)] hover:bg-[var(--color-surface-container-low-color)]"
            >
              Keep Subscription
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-color)] px-4 py-2 text-[var(--typography-font-size-sm)] font-semibold text-[var(--color-on-tertiary-color)] hover:opacity-90"
            >
              {submitting ? "Canceling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
