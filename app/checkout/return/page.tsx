"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PLANS } from "@/types";

function planDisplayName(interval?: string | null): string | null {
  if (interval === "monthly" || interval === "yearly") return PLANS[interval].name;
  return null;
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams();

  const txRef = searchParams.get("tx_ref") || "";
  const transactionId = searchParams.get("transaction_id") || "";
  const redirectStatus = searchParams.get("status") || "";
  const userId = searchParams.get("userId") || "usr_test_default";

  const [status, setStatus] = useState<"confirming" | "success" | "pending" | "cancelled">(
    "confirming"
  );
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      status === "success"
        ? "Payment Confirmed | IdemPay"
        : status === "cancelled"
        ? "Payment Not Completed | IdemPay"
        : "Confirming Payment | IdemPay";
  }, [status]);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      if (transactionId && txRef) {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, txRef, transactionId }),
        });
        const data = await res.json();
        if (res.ok && data.confirmed) {
          const interval = data.subscription?.plan_interval;
          const name = planDisplayName(interval);
          if (name) setPlanName(name);
          setStatus("success");
          return true;
        }
      }
    } catch (e) {
      console.error("Confirmation error:", e);
    }

    try {
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok && data.hasActiveSubscription) {
        const name = planDisplayName(data.subscription?.plan_interval);
        if (name) setPlanName(name);
        setStatus("success");
        return true;
      }
    } catch (e) {
      console.error("Status polling error:", e);
    }

    return false;
  }, [transactionId, txRef, userId]);

  useEffect(() => {
    if (redirectStatus === "cancelled" || redirectStatus === "failed") {
      setStatus("cancelled");
      return;
    }

    let cancelled = false;
    (async () => {
      const ok = await checkStatus();
      if (!ok && !cancelled) setStatus("pending");
    })();
    return () => {
      cancelled = true;
    };
  }, [checkStatus, redirectStatus]);

  const isSuccess = status === "success";
  const isPending = status === "pending";
  const isCancelled = status === "cancelled";
  const isConfirming = status === "confirming";

  return (
    <div className="w-full px-space-md sm:px-space-lg md:px-page-x py-margin">
      <div className="flex flex-col w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-xl items-center bg-surface p-space-md sm:p-space-lg-xl rounded-2xl shadow-md relative overflow-hidden">
          <div className="md:col-span-7 flex flex-col gap-space-lg relative z-10 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-space-sm min-w-0">
              <span className="shrink-0 px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm">
                {isSuccess ? "Payment Completed" : "Order Reference"}
              </span>
              <span className="min-w-0 max-w-full truncate px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface-variant text-label-sm font-label-sm">
                #{txRef.replace(/tx_?/, "")}
              </span>
            </div>

            {/* Confirming state */}
            {isConfirming && (
              <div className="flex flex-col gap-space-lg w-full min-w-0">
                <h1 className="w-full max-w-full break-words font-headline-lg text-[clamp(1.5rem,1.25rem+2.5vw,3rem)] leading-[1.15] tracking-[clamp(-0.025em,calc(-0.005em_-_0.002vw),-0.005em)] text-on-surface [text-wrap:balance]">
                  Confirming your payment
                </h1>
                <p className="w-full max-w-full break-words text-body-lg text-on-surface-variant max-w-2xl [text-wrap:balance]">
                  Please wait a moment while we finalize your subscription.
                </p>
                <div className="flex items-center gap-space-md py-space-sm">
                  <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <span className="font-label-lg text-label-lg text-on-surface">
                    Processing…
                  </span>
                </div>
              </div>
            )}

            {/* Success state */}
            {isSuccess && (
              <div className="flex flex-col gap-space-lg w-full min-w-0">
                <h1 className="w-full max-w-full break-words font-headline-lg text-[clamp(1.5rem,1.25rem+2.5vw,3rem)] leading-[1.15] tracking-[clamp(-0.025em,calc(-0.005em_-_0.002vw),-0.005em)] text-on-surface [text-wrap:balance]">
                  Payment Confirmed!
                </h1>
                <p className="w-full max-w-full break-words text-body-lg text-on-surface-variant max-w-2xl [text-wrap:balance]">
                  Your payment was successful and your{" "}
                  {planName ? <strong className="text-on-surface">{planName}</strong> : "plan"} has
                  been activated. Welcome aboard!
                </p>
                <div className="p-space-md sm:p-space-lg bg-secondary-container/30 rounded-xl flex items-start gap-space-md">
                  <span
                    className="material-symbols-outlined text-secondary text-[1.5rem] mt-space-2xs shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <div className="flex flex-col gap-space-xs min-w-0">
                    <span className="font-label-lg text-label-lg text-on-surface">
                      {planName ? `${planName} activated` : "Plan activated"}
                    </span>
                    <span className="text-body-md text-on-surface-variant break-words">
                      {planName
                        ? `Your ${planName} plan is ready to use.`
                        : "Your upgraded plan is ready to use."}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                  <Link
                    href="/?view=billing"
                    className="flex items-center justify-center gap-space-sm px-space-xl py-space-md bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-[1.125rem]">dashboard</span>
                    <span>Go to Billing Dashboard</span>
                  </Link>
                  <Link
                    href="/?view=plans"
                    className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
                  >
                    Back to Plans
                  </Link>
                </div>
              </div>
            )}

            {/* Pending state */}
            {isPending && (
              <div className="flex flex-col gap-space-lg w-full min-w-0">
                <h1 className="w-full max-w-full break-words font-headline-lg text-[clamp(1.5rem,1.25rem+2.5vw,3rem)] leading-[1.15] tracking-[clamp(-0.025em,calc(-0.005em_-_0.002vw),-0.005em)] text-on-surface [text-wrap:balance]">
                  Almost there
                </h1>
                <p className="w-full max-w-full break-words text-body-lg text-on-surface-variant max-w-2xl [text-wrap:balance]">
                  We received your payment and are finishing the final steps to activate your plan.
                </p>
                <div className="flex flex-wrap items-center gap-space-md">
                  <button
                    type="button"
                    className="px-space-xl py-space-md bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
                    onClick={async () => {
                      setStatus("confirming");
                      const ok = await checkStatus();
                      if (!ok) setStatus("pending");
                    }}
                  >
                    Check Payment Status
                  </button>
                  <Link
                    href="/?view=billing"
                    className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
                  >
                    Go to Billing
                  </Link>
                </div>
              </div>
            )}

            {/* Cancelled / failed state */}
            {isCancelled && (
              <div className="flex flex-col gap-space-lg w-full min-w-0">
                <h1 className="w-full max-w-full break-words font-headline-lg text-[clamp(1.5rem,1.25rem+2.5vw,3rem)] leading-[1.15] tracking-[clamp(-0.025em,calc(-0.005em_-_0.002vw),-0.005em)] text-on-surface [text-wrap:balance]">
                  Payment not completed
                </h1>
                <p className="w-full max-w-full break-words text-body-lg text-on-surface-variant max-w-2xl [text-wrap:balance]">
                  No charges were made. You can choose a plan again whenever you&apos;re ready.
                </p>
                <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                  <Link
                    href="/?view=plans"
                    className="flex items-center justify-center gap-space-sm px-space-xl py-space-md bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-[1.125rem]">grid_view</span>
                    <span>Choose a Plan</span>
                  </Link>
                  <Link
                    href="/?view=billing"
                    className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
                  >
                    Go to Billing
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-5 flex flex-col items-center justify-center relative z-10 min-w-0">
            <div className="w-full max-w-xs min-w-0 bg-surface-container-lowest p-space-md sm:p-space-lg-xl rounded-2xl shadow-xl flex flex-col items-center text-center gap-space-md">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner shrink-0 ${
                  isSuccess
                    ? "bg-secondary-container text-on-secondary-container"
                    : isCancelled
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary-fixed text-on-primary-fixed"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[2.25rem] ${isConfirming ? "animate-spin" : ""}`}
                  style={isSuccess ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {isSuccess ? "verified" : isCancelled ? "close" : "sync"}
                </span>
              </div>
              <div className="flex flex-col gap-space-xs w-full min-w-0">
                <h3 className="font-headline-sm text-headline-sm text-on-surface break-words">
                  {isSuccess
                    ? "Payment Confirmed"
                    : isCancelled
                    ? "Payment Cancelled"
                    : isPending
                    ? "Processing"
                    : "Confirming Payment"}
                </h3>
                <p className="text-body-sm text-on-surface-variant break-words">
                  {isSuccess
                    ? planName
                      ? `Your ${planName} plan is now active.`
                      : "Your plan is now active."
                    : isCancelled
                    ? "Your payment was not completed."
                    : "Please wait a moment."}
                </p>
              </div>
              {txRef && (
                <div className="w-full bg-surface-container py-space-sm px-space-sm-md rounded-lg flex items-center justify-between gap-space-sm text-body-sm">
                  <span className="shrink-0 text-text-muted">Transaction ID</span>
                  <span className="font-medium text-on-surface min-w-0 truncate">
                    #{txRef.replace(/tx_?/, "")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}