import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding IdemPay database...");

  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days remaining
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days in

  // 1. Create or upsert test user (Alex Dev)
  const user = await prisma.users.upsert({
    where: { id: "usr_test_default" },
    update: {
      email: "alex.dev@example.com",
    },
    create: {
      id: "usr_test_default",
      email: "alex.dev@example.com",
    },
  });

  console.log(`User created/updated: ${user.email} (${user.id})`);

  // 2. Create or upsert active monthly subscription with 20 days remaining
  const subscription = await prisma.subscriptions.upsert({
    where: { user_id: user.id },
    update: {
      plan_interval: "monthly",
      status: "active",
      current_period_start: tenDaysAgo,
      current_period_end: thirtyDaysLater,
      cancel_at_period_end: false,
      cancellation_reason: null,
    },
    create: {
      user_id: user.id,
      provider_subscription_id: "flw_sub_mock_monthly_001",
      plan_interval: "monthly",
      status: "active",
      current_period_start: tenDaysAgo,
      current_period_end: thirtyDaysLater,
      cancel_at_period_end: false,
    },
  });

  console.log(`Subscription seeded: ${subscription.plan_interval} (${subscription.status})`);

  // 3. Seed initial payment log for the monthly plan
  const existingLog = await prisma.payment_logs.findUnique({
    where: { provider_event_id: "flw_txn_initial_monthly_001" },
  });

  if (!existingLog) {
    await prisma.payment_logs.create({
      data: {
        provider_event_id: "flw_txn_initial_monthly_001",
        user_id: user.id,
        event_type: "charge.completed",
        amount_in_minor_units: 2000,
        currency: "USD",
        payload_json: {
          id: "flw_txn_initial_monthly_001",
          event: "charge.completed",
          status: "successful",
          amount: 20,
          currency: "USD",
          customer: {
            email: "alex.dev@example.com",
          },
        },
      },
    });
    console.log("Initial payment log created.");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
