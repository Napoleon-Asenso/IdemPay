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
    const { userId, planInterval, amountInMinorUnits, paymentMethod, isUpgrade } = body;

    if (!userId || !planInterval || !amountInMinorUnits) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, planInterval, amountInMinorUnits" },
        { status: 400 }
      );
    }

    // Whitelisted hosted-checkout payment options (Flutterwave payment_options).
    const supportedMethods = ["card", "banktransfer", "account", "ussd", "mobilemoney"];
    const requestedMethod = String(paymentMethod || "card");
    const paymentMethodValue = supportedMethods.includes(requestedMethod)
      ? requestedMethod
      : "card";
    const paymentOptions = body.paymentOptions
      ? String(body.paymentOptions)
      : "card,banktransfer,account";

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
        payment_method: paymentMethodValue,
        status: "initiated",
        gateway: "flutterwave",
        payload_json: {
          tx_ref: txRef,
          plan_interval: planInterval,
          payment_method: paymentMethodValue,
          payment_options: paymentOptions,
          initiated_at: new Date().toISOString(),
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = isUpgrade
      ? `${appUrl}/checkout/return?tx_ref=${txRef}&isUpgrade=true`
      : `${appUrl}/checkout/return?tx_ref=${txRef}`;

    // --- Flutterwave Standard (Hosted Checkout) integration ---
    // Server-side call to POST /v3/payments returns a hosted checkout link.
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const apiBase = process.env.FLUTTERWAVE_API_BASE || "https://api.flutterwave.com/v3";

    if (!secretKey || secretKey.includes("REPLACE_WITH")) {
      logger.error({
        context: "Checkout:Initiate",
        message: "FLUTTERWAVE_SECRET_KEY is not configured in .env",
      });
      return NextResponse.json(
        { error: "Payment gateway is not configured. Ask the admin to set FLUTTERWAVE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const currency = process.env.SYSTEM_CURRENCY || "USD";
    const paymentPlan =
      planInterval === "yearly"
        ? process.env.FLUTTERWAVE_PAYMENT_PLAN_YEARLY
        : process.env.FLUTTERWAVE_PAYMENT_PLAN_MONTHLY;

    const checkoutPayload: Record<string, unknown> = {
      tx_ref: txRef,
      amount: amountInMinorUnits / 100,
      currency,
      redirect_url: redirectUrl,
      customer: {
        email: user.email,
        name: `${user.email.split("@")[0]}`,
      },
      customizations: {
        title: "IdemPay Subscription",
        description: `${planInterval} plan subscription`,
      },
      meta: {
        user_id: userId,
        plan_interval: planInterval,
        payment_method: paymentMethodValue,
      },
      configurations: {
        session_duration: 30,
        max_retry_attempt: 3,
      },
      // Enable users to switch between cards, bank accounts, transfers, etc.
      // inside the hosted Flutterwave payment page.
      payment_options: paymentOptions,
    };

    if (paymentPlan) {
      checkoutPayload.payment_plan = Number(paymentPlan);
    }

    let flutterwaveResponse: Response;
    try {
      flutterwaveResponse = await fetch(`${apiBase}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      });
    } catch (networkError: any) {
      logger.error({
        context: "Checkout:Initiate",
        message: "Network error reaching Flutterwave API",
        error: networkError,
      });
      return NextResponse.json(
        { error: "Unable to reach the payment gateway. Please try again." },
        { status: 502 }
      );
    }

    const flutterwaveResult = await flutterwaveResponse.json().catch(() => null);

    if (
      !flutterwaveResponse.ok ||
      flutterwaveResult?.status !== "success" ||
      !flutterwaveResult?.data?.link
    ) {
      logger.error({
        context: "Checkout:Initiate",
        message: "Flutterwave checkout initiation failed",
        data: {
          status: flutterwaveResponse.status,
          flutterwaveMessage: flutterwaveResult?.message,
          txRef,
        },
      });
      return NextResponse.json(
        {
          error:
            flutterwaveResult?.message ||
            "Payment gateway could not create a checkout session.",
        },
        { status: 502 }
      );
    }

    const checkoutUrl = flutterwaveResult.data.link as string;

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
