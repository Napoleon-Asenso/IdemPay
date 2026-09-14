import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface FlutterwaveTransaction {
  id: string;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string;
  meta?: { user_id?: string; plan_interval?: string } | null;
}

export interface FlutterwaveEvent {
  event?: string;
  data?: {
    id?: string | number;
    tx_ref?: string;
    amount?: number;
    amount_in_minor_units?: number;
    currency?: string;
    status?: string;
    payment_type?: string;
    subscription_id?: string | number;
    meta?: { user_id?: string; plan_interval?: string; payment_method?: string };
  };
}

export function getFlutterwaveSecret(): string | null {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret || secret.includes("REPLACE_WITH")) return null;
  return secret;
}

export function getFlutterwaveApiBase(): string {
  return process.env.FLUTTERWAVE_API_BASE || "https://api.flutterwave.com/v3";
}

/**
 * Server-to-server transaction verification.
 * Returns the verified transaction data, or null when the transaction
 * cannot be confirmed with Flutterwave.
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string
): Promise<FlutterwaveTransaction | null> {
  const secret = getFlutterwaveSecret();
  if (!secret) return null;

  const controller = new AbortController();
  const timeoutMs = 10000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `${getFlutterwaveApiBase()}/transactions/${encodeURIComponent(transactionId)}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    const body = await res.json().catch(() => null);
    if (!res.ok || body?.status !== "success" || !body?.data) return null;
    return body.data as FlutterwaveTransaction;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      logger.error({
        context: "Flutterwave:Verify",
        message: `Verification request timed out after ${timeoutMs}ms for ${transactionId}`,
      });
    } else {
      logger.error({
        context: "Flutterwave:Verify",
        message: `Verification request failed for ${transactionId}`,
        error,
      });
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Atomic, idempotent processing of a charge.completed event.
 * Inserts a payment_logs row (unique provider_event_id) and provisions the
 * subscription entitlement. Duplicate events are skipped safely.
 */
export async function processChargeEvent(
  event: FlutterwaveEvent
): Promise<{ status: "processed" | "duplicate" }> {
  const providerEventId = String(event.data?.id ?? event.id ?? "");
  const userId = event.data?.meta?.user_id;
  const planInterval = event.data?.meta?.plan_interval as "monthly" | "yearly" | undefined;

  const amountInMinorUnits =
    typeof event.data?.amount_in_minor_units === "number"
      ? Math.floor(event.data.amount_in_minor_units)
      : Math.floor((Number(event.data?.amount) || 0) * 100);

  const currency = event.data?.currency || "USD";
  const paymentMethod =
    event.data?.payment_type ||
    event.data?.meta?.payment_method ||
    "card";
  const isSuccessfulCharge =
    event.event === "charge.completed" && event.data?.status === "successful";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment_logs.create({
        data: {
          provider_event_id: providerEventId,
          user_id: userId ?? "",
          event_type: event.event || "charge.completed",
          amount_in_minor_units: amountInMinorUnits,
          currency,
          payment_method: paymentMethod,
          status: isSuccessfulCharge ? "successful" : event.event || "received",
          gateway: "flutterwave",
          transaction_id:
            typeof event.data?.id === "number" || typeof event.data?.id === "string"
              ? String(event.data.id)
              : null,
          payload_json: event,
        },
      });

      if (isSuccessfulCharge) {
        const interval = planInterval === "yearly" ? "yearly" : "monthly";
        const durationDays = interval === "yearly" ? 365 : 30;
        const periodStart = new Date();
        const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        await tx.subscriptions.upsert({
          where: { user_id: userId ?? "" },
          update: {
            plan_interval: interval,
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            cancellation_reason: null,
          },
          create: {
            user_id: userId ?? "",
            provider_subscription_id: String(event.data?.subscription_id || providerEventId),
            plan_interval: interval,
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
          },
        });
      }
    });

    return { status: "processed" };
  } catch (error: any) {
    if (error?.code === "P2002") {
      logger.info({
        context: "Flutterwave:Process",
        message: `Idempotent duplicate event skipped: ${providerEventId}`,
      });
      return { status: "duplicate" };
    }

    logger.error({
      context: "Flutterwave:Process",
      message: "Charge event processing failed",
      error,
    });
    throw error;
  }
}