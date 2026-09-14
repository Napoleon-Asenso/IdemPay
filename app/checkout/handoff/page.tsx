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

  const amountInMinorUnits = parseInt(amountStr, 10) || 2000;

  const [error, setError] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;

    async function initiateHandoff() {
      try {
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

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          router.push(data.redirectUrl || `/checkout/return?tx_ref=${data.txRef}`);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    }

    initiateHandoff();
  }, [plan, amountInMinorUnits, userId, router]);

  return (
    <div className="px-space-md sm:px-space-lg md:px-page-x py-margin">
      <div className="flex flex-col w-full">
        {error ? (
          <div className="flex flex-col items-center justify-center py-space-4xl text-center">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">error</span>
            </div>
            <h2 className="mt-space-md font-headline-md text-headline-md text-on-surface">Something went wrong</h2>
            <p className="mt-space-sm text-body-md text-text-muted max-w-md">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-space-lg bg-primary text-on-primary px-space-lg py-space-md rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
            >
              Return to Plans
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-space-4xl text-center">
            <div className="relative w-12 h-12 flex items-center justify-center mb-space-lg">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
              <span className="material-symbols-outlined text-primary text-[1.125rem]">lock</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Opening secure checkout
            </h1>
            <p className="text-body-md text-on-surface-variant mt-space-sm max-w-md">
              Please wait while we connect you to the payment page.
            </p>
          </div>
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <CheckoutHandoffContent />
    </Suspense>
  );
}