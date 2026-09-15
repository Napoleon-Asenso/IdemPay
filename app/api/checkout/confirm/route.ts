import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";

/**
 * POST /api/checkout/confirm
 *
 * READ-ONLY payment confirmation. NEVER grants entitlements.
 *
 * Zero-trust architecture: the client-triggered confirm path only performs a
 * server-to-server verification against Flutterwave and checks that the
 * verified charge was recorded by the webhook pipeline (payment_logs). The
 * final entitlement mutation happens strictly on the server-to-server
 * /api/webhooks/flutterwave path — this route has no write access to
 * subscription state.
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

    const matchesGateway =
      !verified ||
      verified.status !== "successful" ||
      String(verified.tx_ref) !== String(txRef) ||
      Math.floor((Number(verified.amount) || 0) * 100) !== initiation.amount_in_minor_units ||
      String(verified.currency) !== String(initiation.currency || "USD");

    // 2. Check the webhook already recorded this verified charge. This is the
    //    source of truth for entitlement — the subscription is only ever
    //    mutated on the webhook path.
    const processed = matchesGateway
      ? null
      : await prisma.payment_logs.findUnique({
          where: { provider_event_id: String(transactionId) },
        });

    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: String(userId) },
    });

    if (matchesGateway || !processed) {
      logger.warn({
        context: "Checkout:Confirm",
        message: `Payment not confirmed yet for tx_ref ${txRef}`,
        data: { userId, txRef, transactionId, verifiedStatus: verified?.status },
      });
      return NextResponse.json(
        { confirmed: false, subscription },
        { status: 200 }
      );
    }

    logger.info({
      context: "Checkout:Confirm",
      message: `Payment confirmed read-only for user ${userId}`,
      data: { userId, txRef, transactionId },
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