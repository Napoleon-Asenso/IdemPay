import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Subscription Reactivation Endpoint
 *
 * Rules:
 * 1. NEVER delete subscription records.
 * 2. Clear cancel_at_period_end so the billing period renews as normal.
 * 3. Clear the recorded cancellation_reason (access continues uninterrupted).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

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
        cancel_at_period_end: false,
        cancellation_reason: null,
        pending_plan_interval: null,
      },
    });

    logger.info({
      context: "Subscription:Reactivate",
      message: `User ${userId} reactivated subscription; renewal continues as scheduled (${updated.current_period_end})`,
      data: { userId },
    });

    return NextResponse.json(
      {
        message: "Subscription reactivated. Billing will continue as scheduled.",
        subscription: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({
      context: "Subscription:Reactivate",
      message: "Error reactivating subscription",
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}