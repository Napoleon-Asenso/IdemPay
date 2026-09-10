import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description:
    "Compare simple, predictable monthly and annual subscription plans. Switch intervals anytime with exact whole-cent proration and never lose value.",
  alternates: {
    canonical: "/plans",
  },
};

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}