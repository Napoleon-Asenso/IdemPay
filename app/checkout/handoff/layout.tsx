import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description:
    "Securely completing your subscription payment through the Flutterwave hosted checkout. Transactions are verified server-to-server with idempotent webhooks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutHandoffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}