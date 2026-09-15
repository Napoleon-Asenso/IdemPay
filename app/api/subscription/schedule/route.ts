import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * POST /api/subscription/schedule
 *
 * Approves a "add a new plan after my running plan exhausts" request.
 * Only valid for users with an ACTIVE, paid plan whose cancellation is already
 * scheduled (cancel_at_period_end = true). Storing the target plan on
 * pending_plan_interval queues it to start when the current period ends —
 * no double charge, no immediate proration.
 *
 * Guards:
 * 1. Requires an existing active subscription.
 * 2. Requires scheduled cancellation (otherwise a now-upgrade with proration is
 *    the correct path and this endpoint refuses).
 * 3. Does NOT mutate status/periods here; the rollover applies it at period end.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, planInterval } = body;

    if (!userId || !planInterval) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, planInterval" },
        { status: 400 }
      );
    }

    const target = String(planInterval);
    if (target !== "monthly" && target !== "yearly") {
      return NextResponse.json(
        { error: "Invalid plan interval. Queueing is only for paid plans." },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: String(userId) },
    });

    if (!subscription || subscription.status !== "active") {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 }
      );
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        {
          error:
            "Your plan is not scheduled for cancellation. Use the prorated checkout to switch now.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.subscriptions.update({
      where: { user_id: String(userId) },
      data: {
        pending_plan_interval: target === "yearly" ? "yearly" : "monthly",
      },
    });

    logger.info({
      context: "Subscription:Schedule",
      message: `User ${userId} queued ${target} to start after current period ends`,
      data: { userId, targetPlan: target, periodEnd: subscription.current_period_end },
    });

    return NextResponse.json(
      {
        message: `Your ${target === "yearly" ? "Yearly Scale" : "Monthly Pro"} plan is approved to start when your current plan ends.`,
        subscription: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({
      context: "Subscription:Schedule",
      message: "Error scheduling plan after period end",
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}