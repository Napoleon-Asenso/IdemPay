import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Period-End Subscription Cancellation Endpoint
 * 
 * Rules:
 * 1. NEVER delete subscription records.
 * 2. NEVER revoke access immediately prior to current_period_end.
 * 3. Update cancel_at_period_end = true and store optional cancellation_reason.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 }
      );
    }

    const updated = await prisma.subscriptions.update({
      where: { user_id: userId },
      data: {
        cancel_at_period_end: true,
        cancellation_reason: reason ? String(reason).slice(0, 500) : null,
      },
    });

    logger.info({
      context: "Subscription:Cancel",
      message: `User ${userId} scheduled cancellation at period end (${updated.current_period_end})`,
      data: { userId, reason },
    });

    return NextResponse.json(
      {
        message: "Subscription scheduled for cancellation at the end of the billing period.",
        subscription: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({
      context: "Subscription:Cancel",
      message: "Error canceling subscription",
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
