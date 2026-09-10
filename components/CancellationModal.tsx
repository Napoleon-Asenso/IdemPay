"use client";

import React, { useEffect, useState } from "react";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  currentPeriodEnd: string | null;
}

const CANCELLATION_REASONS = [
  "Too Expensive",
  "Missing Features",
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [isOpen]);

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

  const periodEndLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "period end";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-surface-container-lowest rounded-xl p-space-xl max-w-lg w-full mx-gutter shadow-2xl transform transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-space-lg">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Cancel Subscription</h3>
          </div>
          <button className="text-text-muted hover:text-on-surface" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-body-md text-text-muted mb-space-lg">
          We&apos;re sorry to see you go. Your subscription will be set to{" "}
          <code className="font-mono bg-surface-container-low px-1 rounded text-primary">
            cancel_at_period_end = true
          </code>
          . You will retain full access to all features until the end of your billing cycle on{" "}
          <strong className="text-on-surface">{periodEndLabel}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-space-lg">
            <label className="block text-label-lg font-label-lg text-on-surface mb-space-sm">
              Please share why you are canceling (optional):
            </label>
            <div className="space-y-space-sm">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-space-md p-space-md rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <input
                    className="text-primary focus:ring-primary h-4 w-4"
                    name="cancel_reason"
                    type="radio"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span className="text-body-md text-on-surface">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Other" && (
            <div className="mb-space-lg">
              <textarea
                placeholder="Tell us what we could improve..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full rounded-lg bg-surface-container-low p-3 text-body-md text-on-surface placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-space-md">
            <button
              type="button"
              disabled={submitting}
              className="bg-surface-container-low hover:bg-surface-container text-on-surface px-space-md py-space-sm rounded-lg font-label-lg transition-all"
              onClick={onClose}
            >
              Keep Subscription
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-error text-on-error hover:opacity-90 px-space-md py-space-sm rounded-lg font-label-lg transition-all shadow-md"
            >
              {submitting ? "Canceling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}