"use client";

import React, { useEffect } from "react";

/**
 * Neutral status alert that auto-dismisses after `durationMs` (default 5s).
 * Used for payment/subscription outcomes (successful upgrade, downgrade,
 * cancellation, reactivation) with a calm surface design.
 */
interface StatusToastProps {
  message: string | null;
  onClose: () => void;
  durationMs?: number;
}

export function StatusToast({
  message,
  onClose,
  durationMs = 5000,
}: StatusToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [message, onClose, durationMs]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-margin left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl bg-surface-container-high text-on-surface shadow-lg ring-1 ring-outline-variant/60 px-space-lg py-space-md flex items-start gap-space-md transition-all"
    >
      <span
        className="material-symbols-outlined text-primary mt-space-2xs text-[1.25rem] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        check_circle
      </span>
      <span className="text-body-sm leading-snug font-medium">{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        className="ml-auto shrink-0 text-text-muted hover:text-on-surface transition-colors"
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-[1.125rem]">close</span>
      </button>
    </div>
  );
}