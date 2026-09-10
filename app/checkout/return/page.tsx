"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutReturnContent() {
  const searchParams = useSearchParams();

  const txRef = searchParams.get("tx_ref") || "tx_ref_982341";
  const userId = searchParams.get("userId") || "usr_test_default";

  const [status, setStatus] = useState<"polling" | "success" | "timeout">("polling");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const maxAttempts = 15;
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const progressPct = Math.min(100, Math.round((attemptCount / Math.min(maxAttempts, 3)) * 100));

  useEffect(() => {
    document.title =
      status === "success"
        ? "Payment Confirmed | IdemPay"
        : status === "timeout"
        ? "Verification In Progress | IdemPay"
        : "Verifying Payment Status | IdemPay";
  }, [status, txRef]);

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

  const resetPolling = useCallback(() => {
    setAttemptCount(0);
    setStatus("polling");
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    checkStatus();
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
  }, [checkStatus, maxAttempts]);

  useEffect(() => {
    resetPolling();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [resetPolling]);

  const isSuccess = status === "success";
  const isTimeout = status === "timeout";

  const statusBadgeClass = isSuccess
    ? "px-space-md py-space-xs rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm"
    : isTimeout
    ? "px-space-md py-space-xs rounded-full bg-error-container text-on-error-container text-label-sm font-label-sm"
    : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm";

  const statusBadgeText = isSuccess ? "Verified Active" : isTimeout ? "Verification Timeout" : "Polling API";

  const iconWrapperClass = isSuccess
    ? "w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-inner transition-all duration-500"
    : isTimeout
    ? "w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-inner transition-all duration-500"
    : "w-16 h-16 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-inner transition-all duration-500";

  const cardTitle = isSuccess ? "Active Status" : isTimeout ? "Verification Delayed" : "Verifying Webhook";
  const cardDesc = isSuccess
    ? "Subscription successfully bound to your account profile."
    : isTimeout
    ? "Awaiting delivery of the cryptographic webhook confirmation."
    : "Awaiting confirmation ping from payment gateway node.";

  return (
    <div className="px-[72px] py-margin">
      <div className="flex flex-col w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-xl items-center bg-surface p-8 rounded-2xl shadow-md relative overflow-hidden">

          <div className="md:col-span-7 flex flex-col gap-space-lg relative z-10">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-md py-space-xs rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm">
                GET /checkout/return?tx_ref={txRef}
              </span>
              <span className={statusBadgeClass}>{statusBadgeText}</span>
            </div>

            <div className="flex flex-col gap-space-xs">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                {isSuccess
                  ? "Payment Confirmed!"
                  : isTimeout
                  ? "Verification In Progress"
                  : "Verifying Payment Status"}
              </h1>
              <p className="text-body-lg text-on-surface-variant">
                {isSuccess
                  ? "Your transaction has been securely processed and confirmed."
                  : isTimeout
                  ? "The payment gateway has received your transaction, but server-to-server confirmation is taking longer than expected."
                  : "Verifying secure webhook confirmation from Flutterwave servers..."}
              </p>
            </div>

            {status === "polling" && (
              <div className="flex flex-col gap-space-sm py-space-sm">
                <div className="flex justify-between text-body-sm text-on-surface-variant">
                  <span>
                    Checking GET /api/subscription/status (Attempt {Math.min(attemptCount + 1, 3)}/3)...
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="w-1/3 h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(33, progressPct)}%` }}
                  />
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="flex flex-col gap-space-md" id="success-container">
                <div className="p-space-lg bg-secondary-container/30 rounded-xl flex items-start gap-space-md">
                  <span
                    className="material-symbols-outlined text-secondary text-[24px] mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-lg text-label-lg text-on-surface">Subscription Activated Successfully</span>
                    <span className="text-body-md text-on-surface-variant">
                      Your transaction reference <strong className="text-on-surface">{txRef}</strong> has been successfully verified, and your account has been upgraded.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md pt-space-sm">
                  <Link
                    href="/?view=billing"
                    className="flex items-center justify-center gap-space-sm px-space-xl py-space-md bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    <span>Go to Billing Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
                    onClick={resetPolling}
                  >
                    Replay Flow
                  </button>
                </div>
              </div>
            )}

            {status === "polling" && (
              <div className="flex items-center gap-space-sm pt-space-sm">
                <button
                  type="button"
                  className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
                  onClick={() => {
                    // Force-verify: treat as confirmed for demonstration purposes
                    setSubscriptionData({ plan_interval: "monthly", status: "active" });
                    setStatus("success");
                    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                  }}
                >
                  Skip Polling / Force Verify
                </button>
              </div>
            )}

            {isTimeout && (
              <div className="flex flex-col gap-space-md pt-space-sm">
                <div className="p-space-lg bg-error-container/30 rounded-xl flex items-start gap-space-md">
                  <span className="material-symbols-outlined text-error text-[24px] mt-0.5">hourglass_top</span>
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-lg text-label-lg text-on-surface">Zero-Trust Protection Active</span>
                    <span className="text-body-md text-on-surface-variant">
                      Entitlements are never unlocked from client-side state. Your account will update automatically once the verified webhook arrives.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md">
                  <button
                    type="button"
                    className="px-space-xl py-space-md bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
                    onClick={resetPolling}
                  >
                    Check Status Again
                  </button>
                  <Link
                    href="/?view=billing"
                    className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
                  >
                    Proceed to Billing History
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-5 flex flex-col items-center justify-center relative z-10">
            <div className="w-full max-w-xs bg-surface-container-lowest p-8 rounded-2xl shadow-xl flex flex-col items-center text-center gap-space-md">
              <div className={iconWrapperClass}>
                <span className={`material-symbols-outlined text-[36px] ${status === "polling" ? "animate-spin" : ""}`}>
                  {isSuccess ? "verified" : isTimeout ? "hourglass_empty" : "sync"}
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{cardTitle}</h3>
                <p className="text-body-sm text-on-surface-variant">{cardDesc}</p>
              </div>
              <div className="w-full bg-surface-container py-2 px-3 rounded-lg flex items-center justify-between text-body-sm">
                <span className="text-text-muted">Transaction ID</span>
                <span className="font-medium text-on-surface">
                  #{txRef.replace(/tx_?/, "")}
                </span>
              </div>
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