import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Read-Only Subscription Status Polling Endpoint
 * 
 * Rules:
 * 1. Read-only: never modifies subscription state.
 * 2. Return current subscription record and most recent payment log.
 * 3. Polled by /checkout/return view to confirm webhook completion.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr_test_default";

    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: userId },
    });

    const latestPayment = await prisma.payment_logs.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        userId,
        hasActiveSubscription: subscription?.status === "active",
        subscription,
        latestPayment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
