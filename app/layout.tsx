import type { Metadata } from "next";
import "./globals.css";
import { NavigationBar } from "@/components/NavigationBar";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "IdemPay — Zero-Trust Payment and Subscription Infrastructure",
  description: "Production-grade SaaS billing lifecycle management with integer proration and webhook idempotency",
};

async function getSubscriptionState() {
  try {
    const user = await prisma.users.findFirst({
      where: { email: "alex.dev@example.com" },
      include: { subscription: true },
    });

    if (user?.subscription && user.subscription.status === "active") {
      return {
        activePlan: user.subscription.plan_interval,
        cancelAtPeriodEnd: user.subscription.cancel_at_period_end,
        currentPeriodEnd: user.subscription.current_period_end.toISOString(),
        email: user.email,
      };
    }
  } catch (err) {
    // Database may be initializing during build
  }

  return {
    activePlan: "Free",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    email: "alex.dev@example.com",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await getSubscriptionState();

  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-[var(--color-background-color)] text-[var(--color-on-background-color)] antialiased">
        <NavigationBar
          activePlan={state.activePlan}
          cancelAtPeriodEnd={state.cancelAtPeriodEnd}
          currentPeriodEnd={state.currentPeriodEnd}
          userEmail={state.email}
        />
        <main className="mx-auto max-w-7xl px-[var(--spacing-4)] sm:px-[var(--spacing-8)] py-[var(--spacing-6)]">
          {children}
        </main>
      </body>
    </html>
  );
}
