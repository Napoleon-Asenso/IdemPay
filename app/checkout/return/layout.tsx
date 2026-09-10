import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Verification",
  description:
    "Verifying your subscription payment status. Your entitlement updates strictly from verified server-to-server payment events.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutReturnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}