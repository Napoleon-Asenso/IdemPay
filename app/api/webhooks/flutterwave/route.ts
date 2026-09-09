import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Flutterwave Webhook Route Handler
 * 
 * Rules:
 * 1. Read raw body as text using req.text() BEFORE any JSON parsing.
 * 2. Constant-time timingSafeEqual HMAC validation on verif-hash header against FLUTTERWAVE_SECRET_HASH.
 * 3. Reject with 401 Unauthorized immediately if missing or invalid.
 * 4. Execute idempotent atomic transaction: insert payment_logs with provider_event_id.
 * 5. Handle P2002 duplicate collisions idempotently with 200 OK "Event already processed".
 * 6. Update user subscription state safely if charge.completed and successful.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Consume raw request body as plain text BEFORE JSON parsing
    const rawBody = await req.text();
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!signature || !secretHash) {
      logger.warn({
        context: "Webhook:Flutterwave",
        message: "Missing verif-hash header or FLUTTERWAVE_SECRET_HASH",
      });
      return NextResponse.json(
        { error: "Missing signature header or secret hash" },
        { status: 401 }
      );
    }

    const signatureBuffer = Buffer.from(signature);
    const secretBuffer = Buffer.from(secretHash);

    // 2. Cryptographic Constant-Time Signature Comparison
    if (
      signatureBuffer.length !== secretBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, secretBuffer)
    ) {
      logger.warn({
        context: "Webhook:Flutterwave",
        message: "Invalid HMAC signature comparison failure",
      });
      return NextResponse.json(
        { error: "Invalid signature verification" },
        { status: 401 }
      );
    }

    // 3. Safe parsing after verified signature
    const event = JSON.parse(rawBody);
    const providerEventId = String(event.data?.id || event.id);

    if (!providerEventId) {
      return NextResponse.json(
        { error: "Missing event identifier in payload" },
        { status: 400 }
      );
    }

    const userId = event.data?.meta?.user_id;
    const planInterval = event.data?.meta?.plan_interval as "monthly" | "yearly" | undefined;

    // Monetary value MUST be an integer in minor units
    // Ensure amount_in_minor_units is taken directly or converted safely as integer
    const amountInMinorUnits =
      typeof event.data?.amount_in_minor_units === "number"
        ? Math.floor(event.data.amount_in_minor_units)
        : Math.floor((Number(event.data?.amount) || 0) * 100);

    const currency = event.data?.currency || "USD";

    try {
      // 4. Atomic Database Transaction with Strict Idempotency
      await prisma.$transaction(async (tx) => {
        // Step 4a: Insert payment_logs record. Unique constraint on provider_event_id prevents double-processing.
        await tx.payment_logs.create({
          data: {
            provider_event_id: providerEventId,
            user_id: userId,
            event_type: event.event || "charge.completed",
            amount_in_minor_units: amountInMinorUnits,
            currency: currency,
            payload_json: event,
          },
        });

        // Step 4b: Grant or upgrade entitlement if charge is successful
        if (
          event.event === "charge.completed" &&
          (event.data?.status === "successful" || event.status === "successful")
        ) {
          const interval = planInterval === "yearly" ? "yearly" : "monthly";
          const durationDays = interval === "yearly" ? 365 : 30;
          const periodStart = new Date();
          const periodEnd = new Date(
            Date.now() + durationDays * 24 * 60 * 60 * 1000
          );

          await tx.subscriptions.upsert({
            where: { user_id: userId },
            update: {
              plan_interval: interval,
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: false,
              cancellation_reason: null,
            },
            create: {
              user_id: userId,
              provider_subscription_id: String(
                event.data?.subscription_id || providerEventId
              ),
              plan_interval: interval,
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: false,
            },
          });

          logger.info({
            context: "Webhook:Flutterwave",
            message: `Successfully provisioned ${interval} subscription for user ${userId}`,
            data: { userId, providerEventId, interval },
          });
        }
      });

      return NextResponse.json({ status: "success" }, { status: 200 });
    } catch (dbError: any) {
      // Step 4c: Catch Prisma unique constraint collision on provider_event_id (P2002)
      if (dbError.code === "P2002") {
        logger.info({
          context: "Webhook:Flutterwave",
          message: `Idempotent duplicate event skipped: ${providerEventId}`,
        });
        return NextResponse.json(
          { message: "Event already processed" },
          { status: 200 }
        );
      }

      logger.error({
        context: "Webhook:Flutterwave",
        message: "Transaction processing failed",
        error: dbError,
      });

      return NextResponse.json(
        { error: "Transaction processing failed" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error({
      context: "Webhook:Flutterwave",
      message: "Unexpected error during webhook handling",
      error,
    });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
