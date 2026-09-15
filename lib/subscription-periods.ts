import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Advances an active subscription whose billing period has already ended so the
 * displayed period dates always stay current. Rolls the window forward by whole
 * billable periods (monthly: +1 month, yearly: +1 year) until today is covered.
 *
 * Maintenance-only: this never changes plan tier or status and never grants or
 * revokes entitlements. Runs lazily on the shell's server-side subscription
 * read so every view (nav badge, plans, billing) sees live dates.
 *
 * When the window exhausts for a subscription with a scheduled cancellation and
 * the user has approved a queued follow-up plan (pending_plan_interval), the
 * approved plan is activated on the new period — the "add after my running plan
 * exhausts" flow. Otherwise a plain rollover keeps the dates current.
 */
export async function ensureCurrentPeriod(
  subscriptionId: string
): Promise<null | {
  current_period_start: Date;
  current_period_end: Date;
  plan_interval?: string;
}> {
  const subscription = await prisma.subscriptions.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription || subscription.status !== "active") return null;

  const now = Date.now();
  if (subscription.current_period_end.getTime() > now) return null;

  let start = new Date(subscription.current_period_start);
  let end = new Date(subscription.current_period_end);

  // Apply an approved follow-up plan once the running (cancelled) plan ends.
  if (subscription.cancel_at_period_end && subscription.pending_plan_interval) {
    const next = subscription.pending_plan_interval;
    const updated = await prisma.subscriptions.update({
      where: { id: subscriptionId },
      data: {
        plan_interval: next,
        cancel_at_period_end: false,
        cancellation_reason: null,
        pending_plan_interval: null,
        current_period_start: end,
        current_period_end:
          next === "yearly"
            ? new Date(end.getFullYear() + 1, end.getMonth(), end.getDate())
            : new Date(end.getFullYear(), end.getMonth() + 1, end.getDate()),
      },
    });

    logger.info({
      context: "Subscription:QueuedPlanApplied",
      message: `Approved ${next} plan activated for subscription ${subscriptionId} after prior plan ended`,
      data: { periodEnd: end.toISOString() },
    });

    return {
      current_period_start: updated.current_period_start,
      current_period_end: updated.current_period_end,
      plan_interval: updated.plan_interval,
    };
  }

  let guard = 0;
  while (end.getTime() <= now && guard < 60) {
    start = new Date(end);
    if (subscription.plan_interval === "yearly") {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    guard += 1;
  }

  const rolled = await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      current_period_start: start,
      current_period_end: end,
    },
  });

  logger.info({
    context: "Subscription:PeriodRollover",
    message: `Advanced expired period for subscription ${subscriptionId}`,
    data: { start: start.toISOString(), end: end.toISOString() },
  });

  return {
    current_period_start: rolled.current_period_start,
    current_period_end: rolled.current_period_end,
  };
}