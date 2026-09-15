import { Prisma } from "@prisma/client";
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
  id?: string | number;
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
 * Derives an integer minor-unit amount from a Flutterwave payload. Prefers the
 * gateway integer field; falls back to converting the major-unit amount only
 * when the integer field is absent.
 */
export function computeAmountInMinorUnits(event: FlutterwaveEvent): number {
  const amountInMinor = event.data?.amount_in_minor_units;
  if (typeof amountInMinor === "number" && Number.isInteger(amountInMinor)) {
    return amountInMinor;
  }
  return Math.floor((Number(event.data?.amount) || 0) * 100);
}

/**
 * Records a payment lifecycle event (verification, failure, etc.) as its own
 * row in payment_logs. Each call is idempotent: the unique provider_event_id
 * constraint guarantees a repeated event is recorded exactly once, and P2002
 * collisions are surfaced as `duplicate` instead of throwing.
 */
export async function logPaymentEvent(params: {
  providerEventId: string;
  userId: string | null;
  eventType: string;
  amountInMinorUnits: number;
  currency: string;
  paymentMethod?: string | null;
  status: string | null;
  transactionId?: string | null;
  payload: unknown;
}): Promise<{ status: "recorded" | "duplicate" }> {
  try {
    await prisma.payment_logs.create({
      data: {
        provider_event_id: params.providerEventId,
        user_id: params.userId ?? "",
        event_type: params.eventType,
        amount_in_minor_units: params.amountInMinorUnits,
        currency: params.currency,
        payment_method: params.paymentMethod || null,
        status: params.status,
        gateway: "flutterwave",
        transaction_id: params.transactionId ?? null,
        payload_json: params.payload as Prisma.InputJsonValue,
      },
    });
    return { status: "recorded" };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { status: "duplicate" };
    }
    throw error;
  }
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

  const amountInMinorUnits = computeAmountInMinorUnits(event);

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
          payload_json: event as unknown as Prisma.InputJsonValue,
        },
      });

      if (isSuccessfulCharge) {
        const interval = planInterval === "yearly" ? "yearly" : "monthly";
        const durationDays = interval === "yearly" ? 365 : 30;

        // Proration-aware period extension (PRD Journey B): on a mid-cycle
        // upgrade the new period EXTENDS from the existing current_period_end
        // so the user's remaining credit is never wiped out. Only when no
        // usable period exists do we start fresh from now.
        const existing = await tx.subscriptions.findUnique({
          where: { user_id: userId ?? "" },
          select: { current_period_start: true, current_period_end: true, status: true },
        });

        const canExtend =
          existing?.status === "active" &&
          existing.current_period_end.getTime() > Date.now();

        const periodStart = canExtend
          ? new Date(existing!.current_period_start)
          : new Date();
        const periodEnd = canExtend
          ? new Date(
              existing!.current_period_end.getTime() +
                durationDays * 24 * 60 * 60 * 1000
            )
          : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        await tx.subscriptions.upsert({
          where: { user_id: userId ?? "" },
          update: {
            plan_interval: interval,
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            cancellation_reason: null,
            pending_plan_interval: null,
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