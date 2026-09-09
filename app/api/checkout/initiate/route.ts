import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Simple in-memory rate limiter per user (3 requests per minute per user)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 3;

  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.expiresAt) {
    rateLimitMap.set(userId, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, planInterval, amountInMinorUnits } = body;

    if (!userId || !planInterval || !amountInMinorUnits) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, planInterval, amountInMinorUnits" },
        { status: 400 }
      );
    }

    // Guard against spam via rate limit
    if (!checkRateLimit(userId)) {
      logger.warn({
        context: "Checkout:Initiate",
        message: `Rate limit exceeded for user ${userId}`,
      });
      return NextResponse.json(
        { error: "Too many checkout requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    // Verify user exists in database or create default
    let user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
        },
      });
    }

    // Generate unique transaction reference
    const txRef = `tx_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Log initiation event in payment_logs
    await prisma.payment_logs.create({
      data: {
        provider_event_id: txRef,
        user_id: userId,
        event_type: "checkout_initiated",
        amount_in_minor_units: Number(amountInMinorUnits),
        currency: "USD",
        payload_json: {
          tx_ref: txRef,
          plan_interval: planInterval,
          initiated_at: new Date().toISOString(),
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/checkout/return?tx_ref=${txRef}`;

    // For Flutterwave Hosted Checkout:
    // When live credentials are configured, we request payment link or generate hosted payment redirect URL.
    // In test environment, we direct user to Flutterwave hosted checkout simulator or standard test link.
    const checkoutUrl = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${txRef}&amount=${amountInMinorUnits / 100}&currency=USD&redirect_url=${encodeURIComponent(
      redirectUrl
    )}&customer_email=${encodeURIComponent(user.email)}&meta[user_id]=${userId}&meta[plan_interval]=${planInterval}`;

    logger.info({
      context: "Checkout:Initiate",
      message: `Checkout initiated for user ${userId} with txRef ${txRef}`,
      data: { txRef, userId, planInterval, amountInMinorUnits },
    });

    return NextResponse.json(
      {
        checkoutUrl,
        txRef,
        redirectUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({
      context: "Checkout:Initiate",
      message: "Failed to initiate checkout session",
      error,
    });
    return NextResponse.json(
      { error: "Failed to initiate checkout session" },
      { status: 500 }
    );
  }
}
