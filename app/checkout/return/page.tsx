"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txRef = searchParams.get("tx_ref") || "";
  const userId = searchParams.get("userId") || "usr_test_default";

  // Polling state: max 15 attempts (30s) at 2s interval
  const [attemptCount, setAttemptCount] = useState(0);
  const [status, setStatus] = useState<"polling" | "success" | "timeout">("polling");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const maxAttempts = 15;
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (res.ok && data.hasActiveSubscription) {
        setSubscriptionData(data.subscription);
        setStatus("success");
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        return true;
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
    return false;
  }, [userId]);

  useEffect(() => {
    // Initial check
    checkStatus();

    // Set up 2-second interval polling
    pollTimerRef.current = setInterval(async () => {
      setAttemptCount((prev) => {
        const next = prev + 1;
        if (next >= maxAttempts) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStatus("timeout");
        }
        return next;
      });

      await checkStatus();
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkStatus]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-lowest-color)] p-[var(--spacing-8)] shadow-[var(--shadow-md)] text-center">
        {/* State 1: Active Polling (Zero-Trust) */}
        {status === "polling" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary-container-color)]">
              <svg
                className="h-8 w-8 animate-spin text-[var(--color-on-secondary-container-color)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>

            <h2 className="mt-6 text-[var(--typography-font-size-xl)] font-bold text-[var(--color-on-surface-color)]">
              Confirming Payment Entitlement...
            </h2>

            <p className="mt-2 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
              Waiting for cryptographic server-to-server webhook confirmation. Do not close this window.
            </p>

            <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low-color)] p-3 text-[var(--typography-font-size-xs)] text-[var(--color-surface-variant-color)]">
              <div>
                Transaction Ref: <span className="font-mono font-bold">{txRef || "Pending"}</span>
              </div>
              <div className="mt-1">
                Attempt {attemptCount + 1} of {maxAttempts} (Polling every 2s)
              </div>
            </div>
          </>
        )}

        {/* State 2: Confirmed Server Provisioning (Success) */}
        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary-container-color)] text-[var(--color-on-secondary-container-color)]">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-[var(--typography-font-size-xl)] font-bold text-[var(--color-on-surface-color)]">
              Payment & Subscription Confirmed!
            </h2>

            <p className="mt-2 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
              Your account has been granted active access to the{" "}
              <span className="font-semibold capitalize text-[var(--color-on-surface-color)]">
                {subscriptionData?.plan_interval || "active"}
              </span>{" "}
              plan via verified server webhook.
            </p>

            <div className="mt-6 flex flex-col space-y-3">
              <Link
                href="/billing"
                className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary-color)] py-2.5 font-semibold text-[var(--color-on-primary-color)] hover:opacity-90 transition-opacity"
              >
                Go to Billing Dashboard
              </Link>
              <Link
                href="/plans"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline-variant-color)] py-2 text-[var(--typography-font-size-sm)] font-medium text-[var(--color-on-surface-color)] hover:bg-[var(--color-surface-container-low-color)]"
              >
                View Plans
              </Link>
            </div>
          </>
        )}

        {/* State 3: Polling Timeout (15 attempts reached) */}
        {status === "timeout" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-tertiary-container-color)] text-[var(--color-on-tertiary-container-color)]">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-[var(--typography-font-size-xl)] font-bold text-[var(--color-on-surface-color)]">
              Verification In Progress
            </h2>

            <p className="mt-2 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
              The payment gateway has received your transaction, but server-to-server confirmation is taking longer than expected.
            </p>

            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low-color)] p-3 text-left text-[var(--typography-font-size-xs)]">
              <span className="font-semibold text-[var(--color-on-surface-color)]">Zero-Trust Notice:</span> We do not unlock features until Flutterwave transmits the cryptographic webhook signature. Your account will automatically update as soon as delivery finishes.
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <button
                type="button"
                onClick={() => {
                  setAttemptCount(0);
                  setStatus("polling");
                }}
                className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary-color)] py-2.5 font-semibold text-[var(--color-on-primary-color)] hover:opacity-90"
              >
                Check Status Again
              </button>

              <Link
                href="/billing"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline-variant-color)] py-2 text-[var(--typography-font-size-sm)] font-medium text-[var(--color-on-surface-color)] hover:bg-[var(--color-surface-container-low-color)]"
              >
                Proceed to Billing History
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-secondary-color)] border-t-transparent"></div>
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}

