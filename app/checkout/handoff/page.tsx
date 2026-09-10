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

  const [statusText, setStatusText] = useState("Establishing secure tunnel...");
  const [statusSubtext, setStatusSubtext] = useState("Encrypting payload with TLS 1.3");
  const [txRef, setTxRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;

    async function initiateHandoff() {
      try {
        setStatusText("Creating payment intent and transaction reference...");
        setStatusSubtext("Encrypting payload with TLS 1.3");

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

        setTxRef(data.txRef || `tx_ref_982341`);
        setStatusText("Redirecting to Flutterwave Secure Checkout...");
        setStatusSubtext("Awaiting secure session handoff");

        // Auto-redirect to gateway within 1.5 seconds per PRD mandate
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
    <div className="max-w-7xl mx-auto p-margin">
      <div className="flex flex-col w-full">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">error</span>
            </div>
            <h2 className="mt-4 font-headline-md text-headline-md text-on-surface">Initiation Error</h2>
            <p className="mt-2 text-body-md text-text-muted max-w-md">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/plans")}
              className="mt-6 bg-primary text-on-primary px-space-lg py-space-md rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
            >
              Return to Plans
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-xl items-center bg-surface p-8 rounded-2xl shadow-md relative overflow-hidden">
            {/* Background decorative ambient blur */}
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-secondary-fixed-dim/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="md:col-span-7 flex flex-col gap-space-lg relative z-10">
              <div className="flex items-center gap-space-sm">
                <span className="px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-label-sm">
                  POST /api/checkout/initiate
                </span>
                <span className="px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm">
                  Ref: {txRef || "tx_ref_pending"}
                </span>
              </div>

              <div className="flex flex-col gap-space-xs">
                <h1 className="font-headline-lg text-headline-lg text-on-surface">Redirecting to Secure Checkout</h1>
                <p className="text-body-lg text-on-surface-variant">
                  Your session is being securely handed off to Flutterwave. Please do not close or refresh this window.
                </p>
              </div>

              <div className="flex items-center gap-space-md py-space-md">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                  <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface">{statusText}</span>
                  <span className="text-body-sm text-text-muted">{statusSubtext}</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-md p-space-lg bg-surface-container-low rounded-xl opacity-70 pointer-events-none">
                <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
                  <span>Subscription Plan</span>
                  <span className="font-medium text-on-surface">
                    {plan === "yearly" ? "Yearly Scale" : "Monthly Pro"} ({formatCurrencyFromMinorUnits(amountInMinorUnits)})
                  </span>
                </div>
                <div className="w-full h-[1px] bg-outline-variant/30"></div>
                <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
                  <span>Gateway Provider</span>
                  <span className="font-medium text-on-surface">Flutterwave Global</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col items-center justify-center relative z-10">
              <div className="w-full max-w-xs bg-surface-container-lowest p-8 rounded-2xl shadow-xl flex flex-col items-center text-center gap-space-md">
                <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-inner">
                  <span
                    className="material-symbols-outlined text-[36px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shield_locked
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">PCI-DSS Level 1</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    End-to-end tokenized processing protecting your financial instruments.
                  </p>
                </div>
                <div className="w-full bg-surface-container py-2 px-3 rounded-lg flex items-center justify-between text-body-sm">
                  <span className="text-text-muted">Status</span>
                  <span className="font-medium text-secondary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse" />
                    Ready
                  </span>
                </div>
              </div>
            </div>
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