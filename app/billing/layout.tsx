import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing & Subscription",
  description:
    "Manage your subscription tier, track upcoming renewal dates, review retained access after cancellation, and audit your immutable payment transaction history.",
  alternates: {
    canonical: "/billing",
  },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}