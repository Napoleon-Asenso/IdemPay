import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  FlutterwaveEvent,
  processChargeEvent,
  verifyFlutterwaveTransaction,
} from "@/lib/flutterwave";

/**
 * POST /api/checkout/confirm
 *
 * Called by the checkout return view once a user is redirected back with a
 * successful payment. Server-to-server verification runs against Flutterwave
 * BEFORE any entitlement mutation — the client query params are never trusted.
 *
 * The idempotent processor is shared with the webhook, so a delayed or
 * duplicate confirmation can never double-grant a subscription.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, txRef, transactionId } = body;

    if (!userId || !txRef || !transactionId) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, txRef, transactionId" },
        { status: 400 }
      );
    }

    // Locate the checkout session we created at initiation time.
    const initiation = await prisma.payment_logs.findUnique({
      where: { provider_event_id: String(txRef) },
    });

    if (!initiation) {
      return NextResponse.json(
        { error: "No matching checkout session found" },
        { status: 400 }
      );
    }

    // 1. Server-to-server verification with Flutterwave.
    const verified = await verifyFlutterwaveTransaction(String(transactionId));

    if (
      !verified ||
      verified.status !== "successful" ||
      String(verified.tx_ref) !== String(txRef) ||
      Math.floor((Number(verified.amount) || 0) * 100) !== initiation.amount_in_minor_units ||
      String(verified.currency) !== String(initiation.currency || "USD")
    ) {
      logger.warn({
        context: "Checkout:Confirm",
        message: `Payment verification failed for tx_ref ${txRef}`,
        data: { userId, txRef, transactionId, verifiedStatus: verified?.status },
      });
      return NextResponse.json(
        { error: "Payment could not be verified with the gateway." },
        { status: 400 }
      );
    }

    // 2. Grant entitlement via the same idempotent pipeline as the webhook.
    const payload = initiation.payload_json as Record<string, unknown> | null;
    const planInterval = payload?.plan_interval === "yearly" ? "yearly" : "monthly";

    const event: FlutterwaveEvent = {
      event: "charge.completed",
      data: {
        id: String(transactionId),
        tx_ref: String(txRef),
        amount: Number(verified.amount),
        currency: String(verified.currency),
        status: "successful",
        meta: {
          user_id: String(userId),
          plan_interval: planInterval,
        },
      },
    };

    await processChargeEvent(event);

    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: String(userId) },
    });

    logger.info({
      context: "Checkout:Confirm",
      message: `Payment confirmed for user ${userId}`,
      data: { userId, txRef, transactionId, planInterval },
    });

    return NextResponse.json(
      { confirmed: true, subscription },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({
      context: "Checkout:Confirm",
      message: "Failed to confirm checkout",
      error,
    });
    return NextResponse.json(
      { error: "Failed to confirm checkout" },
      { status: 500 }
    );
  }
}