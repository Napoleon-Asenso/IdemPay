import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import {
  FlutterwaveEvent,
  computeAmountInMinorUnits,
  logPaymentEvent,
  processChargeEvent,
  verifyFlutterwaveTransaction,
} from "@/lib/flutterwave";

// Loose in-memory burst limiter for webhook floods. Generous enough that
// Flutterwave retries always pass; hardens against replay/DDoS floods.
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkWebhookRateLimit(key: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 120;

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Flutterwave Webhook Route Handler
 *
 * Rules:
 * 1. Read raw body as text using req.text() BEFORE any JSON parsing.
 * 2. Constant-time timingSafeEqual secret comparison on verif-hash header against FLUTTERWAVE_SECRET_HASH.
 * 3. Reject with 401 Unauthorized immediately if missing or invalid.
 * 4. For charge.completed events, execute a mandatory server-to-server transaction
 *    verification (GET /v3/transactions/{id}/verify) BEFORE any DB mutation.
 * 5. Execute idempotent atomic transaction: insert payment_logs with provider_event_id.
 * 6. Handle P2002 duplicate collisions idempotently with 200 OK "Event already processed".
 * 7. Update user subscription state safely if charge.completed and successful.
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

    // 2. Cryptographic Constant-Time Signature Comparison
    const signatureBuffer = Buffer.from(signature);
    const secretBuffer = Buffer.from(secretHash);

    if (
      signatureBuffer.length !== secretBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, secretBuffer)
    ) {
      logger.warn({
        context: "Webhook:Flutterwave",
        message: "Invalid signature comparison failure",
      });
      return NextResponse.json(
        { error: "Invalid signature verification" },
        { status: 401 }
      );
    }

    // 2b. Burst rate limit after verification — protects DB mutation paths
    // from floods without ever throttling legitimate gateway retries.
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "unknown";

    if (!checkWebhookRateLimit(clientIp)) {
      logger.warn({
        context: "Webhook:Flutterwave",
        message: `Webhook rate limit exceeded from ${clientIp}`,
      });
      return NextResponse.json(
        { error: "Too many webhook requests" },
        { status: 429 }
      );
    }

    // 3. Safe parsing after verified signature
    const event = JSON.parse(rawBody) as FlutterwaveEvent;
    const providerEventId = String(event.data?.id ?? event.id ?? "");

    if (!providerEventId) {
      return NextResponse.json(
        { error: "Missing event identifier in payload" },
        { status: 400 }
      );
    }

    // 4. Mandatory server-to-server transaction verification (PRD §2)
    if (event.event === "charge.completed") {
      const verified = await verifyFlutterwaveTransaction(providerEventId);

      if (
        !verified ||
        verified.status !== "successful" ||
        String(verified.tx_ref) !== String(event.data?.tx_ref) ||
        Number(verified.amount) !== Number(event.data?.amount) ||
        String(verified.currency) !== String(event.data?.currency || "USD")
      ) {
        logger.warn({
          context: "Webhook:Flutterwave",
          message: `Server-side verification failed for event ${providerEventId}`,
          data: { providerEventId, verifiedStatus: verified?.status },
        });

        // Record the failed verification as a distinct failure event. Best-effort:
        // the rejection response is authoritative even if audit logging fails.
        await logPaymentEvent({
          providerEventId: `${providerEventId}:verification_failed`,
          userId: event.data?.meta?.user_id ?? null,
          eventType: "verification_failed",
          amountInMinorUnits: computeAmountInMinorUnits(event),
          currency: String(event.data?.currency || "USD"),
          paymentMethod:
            event.data?.payment_type || event.data?.meta?.payment_method || "card",
          status: "failed",
          transactionId: providerEventId,
          payload: {
            event,
            verified_status: verified?.status,
            verified_at: new Date().toISOString(),
          },
        }).catch((logError: any) => {
          logger.error({
            context: "Webhook:Flutterwave",
            message: `Failed to record verification failure for event ${providerEventId}`,
            error: logError,
          });
        });

        return NextResponse.json(
          { error: "Transaction verification failed. No state was mutated." },
          { status: 400 }
        );
      }

      logger.info({
        context: "Webhook:Flutterwave",
        message: `Transaction ${providerEventId} verified server-side`,
        data: { providerEventId },
      });

      // 4b. Zero-trust guard: a charge webhook without a subscriber identity in
      // meta must never mutate state (would otherwise write user_id "").
      if (!event.data?.meta?.user_id) {
        logger.warn({
          context: "Webhook:Flutterwave",
          message: `Charge event ${providerEventId} rejected: missing meta.user_id`,
          data: { providerEventId },
        });

        await logPaymentEvent({
          providerEventId: `${providerEventId}:verification_failed`,
          userId: null,
          eventType: "verification_failed",
          amountInMinorUnits: computeAmountInMinorUnits(event),
          currency: String(event.data?.currency || "USD"),
          paymentMethod:
            event.data?.payment_type || event.data?.meta?.payment_method || "card",
          status: "failed",
          transactionId: providerEventId,
          payload: {
            event,
            reason: "missing meta.user_id",
            verified_at: new Date().toISOString(),
          },
        }).catch((logError: any) => {
          logger.error({
            context: "Webhook:Flutterwave",
            message: `Failed to record verification failure for event ${providerEventId}`,
            error: logError,
          });
        });

        return NextResponse.json(
          { error: "Payload is missing subscriber identity. No state was mutated." },
          { status: 400 }
        );
      }

      // 4c. Record the server-side verification event BEFORE any entitlement
      // mutation so the audit trail shows initiation -> verification -> fulfilment.
      await logPaymentEvent({
        providerEventId: `${providerEventId}:verified`,
        userId: event.data.meta.user_id,
        eventType: "charge.verified",
        amountInMinorUnits: computeAmountInMinorUnits(event),
        currency: String(event.data.currency || "USD"),
        paymentMethod:
          event.data.payment_type || event.data.meta.payment_method || "card",
        status: "verified",
        transactionId: providerEventId,
        payload: {
          event: event.event,
          verified_transaction: verified,
          verified_at: new Date().toISOString(),
        },
      });

      // 4d. A verified charge that reports a non-successful status is a payment
      // failure: record it as a failure event and never grant entitlement.
      if (event.data.status !== "successful") {
        logger.warn({
          context: "Webhook:Flutterwave",
          message: `Verified charge ${providerEventId} reported status ${event.data.status}`,
          data: { providerEventId, status: event.data.status },
        });

        await logPaymentEvent({
          providerEventId: `${providerEventId}:payment_failed`,
          userId: event.data.meta.user_id,
          eventType: "payment_failed",
          amountInMinorUnits: computeAmountInMinorUnits(event),
          currency: String(event.data.currency || "USD"),
          paymentMethod:
            event.data.payment_type || event.data.meta.payment_method || "card",
          status: "failed",
          transactionId: providerEventId,
          payload: {
            event,
            reason: "charge status is not successful",
            verified_at: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { message: "Charge recorded as failed. No entitlement was granted." },
          { status: 200 }
        );
      }
    } else if (event.event === "charge.failed") {
      // Flutterwave-sent charge failure events also become failure log rows.
      await logPaymentEvent({
        providerEventId: `${providerEventId}:payment_failed`,
        userId: event.data?.meta?.user_id ?? null,
        eventType: "payment_failed",
        amountInMinorUnits: computeAmountInMinorUnits(event),
        currency: String(event.data?.currency || "USD"),
        paymentMethod:
          event.data?.payment_type || event.data?.meta?.payment_method || "card",
        status: "failed",
        transactionId: providerEventId,
        payload: event as unknown,
      });

      return NextResponse.json(
        { message: "Charge recorded as failed. No entitlement was granted." },
        { status: 200 }
      );
    }

    // 5. Atomic, idempotent event processing
    const result = await processChargeEvent(event);

    if (result.status === "duplicate") {
      return NextResponse.json(
        { message: "Event already processed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
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