"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrencyFromMinorUnits } from "@/lib/proration";

function CheckoutHandoffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get("plan") || "monthly";
  const amountStr = searchParams.get("amount") || "2000";
  const userId = searchParams.get("userId") || "usr_test_default";
  const isUpgrade = searchParams.get("isUpgrade") === "true";

  const amountInMinorUnits = parseInt(amountStr, 10) || 2000;

  const [statusText, setStatusText] = useState("Preparing secure checkout session...");
  const [error, setError] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;

    async function initiateHandoff() {
      try {
        setStatusText("Creating payment intent and transaction reference...");

        const res = await fetch("/api/checkout/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            planInterval: plan,
            amountInMinorUnits,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to initiate checkout");
        }

        setStatusText("Redirecting to Flutterwave Secure Checkout...");

        // Auto-redirect to gateway or return view within 1.5 seconds per PRD mandate
        setTimeout(() => {
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            router.push(data.redirectUrl || `/checkout/return?tx_ref=${data.txRef}`);
          }
        }, 1500);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    }

    initiateHandoff();
  }, [plan, amountInMinorUnits, userId, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-lowest-color)] p-[var(--spacing-8)] shadow-[var(--shadow-md)] text-center">
        {/* Animated Loading Ring */}
        {!error ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-container-color)]">
              <svg
                className="h-8 w-8 animate-spin text-[var(--color-primary-color)]"
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

            <h2 className="mt-6 text-[var(--typography-font-size-xl)] font-bold tracking-tight text-[var(--color-on-surface-color)]">
              {statusText}
            </h2>

            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low-color)] p-4 text-left text-[var(--typography-font-size-sm)]">
              <div className="flex justify-between py-1">
                <span className="text-[var(--color-surface-variant-color)]">Plan Tier:</span>
                <span className="font-semibold capitalize text-[var(--color-on-surface-color)]">
                  {plan} {isUpgrade && "(Upgrade)"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-[var(--color-outline-variant-color)]">
                <span className="text-[var(--color-surface-variant-color)]">Total Due:</span>
                <span className="font-mono font-bold text-[var(--color-primary-color)]">
                  {formatCurrencyFromMinorUnits(amountInMinorUnits)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[var(--typography-font-size-xs)] text-[var(--color-surface-variant-color)]">
              Zero-Trust Protection: Card details are never collected or stored on our servers. You are transitioning directly to Flutterwave PCI-DSS Level 1 compliant hosted checkout.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-tertiary-container-color)] text-[var(--color-on-tertiary-container-color)] font-bold text-xl">
              !
            </div>
            <h3 className="mt-4 text-[var(--typography-font-size-lg)] font-bold text-[var(--color-on-surface-color)]">
              Initiation Error
            </h3>
            <p className="mt-2 text-[var(--typography-font-size-sm)] text-[var(--color-surface-variant-color)]">
              {error}
            </p>
            <button
              onClick={() => router.push("/plans")}
              className="mt-6 inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary-color)] px-4 py-2 text-[var(--typography-font-size-sm)] font-medium text-[var(--color-on-primary-color)] hover:opacity-90"
            >
              Return to Plans
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutHandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary-color)] border-t-transparent"></div>
        </div>
      }
    >
      <CheckoutHandoffContent />
    </Suspense>
  );
}

