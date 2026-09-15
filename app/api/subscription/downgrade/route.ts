import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const PLAN_TIER: Record<string, number> = {
  free: 0,
  monthly: 1,
  yearly: 2,
};

/**
 * Plan Downgrade Endpoint
 *
 * Moves the user's subscription to a lower tier directly in the database so
 * the UI (nav badge, plans view, billing view) reflects what they actually
 * subscribe to. Downgrades to Yearly are rejected; upgrades must go through
 * checkout.
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
    if (target !== "free" && target !== "monthly") {
      return NextResponse.json(
        { error: "Invalid downgrade target plan." },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: String(userId) },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 }
      );
    }

    const currentTier = PLAN_TIER[subscription.plan_interval];
    const targetTier = PLAN_TIER[target];

    if (targetTier >= currentTier) {
      return NextResponse.json(
        { error: "Target plan is not a downgrade. Use checkout to upgrade." },
        { status: 400 }
      );
    }

    const updated = await prisma.subscriptions.update({
      where: { user_id: String(userId) },
      data: {
        plan_interval: target === "monthly" ? "monthly" : "free",
        cancel_at_period_end: false,
        cancellation_reason: null,
        pending_plan_interval: null,
      },
    });

    logger.info({
      context: "Subscription:Downgrade",
      message: `User ${userId} downgraded from ${subscription.plan_interval} to ${target}`,
      data: { userId, targetPlan: target },
    });

    return NextResponse.json(
      {
        message: "Plan downgraded.",
        subscription: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({
      context: "Subscription:Downgrade",
      message: "Error downgrading subscription",
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}